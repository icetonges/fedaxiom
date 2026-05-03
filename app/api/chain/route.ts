/**
 * /api/chain — Sequential model chain
 *
 * Runs the user's question through 6 free models one after another.
 * Each model receives: original question + all previous models' responses as context.
 * Streams SSE events so the client can render each model's response as it arrives.
 *
 * Event types:
 *   { type: "model_start", index: number, modelId: string, label: string, hex: string }
 *   { type: "chunk",       index: number, modelId: string, delta: string }
 *   { type: "model_done",  index: number, modelId: string }
 *   { type: "done" }
 *   { type: "error",       message: string }
 */

import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ─── Chain definition ────────────────────────────────────────────────────────

export const CHAIN_MODELS = [
  { id: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash",  hex: "#34d399", provider: "google" },
  { id: "llama-3.3-70b-versatile",        label: "Llama 3.3 70B",     hex: "#a78bfa", provider: "groq"   },
  { id: "gemini-2.0-flash",               label: "Gemini 2.0 Flash",  hex: "#60a5fa", provider: "google" },
  { id: "deepseek-r1-distill-llama-70b",  label: "DeepSeek R1 70B",   hex: "#f472b6", provider: "groq"   },
  { id: "mixtral-8x7b-32768",             label: "Mixtral 8×7B",      hex: "#fb923c", provider: "groq"   },
  { id: "gemma2-9b-it",                   label: "Gemma 2 9B",        hex: "#fbbf24", provider: "groq"   },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SendFn = (data: object) => void;

async function runGroq(
  modelId: string,
  systemPrompt: string,
  userTurn: string,
  send: SendFn,
  index: number,
): Promise<string> {
  const stream = await groq.chat.completions.create({
    model: modelId,
    stream: true,
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userTurn },
    ],
  });

  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) {
      full += delta;
      send({ type: "chunk", index, modelId, delta });
    }
  }
  return full;
}

async function runGemini(
  modelId: string,
  systemPrompt: string,
  userTurn: string,
  send: SendFn,
  index: number,
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContentStream(userTurn);

  let full = "";
  for await (const chunk of result.stream) {
    const delta = chunk.text();
    if (delta) {
      full += delta;
      send({ type: "chunk", index, modelId, delta });
    }
  }
  return full;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { messages, systemPrompt } = await req.json() as {
    messages: { role: string; content: string }[];
    systemPrompt?: string;
  };

  // Extract the user's question (last user message)
  const question = messages.filter(m => m.role === "user").pop()?.content ?? "";

  const encoder = new TextEncoder();

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
          send({ type: "model_start", index: i, modelId: cm.id, label: cm.label, hex: cm.hex });

          // Build context: question + all prior model outputs
          let userTurn = question;
          if (priorResponses.length > 0) {
            const context = priorResponses
              .map(r => `## ${r.label} said:\n${r.content}`)
              .join("\n\n");
            userTurn = `Original question: ${question}\n\n${context}\n\nNow provide your own perspective, building on or critiquing the above. Be additive — don't just repeat what was said.`;
          }

          let response = "";
          try {
            if (cm.provider === "groq") {
              response = await runGroq(cm.id, sys, userTurn, send, i);
            } else {
              response = await runGemini(cm.id, sys, userTurn, send, i);
            }
          } catch (modelErr) {
            const errMsg = `⚠️ ${cm.label} unavailable: ${modelErr}`;
            send({ type: "chunk", index: i, modelId: cm.id, delta: errMsg });
            response = errMsg;
          }

          priorResponses.push({ label: cm.label, content: response });
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
