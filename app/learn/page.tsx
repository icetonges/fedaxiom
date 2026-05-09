"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  GraduationCap, Blocks, BookOpen, Hammer, Copy, Check,
  X, Trash2, Download, ChevronDown, ChevronRight, Zap,
  Code2, ArrowRight, Plus, RotateCcw,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface BlockDef {
  id: string; label: string; icon: string; desc: string;
  deps: string[]; env: string[];
}
interface BlockCat {
  cat: string; label: string; color: string; blocks: BlockDef[];
}
interface CanvasBlock {
  id: string; typeId: string; catId: string;
  label: string; icon: string; color: string;
  x: number; y: number;
  deps: string[]; env: string[];
}
interface Connection {
  id: string; fromId: string; toId: string; color: string;
}

// ─── BLOCK PALETTE ───────────────────────────────────────────────────────────
const BLOCK_PALETTE: BlockCat[] = [
  { cat:"llm", label:"🧠 LLM Models", color:"#4f8ef7", blocks:[
    { id:"gpt4o",    label:"GPT-4o",            icon:"🤖", desc:"OpenAI flagship. Best reasoning + vision.", deps:["openai"], env:["OPENAI_API_KEY"] },
    { id:"gemini25", label:"Gemini 2.5 Flash",  icon:"✨", desc:"Google. Fast, cheap, 1M context window.",  deps:["@google/generative-ai"], env:["GEMINI_API_KEY"] },
    { id:"claude35", label:"Claude 3.5 Sonnet", icon:"🧬", desc:"Anthropic. Best for complex code tasks.",  deps:["@anthropic-ai/sdk"], env:["ANTHROPIC_API_KEY"] },
    { id:"llama3",   label:"Llama 3 (Ollama)",  icon:"🦙", desc:"Runs 100% locally. Free, private.",       deps:["ollama"], env:[] },
    { id:"deepseek", label:"DeepSeek V3",        icon:"🔬", desc:"Open-source, near GPT-4 quality.",        deps:["openai"], env:["DEEPSEEK_API_KEY"] },
  ]},
  { cat:"tool", label:"🔧 Tools", color:"#34d399", blocks:[
    { id:"websearch", label:"Web Search",    icon:"🔍", desc:"Tavily real-time web search.",        deps:["@tavily/core"], env:["TAVILY_API_KEY"] },
    { id:"coderun",   label:"Code Executor", icon:"⚡", desc:"E2B sandboxed code execution.",       deps:["e2b"], env:["E2B_API_KEY"] },
    { id:"sqlquery",  label:"SQL Query",     icon:"🗄️", desc:"Neon Postgres query tool.",           deps:["@neondatabase/serverless"], env:["DATABASE_URL"] },
    { id:"emailsend", label:"Send Email",    icon:"📧", desc:"Resend transactional email.",         deps:["resend"], env:["RESEND_API_KEY"] },
    { id:"fileread",  label:"File System",   icon:"📄", desc:"Read/write local files.",             deps:[], env:[] },
    { id:"apicall",   label:"HTTP Request",  icon:"🌐", desc:"Fetch any external API.",             deps:[], env:[] },
    { id:"calcmath",  label:"Calculator",    icon:"🔢", desc:"Math & unit conversions.",            deps:[], env:[] },
  ]},
  { cat:"memory", label:"💾 Memory & RAG", color:"#a78bfa", blocks:[
    { id:"pgvector", label:"pgvector (Neon)", icon:"🐘", desc:"Postgres vector store.",             deps:["@neondatabase/serverless"], env:["DATABASE_URL"] },
    { id:"pinecone", label:"Pinecone",        icon:"🌲", desc:"Managed vector DB, scales to billions.", deps:["@pinecone-database/pinecone"], env:["PINECONE_API_KEY"] },
    { id:"chroma",   label:"ChromaDB",        icon:"🎨", desc:"Local vector store for dev.",        deps:["chromadb"], env:[] },
    { id:"redis",    label:"Redis Cache",     icon:"🔴", desc:"Session + short-term memory (KV).",  deps:["ioredis"], env:["REDIS_URL"] },
    { id:"inmem",    label:"In-Memory Store", icon:"💡", desc:"Ephemeral JS array. Dev only.",      deps:[], env:[] },
  ]},
  { cat:"processing", label:"⚙️ Processing", color:"#fb923c", blocks:[
    { id:"chunker",    label:"Text Chunker", icon:"✂️", desc:"Sliding window 800 chars / 120 overlap.", deps:[], env:[] },
    { id:"embedder",   label:"Embedder",     icon:"📐", desc:"text-embedding-004 → 768-dim vectors.", deps:["@google/generative-ai"], env:["GEMINI_API_KEY"] },
    { id:"reranker",   label:"Reranker",     icon:"📊", desc:"Cosine similarity re-rank top-k.",    deps:[], env:[] },
    { id:"summarizer", label:"Summarizer",   icon:"📝", desc:"Compress long context with LLM.",     deps:[], env:[] },
    { id:"classifier", label:"Classifier",   icon:"🏷️", desc:"Route by intent / category.",        deps:[], env:[] },
  ]},
  { cat:"orchestration", label:"🎼 Orchestration", color:"#e879f9", blocks:[
    { id:"sequential", label:"Sequential Chain",  icon:"➡️", desc:"Steps run one after another.",           deps:[], env:[] },
    { id:"parallel",   label:"Parallel Fan-out",  icon:"⑂",  desc:"Steps run concurrently via Promise.all.", deps:[], env:[] },
    { id:"router",     label:"Conditional Router", icon:"🔀", desc:"Branch on intent / confidence score.",   deps:[], env:[] },
    { id:"reactloop",  label:"ReAct Loop",        icon:"🔄", desc:"Reason → Act → Observe cycle.",          deps:[], env:[] },
    { id:"planner",    label:"Task Planner",      icon:"📋", desc:"Decompose goal into ordered sub-tasks.", deps:[], env:[] },
  ]},
  { cat:"protocol", label:"🔌 Protocols", color:"#38bdf8", blocks:[
    { id:"mcpserver", label:"MCP Server", icon:"🖥️", desc:"Expose tools via Model Context Protocol.", deps:["@modelcontextprotocol/sdk"], env:[] },
    { id:"mcpclient", label:"MCP Client", icon:"🔗", desc:"Connect to any MCP server dynamically.",   deps:["@modelcontextprotocol/sdk"], env:[] },
    { id:"a2aserver", label:"A2A Server", icon:"📡", desc:"Publish as A2A agent with AgentCard.",     deps:["express"], env:[] },
    { id:"a2aclient", label:"A2A Client", icon:"📤", desc:"Send tasks to remote A2A agents.",         deps:[], env:[] },
  ]},
  { cat:"evaluation", label:"📊 Evaluation", color:"#fbbf24", blocks:[
    { id:"llmjudge",      label:"LLM Judge",       icon:"⚖️", desc:"Use LLM to score agent output 1-10.",     deps:[], env:[] },
    { id:"ragas",         label:"RAGAS Metrics",   icon:"📈", desc:"Faithfulness, relevance, precision.",      deps:[], env:[] },
    { id:"exactmatch",    label:"Exact Match",     icon:"✅", desc:"String similarity evals.",                 deps:[], env:[] },
    { id:"humanfeedback", label:"Human Feedback",  icon:"👤", desc:"RLHF preference data collection.",        deps:[], env:[] },
    { id:"benchmark",     label:"Benchmark Runner",icon:"🏁", desc:"Run eval dataset against agent.",         deps:[], env:[] },
  ]},
  { cat:"deployment", label:"🚀 Deployment", color:"#f87171", blocks:[
    { id:"vercel",   label:"Vercel",     icon:"▲", desc:"Serverless Next.js. Zero-config deploy.", deps:[], env:["VERCEL_TOKEN"] },
    { id:"docker",   label:"Docker",     icon:"🐳", desc:"Container — portable, reproducible.",    deps:[], env:[] },
    { id:"cloudrun", label:"Cloud Run",  icon:"☁️", desc:"Google serverless containers.",           deps:[], env:["GOOGLE_CLOUD_PROJECT"] },
    { id:"railway",  label:"Railway",    icon:"🚃", desc:"Simple Docker hosting, no K8s needed.",  deps:[], env:["RAILWAY_TOKEN"] },
    { id:"k8s",      label:"Kubernetes", icon:"⚓", desc:"Enterprise-grade pod orchestration.",    deps:[], env:[] },
  ]},
];

