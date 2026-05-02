export type AIProvider = "gemini" | "groq"

export interface AIModel {
  id:       string
  label:    string
  provider: AIProvider
  free:     boolean
  context:  number
}

export const AI_MODELS: AIModel[] = [
  { id: "gemini-2.0-flash",              label: "Gemini 2.0 Flash",  provider: "gemini", free: true,  context: 1000000 },
  { id: "gemini-2.5-pro-preview-05-06",  label: "Gemini 2.5 Pro",    provider: "gemini", free: false, context: 1000000 },
  { id: "llama-3.3-70b-versatile",       label: "Llama 3.3 70B",     provider: "groq",   free: true,  context: 128000  },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1",       provider: "groq",   free: true,  context: 128000  },
  { id: "mixtral-8x7b-32768",            label: "Mixtral 8x7B",      provider: "groq",   free: true,  context: 32768   },
]

export interface ChatMessage {
  role:    "user" | "assistant" | "system"
  content: string
}

export interface AgentStep {
  thought:     string
  action:      string
  actionInput: Record<string, unknown>
  observation: string
  timestamp:   number
}

export interface FeedItem {
  title:  string
  link:   string
  date:   string
  source: string
  tag:    string
}