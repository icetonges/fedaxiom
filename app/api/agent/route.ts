import { NextRequest, NextResponse } from "next/server"
import { geminiChat } from "@/lib/ai/gemini"
import { groqChat   } from "@/lib/ai/groq"

export const runtime = "nodejs"

interface Tool {
  name:        string
  description: string
  execute:     (input: Record<string, unknown>) => Promise<string>
}

// Built-in tools available to all agents
const TOOLS: Tool[] = [
  {
    name:        "calculator",
    description: "Evaluate a mathematical expression. Input: { expression: string }",
    execute: async ({ expression }) => {
      try {
        // eslint-disable-next-line no-new-func
        return String(new Function(`"use strict"; return (${expression as string})`)())
      } catch {
        return "Invalid expression"
      }
    },
  },
  {
    name:        "current_date",
    description: "Get the current date and time. No input required.",
    execute: async () => new Date().toISOString(),
  },
  {
    name:        "word_count",
    description: "Count words in a string. Input: { text: string }",
    execute: async ({ text }) =>
      String((text as string).trim().split(/\s+/).filter(Boolean).length) + " words",
  },
]

const TOOL_DESCRIPTIONS = TOOLS
  .map(t => `- ${t.name}: ${t.description}`)
  .join("\n")

const SYSTEM = `You are a ReAct agent. For every response use EXACTLY this format:

Thought: <your reasoning>
Action: <tool_name or "finish">
Action Input: <JSON object for the tool, or your final answer if action is "finish">

Available tools:
${TOOL_DESCRIPTIONS}

When you have the final answer, use:
Action: finish
Action Input: { "answer": "your final answer here" }`

export async function POST(req: NextRequest) {
  const { goal, model, provider, maxSteps = 6 } = await req.json() as {
    goal:      string
    model:     string
    provider:  "gemini" | "groq"
    maxSteps?: number
  }

  const steps: { thought: string; action: string; input: unknown; observation: string }[] = []
  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: goal },
  ]

  for (let i = 0; i < maxSteps; i++) {
    // Get model response
    let response = ""
    if (provider === "gemini") {
      response = await geminiChat(messages, model, SYSTEM)
    } else {
      const groqMsgs = [
        { role: "system" as const, content: SYSTEM },
        ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      ]
      response = await groqChat(groqMsgs, model)
    }

    messages.push({ role: "assistant", content: response })

    // Parse the response
    const thought = response.match(/Thought:(.*?)(?=Action:|$)/s)?.[1]?.trim() ?? ""
    const action  = response.match(/Action:(.*?)(?=Action Input:|$)/s)?.[1]?.trim() ?? ""
    const inputStr = response.match(/Action Input:(.*?)(?=Thought:|$)/s)?.[1]?.trim() ?? "{}"

    let parsedInput: Record<string, unknown> = {}
    try { parsedInput = JSON.parse(inputStr) } catch { parsedInput = { raw: inputStr } }

    // Check for finish
    if (action.toLowerCase() === "finish") {
      const answer = (parsedInput as { answer?: string }).answer ?? inputStr
      steps.push({ thought, action: "finish", input: parsedInput, observation: answer })
      return NextResponse.json({ steps, result: answer, status: "done" })
    }

    // Execute tool
    const tool = TOOLS.find(t => t.name === action)
    const observation = tool
      ? await tool.execute(parsedInput).catch(e => "Tool error: " + String(e))
      : `Unknown tool "${action}". Available: ${TOOLS.map(t => t.name).join(", ")}`

    steps.push({ thought, action, input: parsedInput, observation })
    messages.push({ role: "user", content: `Observation: ${observation}` })
  }

  return NextResponse.json({
    steps,
    result: "Max steps reached without a final answer.",
    status: "timeout",
  })
}