const BLOCK_W = 172;
const BLOCK_H = 60;

function getCatColor(catId: string): string {
  return BLOCK_PALETTE.find(c => c.cat === catId)?.color ?? "#6b7499";
}

// ─── CODE GENERATOR ───────────────────────────────────────────────────────────
function generateProject(blocks: CanvasBlock[]): Record<string, string> {
  const files: Record<string, string> = {};
  const has = (id: string) => blocks.some(b => b.typeId === id);
  const llm = blocks.find(b => b.catId === "llm");
  const tools = blocks.filter(b => b.catId === "tool");
  const hasRAG = blocks.some(b => b.catId === "memory" || b.catId === "processing");
  const hasMCP = has("mcpserver");
  const hasA2A = has("a2aserver");
  const hasEval = blocks.some(b => b.catId === "evaluation");
  const hasDocker = has("docker");
  const hasOrch = blocks.some(b => b.catId === "orchestration");

  // Collect all deps + env
  const allDeps = new Set<string>(["zod"]);
  const allEnv = new Set<string>();
  blocks.forEach(b => { b.deps.forEach(d => allDeps.add(d)); b.env.forEach(e => allEnv.add(e)); });

  // ── package.json ─────────────────────────────────────────────────────────
  files["package.json"] = `{
  "name": "my-ai-agent",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "test": "vitest"
  },
  "dependencies": {
    ${[...allDeps].map(d => `"${d}": "latest"`).join(",\n    ")}
  },
  "devDependencies": {
    "typescript": "^5",
    "tsx": "^4",
    "vitest": "^1",
    "@types/node": "^20"
  }
}`;

  // ── .env.example ──────────────────────────────────────────────────────────
  files[".env.example"] = [...allEnv].map(k => `${k}=`).join("\n") + "\n";

  // ── tsconfig.json ─────────────────────────────────────────────────────────
  files["tsconfig.json"] = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}`;

  // ── src/llm/client.ts ─────────────────────────────────────────────────────
  if (llm?.typeId === "gpt4o" || llm?.typeId === "deepseek") {
    const baseURL = llm.typeId === "deepseek" ? `\n  baseURL: "https://api.deepseek.com/v1",` : "";
    const apiKey = llm.typeId === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENAI_API_KEY";
    const model = llm.typeId === "deepseek" ? "deepseek-chat" : "gpt-4o";
    files["src/llm/client.ts"] = `import OpenAI from "openai";

const client = new OpenAI({${baseURL}
  apiKey: process.env.${apiKey}!,
});

export async function complete(
  prompt: string,
  system = "You are a helpful AI assistant.",
): Promise<string> {
  const res = await client.chat.completions.create({
    model: "${model}",
    messages: [
      { role: "system", content: system },
      { role: "user",   content: prompt },
    ],
  });
  return res.choices[0].message.content ?? "";
}

export async function completeStream(
  prompt: string,
  system = "You are a helpful AI assistant.",
  onChunk: (text: string) => void,
): Promise<void> {
  const stream = await client.chat.completions.create({
    model: "${model}",
    stream: true,
    messages: [
      { role: "system", content: system },
      { role: "user",   content: prompt },
    ],
  });
  for await (const chunk of stream) {
    onChunk(chunk.choices[0]?.delta.content ?? "");
  }
}`;
  } else if (llm?.typeId === "claude35") {
    files["src/llm/client.ts"] = `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function complete(
  prompt: string,
  system = "You are a helpful AI assistant.",
): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content[0].type === "text" ? msg.content[0].text : "";
}

export async function completeStream(
  prompt: string,
  system = "You are a helpful AI assistant.",
  onChunk: (text: string) => void,
): Promise<void> {
  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      onChunk(event.delta.text);
    }
  }
}`;
  } else if (llm?.typeId === "llama3") {
    files["src/llm/client.ts"] = `import ollama from "ollama";

