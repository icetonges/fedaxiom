import { NextRequest } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Search the web for current information on a topic",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculate",
      description: "Evaluate a mathematical expression",
      parameters: {
        type: "object",
        properties: {
          expression: { type: "string", description: "Math expression to evaluate" },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "summarize_url",
      description: "Fetch and summarize content from a URL",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to summarize" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "analyze_data",
      description: "Analyze a list of numbers or data and return statistics",
      parameters: {
        type: "object",
        properties: {
          data: { type: "array", items: { type: "number" }, description: "Array of numbers" },
          operation: { type: "string", enum: ["mean", "median", "std", "all"], description: "Statistical operation" },
        },
        required: ["data", "operation"],
      },
    },
  },
];

// Simulate tool execution (replace with real implementations as needed)
async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "web_search": {
      const query = args.query as string;
      // Simulate search result
      return JSON.stringify({
        results: [
          { title: `Search result for: ${query}`, snippet: `Simulated result. In production, connect to a real search API (SerpAPI, Tavily, etc.) to get live results for: ${query}`, url: `https://example.com/search?q=${encodeURIComponent(query)}` },
          { title: `Related: ${query} - Latest developments`, snippet: `More information about ${query} would appear here with a real search integration.`, url: `https://example.com/related` },
        ],
      });
    }
    case "calculate": {
      try {
        // Safe evaluation
        const expr = (args.expression as string).replace(/[^0-9+\-*/().%\s]/g, "");
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expr})`)();
        return `Result: ${result}`;
      } catch {
        return "Error: Invalid expression";
      }
    }
    case "summarize_url": {
      const url = args.url as string;
      return `Simulated summary of ${url}: This page contains relevant content. In production, use a fetch + parse pipeline to extract real content from the URL.`;
    }
    case "analyze_data": {
      const data = args.data as number[];
      const op = args.operation as string;
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      const sorted = [...data].sort((a, b) => a - b);
      const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
      const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
      const std = Math.sqrt(variance);
      if (op === "mean") return `Mean: ${mean.toFixed(4)}`;
      if (op === "median") return `Median: ${median.toFixed(4)}`;
      if (op === "std") return `Std Dev: ${std.toFixed(4)}`;
      return JSON.stringify({ mean: mean.toFixed(4), median: median.toFixed(4), std: std.toFixed(4), min: sorted[0], max: sorted[sorted.length - 1], count: data.length });
    }
    default:
      return "Unknown tool";
  }
}

// Detect if a prompt is conceptual/educational (no tools needed)
function isConceptualPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  const conceptualKeywords = [
    "help me build and understand", "explain", "what is", "how does",
    "difference between", "tell me about", "describe", "overview",
    "what are", "why is", "help me learn", "teach me",
  ];
  return conceptualKeywords.some(k => lower.includes(k));
}

// Local type for non-streaming Groq completions (avoids SDK namespace issues)
interface GroqCompletionParams {
  model: string;
  messages: Groq.Chat.ChatCompletionMessageParam[];
  tools?: Groq.Chat.ChatCompletionTool[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
  max_tokens?: number;
  stream?: false;
}

// Attempt one Groq call; on tool_use_failed, retry without tools
async function groqWithFallback(
  groqClient: Groq,
  params: GroqCompletionParams,
): Promise<Groq.Chat.ChatCompletion> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (groqClient.chat.completions.create as any)(params);
  } catch (err: unknown) {
    const isToolFail =
      err instanceof Error &&
      (err.message.includes("tool_use_failed") || err.message.includes("Failed to call a function"));
    if (isToolFail) {
      // Retry without tools — model answers directly
      const { tools: _t, tool_choice: _tc, ...rest } = params;
      void _t; void _tc;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (groqClient.chat.completions.create as any)(rest);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const { prompt, model = "llama-3.3-70b-versatile", systemPrompt } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // For purely conceptual prompts, skip tool loop and answer directly
        if (isConceptualPrompt(prompt) && !systemPrompt) {
          send({ type: "agent_start", message: "Answering directly…" });
          send({ type: "step_start", step: 1 });
          const direct = await groq.chat.completions.create({
            model,
            messages: [
              {
                role: "system",
                content: `You are AXIOM, an expert AI engineering mentor. Answer clearly and technically.
When explaining AI concepts: give a crisp definition, explain why it matters, and show a short code example if relevant.`,
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 1200,
          });
          send({ type: "final_answer", content: direct.choices[0].message.content || "" });
          send({ type: "done" });
          controller.close();
          return;
        }

        const messages: Groq.Chat.ChatCompletionMessageParam[] = [
          {
            role: "system",
            content: systemPrompt || `You are AXIOM ReAct Agent — an AI that uses tools when needed.

CRITICAL TOOL USE RULES:
- Use web_search ONLY when you need real-time facts, news, or current data
- Use calculate ONLY for math or unit conversions
- Use analyze_data ONLY when given an explicit array of numbers to analyze
- Use summarize_url ONLY when given an explicit URL to fetch
- For ALL other questions — especially explanations, concepts, or "how to" questions — answer DIRECTLY without any tool calls

When you have enough information, stop calling tools and give your final answer.
Always think before each tool call: "Do I actually need external data for this?"`,
          },
          { role: "user", content: prompt },
        ];

        let stepCount = 0;
        const maxSteps = 8;

        send({ type: "agent_start", message: "Agent initialized, reasoning…" });

        while (stepCount < maxSteps) {
          stepCount++;
          send({ type: "step_start", step: stepCount });

          const response = await groqWithFallback(groq, {
            model,
            messages,
            tools: TOOLS,
            tool_choice: "auto",
            max_tokens: 1024,
          });

          const choice = response.choices[0];
          const msg = choice.message;

          if (msg.content) {
            send({ type: "thought", step: stepCount, content: msg.content });
          }

          // No tool calls → this is the final answer
          if (!msg.tool_calls || msg.tool_calls.length === 0) {
            send({ type: "final_answer", content: msg.content || "No response generated." });
            break;
          }

          // Push assistant message with its tool calls
          messages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });

          for (const toolCall of msg.tool_calls) {
            const toolName = toolCall.function.name;

            let toolArgs: Record<string, unknown> = {};
            try {
              toolArgs = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
              toolArgs = { raw: toolCall.function.arguments };
            }

            send({ type: "tool_call", step: stepCount, tool: toolName, args: toolArgs });

            const result = await executeTool(toolName, toolArgs);

            send({ type: "tool_result", step: stepCount, tool: toolName, result });

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: result,
            });
          }
        }

        if (stepCount >= maxSteps) {
          send({ type: "max_steps", message: "Max steps reached. Summarising…" });
          const finalResp = await groq.chat.completions.create({
            model,
            messages: [
              ...messages,
              { role: "user", content: "Provide your final answer based on what you have gathered so far." },
            ],
            max_tokens: 512,
          });
          send({ type: "final_answer", content: finalResp.choices[0].message.content || "" });
        }

        send({ type: "done" });
        controller.close();
      } catch (error) {
        send({ type: "error", message: String(error) });
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
