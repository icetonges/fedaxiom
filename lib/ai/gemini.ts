import { GoogleGenerativeAI } from "@google/generative-ai"

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables")
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export function getGeminiModel(modelId = "gemini-2.0-flash") {
  return genAI.getGenerativeModel({ model: modelId })
}

/**
 * Single-turn chat — returns full string
 */
export async function geminiChat(
  messages: { role: string; content: string }[],
  modelId = "gemini-2.0-flash",
  systemPrompt?: string,
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: modelId,
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  })
  const history = messages.slice(0, -1).map(m => ({
    role:  m.role === "user" ? "user" : "model" as const,
    parts: [{ text: m.content }],
  }))
  const chat   = model.startChat({ history })
  const last   = messages[messages.length - 1]
  const result = await chat.sendMessage(last.content)
  return result.response.text()
}

/**
 * Streaming chat — returns async iterable of text chunks
 */
export async function geminiStream(
  messages: { role: string; content: string }[],
  modelId = "gemini-2.0-flash",
  systemPrompt?: string,
) {
  const model = genAI.getGenerativeModel({
    model: modelId,
    ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
  })
  const history = messages.slice(0, -1).map(m => ({
    role:  m.role === "user" ? "user" : "model" as const,
    parts: [{ text: m.content }],
  }))
  const chat   = model.startChat({ history })
  const last   = messages[messages.length - 1]
  const result = await chat.sendMessageStream(last.content)
  return result.stream
}

/**
 * Text embedding for RAG / pgvector
 */
export async function geminiEmbed(text: string): Promise<number[]> {
  const model  = genAI.getGenerativeModel({ model: "text-embedding-004" })
  const result = await model.embedContent(text)
  return result.embedding.values
}