export async function complete(
  prompt: string,
  system = "You are a helpful AI assistant.",
): Promise<string> {
  const res = await ollama.chat({
    model: "llama3",
    messages: [
      { role: "system", content: system },
      { role: "user",   content: prompt },
    ],
  });
  return res.message.content;
}

export async function completeStream(
  prompt: string,
  system = "You are a helpful AI assistant.",
  onChunk: (text: string) => void,
): Promise<void> {
  const stream = await ollama.chat({
    model: "llama3",
    stream: true,
    messages: [
      { role: "system", content: system },
      { role: "user",   content: prompt },
    ],
  });
  for await (const chunk of stream) {
    onChunk(chunk.message.content);
  }
}`;
  } else {
    // default: Gemini
    files["src/llm/client.ts"] = `import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function complete(
  prompt: string,
  system = "You are a helpful AI assistant.",
): Promise<string> {
  const result = await model.generateContent(
    \`SYSTEM: \${system}\\n\\nUSER: \${prompt}\`
  );
  return result.response.text();
}

export async function completeStream(
  prompt: string,
  system = "You are a helpful AI assistant.",
  onChunk: (text: string) => void,
): Promise<void> {
  const result = await model.generateContentStream(
    \`SYSTEM: \${system}\\n\\nUSER: \${prompt}\`
  );
  for await (const chunk of result.stream) {
    onChunk(chunk.text());
  }
}`;
  }

  // ── src/tools/index.ts ────────────────────────────────────────────────────
  if (tools.length > 0) {
    const toolImpls: string[] = [
      `import { z } from "zod";`,
      ``,
      `export interface Tool<TInput, TOutput> {`,
      `  name: string;`,
      `  description: string;`,
      `  schema: z.ZodType<TInput>;`,
      `  execute: (input: TInput) => Promise<TOutput>;`,
      `}`,
      ``,
    ];

    if (tools.some(t => t.typeId === "websearch")) {
      toolImpls.push(
        `// ── Web Search (Tavily) ──────────────────────────────────────────────────`,
        `export const searchWebTool: Tool<{ query: string; maxResults?: number }, unknown[]> = {`,
        `  name: "search_web",`,
        `  description: "Search the internet for current, real-time information",`,
        `  schema: z.object({ query: z.string(), maxResults: z.number().optional().default(5) }),`,
        `  async execute({ query, maxResults = 5 }) {`,
        `    const res = await fetch("https://api.tavily.com/search", {`,
        `      method: "POST",`,
        `      headers: { "Content-Type": "application/json" },`,
        `      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, max_results: maxResults }),`,
        `    });`,
        `    const data = await res.json() as { results: unknown[] };`,
        `    return data.results;`,
        `  },`,
        `};`,
        ``,
      );
    }

    if (tools.some(t => t.typeId === "sqlquery")) {
      toolImpls.push(
        `// ── SQL Query (Neon) ─────────────────────────────────────────────────────`,
        `import { neon } from "@neondatabase/serverless";`,
        `const sql = neon(process.env.DATABASE_URL!);`,
        ``,
        `export const queryDbTool: Tool<{ query: string; params?: unknown[] }, unknown[]> = {`,
        `  name: "query_db",`,
        `  description: "Run a read-only SQL query against the database",`,
        `  schema: z.object({ query: z.string(), params: z.array(z.unknown()).optional() }),`,
        `  async execute({ query, params = [] }) {`,
        `    return sql(query, params);`,
        `  },`,
        `};`,
        ``,
      );
    }

    if (tools.some(t => t.typeId === "emailsend")) {
      toolImpls.push(
        `// ── Send Email (Resend) ──────────────────────────────────────────────────`,
        `import { Resend } from "resend";`,
        `const resend = new Resend(process.env.RESEND_API_KEY!);`,
        ``,
        `export const sendEmailTool: Tool<{ to: string; subject: string; body: string }, { id: string }> = {`,
        `  name: "send_email",`,
        `  description: "Send a transactional email",`,
        `  schema: z.object({ to: z.string().email(), subject: z.string(), body: z.string() }),`,
        `  async execute({ to, subject, body }) {`,
        `    const { data } = await resend.emails.send({ from: "agent@yourdomain.com", to, subject, html: body });`,
        `    return { id: data?.id ?? "unknown" };`,
        `  },`,
        `};`,
        ``,
      );
    }

    if (tools.some(t => t.typeId === "calcmath")) {
      toolImpls.push(
        `// ── Calculator ───────────────────────────────────────────────────────────`,
        `export const calculatorTool: Tool<{ expression: string }, number> = {`,
        `  name: "calculate",`,
        `  description: "Evaluate a mathematical expression",`,
        `  schema: z.object({ expression: z.string() }),`,
        `  async execute({ expression }) {`,
        `    // Safe subset — only numbers and operators`,
        `    if (!/^[0-9+\\-*/().\\s]+$/.test(expression)) throw new Error("Unsafe expression");`,
        `    return Function(\`"use strict"; return (\${expression})\`)() as number;`,
        `  },`,
        `};`,
        ``,
      );
    }

    // Tool registry
    const toolNames = tools.map(t => {
      if (t.typeId === "websearch") return "searchWebTool";
      if (t.typeId === "sqlquery") return "queryDbTool";
      if (t.typeId === "emailsend") return "sendEmailTool";
      if (t.typeId === "calcmath") return "calculatorTool";
      return null;
    }).filter(Boolean) as string[];

    toolImpls.push(
      `// ── Registry ─────────────────────────────────────────────────────────────`,
      `// eslint-disable-next-line @typescript-eslint/no-explicit-any`,
      `export const TOOL_REGISTRY: Record<string, Tool<any, any>> = {`,
      ...toolNames.map(n => `  ${n.replace("Tool", "")}: ${n},`),
      `};`,
    );

    files["src/tools/index.ts"] = toolImpls.join("\n");
  }

  // ── src/rag/pipeline.ts ───────────────────────────────────────────────────
  if (hasRAG) {
    const useGeminiEmbed = has("embedder") || has("pgvector");
    files["src/rag/pipeline.ts"] = `${useGeminiEmbed ? `import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
` : ""}
export interface Chunk { id: string; text: string; vector?: number[]; }

// ── Chunker ───────────────────────────────────────────────────────────────
export function chunkText(text: string, size = 800, overlap = 120): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + size).trim();
    if (chunk) chunks.push(chunk);
    i += size - overlap;
  }
  return chunks;
}

${useGeminiEmbed ? `// ── Embedder ─────────────────────────────────────────────────────────────
export async function embed(text: string): Promise<number[]> {
  const result = await embedModel.embedContent(text);
  return result.embedding.values;
}

// ── Cosine similarity ─────────────────────────────────────────────────────
function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

// ── In-memory vector store ────────────────────────────────────────────────
const STORE: Chunk[] = [];

export async function ingest(text: string, id = crypto.randomUUID()): Promise<void> {
  const texts = chunkText(text);
  for (const t of texts) {
    const vector = await embed(t);
    STORE.push({ id: \`\${id}-\${STORE.length}\`, text: t, vector });
  }
}

// ── Hybrid retrieval: keyword pre-filter → vector re-rank ─────────────────
export async function retrieve(query: string, k = 5): Promise<Chunk[]> {
  const qTerms = query.toLowerCase().split(/\\s+/);
  const candidates = STORE
    .map(c => ({ ...c, kw: qTerms.filter(t => c.text.toLowerCase().includes(t)).length }))
    .filter(c => c.kw > 0 || STORE.length <= 20)
    .sort((a, b) => b.kw - a.kw)
    .slice(0, 20);

  const qVec = await embed(query);
  return candidates
    .map(c => ({ ...c, score: c.vector ? cosine(qVec, c.vector) : 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}` : `// ── Simple keyword search (add embedder block for vector search) ─────────
const STORE: Chunk[] = [];

export function ingest(text: string, id = crypto.randomUUID()): void {
  chunkText(text).forEach((t, i) => STORE.push({ id: \`\${id}-\${i}\`, text: t }));
}

export function retrieve(query: string, k = 5): Chunk[] {
  const terms = query.toLowerCase().split(/\\s+/);
  return STORE
    .map(c => ({ ...c, score: terms.filter(t => c.text.toLowerCase().includes(t)).length }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}`}`;
  }

  // ── src/orchestration/pipeline.ts ─────────────────────────────────────────
  if (hasOrch) {
    const orch = blocks.find(b => b.catId === "orchestration");
    const orchType = orch?.typeId ?? "sequential";
    files["src/orchestration/pipeline.ts"] = `import { complete } from "../llm/client.js";
${hasRAG ? `import { retrieve } from "../rag/pipeline.js";` : ""}
${tools.length > 0 ? `import { TOOL_REGISTRY } from "../tools/index.js";` : ""}

export interface PipelineInput  { query: string; context?: string; }
export interface PipelineOutput { answer: string; sources: string[]; tokensUsed?: number; }

${orchType === "parallel" ? `// ── Parallel fan-out: retrieve + classify simultaneously ─────────────────
export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const [chunks, intent] = await Promise.all([
    ${hasRAG ? `retrieve(input.query, 5),` : `Promise.resolve([] as { text: string }[]),`}
    complete(\`Classify this query as one word (factual|analytical|creative): \${input.query}\`),
  ]);
  const context = [
    ...chunks.map(c => c.text),
    input.context ?? "",
  ].filter(Boolean).join("\\n\\n---\\n\\n");

  const answer = await complete(
    \`Answer using ONLY the context below. Query: \${input.query}\\n\\nContext:\\n\${context}\`,
    "You are a precise research assistant. Ground every claim in the context.",
  );
  return { answer, sources: chunks.map(c => c.id) };
}` : orchType === "reactloop" ? `// ── ReAct loop: Reason → Act → Observe ──────────────────────────────────
const MAX_STEPS = 6;

export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const history: string[] = [];

  for (let step = 0; step < MAX_STEPS; step++) {
    const thought = await complete(
      [
        \`Goal: \${input.query}\`,
        \`History:\\n\${history.join("\\n") || "(none)"}\`,
        \`Step \${step + 1}: Decide — call a tool or give final answer.\`,
        \`Format: TOOL: <name> <json_args>  OR  ANSWER: <your answer>\`,
      ].join("\\n"),
    );

    if (thought.startsWith("ANSWER:")) {
      return { answer: thought.slice(7).trim(), sources: [] };
    }

    const toolMatch = thought.match(/^TOOL:\\s*(\\w+)\\s+(\\{.*\\})/s);
    if (toolMatch) {
      const [, toolName, argsJson] = toolMatch;
      const tool = TOOL_REGISTRY[toolName];
      if (tool) {
        const result = await tool.execute(JSON.parse(argsJson));
        history.push(\`Step \${step + 1}: Called \${toolName} → \${JSON.stringify(result).slice(0, 400)}\`);
        continue;
      }
    }

    history.push(\`Step \${step + 1}: (invalid format) \${thought.slice(0, 200)}\`);
  }

  return { answer: "Max steps reached without final answer.", sources: [] };
}` : `// ── Sequential chain: classify → retrieve → synthesise ───────────────────
export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  // Phase 1: classify intent
  const intent = await complete(
    \`In one word classify this query: factual|creative|analytical.\\nQuery: \${input.query}\`
  );

  // Phase 2: retrieve context
  ${hasRAG ? `const chunks = await retrieve(input.query, 5);
  const context = chunks.map(c => c.text).join("\\n\\n---\\n\\n");` : `const context = input.context ?? "";
  const chunks: { id: string }[] = [];`}

  // Phase 3: synthesise
  const system = intent.includes("factual")
    ? "Answer factually, cite sources. If context doesn't contain the answer, say so."
    : "Be helpful, clear, and concise.";

  const answer = await complete(
    context
      ? \`Context:\\n\${context}\\n\\nQuestion: \${input.query}\`
      : input.query,
    system,
  );

  return { answer, sources: ${hasRAG ? "chunks.map(c => c.id)" : "[]"} };
}`}`;
  }

  // ── src/mcp/server.ts ─────────────────────────────────────────────────────
  if (hasMCP) {
    files["src/mcp/server.ts"] = `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
${hasOrch ? `import { runPipeline } from "../orchestration/pipeline.js";` : `import { complete } from "../llm/client.js";`}

const server = new McpServer({
  name: "my-agent-server",
  version: "1.0.0",
});

// ── Expose the agent as an MCP tool ──────────────────────────────────────
server.tool(
  "ask_agent",
  "Send a query to the AI agent and get a comprehensive answer",
  { query: z.string().describe("The question or task for the agent") },
  async ({ query }) => {
    ${hasOrch
      ? `const result = await runPipeline({ query });
    return { content: [{ type: "text", text: result.answer }] };`
      : `const answer = await complete(query);
    return { content: [{ type: "text", text: answer }] };`}
  },
);

// ── Health check tool ─────────────────────────────────────────────────────
server.tool(
  "health_check",
  "Check if the agent server is running correctly",
  {},
  async () => ({
    content: [{ type: "text", text: JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }) }],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[MCP] Server running on stdio");
}

main().catch(console.error);`;
  }

  // ── src/eval/judge.ts ─────────────────────────────────────────────────────
  if (hasEval) {
    files["src/eval/judge.ts"] = `import { complete } from "../llm/client.js";

export interface EvalCase {
  query:    string;
  expected: string;
  actual:   string;
  context?: string;
}

export interface EvalResult {
  score:      number;   // 1–10
  reasoning:  string;
  pass:       boolean;  // score >= 7
  faithfulness?: number;
  relevance?:    number;
}

// ── LLM-as-Judge ─────────────────────────────────────────────────────────
export async function judgeAnswer(c: EvalCase): Promise<EvalResult> {
  const prompt = \`You are an expert evaluator. Score this AI response from 1 to 10.

QUERY: \${c.query}
EXPECTED (ground truth): \${c.expected}
ACTUAL RESPONSE: \${c.actual}
\${c.context ? \`CONTEXT PROVIDED: \${c.context.slice(0, 800)}\` : ""}

Evaluate on:
1. Faithfulness — is the answer grounded in truth / context? (no hallucination)
2. Relevance — does it directly answer the query?
3. Completeness — does it cover the key points?

Respond with JSON only:
{ "score": <1-10>, "faithfulness": <1-10>, "relevance": <1-10>, "reasoning": "<1 sentence>" }\`;

  const raw = await complete(prompt, "You are a precise evaluator. Return only valid JSON.");
  try {
    const parsed = JSON.parse(raw.replace(/\`\`\`json|\`\`\`/g, "").trim()) as {
      score: number; faithfulness: number; relevance: number; reasoning: string;
    };
    return { ...parsed, pass: parsed.score >= 7 };
  } catch {
    return { score: 0, reasoning: "Parse error", pass: false };
  }
}

// ── Batch benchmark ───────────────────────────────────────────────────────
export async function runBenchmark(cases: EvalCase[]): Promise<{
  avgScore: number; passRate: number; results: EvalResult[];
}> {
  const results = await Promise.all(cases.map(judgeAnswer));
  const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;
  const passRate = results.filter(r => r.pass).length / results.length;
  return { avgScore, passRate, results };
}`;
  }

  // ── src/a2a/server.ts ─────────────────────────────────────────────────────
  if (hasA2A) {
    files["src/a2a/server.ts"] = `import express from "express";
${hasOrch ? `import { runPipeline } from "../orchestration/pipeline.js";` : `import { complete } from "../llm/client.js";`}

const app = express();
app.use(express.json());

// ── Agent Card — discovery endpoint ──────────────────────────────────────
app.get("/.well-known/agent.json", (_req, res) => {
  res.json({
    name: "research-agent",
    version: "1.0.0",
    description: "AI research agent with RAG and web search",
    endpoint: \`http://localhost:\${PORT}\`,
    skills: [
      { id: "research", description: "Research any topic and return cited answer" },
      { id: "summarize", description: "Summarize a provided document" },
    ],
    auth: { schemes: ["none"] },
  });
});

// ── Task endpoint — accepts and executes tasks ────────────────────────────
app.post("/tasks/send", async (req, res) => {
  const { id, goal, context } = req.body as { id: string; goal: string; context?: string };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");

  const send = (data: object) => res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);
  send({ status: "working", taskId: id });

  try {
    ${hasOrch
      ? `const result = await runPipeline({ query: goal, context });
    send({ status: "done", taskId: id, output: result.answer, sources: result.sources });`
      : `const answer = await complete(goal);
    send({ status: "done", taskId: id, output: answer });`}
  } catch (err) {
    send({ status: "error", taskId: id, error: String(err) });
  }

  res.end();
});

const PORT = parseInt(process.env.PORT ?? "3001", 10);
app.listen(PORT, () => console.log(\`[A2A] Agent listening on port \${PORT}\`));`;
  }

  // ── Dockerfile ───────────────────────────────────────────────────────────
  if (hasDocker) {
    files["Dockerfile"] = `FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=deps  /app/node_modules ./node_modules
COPY package.json .

EXPOSE 3000
CMD ["node", "dist/index.js"]`;

    files["docker-compose.yml"] = `version: "3.9"
services:
  agent:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3`;
  }

  // ── .github/workflows/ci.yml ──────────────────────────────────────────────
  files[".github/workflows/ci.yml"] = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test -- --run

      ${hasDocker ? `- name: Build Docker image
        run: docker build -t my-ai-agent .` : ""}

      ${has("vercel")
        ? `- name: Deploy to Vercel
        if: github.ref == 'refs/heads/main'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'`
        : ""}`;

  // ── src/index.ts (entry point) ────────────────────────────────────────────
  files["src/index.ts"] = `${hasOrch ? `import { runPipeline } from "./orchestration/pipeline.js";` : `import { complete } from "./llm/client.js";`}

async function main() {
  const query = process.argv[2] ?? "Explain what an AI agent system is in 3 sentences.";
  console.log(\`\\n🤖 Query: \${query}\\n\`);

  ${hasOrch
    ? `const result = await runPipeline({ query });
  console.log("📝 Answer:", result.answer);
  if (result.sources.length) console.log("📚 Sources:", result.sources.join(", "));`
    : `const answer = await complete(query);
  console.log("📝 Answer:", answer);`}
}

main().catch(console.error);`;

  return files;
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function LearnPage() {
  type Mode = "canvas" | "curriculum" | "builder";
  const [mode, setMode] = useState<Mode>("canvas");

  // Canvas state
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [activeGenFile, setActiveGenFile] = useState(0);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);

  const draggingRef = useRef<{ id: string; sx: number; sy: number; bx: number; by: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  // Mouse drag: reposition blocks on canvas
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - draggingRef.current.sx;
      const dy = e.clientY - draggingRef.current.sy;
      const { id, bx, by } = draggingRef.current;
      setCanvasBlocks(prev => prev.map(b =>
        b.id === id ? { ...b, x: Math.max(0, bx + dx), y: Math.max(0, by + dy) } : b
      ));
    };
    const onUp = () => { draggingRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const addBlock = useCallback((typeId: string, x: number, y: number) => {
    const cat = BLOCK_PALETTE.find(c => c.blocks.some(b => b.id === typeId));
    const def = cat?.blocks.find(b => b.id === typeId);
    if (!def || !cat) return;
    const id = `b${++idRef.current}`;
    setCanvasBlocks(prev => [...prev, {
      id, typeId, catId: cat.cat,
      label: def.label, icon: def.icon, color: cat.color,
      x, y, deps: def.deps, env: def.env,
    }]);
    setSelectedBlock(id);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const typeId = e.dataTransfer.getData("text/plain");
    if (!typeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    addBlock(typeId, e.clientX - rect.left - BLOCK_W / 2, e.clientY - rect.top - BLOCK_H / 2);
  }, [addBlock]);

  const handleBlockMouseDown = useCallback((e: React.MouseEvent, blockId: string) => {
    e.preventDefault(); e.stopPropagation();
    const block = canvasBlocks.find(b => b.id === blockId);
    if (!block) return;
    draggingRef.current = { id: blockId, sx: e.clientX, sy: e.clientY, bx: block.x, by: block.y };
  }, [canvasBlocks]);

  const handlePortClick = useCallback((e: React.MouseEvent, blockId: string, port: "in" | "out") => {
    e.stopPropagation();
    if (port === "out") {
      setConnectingFrom(prev => prev === blockId ? null : blockId);
    } else {
      if (connectingFrom && connectingFrom !== blockId) {
        const from = canvasBlocks.find(b => b.id === connectingFrom);
        setConnections(prev => [...prev, {
          id: `c${Date.now()}`, fromId: connectingFrom, toId: blockId,
          color: from?.color ?? "#6b7499",
        }]);
        setConnectingFrom(null);
      }
    }
  }, [connectingFrom, canvasBlocks]);

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);

  const generatedFiles = canvasBlocks.length > 0 ? generateProject(canvasBlocks) : {};
  const genFileNames = Object.keys(generatedFiles);
  const selectedBlockDef = canvasBlocks.find(b => b.id === selectedBlock);

  // Color for connecting indicator
  const connectingBlock = connectingFrom ? canvasBlocks.find(b => b.id === connectingFrom) : null;

  return (
    <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#0d0f1a", color: "#eaedf8", fontFamily: "system-ui, sans-serif", overflow: "hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", borderBottom: "1px solid #1a1d2e", background: "#0a0c15" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 16 }}>
          <span style={{ fontSize: 20 }}>🧩</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#eaedf8", letterSpacing: "-0.3px" }}>Zero → Enterprise AI</span>
        </div>

        {/* Mode tabs */}
        {(["canvas", "curriculum", "builder"] as Mode[]).map((m, i) => {
          const labels: Record<Mode, string> = { canvas: "🧩 LEGO Canvas", curriculum: "📚 Curriculum", builder: "🔨 Builder" };
          const colors: Record<Mode, string> = { canvas: "#f59e0b", curriculum: "#a78bfa", builder: "#34d399" };
          return (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "5px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: mode === m ? `${colors[m]}18` : "transparent",
              border: mode === m ? `1px solid ${colors[m]}50` : "1px solid transparent",
              color: mode === m ? colors[m] : "#5c6480", transition: "all 0.15s",
            }}>{labels[m]}</button>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* Canvas actions */}
        {mode === "canvas" && (
          <>
            {connectingFrom && (
              <div style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.35)", color: "#38bdf8" }}>
                🔗 Click an input port to connect from <strong>{connectingBlock?.label}</strong>
              </div>
            )}
            <button onClick={() => { setCanvasBlocks([]); setConnections([]); setSelectedBlock(null); setConnectingFrom(null); }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid #252840", color: "#5c6480" }}>
              <RotateCcw size={11} />Clear
            </button>
            <button onClick={() => { setShowCodeModal(true); setActiveGenFile(0); }}
              disabled={canvasBlocks.length === 0}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 800, cursor: canvasBlocks.length > 0 ? "pointer" : "not-allowed", background: canvasBlocks.length > 0 ? "linear-gradient(135deg,#f59e0b,#e879f9)" : "rgba(255,255,255,0.04)", border: "none", color: canvasBlocks.length > 0 ? "#0d0f1a" : "#3d4460", opacity: canvasBlocks.length === 0 ? 0.5 : 1 }}>
              <Zap size={11} />Generate Code
            </button>
          </>
        )}

        <a href="/code-analysis" style={{ fontSize: 11, color: "#4a5270", textDecoration: "none", padding: "5px 10px", borderRadius: 6, border: "1px solid #1a1d2e" }}>← Code Intel</a>
      </div>

      {/* ── CANVAS MODE ── */}
      {mode === "canvas" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Palette sidebar */}
          <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid #1a1d2e", overflowY: "auto", background: "#0a0c15" }}>
            <div style={{ padding: "10px 12px 6px", fontSize: 10, fontWeight: 800, color: "#3d4460", letterSpacing: "0.1em" }}>DRAG BLOCKS TO CANVAS</div>
            {BLOCK_PALETTE.map(cat => (
              <div key={cat.cat}>
                <button onClick={() => setCollapsedCats(prev => { const next = new Set(prev); next.has(cat.cat) ? next.delete(cat.cat) : next.add(cat.cat); return next; })}
                  style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "7px 12px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                  {collapsedCats.has(cat.cat) ? <ChevronRight size={11} color="#5c6480" /> : <ChevronDown size={11} color={cat.color} />}
                  <span style={{ fontSize: 11, fontWeight: 700, color: collapsedCats.has(cat.cat) ? "#5c6480" : cat.color }}>{cat.label}</span>
                </button>
                {!collapsedCats.has(cat.cat) && cat.blocks.map(block => (
                  <div key={block.id} draggable
                    onDragStart={e => { e.dataTransfer.setData("text/plain", block.id); e.dataTransfer.effectAllowed = "copy"; }}
                    style={{ margin: "2px 8px", padding: "7px 10px", borderRadius: 7, background: "#12141f", border: `1px solid ${cat.color}20`, cursor: "grab", userSelect: "none", transition: "border-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${cat.color}60`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = `${cat.color}20`)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{block.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>{block.label}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#5c6480", marginTop: 3, lineHeight: 1.4 }}>{block.desc}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Canvas drop zone */}
          <div ref={canvasRef} onClick={() => { setSelectedBlock(null); if (!connectingFrom) return; }}
            onDragOver={e => e.preventDefault()}
            onDrop={handleCanvasDrop}
            style={{ flex: 1, position: "relative", overflow: "hidden", background: "#090b14",
              backgroundImage: "radial-gradient(circle, #1a1d2e 1px, transparent 1px)",
              backgroundSize: "28px 28px", cursor: "default" }}>

            {canvasBlocks.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, pointerEvents: "none" }}>
                <div style={{ fontSize: 48, opacity: 0.15 }}>🧩</div>
                <div style={{ fontSize: 14, color: "#3d4460", fontWeight: 600 }}>Drag blocks here to build your agent</div>
                <div style={{ fontSize: 12, color: "#2a2e46" }}>Connect blocks with ports → Generate production code</div>
              </div>
            )}

            {/* SVG connection layer */}
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
              {connections.map(conn => {
                const from = canvasBlocks.find(b => b.id === conn.fromId);
                const to = canvasBlocks.find(b => b.id === conn.toId);
                if (!from || !to) return null;
                const x1 = from.x + BLOCK_W;
                const y1 = from.y + BLOCK_H / 2;
                const x2 = to.x;
                const y2 = to.y + BLOCK_H / 2;
                const mx = (x1 + x2) / 2;
                return (
                  <g key={conn.id}>
                    <path d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
                      stroke={conn.color} strokeWidth={2} fill="none" opacity={0.65} />
                    <circle cx={x1} cy={y1} r={4} fill={conn.color} opacity={0.8} />
                    <circle cx={x2} cy={y2} r={4} fill={conn.color} opacity={0.8} />
                  </g>
                );
              })}
            </svg>

            {/* Blocks */}
            {canvasBlocks.map(block => {
              const isSelected = selectedBlock === block.id;
              const isConnFrom = connectingFrom === block.id;
              return (
                <div key={block.id}
                  onMouseDown={e => handleBlockMouseDown(e, block.id)}
                  onClick={e => { e.stopPropagation(); setSelectedBlock(block.id); }}
                  style={{
                    position: "absolute", left: block.x, top: block.y,
                    width: BLOCK_W, height: BLOCK_H, zIndex: 2,
                    borderRadius: 10, background: "#12141f",
                    border: `2px solid ${isSelected || isConnFrom ? block.color : `${block.color}35`}`,
                    boxShadow: isSelected ? `0 0 0 3px ${block.color}25` : "none",
                    cursor: "move", userSelect: "none", transition: "border-color 0.1s, box-shadow 0.1s",
                    display: "flex", alignItems: "center", padding: "0 12px", gap: 8,
                  }}>
                  {/* Input port */}
                  <div onClick={e => handlePortClick(e, block.id, "in")}
                    style={{ position: "absolute", left: -7, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: connectingFrom && connectingFrom !== block.id ? block.color : "#1a1d2e", border: `2px solid ${block.color}`, cursor: "pointer", zIndex: 3, transition: "background 0.15s" }} />
                  {/* Block content */}
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{block.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: block.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.label}</div>
                    <div style={{ fontSize: 9, color: "#5c6480", marginTop: 1 }}>{block.catId.toUpperCase()}</div>
                  </div>
                  {/* Output port */}
                  <div onClick={e => handlePortClick(e, block.id, "out")}
                    style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: isConnFrom ? block.color : "#1a1d2e", border: `2px solid ${block.color}`, cursor: "pointer", zIndex: 3, transition: "background 0.15s" }} />
                  {/* Delete button */}
                  <button onClick={e => { e.stopPropagation(); setCanvasBlocks(prev => prev.filter(b => b.id !== block.id)); setConnections(prev => prev.filter(c => c.fromId !== block.id && c.toId !== block.id)); if (selectedBlock === block.id) setSelectedBlock(null); }}
                    style={{ position: "absolute", top: -7, right: -7, width: 16, height: 16, borderRadius: "50%", background: "#f87171", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4, opacity: isSelected ? 1 : 0, transition: "opacity 0.15s" }}>
                    <X size={9} color="#0d0f1a" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right panel */}
          <div style={{ width: 300, flexShrink: 0, borderLeft: "1px solid #1a1d2e", overflowY: "auto", background: "#0a0c15", padding: 16 }}>
            {selectedBlockDef ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{selectedBlockDef.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: selectedBlockDef.color }}>{selectedBlockDef.label}</div>
                    <div style={{ fontSize: 10, color: "#5c6480" }}>{selectedBlockDef.catId.toUpperCase()}</div>
                  </div>
                </div>

                {selectedBlockDef.deps.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#5c6480", marginBottom: 5 }}>NPM DEPENDENCIES</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {selectedBlockDef.deps.map(d => (
                        <span key={d} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: `${selectedBlockDef.color}12`, border: `1px solid ${selectedBlockDef.color}30`, color: selectedBlockDef.color, fontFamily: "monospace" }}>{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBlockDef.env.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#5c6480", marginBottom: 5 }}>ENV VARIABLES NEEDED</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {selectedBlockDef.env.map(e => (
                        <span key={e} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", fontFamily: "monospace" }}>{e}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ fontSize: 10, fontWeight: 700, color: "#5c6480", marginBottom: 6 }}>CONNECTIONS</div>
                <div style={{ fontSize: 11, color: "#5c6480", marginBottom: 12 }}>
                  In: {connections.filter(c => c.toId === selectedBlockDef.id).length} &nbsp;|&nbsp;
                  Out: {connections.filter(c => c.fromId === selectedBlockDef.id).length}
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: "#5c6480", marginBottom: 6 }}>QUICK ACTIONS</div>
                <button onClick={() => handlePortClick({ stopPropagation: () => {} } as React.MouseEvent, selectedBlockDef.id, "out")}
                  style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "7px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", background: `${selectedBlockDef.color}12`, border: `1px solid ${selectedBlockDef.color}30`, color: selectedBlockDef.color, marginBottom: 6 }}>
                  <ArrowRight size={11} />Start connection from this block
                </button>
                <button onClick={() => { setCanvasBlocks(prev => prev.filter(b => b.id !== selectedBlockDef.id)); setConnections(prev => prev.filter(c => c.fromId !== selectedBlockDef.id && c.toId !== selectedBlockDef.id)); setSelectedBlock(null); }}
                  style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", padding: "7px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
                  <Trash2 size={11} />Remove block
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>🎛️</div>
                <div style={{ fontSize: 12, color: "#3d4460" }}>Click a block to see its config</div>
                <div style={{ fontSize: 10, color: "#2a2e46", marginTop: 6 }}>
                  {canvasBlocks.length} block{canvasBlocks.length !== 1 ? "s" : ""} · {connections.length} connection{connections.length !== 1 ? "s" : ""}
                </div>
              </div>
            )}

            {canvasBlocks.length > 0 && (
              <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", marginBottom: 8 }}>📦 GENERATED FILES</div>
                {Object.keys(generatedFiles).map(f => (
                  <div key={f} style={{ fontSize: 10, color: "#7d88a8", fontFamily: "monospace", padding: "2px 0" }}>📄 {f}</div>
                ))}
                <button onClick={() => { setShowCodeModal(true); setActiveGenFile(0); }}
                  style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 5, width: "100%", justifyContent: "center", padding: "6px 0", borderRadius: 7, fontSize: 11, fontWeight: 800, cursor: "pointer", background: "linear-gradient(135deg,#f59e0b,#e879f9)", border: "none", color: "#0d0f1a" }}>
                  <Code2 size={11} />View All Files
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CURRICULUM & BUILDER placeholders ── */}
      {(mode === "curriculum" || mode === "builder") && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 40, opacity: 0.3 }}>{mode === "curriculum" ? "📚" : "🔨"}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#5c6480" }}>
            {mode === "curriculum" ? "Curriculum — 12 Modules" : "Project Builder — 35 Steps"}
          </div>
          <div style={{ fontSize: 13, color: "#3d4460", maxWidth: 400, textAlign: "center" }}>
            Coming in Phase 2. Use the <strong style={{ color: "#f59e0b" }}>🧩 LEGO Canvas</strong> to start building your agent architecture now.
          </div>
        </div>
      )}

      {/* ── GENERATED CODE MODAL ── */}
      {showCodeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setShowCodeModal(false)}>
          <div style={{ width: "100%", maxWidth: 900, maxHeight: "85vh", borderRadius: 14, background: "#0d0f1a", border: "1px solid #1a1d2e", display: "flex", flexDirection: "column", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #1a1d2e", gap: 10 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#eaedf8" }}>Generated Project — {Object.keys(generatedFiles).length} files</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowCodeModal(false)} style={{ background: "none", border: "none", color: "#5c6480", cursor: "pointer", padding: 4 }}><X size={16} /></button>
            </div>

            {/* File tabs */}
            <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid #1a1d2e", padding: "0 12px" }}>
              {genFileNames.map((name, i) => (
                <button key={name} onClick={() => setActiveGenFile(i)} style={{
                  padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  background: "transparent", border: "none", borderBottom: activeGenFile === i ? "2px solid #f59e0b" : "2px solid transparent",
                  color: activeGenFile === i ? "#f59e0b" : "#5c6480", transition: "all 0.15s",
                  fontFamily: "monospace",
                }}>{name}</button>
              ))}
            </div>

            {/* Code content */}
            <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
              <button onClick={() => copyToClipboard(generatedFiles[genFileNames[activeGenFile]] ?? "", genFileNames[activeGenFile])}
                style={{ position: "absolute", top: 12, right: 14, display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", zIndex: 2 }}>
                {copied === genFileNames[activeGenFile] ? <><Check size={10} />Copied!</> : <><Copy size={10} />Copy</>}
              </button>
              <pre style={{ margin: 0, padding: "16px 18px", fontSize: 12, lineHeight: 1.75, fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace", color: "#c9d1f0", overflowX: "auto", whiteSpace: "pre" }}>
                {genFileNames[activeGenFile] && (generatedFiles[genFileNames[activeGenFile]] ?? "").split("\n").map((line, i) => (
                  <div key={i} style={{ display: "flex" }}>
                    <span style={{ width: 34, flexShrink: 0, color: "#2a2e46", userSelect: "none", textAlign: "right", paddingRight: 14, fontSize: 10 }}>{i + 1}</span>
                    <span>{line || " "}</span>
                  </div>
                ))}
              </pre>
            </div>

            {/* Modal footer */}
            <div style={{ padding: "12px 18px", borderTop: "1px solid #1a1d2e", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 11, color: "#5c6480" }}>💡 Copy each file into your project, run <code style={{ color: "#f59e0b" }}>npm install</code>, then <code style={{ color: "#34d399" }}>npm run dev</code></div>
              <div style={{ flex: 1 }} />
              <button onClick={() => {
                const all = genFileNames.map(n => `// ── ${n} ──\n${generatedFiles[n]}`).join("\n\n");
                copyToClipboard(all, "all");
              }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>
                {copied === "all" ? <><Check size={11} />Copied all!</> : <><Copy size={11} />Copy all files</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
