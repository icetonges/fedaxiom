/**
 * /api/chain — Multi-purpose model chain
 *
 * Runs a question through 8 nodes of different model types:
 *   Nodes 0-5  → Sequential text reasoning chain (each model builds on prior output)
 *   Node  6    → Semantic embedding analysis (gemini-embedding-2 / text-embedding-004)
 *   Node  7    → Image generation (Imagen 4 Fast via REST API)
 *
 * SSE event types:
 *   { type: "model_start", index, modelId, label, hex, role, kind }
 *   { type: "chunk",       index, modelId, delta }         ← text streaming
 *   { type: "model_done",  index, modelId }
 *   { type: "done" }
 *   { type: "error",       message }
 */

import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ─── Chain definition ────────────────────────────────────────────────────────

export type ChainKind = "text" | "embed" | "image";

export interface ChainModelDef {
  id:       string;
  label:    string;
  hex:      string;
  provider: "google" | "groq";
  kind:     ChainKind;
  role:     string;   // Human-readable purpose shown in the UI panel
}

export const CHAIN_MODELS: ChainModelDef[] = [
  // ── 6 sequential text models ─────────────────────────────────────────────
  { id: "gemini-2.5-flash",              label: "Gemini 2.5 Flash",   hex: "#34d399", provider: "google", kind: "text",  role: "Synthesize"   },
  { id: "llama-3.3-70b-versatile",       label: "Llama 3.3 70B",      hex: "#a78bfa", provider: "groq",   kind: "text",  role: "Reason"       },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 70B",    hex: "#f472b6", provider: "groq",   kind: "text",  role: "Deep Think"   },
  { id: "gemini-2.5-flash-lite",         label: "Gemini Flash Lite",  hex: "#22d3ee", provider: "google", kind: "text",  role: "Refine"       },
  { id: "llama-3.1-8b-instant",          label: "Llama 3.1 8B",       hex: "#fb923c", provider: "groq",   kind: "text",  role: "Condense"     },
  { id: "gemma2-9b-it",                  label: "Gemma 2 9B",         hex: "#fbbf24", provider: "groq",   kind: "text",  role: "Polish"       },
  // ── Embedding analysis ───────────────────────────────────────────────────
  { id: "text-embedding-004",            label: "Gemini Embedding",   hex: "#818cf8", provider: "google", kind: "embed", role: "Vectorize"    },
  // ── Image generation ─────────────────────────────────────────────────────
  { id: "imagen-4.0-fast-generate-001",  label: "Imagen 4 Fast",      hex: "#e879f9", provider: "google", kind: "image", role: "Visualize"    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SendFn = (data: object) => void;

// Run a Groq text model and stream back deltas
async function runGroq(modelId: string, system: string, userTurn: string, send: SendFn, index: number): Promise<string> {
  const stream = await groq.chat.completions.create({
    model: modelId, stream: true, max_tokens: 1024,
    messages: [{ role: "system", content: system }, { role: "user", content: userTurn }],
  });
  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) { full += delta; send({ type: "chunk", index, modelId, delta }); }
  }
  return full;
}

// Run a Gemini text model and stream back deltas
async function runGemini(modelId: string, system: string, userTurn: string, send: SendFn, index: number): Promise<string> {
  const model  = genAI.getGenerativeModel({ model: modelId, systemInstruction: system });
  const result = await model.generateContentStream(userTurn);
  let full = "";
  for await (const chunk of result.stream) {
    const delta = chunk.text();
    if (delta) { full += delta; send({ type: "chunk", index, modelId, delta }); }
  }
  return full;
}

// Run embedding analysis: embed question & synthesized text, compute cosine similarity
async function runEmbedding(question: string, synthesis: string, send: SendFn, index: number): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const [qEmb, sEmb] = await Promise.all([
    model.embedContent(question),
    model.embedContent(synthesis.slice(0, 600)), // keep tokens low
  ]);

  const qVec = qEmb.embedding.values;
  const sVec = sEmb.embedding.values;

  // Cosine similarity
  let dot = 0, magQ = 0, magS = 0;
  for (let i = 0; i < qVec.length; i++) {
    dot  += qVec[i] * sVec[i];
    magQ += qVec[i] * qVec[i];
    magS += sVec[i] * sVec[i];
  }
  const similarity = dot / (Math.sqrt(magQ) * Math.sqrt(magS));

  // Top 6 dimensions for visual interest
  const top6 = qVec.slice(0, 6).map(v => v.toFixed(4));

  const output = [
    `📐 Embedding model: text-embedding-004 (${qVec.length}-dim vectors)`,
    ``,
    `🔢 Question vector sample (dims 0–5):`,
    `   [${top6.join(", ")}]`,
    ``,
    `📊 Cosine similarity (question ↔ synthesis):`,
    `   ${(similarity * 100).toFixed(1)}%  ${similarity > 0.85 ? "✅ Highly aligned" : similarity > 0.7 ? "🟡 Moderately aligned" : "⚠️ Low alignment"}`,
    ``,
    `💡 What this means: the 6 models converged on content that is ${(similarity * 100).toFixed(0)}% semantically related to your original question.`,
    `   In a RAG system this score would determine whether to return or discard a retrieved chunk.`,
  ].join("\n");

  // Stream the result in one shot (not streaming, but emit as chunks)
  send({ type: "chunk", index, modelId: "text-embedding-004", delta: output });
  return output;
}

