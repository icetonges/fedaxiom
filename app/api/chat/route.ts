import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "deepseek-r1-distill-llama-70b",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
  "mistral-saba-24b",
  "qwen-qwq-32b",
]);

const GEMINI_MODELS = new Set([
  "gemini-2.5-flash",
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
]);

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

// Write AI-SDK compatible stream chunk: 0:"text"\n
function encodeChunk(encoder: TextEncoder, text: string): Uint8Array {
  return encoder.encode(`0:${JSON.stringify(text)}\n`);
}

async function streamGroq(
  messages: ChatMessage[],
  model: string,
  systemPrompt: string | undefined,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
) {
  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt ?? "You are AXIOM — an expert AI engineering mentor. Be precise and technical." },
    ...messages.map(m => ({
      role: m.role === "assistant" ? "assistant" as const : "user" as const,
      content: m.content,
    })),
  ];

  const stream = await groq.chat.completions.create({
    model,
    messages: groqMessages,
    stream: true,
    max_tokens: 2048,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? "";
    if (delta) controller.enqueue(encodeChunk(encoder, delta));
  }
}

async function streamGemini(
  messages: ChatMessage[],
  model: string,
  systemPrompt: string | undefined,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
) {
  const geminiModel = genAI.getGenerativeModel({
    model,
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  });

  // Convert messages to Gemini history (all except last)
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "model" as const : "user" as const,
    parts: [{ text: m.content }],
  }));

  const chat = geminiModel.startChat({ history });
  const last = messages[messages.length - 1];
  const result = await chat.sendMessageStream(last.content);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) controller.enqueue(encodeChunk(encoder, text));
  }
}

export async function POST(req: NextRequest) {
  const { messages, model = "gemini-2.0-flash", systemPrompt } = await req.json() as {
    messages: ChatMessage[];
    model?: string;
    systemPrompt?: string;
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (GROQ_MODELS.has(model)) {
          await streamGroq(messages, model, systemPrompt, controller, encoder);
        } else if (GEMINI_MODELS.has(model)) {
          await streamGemini(messages, model, systemPrompt, controller, encoder);
        } else {
          // Default fallback to Gemini 2.0 Flash
          await streamGemini(messages, "gemini-2.0-flash", systemPrompt, controller, encoder);
        }
      } catch (err) {
        controller.enqueue(encodeChunk(encoder, `\n\n⚠️ Error: ${err}`));
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
