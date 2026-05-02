import Groq from "groq-sdk"

if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY in environment variables")
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export type GroqMessage = {
  role:    "user" | "assistant" | "system"
  content: string
}

/**
 * Single-turn chat — returns full string
 */
export async function groqChat(
  messages: GroqMessage[],
  model = "llama-3.3-70b-versatile",
): Promise<string> {
  const completion = await groq.chat.completions.create({ model, messages })
  return completion.choices[0].message.content ?? ""
}

/**
 * Streaming chat — returns async iterable of chunks
 */
export async function groqStream(
  messages: GroqMessage[],
  model = "llama-3.3-70b-versatile",
) {
  return groq.chat.completions.create({ model, messages, stream: true })
}

export const GROQ_FREE_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "deepseek-r1-distill-llama-70b",
  "mixtral-8x7b-32768",
  "gemma2-9b-it",
] as const