// Run Imagen 4 via Gemini REST API → return markdown image or error message
async function runImagen(question: string, send: SendFn, index: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const msg = "⚠️ GEMINI_API_KEY not configured.";
    send({ type: "chunk", index, modelId: "imagen-4.0-fast-generate-001", delta: msg });
    return msg;
  }

  // Build a concise visual prompt from the question
  const visualPrompt = `A clean, modern technical diagram or illustration representing: "${question.slice(0, 120)}".
  Style: digital art, light background, professional, suitable for AI engineering documentation.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:generateImages?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: { text: visualPrompt },
          number_of_images: 1,
          output_image_config: { image_format: { mime_type: "image/jpeg" } },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      // Friendly messages for known error types
      if (res.status === 403 || errBody.includes("PERMISSION_DENIED") || errBody.includes("billing")) {
        const msg = [
          `🎨 Imagen 4 Fast — image generation`,
          ``,
          `⚠️ Not available on the free Gemini API tier.`,
          `   Imagen 4 requires Google AI Studio with billing enabled.`,
          ``,
          `To enable:`,
          `  1. Visit https://aistudio.google.com`,
          `  2. Enable billing on your Google Cloud project`,
          `  3. Use model ID: imagen-4.0-fast-generate-001`,
          ``,
          `Visual prompt that would have been used:`,
          `"${visualPrompt.slice(0, 120)}…"`,
        ].join("\n");
        send({ type: "chunk", index, modelId: "imagen-4.0-fast-generate-001", delta: msg });
        return msg;
      }
      throw new Error(`Imagen API ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json() as {
      generatedImages?: { image?: { imageBytes?: string } }[];
    };

    const b64 = data.generatedImages?.[0]?.image?.imageBytes;
    if (!b64) throw new Error("No image returned");

    const imgSrc = `data:image/jpeg;base64,${b64}`;
    const msg = `__IMAGE__${imgSrc}`;
    send({ type: "chunk", index, modelId: "imagen-4.0-fast-generate-001", delta: msg });
    return msg;

  } catch (err) {
    const msg = `⚠️ Imagen error: ${err}`;
    send({ type: "chunk", index, modelId: "imagen-4.0-fast-generate-001", delta: msg });
    return msg;
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json() as {
    messages: { role: string; content: string }[];
    systemPrompt?: string;
  };

  const question = messages.filter(m => m.role === "user").pop()?.content ?? "";
  const encoder  = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send: SendFn = (data) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const sys = systemPrompt ?? "You are AXIOM — an expert AI engineering mentor. Give a precise, technical, helpful answer.";
        const priorResponses: { label: string; content: string }[] = [];

        for (let i = 0; i < CHAIN_MODELS.length; i++) {
          const cm = CHAIN_MODELS[i];
          send({ type: "model_start", index: i, modelId: cm.id, label: cm.label, hex: cm.hex, role: cm.role, kind: cm.kind });

          let response = "";

          try {
            if (cm.kind === "embed") {
              // Use the synthesis from the last text model (or question if none)
              const synthesis = priorResponses[priorResponses.length - 1]?.content ?? question;
              response = await runEmbedding(question, synthesis, send, i);

            } else if (cm.kind === "image") {
              response = await runImagen(question, send, i);

            } else {
              // Text: build context from prior responses
              let userTurn = question;
              if (priorResponses.length > 0) {
                const ctx = priorResponses
                  .map(r => `## ${r.label}:\n${r.content}`)
                  .join("\n\n");
                userTurn = `Original question: ${question}\n\n${ctx}\n\nNow give your own perspective, building on or critiquing the above. Be additive — don't repeat what was already said.`;
              }

              if (cm.provider === "groq") {
                response = await runGroq(cm.id, sys, userTurn, send, i);
              } else {
                response = await runGemini(cm.id, sys, userTurn, send, i);
              }
            }
          } catch (modelErr) {
            const errMsg = `⚠️ ${cm.label} unavailable: ${modelErr}`;
            send({ type: "chunk", index: i, modelId: cm.id, delta: errMsg });
            response = errMsg;
          }

          if (cm.kind === "text") {
            priorResponses.push({ label: cm.label, content: response });
          }
          send({ type: "model_done", index: i, modelId: cm.id });
        }

        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
