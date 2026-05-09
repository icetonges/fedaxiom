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
  { cat:"knowledge", label:"📚 Knowledge", color:"#22d3ee", blocks:[
    { id:"docloader",     label:"Doc Loader",      icon:"📥", desc:"Load PDFs, Word docs, spreadsheets.",           deps:[], env:[] },
    { id:"knowledgebase", label:"Knowledge Base",  icon:"🗂️", desc:"Structured store with full-text search.",       deps:[], env:[] },
    { id:"webscraper",    label:"Web Scraper",     icon:"🕷️", desc:"Crawl & extract web content for ingestion.",    deps:["cheerio"], env:[] },
    { id:"docparser",     label:"Doc Parser",      icon:"🔎", desc:"Extract tables, headings, sections from docs.", deps:[], env:[] },
  ]},
  { cat:"workflow", label:"🔄 Workflow", color:"#f97316", blocks:[
    { id:"cronTrigger",    label:"Cron Trigger",    icon:"⏰", desc:"Schedule agent runs on a time interval.",       deps:[], env:[] },
    { id:"webhookTrigger", label:"Webhook Trigger", icon:"🪝", desc:"Trigger agent from HTTP webhook.",              deps:["express"], env:[] },
    { id:"humanloop",      label:"Human-in-Loop",   icon:"👤", desc:"Pause execution for human review/approval.",    deps:[], env:[] },
    { id:"statemachine",   label:"State Machine",   icon:"📊", desc:"Track multi-step workflow state persistently.", deps:[], env:[] },
  ]},
  { cat:"execution", label:"⚙️ Exec Environments", color:"#fb923c", blocks:[
    { id:"awss3",      label:"AWS S3",           icon:"🪣", desc:"Store/retrieve files from Amazon S3.",              deps:["@aws-sdk/client-s3"], env:["AWS_ACCESS_KEY_ID","AWS_SECRET_ACCESS_KEY","AWS_REGION","S3_BUCKET"] },
    { id:"databricks", label:"Databricks",       icon:"🔷", desc:"Run Spark jobs & query Unity Catalog.",            deps:["@databricks/sdk"], env:["DATABRICKS_HOST","DATABRICKS_TOKEN"] },
    { id:"palantir",   label:"Palantir Foundry", icon:"🏛️", desc:"Read/write Foundry datasets & pipelines.",         deps:[], env:["FOUNDRY_TOKEN","FOUNDRY_URL"] },
    { id:"snowflake",  label:"Snowflake",        icon:"❄️", desc:"Query Snowflake data warehouse.",                  deps:["snowflake-sdk"], env:["SNOWFLAKE_ACCOUNT","SNOWFLAKE_USER","SNOWFLAKE_PASSWORD"] },
    { id:"azureblob",  label:"Azure Blob",       icon:"☁️", desc:"Microsoft Azure Blob Storage.",                    deps:["@azure/storage-blob"], env:["AZURE_STORAGE_CONNECTION_STRING"] },
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

// ─── CURRICULUM DATA ─────────────────────────────────────────────────────────
interface Module {
  id: number; icon: string; color: string; title: string; time: string;
  overview: string; analogy: string;
  keyPoints: string[];
  code: { file: string; content: string };
  stacks: { option: string; when: string }[];
  quiz: { q: string; hint: string }[];
}

const MODULES: Module[] = [
  {
    id: 1, icon: "🌐", color: "#4f8ef7", title: "AI & LLM Foundations", time: "45 min",
    overview: "A Large Language Model (LLM) is a neural network trained on text that can predict the next token given a sequence. It isn't a database or a search engine — it's a statistical pattern-matcher that has internalized the structure of human language and knowledge. Understanding how tokens, temperature, and context windows work is the foundation for everything else.",
    analogy: "The LLM is like a brilliant intern who has read the entire internet but has amnesia every time you start a new conversation. They're fast, creative, and very capable — but they only know what you tell them in this conversation (the context window) plus what they memorized during training. Your job as the engineer is to give them the right briefing (system prompt) before each task.",
    keyPoints: [
      "A token is roughly 4 characters or ¾ of a word. GPT-4o processes ~128,000 tokens per call — that's ~96,000 words, or a short novel.",
      "Temperature (0–2) controls randomness. 0 = deterministic and focused. 1 = balanced creativity. 2 = chaotic. Use 0 for code/facts, 0.7 for writing.",
      "The context window is the LLM's working memory for one call — system prompt + history + retrieved docs + user message all share this budget.",
      "The system prompt sets persona, rules, and output format. It runs at the start of every call. Small prompt = big impact.",
      "Streaming returns tokens as they generate — essential for chat UIs. Use streamText() in Vercel AI SDK or model.generateContentStream() in Gemini.",
      "Structured output forces the LLM to return valid JSON by providing a schema — far more reliable than asking nicely in the prompt.",
    ],
    code: {
      file: "src/llm/first-call.ts",
      content: `import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── 1. Simple completion ──────────────────────────────────────────────────
export async function ask(question: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(question);
  return result.response.text();
}

// ── 2. With system prompt ─────────────────────────────────────────────────
export async function askWithSystem(system: string, question: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: system,     // ← sets the "persona"
    generationConfig: {
      temperature: 0.2,            // ← deterministic for factual tasks
      maxOutputTokens: 2048,
    },
  });
  return (await model.generateContent(question)).response.text();
}

// ── 3. Streaming ──────────────────────────────────────────────────────────
export async function stream(prompt: string, onChunk: (t: string) => void) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContentStream(prompt);
  for await (const chunk of result.stream) {
    onChunk(chunk.text());          // ← call your UI updater here
  }
}

// ── 4. Structured JSON output ─────────────────────────────────────────────
export async function extractStructured(text: string) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          summary:  { type: SchemaType.STRING },
          keywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          sentiment:{ type: SchemaType.STRING, enum: ["positive","neutral","negative"] },
        },
        required: ["summary", "keywords", "sentiment"],
      },
    },
  });
  const result = await model.generateContent(\`Analyze: \${text}\`);
  return JSON.parse(result.response.text());
}`,
    },
    stacks: [
      { option: "Gemini 2.5 Flash (Google)", when: "Best price/performance. 1M token context. Free tier generous. Use for most tasks." },
      { option: "GPT-4o (OpenAI)", when: "Best for reasoning chains, vision, and function calling. $2.50/1M tokens in." },
      { option: "Claude 3.5 Sonnet (Anthropic)", when: "Best for complex code, long document analysis. 200K context. $3/1M in." },
      { option: "Llama 3.3 70B (Ollama — local)", when: "Zero cost, full privacy, air-gap capable. Needs a GPU or Apple Silicon Mac." },
      { option: "DeepSeek V3 (open source)", when: "Near GPT-4 quality at 10× lower cost. Great for Asia-Pacific deployments." },
    ],
    quiz: [
      { q: "What is a token and why does it matter?", hint: "Tokens are the billing unit AND the context unit — knowing token count tells you cost and whether your input fits the window." },
      { q: "You need a deterministic, always-same answer for a legal document extraction task. What temperature do you set?", hint: "Temperature 0 eliminates randomness — the model always picks the highest-probability next token." },
      { q: "Your prompt + conversation history is 90,000 tokens on GPT-4o (128k window). How many tokens are left for the response?", hint: "128,000 − 90,000 = 38,000 tokens left for output. Always reserve headroom." },
      { q: "What is the difference between a system prompt and a user message?", hint: "System prompt = standing instructions (persona, rules, format). User message = the specific task for this call. System prompt persists across the conversation." },
    ],
  },
  {
    id: 2, icon: "🤖", color: "#34d399", title: "Agent Architecture & ReAct", time: "45 min",
    overview: "An AI agent is an LLM connected to a loop: it reasons about what to do, calls a tool to act, observes the result, then reasons again — repeating until the goal is achieved. This Reason → Act → Observe cycle (called ReAct) transforms a passive text-predictor into an autonomous worker that can browse the web, query databases, write and run code, and send emails.",
    analogy: "A regular chatbot is like asking a librarian a question and getting one answer. An agent is like hiring a research analyst: you give them a goal, they figure out which books to look up, make calls, run calculations, and bring you a complete report. The difference is the loop — they keep working until the job is done, not just until they've said one thing.",
    keyPoints: [
      "ReAct = Reason + Act. Every loop iteration: LLM decides what to do → calls a tool → reads the result → decides next action.",
      "An agent needs: (1) an LLM as the brain, (2) tools it can call, (3) memory to track progress, (4) a loop that runs until a stop condition.",
      "Stop conditions: LLM outputs a final answer (no tool call), or max_steps is reached, or an error occurs. Always set a max_steps limit.",
      "Tool call format: the LLM outputs a structured object like { name: 'search_web', args: { query: '...' } }. Your code parses this and runs the tool.",
      "Single-agent vs multi-agent: one agent handles one goal; multi-agent systems split complex goals into parallel sub-tasks assigned to specialist agents.",
      "The ReAct loop is NOT magic — it's just an async while loop in your code. The LLM doesn't 'run' autonomously; your orchestrator drives every iteration.",
    ],
    code: {
      file: "src/agent/react-loop.ts",
      content: `import { complete } from "../llm/client.js";
import { TOOL_REGISTRY } from "../tools/index.js";

export interface AgentResult {
  answer:  string;
  steps:   number;
  history: string[];
}

const MAX_STEPS = 8;

// ── Full ReAct loop implementation ────────────────────────────────────────
export async function runAgent(goal: string): Promise<AgentResult> {
  const history: string[] = [];

  for (let step = 1; step <= MAX_STEPS; step++) {
    // ── REASON ───────────────────────────────────────────────────────────
    const thought = await complete(
      buildPrompt(goal, history),
      SYSTEM_PROMPT,
    );

    history.push(\`Step \${step}: \${thought.slice(0, 200)}\`);

    // ── Check for final answer ────────────────────────────────────────────
    if (thought.startsWith("ANSWER:")) {
      return { answer: thought.slice(7).trim(), steps: step, history };
    }

    // ── ACT — parse tool call ─────────────────────────────────────────────
    const match = thought.match(/^TOOL:\\s*(\\w+)\\s+(\\{[\\s\\S]*\\})/m);
    if (!match) {
      history.push("  → (no valid tool call, retrying)");
      continue;
    }

    const [, toolName, argsRaw] = match;
    const tool = TOOL_REGISTRY[toolName];
    if (!tool) {
      history.push(\`  → Unknown tool: \${toolName}\`);
      continue;
    }

    // ── OBSERVE — run the tool, feed result back ──────────────────────────
    try {
      const result = await tool.execute(JSON.parse(argsRaw));
      history.push(\`  → \${toolName} returned: \${JSON.stringify(result).slice(0, 400)}\`);
    } catch (err) {
      history.push(\`  → \${toolName} ERROR: \${err}\`);
    }
  }

  return { answer: "Reached max steps without a final answer.", steps: MAX_STEPS, history };
}

function buildPrompt(goal: string, history: string[]): string {
  return [
    \`GOAL: \${goal}\`,
    history.length ? \`\\nHISTORY:\\n\${history.join("\\n")}\` : "",
    \`\\nDecide your next action. Reply with ONE of:\`,
    \`  TOOL: <tool_name> <json_args>  — to call a tool\`,
    \`  ANSWER: <final answer>         — when goal is achieved\`,
  ].join("\\n");
}

const SYSTEM_PROMPT = \`You are a precise AI agent. Use tools to gather information.
Available tools: \${Object.keys(TOOL_REGISTRY).join(", ")}.
Always prefer ANSWER when you have enough information.\`;`,
    },
    stacks: [
      { option: "Vercel AI SDK (streamText + tools)", when: "Best for Next.js apps — streaming, tool calls, and multi-step agents in one SDK." },
      { option: "LangChain AgentExecutor", when: "Battle-tested, huge ecosystem. More abstraction. Good if you need pre-built agent templates." },
      { option: "LangGraph", when: "Stateful agents with complex branching. Use when your agent needs to pause, resume, or have conditional branches." },
      { option: "Custom loop (like above)", when: "Maximum control, zero abstraction overhead. Recommended when you know exactly what your agent should do." },
    ],
    quiz: [
      { q: "What are the 3 steps of a ReAct loop?", hint: "Reason (decide what to do) → Act (call a tool) → Observe (read the result, then loop back to Reason)." },
      { q: "Why must you always set a max_steps limit?", hint: "Without a limit, a confused agent can loop forever, burning API tokens and money. Always cap at 6–10 steps." },
      { q: "The LLM outputs 'TOOL: search_web {\"query\": \"AI news\"}'. What does your code do next?", hint: "Parse the tool name and args, look up the function in TOOL_REGISTRY, call tool.execute({query: 'AI news'}), push the result into history." },
    ],
  },
  {
    id: 3, icon: "🔧", color: "#fb923c", title: "Tool Engineering", time: "60 min",
    overview: "Tools are the only way an agent touches the real world. A tool is a typed function with a name, description, and Zod schema — the LLM reads the schema to know how to call it, your code executes it, and the result flows back into the context. Well-designed tools are the difference between a reliable agent and a hallucinating one.",
    analogy: "Every LEGO technic set has specialized pieces: an axle piece (only connects to axle holes), a gear piece (only meshes with other gears), a motor piece (needs a battery connector). Tools work the same way. Each tool has a specific shape (its Zod schema — the slots). The LLM can only plug things in that match the shape. If you design the shape correctly, misuse is structurally impossible.",
    keyPoints: [
      "Every tool needs: name (unique ID), description (what the LLM reads to decide when to use it), schema (Zod — what params it accepts), execute (the actual function).",
      "The description is the most important part — it's marketing copy for the LLM. Be specific: 'Search the internet for real-time news' beats 'search tool'.",
      "Zod schemas validate inputs before execution. If the LLM hallucinates a wrong param type, Zod rejects it before any damage is done.",
      "Deterministic tools (math, formatting) are safe to retry and cache. Side-effect tools (send email, insert DB row, charge card) need idempotency keys and confirmation gates.",
      "Always wrap tool execution in try/catch and return structured errors. An agent that sees an error message can retry or pivot — one that crashes cannot.",
      "Tool timeout: set a max execution time (e.g. 10s). A hanging tool hangs the entire agent loop.",
    ],
    code: {
      file: "src/tools/production-tools.ts",
      content: `import { z } from "zod";
import { neon } from "@neondatabase/serverless";

// ── Tool interface ────────────────────────────────────────────────────────
export interface Tool<TIn, TOut> {
  name:        string;
  description: string;    // LLM reads this to decide when to call the tool
  schema:      z.ZodType<TIn>;
  execute:     (input: TIn) => Promise<TOut>;
  timeout?:    number;    // ms — abort if exceeded
}

// ── 1. Web search — Tavily ────────────────────────────────────────────────
export const searchWebTool: Tool<
  { query: string; maxResults?: number },
  { title: string; url: string; snippet: string }[]
> = {
  name: "search_web",
  description:
    "Search the internet for current, real-time information. " +
    "Use for news, recent events, prices, documentation, or anything time-sensitive.",
  schema: z.object({
    query:      z.string().min(3).describe("The search query"),
    maxResults: z.number().int().min(1).max(10).optional().default(5),
  }),
  async execute({ query, maxResults = 5 }) {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, max_results: maxResults }),
    });
    if (!res.ok) throw new Error(\`Tavily HTTP \${res.status}\`);
    const data = await res.json() as { results: { title: string; url: string; content: string }[] };
    return data.results.map(r => ({ title: r.title, url: r.url, snippet: r.content.slice(0, 300) }));
  },
  timeout: 8000,
};

// ── 2. SQL query — read-only, parameterized ───────────────────────────────
const sql = neon(process.env.DATABASE_URL!);

export const queryDbTool: Tool<
  { query: string; params?: (string | number | boolean)[] },
  unknown[]
> = {
  name: "query_database",
  description:
    "Run a read-only SQL SELECT query against the application database. " +
    "Use to retrieve user records, stats, or any structured data. NEVER use for INSERT/UPDATE/DELETE.",
  schema: z.object({
    query:  z.string().regex(/^SELECT/i, "Only SELECT queries allowed"),
    params: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
  }),
  async execute({ query, params = [] }) {
    return sql(query, params);
  },
  timeout: 5000,
};

// ── 3. Calculator — deterministic, safe ──────────────────────────────────
export const calculatorTool: Tool<{ expression: string }, number> = {
  name: "calculate",
  description: "Evaluate a mathematical expression. Use for any arithmetic, percentages, or unit conversions.",
  schema: z.object({
    expression: z.string()
      .regex(/^[0-9+\\-*/().\\s%]+$/, "Only numbers and basic operators"),
  }),
  async execute({ expression }) {
    return Function(\`"use strict"; return (\${expression})\`)() as number;
  },
};

// ── Tool registry ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOL_REGISTRY: Record<string, Tool<any, any>> = {
  search_web:       searchWebTool,
  query_database:   queryDbTool,
  calculate:        calculatorTool,
};

// ── Safe executor with timeout + error handling ───────────────────────────
export async function executeTool(name: string, args: unknown): Promise<string> {
  const tool = TOOL_REGISTRY[name];
  if (!tool) return \`Error: unknown tool "\${name}"\`;

  const parsed = tool.schema.safeParse(args);
  if (!parsed.success) return \`Error: invalid args — \${parsed.error.message}\`;

  try {
    const timeoutMs = tool.timeout ?? 10_000;
    const result = await Promise.race([
      tool.execute(parsed.data),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Tool timeout")), timeoutMs)),
    ]);
    return JSON.stringify(result);
  } catch (err) {
    return \`Error: \${err instanceof Error ? err.message : String(err)}\`;
  }
}`,
    },
    stacks: [
      { option: "Tavily Search API", when: "Best AI-optimized web search. Returns clean snippets. Free tier: 1000 calls/month." },
      { option: "E2B Code Interpreter", when: "Sandboxed Python/TypeScript execution. Use when agent needs to run data analysis or generate charts." },
      { option: "Neon Serverless SQL", when: "Postgres on serverless. Use for structured data queries. Works on Vercel Edge Functions." },
      { option: "Resend Email API", when: "Transactional email. Simple API. 3000 emails/month free." },
      { option: "Browserbase / Playwright", when: "Full browser automation. Use when you need to scrape JS-rendered pages or fill forms." },
    ],
    quiz: [
      { q: "Why is the tool description so important?", hint: "The LLM reads descriptions — not your code — to decide when to use a tool. A vague description = wrong tool choices." },
      { q: "A tool inserts a row in the database. What safety mechanism should you add?", hint: "An idempotency key (unique request ID) so if the agent retries, the same row isn't inserted twice." },
      { q: "The agent calls 'search_web' with { query: 123 } (number instead of string). What stops this?", hint: "The Zod schema validator. z.string() rejects a number before execute() is ever called." },
    ],
  },
  {
    id: 4, icon: "🧠", color: "#a78bfa", title: "RAG & Vector Memory", time: "60 min",
    overview: "Retrieval-Augmented Generation (RAG) lets your agent answer questions from your own documents — product manuals, codebases, meeting notes, legal docs — without fine-tuning the model. Documents are split into chunks, each chunk is converted to a vector (a list of numbers representing meaning), stored in a vector database, and at query time the most semantically relevant chunks are retrieved and injected into the LLM's context.",
    analogy: "Imagine a vast library (your docs). RAG gives every page a GPS coordinate based on its meaning (embedding). When you ask a question, RAG finds the pages whose coordinates are closest to your question's coordinate (cosine similarity) and hands those pages to the LLM. The LLM then synthesises an answer from those specific pages — not from memory, but from actual text. No hallucination about what's in your docs.",
    keyPoints: [
      "Chunking: split docs into 500–1000 char pieces with ~20% overlap. Smaller chunks = more precise retrieval. Larger chunks = more context per chunk.",
      "Embedding: text → vector via a model (text-embedding-004 = 768 dims, free). Similar meaning → similar vectors (close together in 768D space).",
      "Cosine similarity: measures the angle between two vectors. 1.0 = identical meaning. 0 = unrelated. Used to rank which chunks answer the query.",
      "Hybrid search: keyword pre-filter (fast, catches exact terms) then vector re-rank (slow but semantic). Top-5 results = sweet spot for context budget.",
      "Chunking strategies: fixed-size (simple), recursive (respects sentence boundaries), semantic (groups by topic). Start with fixed-size.",
      "Hallucination guard: instruct the LLM to only answer from the retrieved context. 'If the context doesn't contain the answer, say so.'",
    ],
    code: {
      file: "src/rag/pipeline.ts",
      content: `import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI  = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embedM = genAI.getGenerativeModel({ model: "text-embedding-004" });

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────
export interface Chunk { id: string; text: string; vector: number[]; source: string; }

// ─────────────────────────────────────────────────────────────────────────
// 1. CHUNK — sliding window with overlap
// ─────────────────────────────────────────────────────────────────────────
export function chunkDocument(text: string, source: string, size = 800, overlap = 120): Omit<Chunk,"vector">[] {
  const chunks: Omit<Chunk,"vector">[] = [];
  let i = 0;
  while (i < text.length) {
    const slice = text.slice(i, i + size).trim();
    if (slice.length > 40) {   // skip tiny trailing fragments
      chunks.push({ id: \`\${source}-\${chunks.length}\`, text: slice, source });
    }
    i += size - overlap;
  }
  return chunks;
}

// ─────────────────────────────────────────────────────────────────────────
// 2. EMBED — text → 768-dim vector (Google text-embedding-004)
// ─────────────────────────────────────────────────────────────────────────
export async function embed(text: string): Promise<number[]> {
  const result = await embedM.embedContent(text);
  return result.embedding.values;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. INGEST — chunk + embed + store
// ─────────────────────────────────────────────────────────────────────────
const STORE: Chunk[] = [];

export async function ingestDocument(text: string, source = "doc"): Promise<number> {
  const raw = chunkDocument(text, source);
  for (const c of raw) {
    const vector = await embed(c.text);
    STORE.push({ ...c, vector });
  }
  console.log(\`[RAG] Ingested \${raw.length} chunks from "\${source}"\`);
  return raw.length;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. COSINE SIMILARITY
// ─────────────────────────────────────────────────────────────────────────
function cosine(a: number[], b: number[]): number {
  const dot  = a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

// ─────────────────────────────────────────────────────────────────────────
// 5. RETRIEVE — hybrid keyword pre-filter + vector re-rank
// ─────────────────────────────────────────────────────────────────────────
export async function retrieve(query: string, k = 5): Promise<Chunk[]> {
  if (STORE.length === 0) return [];

  // Phase 1: keyword pre-filter — fast O(n), eliminates obviously irrelevant chunks
  const terms = query.toLowerCase().split(/\\s+/).filter(t => t.length > 3);
  const candidates = terms.length > 0
    ? STORE.filter(c => terms.some(t => c.text.toLowerCase().includes(t))).slice(0, 30)
    : STORE.slice(0, 30);

  const pool = candidates.length >= 5 ? candidates : STORE; // fallback to all

  // Phase 2: vector re-rank — semantic similarity
  const qVec = await embed(query);
  return pool
    .map(c => ({ chunk: c, score: cosine(qVec, c.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(r => r.chunk);
}

// ─────────────────────────────────────────────────────────────────────────
// 6. RAG QUERY — retrieve + answer
// ─────────────────────────────────────────────────────────────────────────
import { complete } from "../llm/client.js";

export async function ragQuery(question: string): Promise<{ answer: string; sources: string[] }> {
  const chunks = await retrieve(question);
  if (chunks.length === 0) {
    return { answer: "No relevant documents found in the knowledge base.", sources: [] };
  }

  const context = chunks.map((c, i) => \`[Source \${i+1}: \${c.source}]\\n\${c.text}\`).join("\\n\\n");

  const answer = await complete(
    \`Answer the question using ONLY the sources below. Cite [Source N] inline.\\n\\nSOURCES:\\n\${context}\\n\\nQUESTION: \${question}\`,
    "You are a precise assistant. Only use information from the provided sources. If the answer isn't there, say so.",
  );

  return { answer, sources: [...new Set(chunks.map(c => c.source))] };
}`,
    },
    stacks: [
      { option: "text-embedding-004 (Google)", when: "Free tier, 768 dims, excellent quality. Best default choice." },
      { option: "text-embedding-3-small (OpenAI)", when: "1536 dims, very good quality. $0.02/1M tokens." },
      { option: "pgvector on Neon", when: "You already have Neon — add vector extension, no extra infra." },
      { option: "Pinecone", when: "Managed, scales to billions of vectors, built-in hybrid search. Use for production at scale." },
      { option: "ChromaDB (local)", when: "Zero setup for development and testing. Not for production." },
    ],
    quiz: [
      { q: "Why do we chunk documents before embedding?", hint: "The LLM has a context limit. Chunking lets you retrieve only the 5 most relevant pieces (500–1000 tokens) rather than the whole document." },
      { q: "What does a cosine similarity of 0.95 mean?", hint: "Very high semantic similarity — the two texts convey nearly the same meaning, even if exact words differ." },
      { q: "Your RAG pipeline retrieves irrelevant chunks. What's the first thing to check?", hint: "The chunk size — chunks that are too large mix multiple topics. Try smaller chunks (400 chars) or semantic chunking." },
    ],
  },
  {
    id: 5, icon: "🎼", color: "#e879f9", title: "Orchestration Patterns", time: "45 min",
    overview: "Orchestration is the code that decides which model/tool/agent to call in what order, how to pass context between them, and how to handle failures. It's the conductor that turns a collection of AI building blocks into a coherent, reliable system. The three core patterns — sequential, parallel, and conditional — combine like LEGO to handle any real-world workflow.",
    analogy: "Orchestration is like a kitchen during dinner service. The head chef (orchestrator) doesn't cook everything themselves — they coordinate the grill station (one agent), the sauce station (another), and the pastry section (a third). Some dishes need all three stations in sequence. Some can run in parallel. And the chef routes different orders to different stations based on what was ordered (conditional routing).",
    keyPoints: [
      "Sequential chain: step A output → step B input → step C input. Use when each step depends on the previous. Simple and predictable.",
      "Parallel fan-out: Promise.all([stepA, stepB, stepC]). Use when steps are independent. Cuts total latency from sum to max.",
      "Conditional routing: switch on intent/content-type/user-role to choose the right branch. Avoids expensive models for simple tasks.",
      "Context object: pass a single mutable context record through all phases. Each phase enriches it. Downstream phases can read upstream results.",
      "Retry + fallback: on tool/model error, retry N times with exponential backoff, then fall back to a cheaper model or simpler path. Never crash the pipeline.",
      "Map-reduce: fan out over a list (map), run each item through an agent, collect + merge results (reduce). Use for bulk analysis tasks.",
    ],
    code: {
      file: "src/orchestration/pipeline.ts",
      content: `import { complete } from "../llm/client.js";
import { retrieve, ragQuery } from "../rag/pipeline.js";
import { executeTool } from "../tools/production-tools.js";

// ── Shared context passed through all phases ──────────────────────────────
interface PipelineCtx {
  query:       string;
  intent:      string;
  chunks:      string[];
  toolResults: string[];
  answer:      string;
  sources:     string[];
  latencyMs:   number;
}

// ── SEQUENTIAL pipeline ───────────────────────────────────────────────────
export async function sequentialPipeline(query: string): Promise<PipelineCtx> {
  const t0  = Date.now();
  const ctx: PipelineCtx = { query, intent:"", chunks:[], toolResults:[], answer:"", sources:[], latencyMs:0 };

  // Phase 1: classify intent (cheap small call)
  ctx.intent = await complete(
    \`Classify in one word (factual | analytical | creative | realtime): \${query}\`,
  );

  // Phase 2: retrieve from knowledge base
  if (ctx.intent.includes("factual") || ctx.intent.includes("analytical")) {
    const chunks = await retrieve(query, 5);
    ctx.chunks = chunks.map(c => c.text);
    ctx.sources = [...new Set(chunks.map(c => c.source))];
  }

  // Phase 3: use web search if realtime needed
  if (ctx.intent.includes("realtime")) {
    ctx.toolResults.push(await executeTool("search_web", { query }));
  }

  // Phase 4: synthesise final answer
  const context = [...ctx.chunks, ...ctx.toolResults].join("\\n\\n---\\n\\n");
  ctx.answer = await complete(
    context ? \`Context:\\n\${context}\\n\\nAnswer: \${query}\` : query,
    "You are a precise, helpful assistant. Ground answers in context when available.",
  );

  ctx.latencyMs = Date.now() - t0;
  return ctx;
}

// ── PARALLEL pipeline (faster for independent steps) ─────────────────────
export async function parallelPipeline(query: string): Promise<PipelineCtx> {
  const t0 = Date.now();
  const ctx: PipelineCtx = { query, intent:"", chunks:[], toolResults:[], answer:"", sources:[], latencyMs:0 };

  // Run classify + retrieve simultaneously
  const [intent, ragResult] = await Promise.all([
    complete(\`Classify in one word (factual|analytical|creative|realtime): \${query}\`),
    ragQuery(query),
  ]);

  ctx.intent  = intent;
  ctx.chunks  = [ragResult.answer];
  ctx.sources = ragResult.sources;

  // If realtime, also fan out to web search
  if (intent.includes("realtime")) {
    const searchResult = await executeTool("search_web", { query });
    ctx.toolResults.push(searchResult);
  }

  const context = [...ctx.chunks, ...ctx.toolResults].join("\\n\\n---\\n\\n");
  ctx.answer = await complete(
    context ? \`Context:\\n\${context}\\n\\nAnswer: \${query}\` : query,
    "You are precise. Ground answers in context.",
  );
  ctx.latencyMs = Date.now() - t0;
  return ctx;
}

// ── MAP-REDUCE: analyse a list of items in parallel ───────────────────────
export async function analyseItems(items: string[]): Promise<string> {
  // MAP: analyse each item independently, in parallel
  const analyses = await Promise.all(
    items.map(item => complete(\`Summarise this in 1 sentence: \${item}\`))
  );

  // REDUCE: merge all analyses into a final report
  return complete(
    \`Merge these summaries into a coherent report:\\n\${analyses.join("\\n")}\`,
    "You are a report writer. Synthesise concisely.",
  );
}`,
    },
    stacks: [
      { option: "Custom TypeScript pipeline", when: "Full control. Use when you know exactly what your workflow looks like." },
      { option: "Vercel AI SDK streamText", when: "Best for streaming Next.js API routes. Built-in multi-step tool calls." },
      { option: "LangGraph", when: "Complex stateful workflows with cycles, human-in-the-loop, and conditional edges." },
      { option: "Inngest (durable functions)", when: "Long-running pipelines that must survive server restarts. Automatic retries, event history." },
      { option: "Temporal", when: "Enterprise-grade workflow engine. Use when you need sub-millisecond SLAs and audit trails." },
    ],
    quiz: [
      { q: "When should you use parallel fan-out instead of sequential?", hint: "When the steps don't depend on each other's output — e.g. classify intent AND retrieve docs can run simultaneously." },
      { q: "What is the context object pattern and why is it useful?", hint: "A single object enriched by each pipeline phase. Downstream phases can read earlier results without re-computing them." },
      { q: "Your synthesise phase sometimes returns 'I don't know' even when the retrieve phase found good chunks. What's wrong?", hint: "The retrieved chunks aren't being passed to the synthesise prompt. Check that ctx.chunks is included in the context string." },
    ],
  },
  {
    id: 6, icon: "🔌", color: "#38bdf8", title: "MCP Protocol", time: "45 min",
    overview: "Model Context Protocol (MCP) is an open standard by Anthropic that separates tool servers from agent code. Instead of hard-coding tool functions inside your agent, you run a lightweight MCP server that exposes tools over a standard JSON-RPC protocol. Any MCP-compatible client (Claude Code, Cursor, your own agent) connects and automatically discovers + calls those tools — no code changes on either side.",
    analogy: "Before USB, every device needed its own special port: a keyboard port, a mouse port, a printer port, a joystick port. USB standardised the physical connector and the protocol. MCP does the same for AI tools. Your agent is the laptop (MCP client). Your tools are devices (MCP servers). One standard protocol, infinite interoperability. Build a tool once, use it everywhere.",
    keyPoints: [
      "MCP server: a process that exposes tools (and optionally resources) via JSON-RPC. Clients call tools/list to discover them, then tools/call to execute.",
      "MCP client: built into Claude Code, Cursor, and your custom agent. Connects to servers, discovers tools at startup, calls them by name.",
      "Transport options: stdio (local subprocess, best for dev), SSE (HTTP, works on Vercel/serverless), WebSocket (persistent bidirectional).",
      "Tool discovery is dynamic — the client calls tools/list at connection time. Add a new tool to the server, all clients see it on next reconnect.",
      "Resources: MCP also exposes read-only data sources (files, DB rows, API snapshots). The client can read them like filesystem paths.",
      "Official SDKs: @modelcontextprotocol/sdk (TypeScript), mcp (Python). Both are MIT-licensed and actively maintained by Anthropic.",
    ],
    code: {
      file: "src/mcp/server.ts",
      content: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ragQuery } from "../rag/pipeline.js";
import { executeTool } from "../tools/production-tools.js";

// ── Create MCP server ─────────────────────────────────────────────────────
const server = new McpServer({
  name:    "research-agent-server",
  version: "1.0.0",
});

// ── Tool 1: Ask the RAG knowledge base ───────────────────────────────────
server.tool(
  "ask_knowledge_base",
  "Search the agent's knowledge base and return a cited answer. " +
  "Use this for questions about documents that were previously ingested.",
  { question: z.string().describe("The question to answer from the knowledge base") },
  async ({ question }) => {
    const { answer, sources } = await ragQuery(question);
    return {
      content: [{
        type: "text",
        text: \`\${answer}\\n\\nSources: \${sources.join(", ") || "none"}\`,
      }],
    };
  },
);

// ── Tool 2: Web search ────────────────────────────────────────────────────
server.tool(
  "search_web",
  "Search the internet for current information. Use for news, prices, or recent events.",
  { query: z.string(), maxResults: z.number().optional() },
  async ({ query, maxResults = 5 }) => {
    const result = await executeTool("search_web", { query, maxResults });
    return { content: [{ type: "text", text: result }] };
  },
);

// ── Tool 3: Health check ──────────────────────────────────────────────────
server.tool(
  "health",
  "Check if the server is running correctly and return current timestamp.",
  {},
  async () => ({
    content: [{ type: "text", text: JSON.stringify({ ok: true, ts: new Date().toISOString() }) }],
  }),
);

// ── Resource: expose ingested document list ───────────────────────────────
server.resource(
  "documents://list",
  "documents://list",
  async () => ({
    contents: [{
      uri:      "documents://list",
      mimeType: "application/json",
      text:     JSON.stringify({ message: "Use ask_knowledge_base tool to query documents" }),
    }],
  }),
);

// ── Start server ──────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr (stdout is reserved for MCP protocol messages)
  console.error("[MCP] research-agent-server running on stdio");
  console.error("[MCP] Tools: ask_knowledge_base, search_web, health");
}

main().catch(err => { console.error("[MCP] Fatal:", err); process.exit(1); });`,
    },
    stacks: [
      { option: "@modelcontextprotocol/sdk (official TS)", when: "Always use this. MIT license, actively maintained by Anthropic." },
      { option: "stdio transport", when: "Local development. Claude Code and Cursor use stdio by default." },
      { option: "SSE transport", when: "Deploy your MCP server to Vercel/Cloudflare. Works with HTTP." },
      { option: "FastMCP (Python)", when: "Python-based tool servers. Same protocol, Python ergonomics." },
    ],
    quiz: [
      { q: "What is the key benefit of MCP over hard-coded tools?", hint: "Decoupling — you build the tool server once, any MCP-compatible client can use it without code changes on either side." },
      { q: "You deploy an MCP server to Vercel. Which transport do you use?", hint: "SSE (Server-Sent Events) — it works over HTTP, which is what Vercel serves." },
      { q: "How does an MCP client know what tools the server offers?", hint: "It calls tools/list at connection time. The server returns all tool names + schemas dynamically." },
    ],
  },
  {
    id: 7, icon: "🤝", color: "#34d399", title: "A2A Multi-Agent", time: "45 min",
    overview: "Agent-to-Agent (A2A) is Google's open protocol for agents to discover and communicate with other agents across different frameworks, vendors, and clouds. Each agent publishes an AgentCard JSON manifest at a well-known URL. Other agents read the card to discover capabilities, then send Tasks and receive streaming Updates — all over standard HTTP.",
    analogy: "A2A is like a freelancer marketplace. Each freelancer (agent) has a profile page (AgentCard) listing what they can do. You post a job (Task). They stream progress updates until done. You don't know or care how they work internally — only what they deliver. The protocol is the marketplace's standard contract form that every freelancer must fill out.",
    keyPoints: [
      "AgentCard: a JSON file at /.well-known/agent.json describing the agent's name, endpoint, skills, and auth scheme. This is how agents advertise themselves.",
      "Task: the unit of work sent from orchestrator to sub-agent. Has an id, goal string, and optional context. POST to /tasks/send.",
      "Streaming updates: the sub-agent streams progress events (status=working → status=done) via Server-Sent Events. Client subscribes and reads incrementally.",
      "Skills: named capabilities listed in AgentCard — e.g. 'audit-typescript', 'summarize-pdf'. The orchestrator picks the right agent by matching skills.",
      "Multi-agent network: one orchestrator discovers N sub-agents via their AgentCards, delegates work in parallel, collects results, synthesises final output.",
      "A2A + MCP are complementary: MCP connects agents to tools, A2A connects agents to other agents. A production system uses both.",
    ],
    code: {
      file: "src/a2a/agent-server.ts",
      content: `import express from "express";
import { complete } from "../llm/client.js";
import { ragQuery } from "../rag/pipeline.js";

const app = express();
app.use(express.json());

// ── 1. AgentCard — discovery endpoint ────────────────────────────────────
app.get("/.well-known/agent.json", (_req, res) => {
  res.json({
    name:        "research-sub-agent",
    version:     "1.0.0",
    description: "Specialist agent for research queries: web search + RAG + synthesis",
    endpoint:    \`http://localhost:\${PORT}\`,
    skills: [
      { id: "research",  description: "Research any topic, return cited answer with sources" },
      { id: "summarize", description: "Summarize a long document or set of texts" },
    ],
    auth: { schemes: ["none"] },   // add bearer token for production
  });
});

// ── 2. Task receiver — streaming SSE response ─────────────────────────────
app.post("/tasks/send", async (req, res) => {
  const { id, skill, goal, context } = req.body as {
    id:      string;
    skill:   string;
    goal:    string;
    context?: string;
  };

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const emit = (data: object) => res.write(\`data: \${JSON.stringify(data)}\\n\\n\`);

  emit({ status: "working", taskId: id, message: \`Starting \${skill} task\` });

  try {
    let output: string;

    if (skill === "research") {
      emit({ status: "working", taskId: id, message: "Querying knowledge base..." });
      const { answer, sources } = await ragQuery(goal);
      emit({ status: "working", taskId: id, message: \`Retrieved \${sources.length} sources\` });
      output = \`\${answer}\\n\\nSources: \${sources.join(", ") || "none"}\`;

    } else if (skill === "summarize") {
      const text = context ?? goal;
      output = await complete(
        \`Summarize this concisely, preserving key facts:\\n\${text}\`,
        "You are a precise summarizer.",
      );

    } else {
      output = await complete(goal, "You are a helpful AI assistant.");
    }

    emit({ status: "done", taskId: id, output });

  } catch (err) {
    emit({ status: "error", taskId: id, error: String(err) });
  }

  res.end();
});

// ── 3. A2A client helper — call another agent ─────────────────────────────
export async function callAgent(
  agentEndpoint: string,
  skill: string,
  goal: string,
  context?: string,
): Promise<string> {
  const taskId = crypto.randomUUID();

  const res = await fetch(\`\${agentEndpoint}/tasks/send\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ id: taskId, skill, goal, context }),
  });

  let output = "";
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    for (const line of text.split("\\n")) {
      if (!line.startsWith("data:")) continue;
      const event = JSON.parse(line.slice(5).trim()) as {
        status: string; output?: string; error?: string;
      };
      if (event.status === "done")   output = event.output ?? "";
      if (event.status === "error")  throw new Error(event.error);
    }
  }
  return output;
}

const PORT = parseInt(process.env.PORT ?? "3001", 10);
app.listen(PORT, () => console.log(\`[A2A] Agent running on port \${PORT}\`));`,
    },
    stacks: [
      { option: "Custom HTTP + SSE (like above)", when: "A2A is just conventions over HTTP. No library needed to get started." },
      { option: "google/a2a SDK", when: "Official Google SDK. More batteries-included but heavier dependency." },
      { option: "Cloud Run (Google)", when: "Ideal host for A2A sub-agents — scales to zero, persistent URL, handles SSE well." },
      { option: "Railway", when: "Simplest Docker hosting. Permanent URL, no cold starts. Good for always-on sub-agents." },
    ],
    quiz: [
      { q: "What is an AgentCard and where does it live?", hint: "A JSON manifest at /.well-known/agent.json that describes the agent's capabilities, endpoint, and skills." },
      { q: "What is the difference between MCP and A2A?", hint: "MCP connects an agent to tools (functions). A2A connects an agent to other agents (specialist workers). Production systems use both." },
      { q: "Your orchestrator calls a sub-agent and gets back status=error. What should happen?", hint: "Catch the error, log it, and either retry with a different agent or fall back to handling the task directly." },
    ],
  },
  {
    id: 8, icon: "⚙️", color: "#fbbf24", title: "Context Engineering", time: "60 min",
    overview: "Context engineering is the discipline of deciding exactly what to put in the LLM's context window on every call — in what order, at what size, with what structure — to maximise answer quality without hitting token limits. It's the highest-leverage skill in LLM engineering because the same model with a better context produces dramatically better output.",
    analogy: "The context window is a whiteboard. Context engineering is knowing what to write on it before each meeting. Write the wrong things and your brilliant colleague (the LLM) solves the wrong problem. Write too much and they lose focus. Write too little and they make things up. The order matters too — people (and LLMs) pay more attention to what they read last.",
    keyPoints: [
      "Token budget allocation: system prompt (~5%), compressed history (~20%), retrieved docs (~40%), tool results (~15%), user message (~10%), output headroom (~10%).",
      "Injection order: put the most relevant content closest to the user message. LLMs attend more strongly to nearby tokens (recency effect).",
      "Context compression: summarize old conversation turns to free tokens. Keep last 10 turns verbatim, earlier turns as a 2-sentence summary.",
      "Few-shot examples: 2–3 worked examples in the system prompt dramatically improve format compliance and accuracy. More reliable than instructions alone.",
      "Retrieval injection: inject only the top-k chunks, prefixed with [Source N] labels. Never inject the entire document — retrieve precisely.",
      "Dynamic context: for multi-turn agents, rebuild the context object from scratch each call. Don't accumulate stale information.",
    ],
    code: {
      file: "src/context/builder.ts",
      content: `// ── Context window budget allocator ──────────────────────────────────────
//
// Rough rule: 1 token ≈ 4 characters
// Budget: 100,000 tokens input → leave 28k for output
// ─────────────────────────────────────────────────────────────────────────

export interface Message { role: "system" | "user" | "assistant" | "tool"; content: string; }

const INPUT_BUDGET   = 100_000;
const CHARS_PER_TOK  = 4;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOK);
}

function compress(messages: Message[], budgetTokens: number): Message[] {
  const budget = budgetTokens * CHARS_PER_TOK;
  const result: Message[] = [];
  let used = 0;

  // Always keep the last 10 turns verbatim (most relevant)
  const recent  = messages.slice(-10);
  const earlier = messages.slice(0, -10);

  for (const m of recent) { result.push(m); used += m.content.length; }

  if (earlier.length === 0 || used >= budget) return result;

  // Compress earlier turns into a brief summary
  const summaryText =
    \`[Earlier conversation summary: \${earlier.length} messages about \` +
    earlier.map(m => m.content.slice(0, 30)).join("; ").slice(0, 200) + "...]";

  result.unshift({ role: "system", content: summaryText });
  return result;
}

// ── Build final context array ─────────────────────────────────────────────
export function buildContext(opts: {
  systemPrompt:  string;
  history:       Message[];
  ragChunks:     string[];
  toolResults:   string[];
  userMessage:   string;
  fewShotExamples?: { user: string; assistant: string }[];
}): Message[] {
  const messages: Message[] = [];
  let budgetUsed = estimateTokens(opts.systemPrompt) + estimateTokens(opts.userMessage);

  // ── Priority 1: System prompt ─────────────────────────────────────────
  let system = opts.systemPrompt;

  // Append few-shot examples to system prompt if provided
  if (opts.fewShotExamples?.length) {
    const examples = opts.fewShotExamples
      .map((ex, i) => \`Example \${i+1}:\\nUser: \${ex.user}\\nAssistant: \${ex.assistant}\`)
      .join("\\n\\n");
    system += \`\\n\\n=== EXAMPLES ===\\n\${examples}\`;
  }
  messages.push({ role: "system", content: system });

  // ── Priority 2: RAG chunks (inject just before user message for recency) ─
  const chunkBudget = Math.floor((INPUT_BUDGET - budgetUsed) * 0.45);
  let chunkTokens = 0;
  const injectedChunks: string[] = [];
  for (const chunk of opts.ragChunks) {
    const t = estimateTokens(chunk);
    if (chunkTokens + t > chunkBudget) break;
    injectedChunks.push(chunk);
    chunkTokens += t;
  }
  budgetUsed += chunkTokens;

  // ── Priority 3: Tool results ───────────────────────────────────────────
  const toolBudget = Math.floor((INPUT_BUDGET - budgetUsed) * 0.3);
  let toolTokens = 0;
  const injectedTools: string[] = [];
  for (const tr of opts.toolResults) {
    const t = estimateTokens(tr);
    if (toolTokens + t > toolBudget) break;
    injectedTools.push(tr);
    toolTokens += t;
  }
  budgetUsed += toolTokens;

  // ── Priority 4: Compressed conversation history ────────────────────────
  const histBudget = INPUT_BUDGET - budgetUsed - 5000; // 5k safety margin
  const compressed = compress(opts.history, histBudget);
  messages.push(...compressed);

  // ── Priority 5: Context injection + user message (always last) ────────
  if (injectedChunks.length || injectedTools.length) {
    const ctxParts = [
      injectedChunks.length ? \`[KNOWLEDGE BASE]\\n\${injectedChunks.join("\\n---\\n")}\` : "",
      injectedTools.length  ? \`[TOOL RESULTS]\\n\${injectedTools.join("\\n---\\n")}\`   : "",
    ].filter(Boolean);
    messages.push({ role: "system", content: ctxParts.join("\\n\\n") });
  }

  messages.push({ role: "user", content: opts.userMessage });
  return messages;
}`,
    },
    stacks: [
      { option: "tiktoken (OpenAI)", when: "Accurate token counting for OpenAI models. Overkill for estimation." },
      { option: "Gemini countTokens API", when: "Use provider's own counter for exact accuracy with Gemini." },
      { option: "4 chars ≈ 1 token rule", when: "Good enough for budget estimation. Fast, no API call needed." },
      { option: "Zep / MemGPT", when: "Managed long-term memory with automatic compression and retrieval." },
    ],
    quiz: [
      { q: "You have 128k context. System prompt = 2k, history = 60k, docs = 40k. How much is left for the answer?", hint: "128k − 2k − 60k − 40k = 26k tokens for output. Enough for a long response, but you'd want to compress history." },
      { q: "Why should retrieved chunks be injected just before the user message?", hint: "LLMs have a recency bias — they attend more strongly to content near the end of the context. Closest to the query = highest attention." },
      { q: "What are few-shot examples and when do they dramatically help?", hint: "Worked input/output pairs in the system prompt that show the LLM exactly the format and style you want. Most effective for structured output (JSON, tables, code)." },
    ],
  },
  {
    id: 9, icon: "📊", color: "#fb923c", title: "Evaluation & Testing", time: "60 min",
    overview: "You can't improve what you can't measure. Evaluation (evals) is the practice of systematically measuring how well your agent performs on real queries. LLM-as-judge uses a second LLM to score your agent's outputs. RAGAS measures RAG quality specifically. A benchmark dataset lets you catch regressions before they reach production.",
    analogy: "Evals are like unit tests for your agent's brain. You wouldn't ship code without tests. Don't ship agent changes without evals. The difference: instead of assert(output === expected), you ask a judge LLM to score the output 1–10. This handles the messy reality that there are often multiple correct answers.",
    keyPoints: [
      "LLM-as-judge: use a capable LLM (GPT-4o or Claude) to evaluate another LLM's output on criteria like faithfulness, relevance, completeness, and safety.",
      "RAGAS metrics: faithfulness (no hallucination), answer relevance (answers the question), context precision (chunks were useful), context recall (right chunks retrieved).",
      "Golden set: a curated dataset of (query, expected_answer) pairs. Run it after every agent change. A pass rate drop = regression.",
      "Eval harness: automate the eval run — loop through golden set, call agent, call judge, store scores in DB, print report. Run it in CI.",
      "Score threshold: pass if score ≥ 7/10, acceptable if 5–6, fail if < 5. Adjust thresholds based on risk level of the task.",
      "Trajectory evaluation: for multi-step agents, eval each step's tool call — did it use the right tool with correct args, not just the final answer.",
    ],
    code: {
      file: "src/eval/harness.ts",
      content: `import { complete } from "../llm/client.js";

// ── Types ─────────────────────────────────────────────────────────────────
export interface EvalCase {
  id:       string;
  query:    string;
  expected: string;     // ground truth answer
  context?: string;     // retrieved docs that were used
}

export interface EvalScore {
  caseId:      string;
  score:       number;    // 1–10
  faithfulness: number;   // 1–10: no hallucination
  relevance:   number;    // 1–10: answers the query
  completeness: number;   // 1–10: covers key points
  reasoning:   string;
  pass:        boolean;   // score >= 7
}

export interface BenchmarkReport {
  totalCases:  number;
  passCount:   number;
  passRate:    number;
  avgScore:    number;
  avgFaithfulness: number;
  avgRelevance: number;
  scores:      EvalScore[];
}

// ── LLM-as-Judge ─────────────────────────────────────────────────────────
export async function judge(
  c: EvalCase,
  actual: string,
): Promise<EvalScore> {
  const prompt = \`You are an expert evaluator. Score this AI response on 3 criteria, each 1–10.

QUERY: \${c.query}
EXPECTED ANSWER (ground truth): \${c.expected}
ACTUAL RESPONSE: \${actual}
\${c.context ? \`CONTEXT USED: \${c.context.slice(0, 600)}\` : ""}

Criteria:
1. Faithfulness: Is the response factually accurate? Does it stay grounded in the context?
   (10 = perfectly accurate, 1 = major hallucinations)
2. Relevance: Does it directly answer the query?
   (10 = directly on-point, 1 = off-topic)
3. Completeness: Does it cover the key points from the expected answer?
   (10 = covers everything important, 1 = misses most key points)

Return ONLY valid JSON, no markdown:
{"faithfulness": N, "relevance": N, "completeness": N, "reasoning": "<one sentence>"}\`;

  try {
    const raw = await complete(prompt, "Return only valid JSON. No markdown fences.");
    const parsed = JSON.parse(raw.trim()) as {
      faithfulness: number; relevance: number; completeness: number; reasoning: string;
    };
    const score = Math.round((parsed.faithfulness + parsed.relevance + parsed.completeness) / 3);
    return { caseId: c.id, score, ...parsed, pass: score >= 7 };
  } catch {
    return { caseId: c.id, score: 0, faithfulness: 0, relevance: 0, completeness: 0, reasoning: "Judge parse error", pass: false };
  }
}

// ── Benchmark runner ──────────────────────────────────────────────────────
export async function runBenchmark(
  cases:     EvalCase[],
  agentFn:   (query: string) => Promise<string>,
  onProgress?: (done: number, total: number) => void,
): Promise<BenchmarkReport> {
  const scores: EvalScore[] = [];

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    const actual = await agentFn(c.query);
    const score  = await judge(c, actual);
    scores.push(score);
    onProgress?.(i + 1, cases.length);
  }

  const passCount = scores.filter(s => s.pass).length;
  return {
    totalCases:       cases.length,
    passCount,
    passRate:         passCount / cases.length,
    avgScore:         scores.reduce((s, r) => s + r.score, 0) / scores.length,
    avgFaithfulness:  scores.reduce((s, r) => s + r.faithfulness, 0) / scores.length,
    avgRelevance:     scores.reduce((s, r) => s + r.relevance, 0) / scores.length,
    scores,
  };
}

// ── Example golden set ────────────────────────────────────────────────────
export const GOLDEN_SET: EvalCase[] = [
  { id: "q1", query: "What is RAG?", expected: "Retrieval-Augmented Generation — combining a vector knowledge base with an LLM to answer questions from your own documents." },
  { id: "q2", query: "What is the ReAct pattern?", expected: "Reason, Act, Observe — the loop where an agent thinks about what to do, calls a tool, reads the result, then repeats." },
  { id: "q3", query: "What is cosine similarity?", expected: "A measure of semantic similarity between two embedding vectors — 1.0 means identical meaning, 0 means unrelated." },
];`,
    },
    stacks: [
      { option: "Custom LLM judge (above)", when: "Full control, works with any LLM. Best starting point." },
      { option: "RAGAS framework", when: "Specialized RAG metrics. Computes faithfulness + context scores from retrieved chunks." },
      { option: "Langfuse evals", when: "Managed eval platform. Tracks scores over time, triggers alerts on regression." },
      { option: "Braintrust", when: "Production eval platform with dataset management, CI integration, and human review." },
    ],
    quiz: [
      { q: "What is the difference between faithfulness and relevance in RAGAS?", hint: "Faithfulness = no hallucination (answer is grounded in context). Relevance = the answer actually addresses the question asked." },
      { q: "Your eval pass rate drops from 85% to 70% after a change. What do you do?", hint: "Revert the change, inspect the 15% of cases that newly failed, identify the pattern, fix the root cause." },
      { q: "Why is a golden set with 50 cases better than testing 5 random queries?", hint: "Statistical significance — 5 cases can get lucky or unlucky. 50 cases gives a reliable signal about average performance." },
    ],
  },
  {
    id: 10, icon: "🧬", color: "#f87171", title: "Fine-tuning (LoRA/QLoRA)", time: "60 min",
    overview: "Fine-tuning trains a model on your specific data so it learns a new style, domain vocabulary, or task format without you engineering it into every prompt. LoRA (Low-Rank Adaptation) is the technique that makes this practical — instead of updating 7 billion weights, it trains a tiny adapter layer (as small as 1% of the model) that is merged in at inference time. Fine-tune when RAG isn't enough.",
    analogy: "RAG is like giving an expert a reference manual before each meeting. Fine-tuning is like sending them to a 2-week specialized training course. After the course, they've internalized the knowledge — you don't need to hand them the manual anymore. The course is expensive (compute time), but then it's permanent. Use RAG for documents that change. Fine-tune for skills that stay constant.",
    keyPoints: [
      "Fine-tune when: you need a specific output format the model resists, you have domain vocabulary the model doesn't know, or RAG is too slow/expensive for your latency target.",
      "Don't fine-tune when: RAG can solve it, or your data changes frequently — re-training is expensive and slow.",
      "LoRA: trains two small matrices (rank 4–16) that get added to the attention weights. 1–10% of the params, 10–100× cheaper than full fine-tuning.",
      "QLoRA: quantize the base model to 4-bit (cuts VRAM 4×), then apply LoRA on top. Lets you fine-tune 7B models on a single 24GB GPU.",
      "Dataset format (JSONL): each line is {\"prompt\": \"...\", \"completion\": \"...\"}. Needs 100–10,000 examples. Quality beats quantity.",
      "Evaluate after fine-tuning: run your benchmark before and after. If pass rate didn't improve by >5%, the fine-tune wasn't worth it.",
    ],
    code: {
      file: "scripts/prepare-finetune-dataset.ts",
      content: `// ── Fine-tuning dataset preparation ─────────────────────────────────────
//
// Workflow:
//   1. Run your current agent on 200–500 real queries
//   2. Manually review and fix the outputs (golden answers)
//   3. Run this script to format + validate the dataset
//   4. Upload to Replicate / Modal / HuggingFace for fine-tuning
// ─────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";

// ── Dataset record type ───────────────────────────────────────────────────
interface DatasetRecord {
  prompt:     string;   // system + user message combined
  completion: string;   // ideal model output
  quality?:   number;   // 1–5 rating (optional, filter low quality)
}

// ── Format for chat fine-tuning (OpenAI / Gemini style) ──────────────────
interface ChatRecord {
  messages: { role: "system"|"user"|"assistant"; content: string }[];
}

function toChatFormat(record: DatasetRecord, systemPrompt: string): ChatRecord {
  return {
    messages: [
      { role: "system",    content: systemPrompt },
      { role: "user",      content: record.prompt },
      { role: "assistant", content: record.completion },
    ],
  };
}

// ── Validation ────────────────────────────────────────────────────────────
function validate(records: DatasetRecord[]): { valid: DatasetRecord[]; rejected: number } {
  const valid: DatasetRecord[] = [];
  let rejected = 0;
  for (const r of records) {
    if (!r.prompt || r.prompt.length < 10) { rejected++; continue; }
    if (!r.completion || r.completion.length < 10) { rejected++; continue; }
    if (r.quality !== undefined && r.quality < 3) { rejected++; continue; }  // filter low quality
    valid.push(r);
  }
  return { valid, rejected };
}

// ── Main: read raw dataset, validate, write JSONL ─────────────────────────
async function main() {
  const rawPath = process.argv[2] ?? "data/raw-dataset.json";
  const outPath = process.argv[3] ?? "data/finetune-dataset.jsonl";

  const systemPrompt =
    "You are a precise research assistant. Answer questions using only provided sources. " +
    "Always cite sources inline as [Source N]. If the answer isn't in the sources, say so.";

  const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as DatasetRecord[];
  const { valid, rejected } = validate(raw);

  console.log(\`✅ Valid: \${valid.length} | ❌ Rejected: \${rejected}\`);

  // Shuffle for training stability
  const shuffled = valid.sort(() => Math.random() - 0.5);

  // Split 90/10 train/validation
  const splitIdx  = Math.floor(shuffled.length * 0.9);
  const trainSet  = shuffled.slice(0, splitIdx);
  const valSet    = shuffled.slice(splitIdx);

  // Write JSONL files
  const trainLines = trainSet.map(r => JSON.stringify(toChatFormat(r, systemPrompt)));
  const valLines   = valSet.map(r =>   JSON.stringify(toChatFormat(r, systemPrompt)));

  fs.writeFileSync(outPath.replace(".jsonl", "-train.jsonl"), trainLines.join("\\n"));
  fs.writeFileSync(outPath.replace(".jsonl", "-val.jsonl"),   valLines.join("\\n"));

  console.log(\`📦 Train: \${trainSet.length} | 📦 Val: \${valSet.length}\`);
  console.log(\`💾 Written to \${path.dirname(outPath)}/\`);
  console.log(\`\\nNext steps:\`);
  console.log(\`  1. Upload to Replicate: replicate.com/meta/llama-3-fine-tune\`);
  console.log(\`  2. Or Modal: modal run scripts/train-lora.py\`);
  console.log(\`  3. Evaluate with: npx tsx scripts/eval-finetuned.ts\`);
}

main().catch(console.error);`,
    },
    stacks: [
      { option: "Replicate fine-tune API", when: "Easiest — upload JSONL, get a fine-tuned model endpoint. No GPU management." },
      { option: "Modal + torchtune", when: "More control, cheaper at scale. Run custom Python training scripts on cloud GPUs." },
      { option: "HuggingFace PEFT + QLoRA", when: "Full open-source stack. Use if you want to self-host the fine-tuned model." },
      { option: "OpenAI fine-tuning API", when: "Simplest for GPT-3.5. Upload JSONL, wait ~1 hour, get a model ID. Expensive per token after." },
      { option: "Axolotl (open source)", when: "Best open-source fine-tuning framework. Supports LoRA, QLoRA, full fine-tune. Highly configurable." },
    ],
    quiz: [
      { q: "When should you fine-tune instead of using RAG?", hint: "When the skill is constant (format, style, domain vocab) not the data. RAG for changing facts, fine-tune for stable behavior." },
      { q: "What is LoRA and why does it matter?", hint: "Low-Rank Adaptation — trains tiny adapter matrices (1% of weights) instead of all weights. Makes fine-tuning 10-100× cheaper and faster." },
      { q: "Your fine-tuned model performs worse on general questions. What happened?", hint: "Catastrophic forgetting — fine-tuning on a narrow dataset can overwrite general capabilities. Use a lower learning rate and fewer epochs." },
    ],
  },
  {
    id: 11, icon: "🚀", color: "#4f8ef7", title: "Production Deployment", time: "45 min",
    overview: "Deployment is the process of making your agent reliably available to real users. Each stage adds resilience: version control (GitHub) → automated tests (GitHub Actions) → preview environments (Vercel) → production traffic → containerisation (Docker) → enterprise orchestration (Kubernetes). Start at the stage that matches your current scale.",
    analogy: "Deploying an agent is like opening a restaurant. Local dev = cooking at home (works, no one else can eat). GitHub = the recipe is in a fire-safe safe. CI = a health inspector checks the kitchen before every service. Vercel = you've opened a proper restaurant. Docker = the restaurant is now a food truck that can park anywhere. Kubernetes = a fleet of food trucks that auto-spawn when there's a queue.",
    keyPoints: [
      "Environment variables: API keys live in Vercel dashboard (or AWS Secrets Manager), never in code. ALWAYS use .env.example as a template, NEVER commit .env.",
      "Preview deployments: every PR gets its own live URL on Vercel. Test before merge. This catches integration bugs that unit tests miss.",
      "CI gate: GitHub Actions runs tsc --noEmit + tests on every push. Broken TypeScript never reaches main.",
      "Health endpoint: GET /api/health returns 200 OK with { status: 'ok' }. Load balancers use this to route traffic. Monitor it in alerting.",
      "Serverless vs containers: Vercel Functions = best for Next.js API routes, cold starts OK. Docker/Railway = better for long-running agents or always-on MCP servers.",
      "Rollback plan: if a deploy breaks prod, revert in 60 seconds with 'vercel rollback' or 'git revert + push'. Test the rollback process before you need it.",
    ],
    code: {
      file: ".github/workflows/deploy.yml",
      content: `name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"

jobs:
  # ── Quality gate ──────────────────────────────────────────────────────
  quality:
    name: TypeScript + Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: TypeScript check
        run: npx tsc --noEmit --skipLibCheck

      - name: Run tests
        run: npm test -- --run
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY_TEST }}
          DATABASE_URL:   \${{ secrets.DATABASE_URL_TEST }}

  # ── Build validation ──────────────────────────────────────────────────
  build:
    name: Next.js Build
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "\${{ env.NODE_VERSION }}", cache: npm }
      - run: npm ci
      - run: npm run build
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          DATABASE_URL:   \${{ secrets.DATABASE_URL }}

  # ── Deploy to Vercel ──────────────────────────────────────────────────
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest
    needs: [quality, build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token:      \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id:     \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args:       '--prod'

      - name: Verify health endpoint
        run: |
          sleep 10
          curl -f https://yourapp.vercel.app/api/health || exit 1

  # ── Docker build (on tag) ─────────────────────────────────────────────
  docker:
    name: Docker Image
    runs-on: ubuntu-latest
    needs: quality
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t my-ai-agent:\${{ github.ref_name }} .

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Push image
        run: |
          docker tag my-ai-agent:\${{ github.ref_name }} ghcr.io/\${{ github.repository }}:\${{ github.ref_name }}
          docker push ghcr.io/\${{ github.repository }}:\${{ github.ref_name }}`,
    },
    stacks: [
      { option: "Vercel", when: "Best for Next.js. Zero config, preview URLs, edge functions, instant rollback." },
      { option: "Railway", when: "Easiest Docker hosting. Permanent URL, no cold starts, affordable. Best for always-on agents." },
      { option: "Google Cloud Run", when: "Scales to zero, global, handles bursts. Great for A2A sub-agents." },
      { option: "Fly.io", when: "Global edge deployment, persistent volumes. Good for latency-sensitive agents." },
      { option: "AWS ECS + Fargate", when: "Enterprise. Full AWS ecosystem. Use when your company is already on AWS." },
    ],
    quiz: [
      { q: "Why should API keys never be in your code or .env file committed to git?", hint: "Once in git history, they're there forever — even after you delete the file. Always use platform env vars and rotate immediately if leaked." },
      { q: "What is the purpose of a health endpoint at /api/health?", hint: "Load balancers and monitoring systems ping it to know if the instance is alive. Returns 200 OK when healthy, 500 when broken." },
      { q: "When would you use Railway instead of Vercel?", hint: "When your agent has long-running tasks (>10s), needs always-on connections (WebSocket, SSE), or is a Docker container rather than a Next.js app." },
    ],
  },
  {
    id: 12, icon: "📡", color: "#a78bfa", title: "Monitoring & Observability", time: "45 min",
    overview: "You can't improve a production agent you can't see. Observability means capturing traces of every LLM call (what went in, what came out, how long it took, how much it cost) so you can debug failures, spot regressions, optimise costs, and build confidence before rolling out changes. Langfuse is the leading open-source platform for this.",
    analogy: "Observability for agents is like flight data recorders ('black boxes') on aircraft. You don't know in advance which flight will have a problem. But when something goes wrong, the black box tells you exactly what happened, in what order, at what speed. Without it, debugging a production failure is like solving a crime with no evidence.",
    keyPoints: [
      "Trace: one complete agent execution — all LLM calls, tool calls, and their latencies, token counts, and costs, linked by a trace ID.",
      "Span: a single step within a trace (one LLM call, one tool call). Spans have start time, duration, input, output, model, and tokens.",
      "Langfuse: open-source LLM observability. Self-host or use cloud. SDK works with any LLM provider. Records all traces automatically.",
      "Cost tracking: multiply (input_tokens × price_per_input) + (output_tokens × price_per_output). Aggregate by user/feature/day to find expensive queries.",
      "Alerting: set up alerts for p95 latency > 5s, error rate > 2%, cost per user > $0.10. Use PagerDuty or Slack webhooks.",
      "A/B testing agents: route 10% of traffic to agent-v2, measure eval scores and cost on real queries, promote or rollback based on data.",
    ],
    code: {
      file: "src/observability/tracer.ts",
      content: `// ── Lightweight observability wrapper ────────────────────────────────────
//
// Wraps LLM and tool calls with timing, token counting, cost tracking.
// Sends traces to Langfuse (or any endpoint you configure).
// ─────────────────────────────────────────────────────────────────────────

export interface Span {
  traceId:    string;
  spanId:     string;
  name:       string;
  input:      unknown;
  output?:    unknown;
  error?:     string;
  model?:     string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?:   number;
  durationMs: number;
  startedAt:  string;
}

// Token pricing (update as providers change)
const PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash":     { input: 0.00015, output: 0.0006 },  // per 1k tokens
  "gpt-4o":               { input: 0.0025,  output: 0.01   },
  "claude-sonnet-4-6":    { input: 0.003,   output: 0.015  },
};

function calcCost(model: string, inputTok: number, outputTok: number): number {
  const p = PRICING[model];
  if (!p) return 0;
  return (inputTok / 1000) * p.input + (outputTok / 1000) * p.output;
}

// ── In-memory trace buffer (flush to Langfuse or DB) ─────────────────────
const TRACE_BUFFER: Span[] = [];

export function getTraces() { return TRACE_BUFFER; }

async function flushSpan(span: Span): Promise<void> {
  TRACE_BUFFER.push(span);   // always keep in memory

  // Send to Langfuse if configured
  const endpoint = process.env.LANGFUSE_HOST;
  const pubKey   = process.env.LANGFUSE_PUBLIC_KEY;
  const secKey   = process.env.LANGFUSE_SECRET_KEY;
  if (!endpoint || !pubKey || !secKey) return;

  try {
    await fetch(\`\${endpoint}/api/public/ingestion\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + btoa(\`\${pubKey}:\${secKey}\`),
      },
      body: JSON.stringify({
        batch: [{
          type: "span-create",
          id:   span.spanId,
          body: span,
        }],
      }),
    });
  } catch {
    // Observability should never break the application
  }
}

// ── Traced LLM call wrapper ───────────────────────────────────────────────
export async function tracedComplete(
  prompt:   string,
  system:   string,
  model:    string,
  traceId:  string,
  completeFn: (prompt: string, system: string) => Promise<string>,
): Promise<string> {
  const t0     = Date.now();
  const spanId = crypto.randomUUID();
  let output   = "";
  let error    = "";

  try {
    output = await completeFn(prompt, system);
    return output;
  } catch (err) {
    error = String(err);
    throw err;
  } finally {
    const inputTok  = Math.ceil((prompt.length + system.length) / 4);
    const outputTok = Math.ceil(output.length / 4);
    await flushSpan({
      traceId, spanId, name: "llm-call",
      input:  { prompt: prompt.slice(0, 200), system: system.slice(0, 100) },
      output: output.slice(0, 200),
      error:  error || undefined,
      model,
      inputTokens:  inputTok,
      outputTokens: outputTok,
      costUsd:      calcCost(model, inputTok, outputTok),
      durationMs:   Date.now() - t0,
      startedAt:    new Date(t0).toISOString(),
    });
  }
}

// ── Traced tool call wrapper ──────────────────────────────────────────────
export async function tracedTool<T>(
  toolName: string,
  args:     unknown,
  traceId:  string,
  fn:       () => Promise<T>,
): Promise<T> {
  const t0     = Date.now();
  const spanId = crypto.randomUUID();
  let result: T | undefined;
  let error    = "";
  try {
    result = await fn();
    return result;
  } catch (err) {
    error = String(err);
    throw err;
  } finally {
    await flushSpan({
      traceId, spanId, name: \`tool:\${toolName}\`,
      input: args, output: result, error: error || undefined,
      durationMs: Date.now() - t0,
      startedAt:  new Date(t0).toISOString(),
    });
  }
}

// ── Cost dashboard helper ─────────────────────────────────────────────────
export function costSummary(): { totalCalls: number; totalCostUsd: number; byModel: Record<string, number> } {
  const byModel: Record<string, number> = {};
  let totalCostUsd = 0;
  for (const span of TRACE_BUFFER) {
    if (span.costUsd) {
      totalCostUsd += span.costUsd;
      byModel[span.model ?? "unknown"] = (byModel[span.model ?? "unknown"] ?? 0) + span.costUsd;
    }
  }
  return { totalCalls: TRACE_BUFFER.length, totalCostUsd, byModel };
}`,
    },
    stacks: [
      { option: "Langfuse (open source)", when: "Best choice — self-host free, or use cloud. Works with all providers. Has eval integration." },
      { option: "Helicone", when: "Proxy-based — zero code changes. Just swap your API base URL. Instant setup." },
      { option: "Arize Phoenix", when: "Best for RAG + embedding analysis. Great for debugging retrieval quality." },
      { option: "Custom DB + Grafana", when: "Maximum control. Write spans to Neon, query with Grafana. No vendor lock-in." },
    ],
    quiz: [
      { q: "What is the difference between a trace and a span?", hint: "A trace is the full agent run (one goal). A span is one step within it (one LLM call or tool call). A trace contains many spans." },
      { q: "Your agent costs $0.50 per query in production. How do you find the expensive step?", hint: "Check the cost per span in your traces. The span with the highest costUsd is your target — usually a large context window or expensive model." },
      { q: "Why should observability code never throw errors or crash the agent?", hint: "The observability layer is a side effect — it should never impact the main execution path. Always wrap flush calls in try/catch and fail silently." },
    ],
  },
];

// ─── CURRICULUM VIEW ─────────────────────────────────────────────────────────
function CurriculumView() {
  const [activeModule, setActiveModule] = useState(0);
  const [tab, setTab] = useState<"overview" | "code" | "stack" | "quiz">("overview");
  const [quizRevealed, setQuizRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const mod = MODULES[activeModule];

  function copyCode() {
    navigator.clipboard.writeText(mod.code.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

      {/* Left: module list */}
      <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid #1a1d2e", overflowY: "auto", background: "#0a0c15", padding: "12px 0" }}>
        <div style={{ padding: "4px 16px 8px", fontSize: 10, fontWeight: 800, color: "#3d4460", letterSpacing: "0.1em" }}>12 MODULES · ZERO TO ENTERPRISE</div>
        {MODULES.map((m, i) => (
          <button key={m.id} onClick={() => { setActiveModule(i); setTab("overview"); }}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", background: activeModule === i ? `${m.color}12` : "transparent", border: "none", borderLeft: activeModule === i ? `3px solid ${m.color}` : "3px solid transparent", cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{m.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: activeModule === i ? m.color : "#8892b0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.title}</div>
              <div style={{ fontSize: 10, color: "#4a5270", marginTop: 2 }}>{m.time}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Right: module content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 20, padding: "20px 24px", borderRadius: 12, background: `linear-gradient(135deg,${mod.color}10,${mod.color}04)`, border: `1px solid ${mod.color}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>{mod.icon}</span>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, background: `${mod.color}20`, border: `1px solid ${mod.color}40`, color: mod.color }}>MODULE {mod.id} / 12</span>
                <span style={{ fontSize: 10, color: "#5c6480" }}>⏱ {mod.time}</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#eaedf8", margin: 0 }}>{mod.title}</h2>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #1a1d2e", paddingBottom: 0 }}>
          {(["overview", "code", "stack", "quiz"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "transparent", border: "none", borderBottom: tab === t ? `2px solid ${mod.color}` : "2px solid transparent", color: tab === t ? mod.color : "#5c6480", textTransform: "capitalize", transition: "all 0.15s" }}>
              {t === "overview" ? "📖 Overview" : t === "code" ? "💻 Code" : t === "stack" ? "🔧 Stack" : "🧠 Quiz"}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === "overview" && (
          <div>
            <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid #1a1d2e" }}>
              <p style={{ fontSize: 14, color: "#c9d1f0", lineHeight: 1.8, margin: 0 }}>{mod.overview}</p>
            </div>
            <div style={{ marginBottom: 20, padding: "14px 18px", borderRadius: 10, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.18)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.1em", marginBottom: 8 }}>🧩 LEGO ANALOGY</div>
              <p style={{ fontSize: 13.5, color: "#c9d1f0", lineHeight: 1.78, margin: 0 }}>{mod.analogy}</p>
            </div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#5c6480", letterSpacing: "0.1em", marginBottom: 12 }}>⚡ KEY POINTS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {mod.keyPoints.map((kp, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px", borderRadius: 8, background: "#12141f", border: `1px solid ${mod.color}15` }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: `${mod.color}18`, border: `1px solid ${mod.color}35`, color: mod.color, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{i + 1}</div>
                  <span style={{ fontSize: 13, color: "#9aa3c0", lineHeight: 1.65 }}>{kp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Code tab */}
        {tab === "code" && (
          <div>
            <div style={{ borderRadius: 10, background: "#0a0c15", border: "1px solid #1a1d2e", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", background: "#0d0f1a", borderBottom: "1px solid #1a1d2e" }}>
                <span style={{ fontSize: 11, color: mod.color, fontFamily: "monospace", fontWeight: 700 }}>{mod.code.file}</span>
                <button onClick={copyCode} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", background: `${mod.color}15`, border: `1px solid ${mod.color}35`, color: mod.color }}>
                  {copied ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
              <pre style={{ margin: 0, padding: "16px 18px", fontSize: 12, lineHeight: 1.8, fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace", color: "#c9d1f0", overflowX: "auto", whiteSpace: "pre" }}>
                {mod.code.content.split("\n").map((line, i) => (
                  <div key={i} style={{ display: "flex" }}>
                    <span style={{ width: 34, flexShrink: 0, color: "#2a2e46", userSelect: "none", textAlign: "right", paddingRight: 14, fontSize: 10 }}>{i + 1}</span>
                    <span>{line || " "}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}

        {/* Stack tab */}
        {tab === "stack" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mod.stacks.map((s, i) => (
              <div key={i} style={{ padding: "14px 18px", borderRadius: 10, background: "#12141f", border: `1px solid ${mod.color}18` }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: mod.color, marginBottom: 6 }}>{s.option}</div>
                <div style={{ fontSize: 12.5, color: "#8892b0", lineHeight: 1.65 }}>{s.when}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quiz tab */}
        {tab === "quiz" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mod.quiz.map((q, qi) => {
              const key = `${mod.id}-${qi}`;
              return (
                <div key={qi} style={{ borderRadius: 10, background: "#12141f", border: `1px solid ${mod.color}18`, overflow: "hidden" }}>
                  <div style={{ padding: "14px 18px" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#eaedf8", marginBottom: 10 }}>Q{qi + 1}: {q.q}</div>
                    <button onClick={() => setQuizRevealed(prev => ({ ...prev, [key]: !prev[key] }))}
                      style={{ fontSize: 11, padding: "5px 12px", borderRadius: 7, cursor: "pointer", fontWeight: 700, background: quizRevealed[key] ? `${mod.color}18` : "rgba(255,255,255,0.04)", border: quizRevealed[key] ? `1px solid ${mod.color}40` : "1px solid #252840", color: quizRevealed[key] ? mod.color : "#5c6480" }}>
                      {quizRevealed[key] ? "▾ Hide hint" : "▸ Reveal hint"}
                    </button>
                    {quizRevealed[key] && (
                      <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: `${mod.color}08`, border: `1px solid ${mod.color}20` }}>
                        <div style={{ fontSize: 12.5, color: "#c9d1f0", lineHeight: 1.72 }}>{q.hint}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28, padding: "12px 16px", borderRadius: 10, background: "#0a0c15", border: "1px solid #1a1d2e" }}>
          <button disabled={activeModule === 0} onClick={() => { setActiveModule(p => p - 1); setTab("overview"); }}
            style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: activeModule === 0 ? "not-allowed" : "pointer", opacity: activeModule === 0 ? 0.3 : 1, background: "rgba(255,255,255,0.04)", border: "1px solid #252840", color: "#8892b0" }}>
            ← Previous
          </button>
          <span style={{ fontSize: 11, color: "#4a5270" }}>{activeModule + 1} / {MODULES.length}</span>
          {activeModule < MODULES.length - 1 ? (
            <button onClick={() => { setActiveModule(p => p + 1); setTab("overview"); }}
              style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", background: `${MODULES[activeModule + 1].color}18`, border: `1px solid ${MODULES[activeModule + 1].color}40`, color: MODULES[activeModule + 1].color }}>
              Next: {MODULES[activeModule + 1].title} →
            </button>
          ) : (
            <div style={{ padding: "7px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399" }}>🎓 All modules complete!</div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── BUILDER DATA ────────────────────────────────────────────────────────────
interface BuilderStep {
  phase: string; phaseColor: string; phaseIdx: number;
  step: number; title: string; desc: string;
  commands: string[];
  files: { name: string; content: string }[];
  checkpoint: string;
}

const BUILDER_STEPS: BuilderStep[] = [
  // ── Phase 1: Foundation ──────────────────────────────────────────────────
  {
    phase: "Foundation", phaseColor: "#4f8ef7", phaseIdx: 0, step: 1,
    title: "Scaffold the project & init Git",
    desc: "Every production system starts with a clean repo. We create the folder structure, init git, and add a .gitignore so secrets never leak.",
    commands: [
      "mkdir research-agent && cd research-agent",
      "git init && git branch -m main",
      "mkdir -p src/{llm,tools,rag,orchestration,mcp,eval,api} tests",
    ],
    files: [{ name: ".gitignore", content: `node_modules/\ndist/\n.env\n.env.local\n*.log\n.DS_Store\n` }],
    checkpoint: "Run `git status` — you should see `.gitignore` listed as an untracked file.",
  },
  {
    phase: "Foundation", phaseColor: "#4f8ef7", phaseIdx: 0, step: 2,
    title: "TypeScript + toolchain",
    desc: "TypeScript strict mode catches entire classes of bugs at compile time. tsx lets us run .ts files directly without a build step during dev.",
    commands: [
      "npm init -y",
      "npm install -D typescript tsx @types/node vitest",
      "npx tsc --init --strict --target ES2022 --module NodeNext --moduleResolution NodeNext --outDir dist --rootDir src",
    ],
    files: [{ name: "tsconfig.json", content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}` }],
    checkpoint: "Run `npx tsc --noEmit` — should print nothing (zero errors).",
  },
  {
    phase: "Foundation", phaseColor: "#4f8ef7", phaseIdx: 0, step: 3,
    title: "Environment config & secrets",
    desc: "Secrets must never be hardcoded. We use dotenv in dev and real env vars in production. Zod validates that required keys are present at startup — no silent failures.",
    commands: [
      "npm install dotenv zod",
      "cp .env.example .env  # then fill in your keys",
    ],
    files: [
      { name: ".env.example", content: `GEMINI_API_KEY=\nTAVILY_API_KEY=\nDATABASE_URL=\nLANGFUSE_SECRET_KEY=\nLANGFUSE_PUBLIC_KEY=\nLANGFUSE_HOST=https://cloud.langfuse.com\n` },
      { name: "src/config.ts", content: `import "dotenv/config";
import { z } from "zod";

const Env = z.object({
  GEMINI_API_KEY: z.string().min(1),
  TAVILY_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_HOST: z.string().url().default("https://cloud.langfuse.com"),
});

export const config = Env.parse(process.env);` },
    ],
    checkpoint: "Run `npx tsx src/config.ts` — if all keys are set it exits silently. Missing keys throw a Zod error listing exactly which ones.",
  },
  {
    phase: "Foundation", phaseColor: "#4f8ef7", phaseIdx: 0, step: 4,
    title: "Neon Postgres database",
    desc: "Neon gives you serverless Postgres with HTTP connections — no persistent TCP socket needed, perfect for serverless/edge environments. We'll use it for vector search and conversation history.",
    commands: [
      "# 1. Go to neon.tech → New project → copy the connection string",
      "# 2. Paste it as DATABASE_URL in your .env",
      "npm install @neondatabase/serverless",
      "# 3. Enable pgvector extension in Neon console SQL editor:",
      "# CREATE EXTENSION IF NOT EXISTS vector;",
    ],
    files: [{ name: "src/db/client.ts", content: `import { neon } from "@neondatabase/serverless";
import { config } from "../config.js";

export const sql = neon(config.DATABASE_URL);

export async function query<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  return sql(strings, ...values) as Promise<T[]>;
}` }],
    checkpoint: "Run `npx tsx -e \"import('./src/db/client.js').then(m => m.query\\`SELECT 1 as ok\\`).then(console.log)\"` — should print `[ { ok: 1 } ]`.",
  },
  {
    phase: "Foundation", phaseColor: "#4f8ef7", phaseIdx: 0, step: 5,
    title: "Database schema & migrations",
    desc: "We define three tables: documents (raw ingested content), chunks (split + embedded pieces), and conversations (agent memory). Running migrations as plain SQL keeps the toolchain minimal.",
    commands: [
      "mkdir -p src/db/migrations",
    ],
    files: [{ name: "src/db/migrations/001_init.sql", content: `-- Documents: raw source material
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  source_url  TEXT,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Chunks: split + embedded pieces
CREATE TABLE IF NOT EXISTS chunks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  embedding   vector(768),
  chunk_index INTEGER,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx
  ON chunks USING hnsw (embedding vector_cosine_ops);

-- Conversations: agent short-term memory
CREATE TABLE IF NOT EXISTS conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role       TEXT CHECK (role IN ('user','assistant','tool')) NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS conv_session_idx ON conversations(session_id, created_at);` },
      { name: "src/db/migrate.ts", content: `import { readFileSync } from "fs";
import { join } from "path";
import { sql } from "./client.js";

const migrationSQL = readFileSync(
  join(import.meta.dirname, "migrations/001_init.sql"),
  "utf8"
);

await sql.unsafe(migrationSQL);
console.log("✅ Migration complete");` },
    ],
    checkpoint: "Run `npx tsx src/db/migrate.ts` — prints '✅ Migration complete'. Check Neon console to see the three tables.",
  },
  {
    phase: "Foundation", phaseColor: "#4f8ef7", phaseIdx: 0, step: 6,
    title: "LLM client (Gemini 2.5 Flash)",
    desc: "We build a thin wrapper around the Gemini SDK. The wrapper normalises chat history into the SDK's format and exposes both a one-shot `complete` and a streaming `stream` function that any part of the agent can call.",
    commands: [
      "npm install @google/generative-ai",
    ],
    files: [{ name: "src/llm/client.ts", content: `import { GoogleGenerativeAI, Content } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface Message { role: "user" | "model"; content: string }

/** Single-turn completion */
export async function complete(
  prompt: string,
  system?: string,
  history: Message[] = [],
): Promise<string> {
  const chat = model.startChat({
    systemInstruction: system,
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    } satisfies Content)),
  });
  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

/** Streaming completion — yields text chunks */
export async function* stream(
  prompt: string,
  system?: string,
  history: Message[] = [],
): AsyncGenerator<string> {
  const chat = model.startChat({
    systemInstruction: system,
    history: history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    } satisfies Content)),
  });
  const result = await chat.sendMessageStream(prompt);
  for await (const chunk of result.stream) {
    yield chunk.text();
  }
}` }],
    checkpoint: "Run `npx tsx -e \"import('./src/llm/client.js').then(m=>m.complete('Say hello in one sentence')).then(console.log)\"` — prints a greeting.",
  },
  {
    phase: "Foundation", phaseColor: "#4f8ef7", phaseIdx: 0, step: 7,
    title: "Verify the foundation",
    desc: "Before building on top, run the full check: TypeScript must compile, tests must pass, and the LLM round-trip must work. Fix anything that fails before proceeding — a shaky foundation means debugging the wrong thing later.",
    commands: [
      "npx tsc --noEmit",
      "npm test",
    ],
    files: [{ name: "tests/config.test.ts", content: `import { describe, it, expect } from "vitest";
import { config } from "../src/config.js";

describe("config", () => {
  it("parses all required env vars", () => {
    expect(config.GEMINI_API_KEY).toBeTruthy();
    expect(config.DATABASE_URL).toMatch(/^postgres/);
  });
});` }],
    checkpoint: "Both commands exit 0. Commit: `git add -A && git commit -m 'feat: foundation — db, llm client, config'`",
  },

  // ── Phase 2: Core Agent ───────────────────────────────────────────────────
  {
    phase: "Core Agent", phaseColor: "#34d399", phaseIdx: 1, step: 8,
    title: "Tool interface abstraction",
    desc: "Every tool the agent can call shares the same interface: a name, a description the LLM reads to decide when to use it, a Zod schema for input validation, and an execute function. This makes adding new tools trivial.",
    commands: ["# No new packages needed — Zod already installed"],
    files: [{ name: "src/tools/types.ts", content: `import { z, ZodSchema } from "zod";

export interface Tool<TIn = unknown, TOut = unknown> {
  name: string;
  description: string;    // LLM reads this to decide when to call
  schema: ZodSchema<TIn>;
  execute(input: TIn): Promise<TOut>;
}

/** Convert tool list to the JSON schema block the LLM function-call API expects */
export function toolsToSchema(tools: Tool[]): object[] {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: zodToJsonSchema(t.schema),
  }));
}

function zodToJsonSchema(schema: ZodSchema): object {
  // Minimal inline converter — covers object/string/number/boolean
  const shape = (schema as z.ZodObject<z.ZodRawShape>)._def?.shape?.() ?? {};
  const props: Record<string, object> = {};
  const required: string[] = [];
  for (const [key, val] of Object.entries(shape)) {
    const def = (val as z.ZodTypeAny)._def;
    props[key] = { type: def.typeName?.toLowerCase().replace("zod","") ?? "string" };
    if (!(val instanceof z.ZodOptional)) required.push(key);
  }
  return { type: "object", properties: props, required };
}` }],
    checkpoint: "File compiles: `npx tsc --noEmit`",
  },
  {
    phase: "Core Agent", phaseColor: "#34d399", phaseIdx: 1, step: 9,
    title: "Web search tool (Tavily)",
    desc: "The agent needs real-time information the LLM wasn't trained on. Tavily returns clean, structured search results with URL, title, and snippet — purpose-built for LLM consumption.",
    commands: ["npm install @tavily/core"],
    files: [{ name: "src/tools/webSearch.ts", content: `import { tavily } from "@tavily/core";
import { z } from "zod";
import type { Tool } from "./types.js";
import { config } from "../config.js";

const client = tavily({ apiKey: config.TAVILY_API_KEY });

export const webSearchTool: Tool<{ query: string; maxResults?: number }, string> = {
  name: "web_search",
  description: "Search the web for current information. Use when the user asks about recent events, live data, or topics you are unsure about.",
  schema: z.object({
    query: z.string().describe("The search query"),
    maxResults: z.number().int().min(1).max(10).optional().default(5),
  }),
  async execute({ query, maxResults = 5 }) {
    const res = await client.search(query, { maxResults });
    return res.results
      .map(r => \`### \${r.title}\\nURL: \${r.url}\\n\${r.content}\`)
      .join("\\n\\n---\\n\\n");
  },
};` }],
    checkpoint: "Run `npx tsx -e \"import('./src/tools/webSearch.js').then(m=>m.webSearchTool.execute({query:'latest AI news'})).then(r=>console.log(r.slice(0,300)))\"` — prints search snippets.",
  },
  {
    phase: "Core Agent", phaseColor: "#34d399", phaseIdx: 1, step: 10,
    title: "URL scraper tool",
    desc: "When the agent finds a promising URL from search, it needs to fetch and clean the full page content. We strip HTML tags and boilerplate to give the LLM clean text, keeping token usage low.",
    commands: ["npm install node-html-parser"],
    files: [{ name: "src/tools/fetchUrl.ts", content: `import { parse } from "node-html-parser";
import { z } from "zod";
import type { Tool } from "./types.js";

export const fetchUrlTool: Tool<{ url: string }, string> = {
  name: "fetch_url",
  description: "Fetch the full text content of a webpage. Use after web_search to read the full article or documentation page.",
  schema: z.object({ url: z.string().url() }),
  async execute({ url }) {
    const res = await fetch(url, {
      headers: { "User-Agent": "ResearchAgent/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}: \${url}\`);
    const html = await res.text();
    const root = parse(html);
    // Remove scripts, styles, nav
    root.querySelectorAll("script,style,nav,header,footer,aside").forEach(el => el.remove());
    const text = root.structuredText.replace(/\\s{3,}/g, "\\n\\n").trim();
    return text.slice(0, 12000); // cap at ~3k tokens
  },
};` }],
    checkpoint: "Run `npx tsx -e \"import('./src/tools/fetchUrl.js').then(m=>m.fetchUrlTool.execute({url:'https://example.com'})).then(r=>console.log(r.slice(0,200)))\"` — prints page text.",
  },
  {
    phase: "Core Agent", phaseColor: "#34d399", phaseIdx: 1, step: 11,
    title: "ReAct loop (Reason → Act → Observe)",
    desc: "The ReAct pattern is the core of every LLM agent. The model reasons about what to do, emits a tool call, we execute it, feed the observation back, and repeat — until the model emits a final answer instead of a tool call.",
    commands: ["# No new packages"],
    files: [{ name: "src/orchestration/react.ts", content: `import { complete, type Message } from "../llm/client.js";
import type { Tool } from "../tools/types.js";

const MAX_TURNS = 10;

export interface ReactResult {
  answer: string;
  turns: { thought: string; tool?: string; input?: unknown; observation?: string }[];
}

export async function reactAgent(
  goal: string,
  tools: Tool[],
  system?: string,
): Promise<ReactResult> {
  const toolMap = new Map(tools.map(t => [t.name, t]));
  const toolDesc = tools.map(t => \`- \${t.name}: \${t.description}\`).join("\\n");
  const history: Message[] = [];
  const turns: ReactResult["turns"] = [];

  const SYS = system ?? \`You are a research assistant. Respond ONLY in this JSON format:
{ "thought": "...", "action": "tool_name OR FINISH", "input": {...} | "your final answer" }\n\nTools available:\n\${toolDesc}\`;

  for (let i = 0; i < MAX_TURNS; i++) {
    const prompt = i === 0 ? \`Goal: \${goal}\` : "Continue.";
    const raw = await complete(prompt, SYS, history);
    history.push({ role: "user", content: prompt });
    history.push({ role: "model", content: raw });

    let parsed: { thought: string; action: string; input: unknown };
    try {
      const json = raw.match(/\\{[\\s\\S]*\\}/)?.[0] ?? raw;
      parsed = JSON.parse(json);
    } catch {
      return { answer: raw, turns };
    }

    if (parsed.action === "FINISH") {
      turns.push({ thought: parsed.thought });
      return { answer: String(parsed.input), turns };
    }

    const tool = toolMap.get(parsed.action);
    if (!tool) {
      turns.push({ thought: parsed.thought, tool: parsed.action, observation: "Tool not found" });
      continue;
    }

    const validated = tool.schema.parse(parsed.input);
    const observation = String(await tool.execute(validated));
    turns.push({ thought: parsed.thought, tool: parsed.action, input: validated, observation: observation.slice(0, 800) });
    history.push({ role: "user", content: \`Observation: \${observation.slice(0, 4000)}\` });
  }

  return { answer: "Max turns reached", turns };
}` }],
    checkpoint: "File compiles clean with `npx tsc --noEmit`.",
  },
  {
    phase: "Core Agent", phaseColor: "#34d399", phaseIdx: 1, step: 12,
    title: "Tool registry + dispatcher",
    desc: "A central registry decouples tool definitions from the agent loop. Any module can register tools; the agent imports the registry and gets them all. This makes it easy to add, remove, or mock tools.",
    commands: ["# No new packages"],
    files: [{ name: "src/tools/registry.ts", content: `import type { Tool } from "./types.js";
import { webSearchTool } from "./webSearch.js";
import { fetchUrlTool } from "./fetchUrl.js";

const registry = new Map<string, Tool>();

export function registerTool(tool: Tool): void {
  registry.set(tool.name, tool);
}

export function getTool(name: string): Tool | undefined {
  return registry.get(name);
}

export function getAllTools(): Tool[] {
  return [...registry.values()];
}

// Register default tools
[webSearchTool, fetchUrlTool].forEach(registerTool);` }],
    checkpoint: "Run `npx tsx -e \"import('./src/tools/registry.js').then(m=>console.log(m.getAllTools().map(t=>t.name)))\"` — prints `['web_search', 'fetch_url']`.",
  },
  {
    phase: "Core Agent", phaseColor: "#34d399", phaseIdx: 1, step: 13,
    title: "Streaming output to terminal",
    desc: "Users hate waiting 8 seconds for a response. Streaming prints each token as it arrives — same latency to first token, dramatically better perceived performance.",
    commands: ["# No new packages"],
    files: [{ name: "src/llm/streamToStdout.ts", content: `import { stream } from "./client.js";
import type { Message } from "./client.js";

export async function streamToConsole(
  prompt: string,
  system?: string,
  history: Message[] = [],
): Promise<string> {
  process.stdout.write("\\n🤖 ");
  let full = "";
  for await (const chunk of stream(prompt, system, history)) {
    process.stdout.write(chunk);
    full += chunk;
  }
  process.stdout.write("\\n");
  return full;
}` }],
    checkpoint: "Run `npx tsx -e \"import('./src/llm/streamToStdout.js').then(m=>m.streamToConsole('Count to 5'))\"` — numbers stream live.",
  },
  {
    phase: "Core Agent", phaseColor: "#34d399", phaseIdx: 1, step: 14,
    title: "Interactive agent CLI",
    desc: "Wire everything together into a REPL (Read-Eval-Print Loop). Type a research question, the agent searches, scrapes, reasons, and answers. This is the first end-to-end demo of the system.",
    commands: ["npm install readline"],
    files: [{ name: "src/index.ts", content: `import * as readline from "readline/promises";
import { reactAgent } from "./orchestration/react.js";
import { getAllTools } from "./tools/registry.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("\\n🔬 Research Intelligence Agent (type 'exit' to quit)\\n");

while (true) {
  const goal = await rl.question("You: ");
  if (goal.toLowerCase() === "exit") break;
  if (!goal.trim()) continue;

  console.log("\\n⚙️  Thinking...\\n");
  const { answer, turns } = await reactAgent(goal, getAllTools());

  for (const t of turns) {
    if (t.tool) console.log(\`  🔧 \${t.tool}(\${JSON.stringify(t.input)?.slice(0,60)})\`);
  }

  console.log(\`\\n📋 Answer: \${answer}\\n\`);
}

rl.close();` }],
    checkpoint: "Run `npx tsx src/index.ts` — try 'What is the latest version of Node.js?'. Commit: `git add -A && git commit -m 'feat: core ReAct agent with tools'`",
  },

  // ── Phase 3: RAG Pipeline ─────────────────────────────────────────────────
  {
    phase: "RAG Pipeline", phaseColor: "#a78bfa", phaseIdx: 2, step: 15,
    title: "Document ingestion endpoint",
    desc: "The agent needs a knowledge base beyond web search. We build an ingestion API: POST a URL or text, and the system fetches, stores, and indexes it for later semantic retrieval.",
    commands: ["npm install express @types/express"],
    files: [{ name: "src/api/ingest.ts", content: `import { Router } from "express";
import { sql } from "../db/client.js";
import { fetchUrlTool } from "../tools/fetchUrl.js";

export const ingestRouter = Router();

ingestRouter.post("/ingest", async (req, res) => {
  const { url, title, content } = req.body as {
    url?: string; title?: string; content?: string;
  };
  try {
    let text = content;
    let resolvedTitle = title ?? url ?? "Untitled";
    if (!text && url) {
      text = await fetchUrlTool.execute({ url });
      resolvedTitle = title ?? url;
    }
    if (!text) return res.status(400).json({ error: "Provide url or content" });

    const [doc] = await sql\`
      INSERT INTO documents (title, source_url, content)
      VALUES (\${resolvedTitle}, \${url ?? null}, \${text})
      RETURNING id, title\`;
    res.json({ ok: true, document: doc });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});` }],
    checkpoint: "File compiles. We'll wire the router in Step 21.",
  },
  {
    phase: "RAG Pipeline", phaseColor: "#a78bfa", phaseIdx: 2, step: 16,
    title: "Text chunker",
    desc: "Embedding entire documents loses precision. Chunking splits text into overlapping 800-character windows — small enough for the embedder to capture focused meaning, with overlap so context isn't lost at boundaries.",
    commands: ["# No new packages"],
    files: [{ name: "src/rag/chunker.ts", content: `export interface Chunk {
  content: string;
  index: number;
}

export function chunkText(
  text: string,
  size = 800,
  overlap = 120,
): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  let index = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    const content = text.slice(start, end).trim();
    if (content.length > 50) {
      chunks.push({ content, index });
      index++;
    }
    start += size - overlap;
  }
  return chunks;
}` }],
    checkpoint: "Run `npx tsx -e \"import('./src/rag/chunker.js').then(m=>console.log(m.chunkText('a'.repeat(2000)).length))\"` — prints ~3 chunks.",
  },
  {
    phase: "RAG Pipeline", phaseColor: "#a78bfa", phaseIdx: 2, step: 17,
    title: "Embedder (text-embedding-004)",
    desc: "Embeddings convert text into a 768-dimensional vector. Semantically similar texts produce vectors that are close in vector space — enabling 'similarity search' that goes far beyond keyword matching.",
    commands: ["# @google/generative-ai already installed"],
    files: [{ name: "src/rag/embedder.ts", content: `import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

/** Embed a single text string → 768-dim float array */
export async function embed(text: string): Promise<number[]> {
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/** Batch embed (max 100 per call) */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results = await Promise.all(
    texts.map(t => model.embedContent(t))
  );
  return results.map(r => r.embedding.values);
}` }],
    checkpoint: "Run `npx tsx -e \"import('./src/rag/embedder.js').then(m=>m.embed('hello world')).then(v=>console.log('dim:', v.length))\"` — prints `dim: 768`.",
  },
  {
    phase: "RAG Pipeline", phaseColor: "#a78bfa", phaseIdx: 2, step: 18,
    title: "Vector store (pgvector)",
    desc: "pgvector turns Postgres into a vector database. We store each chunk's embedding and use an HNSW index for approximate nearest-neighbour search — finding the top-k most relevant chunks for any query in milliseconds.",
    commands: ["# pgvector extension already enabled in Step 4"],
    files: [{ name: "src/rag/vectorStore.ts", content: `import { sql } from "../db/client.js";
import { embed } from "./embedder.js";
import { chunkText } from "./chunker.js";

/** Index a document — chunk → embed → store */
export async function indexDocument(documentId: string, text: string): Promise<number> {
  const chunks = chunkText(text);
  const embeddings = await embedBatch(chunks.map(c => c.content));
  for (let i = 0; i < chunks.length; i++) {
    const vec = "[" + embeddings[i].join(",") + "]";
    await sql\`
      INSERT INTO chunks (document_id, content, embedding, chunk_index)
      VALUES (\${documentId}, \${chunks[i].content}, \${vec}::vector, \${i})\`;
  }
  return chunks.length;
}

/** Retrieve top-k semantically relevant chunks */
export async function retrieve(
  query: string,
  topK = 5,
): Promise<{ content: string; score: number }[]> {
  const qEmbed = await embed(query);
  const vec = "[" + qEmbed.join(",") + "]";
  const rows = await sql<{ content: string; score: number }[]>\`
    SELECT content,
           1 - (embedding <=> \${vec}::vector) AS score
    FROM chunks
    ORDER BY embedding <=> \${vec}::vector
    LIMIT \${topK}\`;
  return rows;
}

import { embedBatch } from "./embedder.js";` }],
    checkpoint: "File compiles. The HNSW index (created in Step 5 migration) keeps retrieval fast as the database grows.",
  },
  {
    phase: "RAG Pipeline", phaseColor: "#a78bfa", phaseIdx: 2, step: 19,
    title: "RAG retrieval tool",
    desc: "We expose the vector store as an agent tool so the ReAct loop can call it. The agent will decide to search the knowledge base when it needs specific information that was previously ingested.",
    commands: ["# No new packages"],
    files: [{ name: "src/tools/ragSearch.ts", content: `import { z } from "zod";
import type { Tool } from "./types.js";
import { retrieve } from "../rag/vectorStore.js";

export const ragSearchTool: Tool<{ query: string; topK?: number }, string> = {
  name: "knowledge_search",
  description: "Search the internal knowledge base for information previously ingested from documents and URLs. Use this BEFORE web_search for topics that may already be in the knowledge base.",
  schema: z.object({
    query: z.string().describe("Semantic search query"),
    topK: z.number().int().min(1).max(10).optional().default(5),
  }),
  async execute({ query, topK = 5 }) {
    const results = await retrieve(query, topK);
    if (results.length === 0) return "No relevant information found in knowledge base.";
    return results
      .map((r, i) => \`[\${i + 1}] (score: \${r.score.toFixed(3)})\\n\${r.content}\`)
      .join("\\n\\n---\\n\\n");
  },
};` }],
    checkpoint: "Register the new tool: in `src/tools/registry.ts` add `ragSearchTool` to the import and the `forEach` line.",
  },
  {
    phase: "RAG Pipeline", phaseColor: "#a78bfa", phaseIdx: 2, step: 20,
    title: "RAG-augmented agent",
    desc: "With knowledge_search registered alongside web_search, the ReAct agent automatically uses the knowledge base first and falls back to live search when needed — giving accurate, grounded answers with full citation.",
    commands: [
      "# Update src/tools/registry.ts to include ragSearchTool",
      "# Test by ingesting a document first:",
      "curl -X POST http://localhost:3000/ingest -H 'Content-Type: application/json' -d '{\"url\":\"https://docs.langfuse.com\"}'",
    ],
    files: [{ name: "src/tools/registry.ts", content: `import type { Tool } from "./types.js";
import { webSearchTool } from "./webSearch.js";
import { fetchUrlTool } from "./fetchUrl.js";
import { ragSearchTool } from "./ragSearch.js";

const registry = new Map<string, Tool>();

export function registerTool(tool: Tool): void { registry.set(tool.name, tool); }
export function getTool(name: string): Tool | undefined { return registry.get(name); }
export function getAllTools(): Tool[] { return [...registry.values()]; }

[webSearchTool, fetchUrlTool, ragSearchTool].forEach(registerTool);` }],
    checkpoint: "Ingest a URL then ask the agent a question about it — it should cite the knowledge base (score > 0.8) before falling back to web search.",
  },
  {
    phase: "RAG Pipeline", phaseColor: "#a78bfa", phaseIdx: 2, step: 21,
    title: "Express API server",
    desc: "The agent needs an HTTP API so it can be called from a UI, other services, or the A2A protocol. We wire all routers and start the server.",
    commands: ["npx tsx src/server.ts &"],
    files: [{ name: "src/server.ts", content: `import express from "express";
import { ingestRouter } from "./api/ingest.js";
import { getAllTools } from "./tools/registry.js";
import { reactAgent } from "./orchestration/react.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

// Ingest documents
app.use("/api", ingestRouter);

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  const { goal, sessionId } = req.body as { goal: string; sessionId?: string };
  if (!goal) return res.status(400).json({ error: "goal required" });
  const result = await reactAgent(goal, getAllTools());
  res.json(result);
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(\`🚀 Server ready on http://localhost:\${PORT}\`));` }],
    checkpoint: "Run `npx tsx src/server.ts` and `curl http://localhost:3000/health` — returns `{\"ok\":true}`. Commit: `git add -A && git commit -m 'feat: RAG pipeline + HTTP API'`",
  },

  // ── Phase 4: Advanced ─────────────────────────────────────────────────────
  {
    phase: "Advanced", phaseColor: "#e879f9", phaseIdx: 3, step: 22,
    title: "MCP server (Model Context Protocol)",
    desc: "MCP is Anthropic's open standard for exposing tools to any LLM client. By publishing our tools as an MCP server, any MCP-compatible client (Claude Desktop, Cursor, Windsurf) can call them — turning your agent into a platform.",
    commands: ["npm install @modelcontextprotocol/sdk"],
    files: [{ name: "src/mcp/server.ts", content: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { webSearchTool } from "../tools/webSearch.js";
import { ragSearchTool } from "../tools/ragSearch.js";

const server = new McpServer({ name: "research-agent", version: "1.0.0" });

// Register web_search as MCP tool
server.tool("web_search", { query: z.string() }, async ({ query }) => ({
  content: [{ type: "text", text: await webSearchTool.execute({ query }) }],
}));

// Register knowledge_search as MCP tool
server.tool("knowledge_search", { query: z.string() }, async ({ query }) => ({
  content: [{ type: "text", text: await ragSearchTool.execute({ query }) }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP server running on stdio");` }],
    checkpoint: "Add to `~/.cursor/mcp.json` (or Claude Desktop config): `{ \"mcpServers\": { \"research\": { \"command\": \"npx\", \"args\": [\"tsx\", \"src/mcp/server.ts\"] } } }` — Cursor/Claude now has your tools.",
  },
  {
    phase: "Advanced", phaseColor: "#e879f9", phaseIdx: 3, step: 23,
    title: "A2A Agent Card (Agent-to-Agent)",
    desc: "A2A is Google's protocol for agents discovering and delegating tasks to each other. An Agent Card is a standardised JSON-LD document that describes what your agent can do — like a business card for AI agents.",
    commands: ["# No new packages"],
    files: [{ name: "src/a2a/agentCard.ts", content: `import { Router } from "express";

export const a2aRouter = Router();

const agentCard = {
  "@context": "https://a2a.ai/schema/v1",
  "@type": "AgentCard",
  "name": "Research Intelligence Agent",
  "description": "An AI agent that researches topics using web search and a curated knowledge base.",
  "version": "1.0.0",
  "url": process.env.AGENT_URL ?? "http://localhost:3000",
  "capabilities": [
    { "name": "research", "description": "Deep research on any topic", "inputSchema": { "type": "object", "properties": { "goal": { "type": "string" } }, "required": ["goal"] } },
    { "name": "ingest", "description": "Add a URL to the knowledge base", "inputSchema": { "type": "object", "properties": { "url": { "type": "string" } }, "required": ["url"] } },
  ],
  "endpoints": {
    "task": "/api/a2a/task",
    "health": "/health",
  },
};

// Serve Agent Card at well-known URL
a2aRouter.get("/.well-known/agent.json", (_req, res) => res.json(agentCard));

// Accept delegated tasks from other agents
a2aRouter.post("/api/a2a/task", async (req, res) => {
  const { capability, input } = req.body as { capability: string; input: Record<string, string> };
  if (capability === "research") {
    const { reactAgent } = await import("../orchestration/react.js");
    const { getAllTools } = await import("../tools/registry.js");
    const result = await reactAgent(input.goal, getAllTools());
    return res.json({ status: "done", output: result.answer });
  }
  res.status(404).json({ error: "Unknown capability" });
});` }],
    checkpoint: "Register in server.ts: `app.use(a2aRouter)`. Then `curl http://localhost:3000/.well-known/agent.json` returns the agent card.",
  },
  {
    phase: "Advanced", phaseColor: "#e879f9", phaseIdx: 3, step: 24,
    title: "LLM-as-judge evaluator",
    desc: "Instead of hand-written test cases, we use a second LLM call to judge answer quality on a 1–10 scale with reasoning. This is the foundation of automated evals — run it on every deployment to catch regressions.",
    commands: ["# No new packages"],
    files: [{ name: "src/eval/judge.ts", content: `import { complete } from "../llm/client.js";

export interface Judgement {
  score: number;  // 1-10
  reasoning: string;
  pass: boolean;  // score >= threshold
}

const JUDGE_SYSTEM = \`You are an expert evaluator. Given a question and an AI-generated answer,
score the answer from 1 to 10 on these dimensions:
- Accuracy (is it factually correct?)
- Completeness (does it fully address the question?)
- Clarity (is it well-explained?)

Respond ONLY as JSON: { "score": <number>, "reasoning": "<one sentence>" }\`;

export async function judge(
  question: string,
  answer: string,
  threshold = 7,
): Promise<Judgement> {
  const prompt = \`Question: \${question}\\n\\nAnswer: \${answer}\`;
  const raw = await complete(prompt, JUDGE_SYSTEM);
  const json = raw.match(/\\{[\\s\\S]*\\}/)?.[0] ?? "{}";
  const { score, reasoning } = JSON.parse(json) as { score: number; reasoning: string };
  return { score: Number(score), reasoning, pass: Number(score) >= threshold };
}` }],
    checkpoint: "Run `npx tsx -e \"import('./src/eval/judge.js').then(m=>m.judge('What is 2+2?','The answer is 4.')).then(console.log)\"` — score should be ≥ 9.",
  },
  {
    phase: "Advanced", phaseColor: "#e879f9", phaseIdx: 3, step: 25,
    title: "RAGAS evaluation metrics",
    desc: "RAGAS metrics measure RAG quality with precision. Faithfulness = answer grounded in retrieved context (not hallucinated). Answer Relevancy = answer addresses the question. Context Precision = retrieved chunks were relevant.",
    commands: ["# No new packages"],
    files: [{ name: "src/eval/ragas.ts", content: `import { complete } from "../llm/client.js";

export interface RagasMetrics {
  faithfulness: number;      // 0-1: is answer supported by context?
  answerRelevancy: number;   // 0-1: does answer address the question?
  contextPrecision: number;  // 0-1: were retrieved chunks relevant?
}

async function scoreLLM(prompt: string): Promise<number> {
  const raw = await complete(prompt, "Reply ONLY with a number between 0.0 and 1.0");
  return Math.min(1, Math.max(0, parseFloat(raw.trim())));
}

export async function ragas(
  question: string,
  answer: string,
  contexts: string[],
): Promise<RagasMetrics> {
  const ctxBlock = contexts.map((c, i) => \`[\${i + 1}] \${c.slice(0, 300)}\`).join("\\n");

  const [faithfulness, answerRelevancy, contextPrecision] = await Promise.all([
    scoreLLM(\`Context:\\n\${ctxBlock}\\n\\nAnswer: \${answer}\\n\\nWhat fraction of the answer is supported by the context? Give 0.0-1.0\`),
    scoreLLM(\`Question: \${question}\\nAnswer: \${answer}\\n\\nHow well does the answer address the question? Give 0.0-1.0\`),
    scoreLLM(\`Question: \${question}\\nContext:\\n\${ctxBlock}\\n\\nWhat fraction of the context chunks are relevant to the question? Give 0.0-1.0\`),
  ]);

  return { faithfulness, answerRelevancy, contextPrecision };
}` }],
    checkpoint: "File compiles. Run with a sample question + context to verify all three scores return values between 0 and 1.",
  },
  {
    phase: "Advanced", phaseColor: "#e879f9", phaseIdx: 3, step: 26,
    title: "Langfuse observability tracing",
    desc: "Langfuse records every LLM call — prompt, response, latency, token cost, and score. When something goes wrong in production, you can replay and debug the exact trace. Essential for any production agent.",
    commands: ["npm install langfuse"],
    files: [{ name: "src/llm/traced.ts", content: `import { Langfuse } from "langfuse";
import { complete, stream, type Message } from "./client.js";
import { config } from "../config.js";

const lf = config.LANGFUSE_SECRET_KEY
  ? new Langfuse({
      secretKey: config.LANGFUSE_SECRET_KEY,
      publicKey: config.LANGFUSE_PUBLIC_KEY!,
      baseUrl: config.LANGFUSE_HOST,
    })
  : null;

export async function tracedComplete(
  prompt: string,
  system?: string,
  history: Message[] = [],
  metadata?: Record<string, unknown>,
): Promise<string> {
  const trace = lf?.trace({ name: "llm-complete", metadata });
  const span = trace?.span({ name: "gemini-call", input: { prompt, system } });
  const answer = await complete(prompt, system, history);
  span?.end({ output: answer });
  await lf?.flushAsync();
  return answer;
}` }],
    checkpoint: "Set `LANGFUSE_SECRET_KEY` and `LANGFUSE_PUBLIC_KEY` in `.env`. Make one call via `tracedComplete` — should appear in cloud.langfuse.com within 5 seconds.",
  },
  {
    phase: "Advanced", phaseColor: "#e879f9", phaseIdx: 3, step: 27,
    title: "Parallel fan-out orchestration",
    desc: "Some research tasks can run in parallel — search multiple queries simultaneously, then synthesise the results. This pattern cuts latency by 3-5x for multi-part research questions.",
    commands: ["# No new packages"],
    files: [{ name: "src/orchestration/parallel.ts", content: `import { complete } from "../llm/client.js";
import { reactAgent, type ReactResult } from "./react.js";
import type { Tool } from "../tools/types.js";

export interface ParallelResult {
  subResults: ReactResult[];
  synthesis: string;
}

/** Run N agent tasks in parallel, then synthesise */
export async function parallelFanOut(
  subGoals: string[],
  tools: Tool[],
  synthesisSystem?: string,
): Promise<ParallelResult> {
  const subResults = await Promise.all(
    subGoals.map(goal => reactAgent(goal, tools))
  );

  const summaries = subResults.map((r, i) =>
    \`### Sub-task \${i + 1}: \${subGoals[i]}\\n\${r.answer}\`
  ).join("\\n\\n");

  const synthesis = await complete(
    \`Synthesise these research findings into a comprehensive answer:\\n\\n\${summaries}\`,
    synthesisSystem ?? "You are an expert research analyst.",
  );

  return { subResults, synthesis };
}` }],
    checkpoint: "Test: `parallelFanOut(['latest GPT-4 benchmarks', 'latest Claude benchmarks'], tools)` — runs concurrently and returns a synthesis comparing both.",
  },
  {
    phase: "Advanced", phaseColor: "#e879f9", phaseIdx: 3, step: 28,
    title: "Retry, rate-limit & error handling",
    desc: "LLM APIs fail: 429 rate limits, 503 overloads, timeout spikes. Exponential backoff with jitter retries transparently. A circuit breaker stops hammering a failing API. Without this, production agents fail silently.",
    commands: ["# No new packages"],
    files: [{ name: "src/llm/retry.ts", content: `const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { status?: number }).status;
      const isRetryable = status === 429 || status === 503 || status === 500;
      if (!isRetryable || attempt === retries) throw err;
      const delay = BASE_DELAY_MS * 2 ** attempt + Math.random() * 200;
      console.warn(\`⏳ Retry \${attempt + 1}/\${retries} after \${delay.toFixed(0)}ms (status \${status})\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Unreachable");
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(\`Timeout after \${ms}ms\`)), ms)
    ),
  ]);
}` }],
    checkpoint: "Wrap the `complete` call in `src/llm/client.ts` with `withRetry(() => ...)`. Commit: `git add -A && git commit -m 'feat: MCP, A2A, eval, tracing, retry'`",
  },

  // ── Phase 5: Ship It ─────────────────────────────────────────────────────
  {
    phase: "Ship It", phaseColor: "#f87171", phaseIdx: 4, step: 29,
    title: "Dockerfile & .dockerignore",
    desc: "Docker packages your agent and all its dependencies into a reproducible image. The multi-stage build keeps the final image small (~180MB) by discarding dev tools. Any server with Docker can run this — Cloud Run, Railway, Fly.io, K8s.",
    commands: ["docker build -t research-agent . && docker run -p 3000:3000 --env-file .env research-agent"],
    files: [
      { name: "Dockerfile", content: `# ── Stage 1: Build ──────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: Runtime ────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]` },
      { name: ".dockerignore", content: `node_modules\ndist\n.env\n*.log\n.git\n` },
    ],
    checkpoint: "`docker run` starts the server. `curl http://localhost:3000/health` returns `{\"ok\":true}`. The image should be < 250MB (`docker image ls`).",
  },
  {
    phase: "Ship It", phaseColor: "#f87171", phaseIdx: 4, step: 30,
    title: "GitHub Actions CI pipeline",
    desc: "Every push runs type-check, tests, and a Docker build. PRs can't merge if CI fails. This is the first line of defence against regressions — it runs in under 2 minutes on a free GitHub runner.",
    commands: [
      "mkdir -p .github/workflows",
    ],
    files: [{ name: ".github/workflows/ci.yml", content: `name: CI

on:
  push:
    branches: [main, "feat/**"]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Tests
        run: npm test
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          TAVILY_API_KEY: \${{ secrets.TAVILY_API_KEY }}
          DATABASE_URL: \${{ secrets.DATABASE_URL }}

      - name: Docker build
        run: docker build -t research-agent .` }],
    checkpoint: "Push to GitHub. The Actions tab shows a green check within ~90 seconds.",
  },
  {
    phase: "Ship It", phaseColor: "#f87171", phaseIdx: 4, step: 31,
    title: "Vercel deployment",
    desc: "Vercel deploys in ~30 seconds with zero config for Next.js. For our Express server we use a single serverless function via the Vercel Node.js runtime. Every git push auto-deploys — a new URL per PR.",
    commands: [
      "npm install -g vercel",
      "vercel login",
      "vercel --prod",
      "# Or connect via GitHub: vercel.com → New Project → Import repo",
    ],
    files: [{ name: "vercel.json", content: `{
  "version": 2,
  "builds": [{ "src": "dist/server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "dist/server.js" }],
  "env": {
    "NODE_ENV": "production"
  }
}` }],
    checkpoint: "`vercel --prod` prints a deployment URL. `curl https://your-project.vercel.app/health` returns `{\"ok\":true}`.",
  },
  {
    phase: "Ship It", phaseColor: "#f87171", phaseIdx: 4, step: 32,
    title: "Health check & readiness probe",
    desc: "Health endpoints tell load balancers and orchestrators whether the service is ready to receive traffic. A liveness check (`/health`) confirms the process is alive. A readiness check (`/ready`) confirms DB and LLM connections are working.",
    commands: ["# Already have /health from server.ts — add /ready:"],
    files: [{ name: "src/api/health.ts", content: `import { Router } from "express";
import { sql } from "../db/client.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

healthRouter.get("/ready", async (_req, res) => {
  const checks: Record<string, boolean> = {};
  try {
    await sql\`SELECT 1\`;
    checks.database = true;
  } catch { checks.database = false; }
  checks.llm = !!process.env.GEMINI_API_KEY;
  const ok = Object.values(checks).every(Boolean);
  res.status(ok ? 200 : 503).json({ ok, checks });
});` }],
    checkpoint: "`curl https://your-project.vercel.app/ready` returns `{\"ok\":true,\"checks\":{\"database\":true,\"llm\":true}}`.",
  },
  {
    phase: "Ship It", phaseColor: "#f87171", phaseIdx: 4, step: 33,
    title: "Rate limiting & abuse prevention",
    desc: "Without rate limiting, a single runaway client can exhaust your LLM budget in seconds. We limit each IP to 20 requests/minute. In production, use Redis for distributed rate limiting across multiple instances.",
    commands: ["npm install express-rate-limit"],
    files: [{ name: "src/middleware/rateLimit.ts", content: `import rateLimit from "express-rate-limit";

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 20,               // max 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — retry in 60 seconds", code: 429 },
  skip: (req) => req.path === "/health" || req.path === "/ready",
});

export const chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,                // chat is expensive — 5/min per IP
  message: { error: "Chat rate limit exceeded", code: 429 },
});` }],
    checkpoint: "Add to `src/server.ts`: `app.use(apiRateLimit)` and `app.post('/api/chat', chatRateLimit, ...)`. Verify with `ab -n 25 -c 5 http://localhost:3000/health` — 5 requests should 429.",
  },
  {
    phase: "Ship It", phaseColor: "#f87171", phaseIdx: 4, step: 34,
    title: "Smoke test the production URL",
    desc: "A smoke test is a quick sanity check against the live production URL — not unit tests, not load tests, just 'is it alive and does the critical path work?' Run this after every deploy.",
    commands: [
      "export BASE=https://your-project.vercel.app",
      "curl -sf $BASE/health | jq .ok",
      "curl -sf $BASE/ready | jq .checks",
      "curl -sf -X POST $BASE/api/chat -H 'Content-Type: application/json' -d '{\"goal\":\"What is 1+1?\"}' | jq .answer",
    ],
    files: [{ name: "scripts/smoke-test.sh", content: `#!/bin/bash
set -e
BASE=\${1:-http://localhost:3000}
echo "🔥 Smoke testing $BASE"

echo -n "  /health ... "
curl -sf "$BASE/health" | grep -q '"ok":true' && echo "✅" || (echo "❌"; exit 1)

echo -n "  /ready ... "
curl -sf "$BASE/ready" | grep -q '"ok":true' && echo "✅" || (echo "❌"; exit 1)

echo -n "  /api/chat (1+1) ... "
ANSWER=$(curl -sf -X POST "$BASE/api/chat" \\
  -H "Content-Type: application/json" \\
  -d '{"goal":"What is 1+1? Answer with just the number."}' | jq -r .answer)
echo "$ANSWER" | grep -q "2" && echo "✅  ($ANSWER)" || (echo "❌  ($ANSWER)"; exit 1)

echo "\\n✅ All smoke tests passed"` }],
    checkpoint: "Run `bash scripts/smoke-test.sh https://your-project.vercel.app` — all three checks print ✅.",
  },
  {
    phase: "Ship It", phaseColor: "#f87171", phaseIdx: 4, step: 35,
    title: "Production checklist & launch",
    desc: "You built a production-grade Research Intelligence Agent — from a blank folder to a deployed, evaluated, observable system. Run through this final checklist, then share your agent URL.",
    commands: [
      "git tag v1.0.0 && git push origin v1.0.0",
      "bash scripts/smoke-test.sh https://your-project.vercel.app",
    ],
    files: [{ name: "LAUNCH_CHECKLIST.md", content: `# Launch Checklist

## Security
- [ ] All secrets in env vars (never in code)
- [ ] .env is in .gitignore
- [ ] Rate limiting enabled on all API routes
- [ ] No sensitive data in logs

## Reliability
- [ ] /health and /ready both return 200
- [ ] Retry + backoff on LLM calls
- [ ] Database connection pooling configured
- [ ] Error boundaries catch unhandled rejections

## Observability
- [ ] Langfuse tracing enabled in production
- [ ] Structured logging (JSON) for log aggregation
- [ ] Smoke tests pass against production URL
- [ ] CI pipeline green on main branch

## Quality
- [ ] LLM-as-judge score >= 7 on benchmark set
- [ ] RAGAS faithfulness >= 0.8
- [ ] TypeScript strict mode, zero tsc errors
- [ ] Test coverage >= 80%

## Deploy
- [ ] v1.0.0 tag pushed
- [ ] Vercel production deployment live
- [ ] Custom domain configured (optional)
- [ ] README with setup instructions updated

## 🎉 You shipped a production AI agent!` }],
    checkpoint: "All checklist items checked. Share your agent URL — you built this from zero.",
  },
];

// ─── BUILDER VIEW ─────────────────────────────────────────────────────────────
function BuilderView() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const step = BUILDER_STEPS[currentStep];

  const phases = [
    { label: "Foundation",  color: "#4f8ef7", steps: BUILDER_STEPS.filter(s => s.phaseIdx === 0) },
    { label: "Core Agent",  color: "#34d399", steps: BUILDER_STEPS.filter(s => s.phaseIdx === 1) },
    { label: "RAG Pipeline",color: "#a78bfa", steps: BUILDER_STEPS.filter(s => s.phaseIdx === 2) },
    { label: "Advanced",    color: "#e879f9", steps: BUILDER_STEPS.filter(s => s.phaseIdx === 3) },
    { label: "Ship It",     color: "#f87171", steps: BUILDER_STEPS.filter(s => s.phaseIdx === 4) },
  ];

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleDone(idx: number) {
    setCompleted(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  const totalDone = completed.size;
  const progress = Math.round((totalDone / BUILDER_STEPS.length) * 100);

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "calc(100dvh - 96px)" }}>

      {/* Left sidebar — phases + steps */}
      <div style={{ width: 240, flexShrink: 0, borderRight: "1px solid #1a1d2e", overflowY: "auto", background: "#0b0d18", display: "flex", flexDirection: "column" }}>
        {/* Progress bar */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #1a1d2e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: "#5c6480" }}>
            <span>Progress</span>
            <span style={{ color: "#34d399", fontWeight: 700 }}>{progress}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "#1a1d2e" }}>
            <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,#34d399,#4f8ef7)", width: `${progress}%`, transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: 10, color: "#3d4460", marginTop: 5 }}>{totalDone} / {BUILDER_STEPS.length} steps</div>
        </div>

        {/* Phase groups */}
        {phases.map((ph, pi) => (
          <div key={pi} style={{ borderBottom: "1px solid #151829" }}>
            <div style={{ padding: "10px 16px 6px", fontSize: 10, fontWeight: 800, color: ph.color, letterSpacing: 1, textTransform: "uppercase" }}>
              {ph.label}
            </div>
            {ph.steps.map((s) => {
              const globalIdx = BUILDER_STEPS.indexOf(s);
              const isActive = globalIdx === currentStep;
              const isDone = completed.has(globalIdx);
              return (
                <div
                  key={s.step}
                  onClick={() => { setCurrentStep(globalIdx); setActiveFile(0); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "7px 16px",
                    cursor: "pointer", fontSize: 11,
                    background: isActive ? "rgba(79,142,247,0.1)" : "transparent",
                    borderLeft: isActive ? `2px solid ${ph.color}` : "2px solid transparent",
                    color: isActive ? "#eaedf8" : isDone ? "#4a5270" : "#7d88a8",
                  }}>
                  <div
                    onClick={(e) => { e.stopPropagation(); toggleDone(globalIdx); }}
                    style={{
                      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                      border: `1.5px solid ${isDone ? ph.color : "#2a2e46"}`,
                      background: isDone ? ph.color : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                    }}>
                    {isDone && <Check size={8} color="#0b0d18" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 10, color: "#3d4460", width: 18, flexShrink: 0 }}>{s.step}</span>
                  <span style={{ fontSize: 11, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Right — step detail */}
      <div style={{ flex: 1, overflowY: "auto", background: "#0d0f1a", display: "flex", flexDirection: "column" }}>

        {/* Step header */}
        <div style={{ padding: "24px 32px 20px", borderBottom: "1px solid #1a1d2e", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: step.phaseColor, padding: "3px 8px", borderRadius: 4, background: `${step.phaseColor}18`, letterSpacing: 0.5 }}>
              PHASE {step.phaseIdx + 1} · {step.phase.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, color: "#3d4460" }}>Step {step.step} of {BUILDER_STEPS.length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#eaedf8", lineHeight: 1.3 }}>{step.title}</h2>
              <p style={{ margin: 0, fontSize: 13, color: "#9aa3c0", lineHeight: 1.75, maxWidth: 680 }}>{step.desc}</p>
            </div>
            <button
              onClick={() => toggleDone(currentStep)}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
                borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: completed.has(currentStep) ? "rgba(52,211,153,0.15)" : "rgba(52,211,153,0.08)",
                border: `1px solid ${completed.has(currentStep) ? "#34d399" : "rgba(52,211,153,0.25)"}`,
                color: completed.has(currentStep) ? "#34d399" : "#5c7a70",
              }}>
              <Check size={13} />
              {completed.has(currentStep) ? "Done!" : "Mark done"}
            </button>
          </div>
        </div>

        {/* Terminal commands */}
        <div style={{ padding: "24px 32px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Code2 size={13} color="#f59e0b" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: 0.5 }}>TERMINAL COMMANDS</span>
          </div>
          <div style={{ borderRadius: 10, background: "#080a12", border: "1px solid #1a1d2e", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: "1px solid #1a1d2e", background: "#0b0d18" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {["#f87171","#fbbf24","#34d399"].map((c, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
              </div>
              <button
                onClick={() => copy(step.commands.filter(c => !c.startsWith("#")).join("\n"), "cmds")}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
                {copied === "cmds" ? <><Check size={9} />Copied!</> : <><Copy size={9} />Copy</>}
              </button>
            </div>
            <pre style={{ margin: 0, padding: "14px 18px", fontSize: 12, lineHeight: 1.8, fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace", color: "#c9d1f0", overflowX: "auto" }}>
              {step.commands.map((cmd, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <span style={{ color: cmd.startsWith("#") ? "#3d4460" : "#4f8ef7", userSelect: "none" }}>{cmd.startsWith("#") ? " " : "$"}</span>
                  <span style={{ color: cmd.startsWith("#") ? "#3d4460" : "#c9d1f0" }}>{cmd}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>

        {/* Files */}
        {step.files.length > 0 && (
          <div style={{ padding: "20px 32px 0", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Blocks size={13} color="#a78bfa" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: 0.5 }}>FILES</span>
            </div>
            {/* File tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 0, flexWrap: "wrap" }}>
              {step.files.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFile(i)}
                  style={{
                    padding: "5px 12px", borderRadius: "6px 6px 0 0", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: activeFile === i ? "#0b0d18" : "transparent",
                    border: `1px solid ${activeFile === i ? "#1a1d2e" : "transparent"}`,
                    borderBottom: activeFile === i ? "1px solid #0b0d18" : "1px solid #1a1d2e",
                    color: activeFile === i ? "#eaedf8" : "#5c6480",
                  }}>
                  {f.name}
                </button>
              ))}
            </div>
            <div style={{ borderRadius: "0 6px 10px 10px", background: "#0b0d18", border: "1px solid #1a1d2e", overflow: "hidden", position: "relative" }}>
              <button
                onClick={() => copy(step.files[activeFile].content, `file-${activeFile}`)}
                style={{ position: "absolute", top: 10, right: 12, display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", zIndex: 2 }}>
                {copied === `file-${activeFile}` ? <><Check size={9} />Copied!</> : <><Copy size={9} />Copy</>}
              </button>
              <pre style={{ margin: 0, padding: "14px 18px", paddingRight: 80, fontSize: 11.5, lineHeight: 1.75, fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace", color: "#c9d1f0", overflowX: "auto", maxHeight: 340, whiteSpace: "pre" }}>
                {step.files[activeFile].content.split("\n").map((line, i) => (
                  <div key={i} style={{ display: "flex" }}>
                    <span style={{ width: 32, flexShrink: 0, color: "#1e2235", userSelect: "none", textAlign: "right", paddingRight: 14, fontSize: 10 }}>{i + 1}</span>
                    <span>{line || " "}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}

        {/* Checkpoint */}
        <div style={{ padding: "20px 32px 32px", flexShrink: 0 }}>
          <div style={{ padding: "14px 18px", borderRadius: 10, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#34d399", marginBottom: 6, letterSpacing: 0.5 }}>✓ CHECKPOINT</div>
            <div style={{ fontSize: 13, color: "#9aa3c0", lineHeight: 1.7 }}>{step.checkpoint}</div>
          </div>
        </div>

        {/* Prev / Next */}
        <div style={{ padding: "0 32px 32px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => { if (currentStep > 0) { setCurrentStep(currentStep - 1); setActiveFile(0); } }}
            disabled={currentStep === 0}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: currentStep === 0 ? "not-allowed" : "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid #1a1d2e", color: currentStep === 0 ? "#2a2e46" : "#7d88a8" }}>
            ← Previous
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => { toggleDone(currentStep); if (currentStep < BUILDER_STEPS.length - 1) { setCurrentStep(currentStep + 1); setActiveFile(0); } }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg, ${step.phaseColor}22, ${step.phaseColor}18)`, border: `1px solid ${step.phaseColor}44`, color: step.phaseColor }}>
            {currentStep === BUILDER_STEPS.length - 1 ? "🎉 Complete!" : "Mark done & Next →"}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── SCENARIOS DATA ──────────────────────────────────────────────────────────
interface ManualEntry {
  type: "h3" | "text" | "bullets" | "commands" | "table" | "warning" | "tip";
  label?: string;
  content?: string | string[] | { headers: string[]; rows: string[][] };
}
interface ManualChapter { title: string; icon: string; entries: ManualEntry[]; }

interface Scenario {
  id: string; icon: string; color: string;
  title: string; domain: string; goal: string;
  challenge: string; architecture: string;
  blocks: CanvasBlock[]; connections: Connection[];
  outcomes: string[];
  manual: ManualChapter[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "fiar-audit", icon: "🔍", color: "#4f8ef7",
    title: "FIAR Audit Intelligence Agent",
    domain: "DoD Financial Management — Clean Audit Opinion",
    goal: "AI agent that continuously monitors financial data, identifies audit findings, traces root causes, and recommends corrective actions to achieve and sustain a clean audit opinion under FIAR methodology.",
    challenge: "DoD financial systems (GFEBS, DEAMS, Navy ERP) generate millions of transactions across disconnected systems. Auditors need AI to triage findings, verify SOP compliance, and surface evidence packages faster than manual review allows.",
    architecture: "Doc Loader ingests audit criteria (FASAB, GAAP, DoD FMR) → pgvector for semantic search over findings history → Claude 3.5 Sonnet reasons over evidence → ReAct Loop iterates: query system → check compliance → flag findings → generate CAP → LLM Judge scores each finding by risk level.",
    outcomes: [
      "Automated triage of audit findings by risk level (High / Medium / Low)",
      "Evidence package assembly from GFEBS, DEAMS, and SPS source systems",
      "Corrective Action Plan (CAP) generation aligned to the FIAR playbook",
      "Continuous audit-readiness dashboard with real-time finding trends",
    ],
    blocks: [
      { id:"s1b1", typeId:"docloader",  catId:"knowledge",     label:"Doc Loader",        icon:"📥", color:"#22d3ee", x:40,  y:60,  deps:[], env:[] },
      { id:"s1b2", typeId:"pgvector",   catId:"memory",        label:"pgvector (Neon)",   icon:"🐘", color:"#a78bfa", x:260, y:60,  deps:["@neondatabase/serverless"], env:["DATABASE_URL"] },
      { id:"s1b3", typeId:"sqlquery",   catId:"tool",          label:"SQL Query",         icon:"🗄️", color:"#34d399", x:260, y:170, deps:["@neondatabase/serverless"], env:["DATABASE_URL"] },
      { id:"s1b4", typeId:"claude35",   catId:"llm",           label:"Claude 3.5 Sonnet", icon:"🧬", color:"#4f8ef7", x:480, y:100, deps:["@anthropic-ai/sdk"], env:["ANTHROPIC_API_KEY"] },
      { id:"s1b5", typeId:"reactloop",  catId:"orchestration", label:"ReAct Loop",        icon:"🔄", color:"#e879f9", x:700, y:100, deps:[], env:[] },
      { id:"s1b6", typeId:"llmjudge",   catId:"evaluation",    label:"LLM Judge",         icon:"⚖️", color:"#fbbf24", x:920, y:100, deps:[], env:[] },
    ],
    connections: [
      { id:"s1c1", fromId:"s1b1", toId:"s1b2", color:"#22d3ee" },
      { id:"s1c2", fromId:"s1b2", toId:"s1b4", color:"#a78bfa" },
      { id:"s1c3", fromId:"s1b3", toId:"s1b5", color:"#34d399" },
      { id:"s1c4", fromId:"s1b4", toId:"s1b5", color:"#4f8ef7" },
      { id:"s1c5", fromId:"s1b5", toId:"s1b6", color:"#e879f9" },
    ],
    manual: [
      { title:"Prerequisites & Overview", icon:"📋", entries:[
        { type:"text", content:"This manual guides a DoD financial management team through deploying the FIAR Audit Intelligence Agent. Estimated effort: 8–12 weeks for a 2-person team (1 engineer + 1 financial analyst). The agent continuously monitors financial data, identifies audit findings, assembles evidence packages, and generates FIAR-compliant Corrective Action Plans (CAPs)." },
        { type:"warning", content:"All data involved is FOUO at minimum. Your hosting infrastructure must meet DoD IL4/IL5 requirements (AWS GovCloud us-gov-west-1 or equivalent) before ingesting any GFEBS or DFAS data." },
        { type:"h3", label:"Technical Prerequisites" },
        { type:"bullets", content:[
          "DoD CAC card + clearance for GFEBS / DEAMS / DFAS system access",
          "AWS GovCloud account with S3, IAM, Secrets Manager, and CloudWatch",
          "Neon Postgres (or managed Postgres) with pgvector extension enabled",
          "Anthropic API key for Claude 3.5 Sonnet — request via anthropic.com or DoD enterprise agreement",
          "Google Cloud API key for text-embedding-004 (768-dim vector generation)",
          "Node.js 20+ on developer workstations; GitHub or internal GitLab for version control",
          "ISSO approval / ATO (or ATO-in-Process) for the hosting environment",
          "Read access to DFAS bulk file transfers OR GFEBS BI/BW reporting module",
        ]},
      ]},
      { title:"Data Inventory", icon:"📦", entries:[
        { type:"text", content:"Catalog every data asset before development. Engage your Command's Records Officer and ISSO to confirm handling procedures. Start with unclassified public documents (DoD FMR, FASAB, FIAR Guidance) before adding FOUO extracts." },
        { type:"table", content:{ headers:["Data Asset","Source System","Format","Sensitivity","Storage Target"], rows:[
          ["Prior Year Audit Findings (NFRs)","IG office / auditor portal","PDF, DOCX","FOUO","S3: /audit-findings/fyXXXX/"],
          ["Prior Year Corrective Action Plans","Audit resolution portal / SharePoint","DOCX, Excel","FOUO","S3: /caps/"],
          ["DoD FMR Volumes 1–16","comptroller.defense.gov (public)","PDF","Unclassified","S3: /policy/fmr/"],
          ["FASAB Standards (SFFAS 1–54)","fasab.gov (public)","PDF","Unclassified","S3: /policy/fasab/"],
          ["FIAR Guidance Handbook","OUSD(C) website (public)","PDF","Unclassified","S3: /policy/fiar/"],
          ["GFEBS Trial Balance / GL Extract","GFEBS BI/BW reporting module","CSV, XLSX","FOUO-Controlled","S3 raw + Postgres table"],
          ["Internal Control Documentation","Finance office SharePoint / TEAMSWORK","DOCX, PDF, Visio","FOUO","S3: /internal-controls/"],
          ["Contract & Order Data","SPS / EDA / PD²","XML, CSV","FOUO","S3: /contracts/ + Postgres"],
          ["Receiving Reports (DD-250/DD-250i)","WAWF (Wide Area WorkFlow)","XML, PDF","FOUO","S3: /receiving/"],
          ["SF-132 Apportionments","OMB MAX / GFEBS","PDF, Excel","FOUO","S3: /apportionment/"],
        ]}},
      ]},
      { title:"Data Architecture", icon:"🏗️", entries:[
        { type:"text", content:"Three-tier storage: (1) Object storage for raw documents, (2) Postgres for structured transaction data and vector embeddings, (3) In-memory cache for agent session state during analysis runs." },
        { type:"table", content:{ headers:["Component","Technology","Purpose","Estimated Size"], rows:[
          ["Document Store","AWS S3 GovCloud","Raw PDFs, DOCX, GFEBS CSV exports","~50 GB initial, +10 GB/quarter"],
          ["Vector Database","pgvector on Neon Postgres","768-dim embeddings for semantic search over findings & policy","~500 K vectors"],
          ["Structured DB","Neon Postgres (additional tables)","Audit findings tracker, GL transactions, evidence links","~10 GB initial"],
          ["Session Cache","Redis (ElastiCache GovCloud or Upstash)","Agent working memory during active audit sessions","1 GB"],
          ["Secrets","AWS Secrets Manager","API keys, DB passwords — never in code or .env files","N/A"],
        ]}},
      ]},
      { title:"Phase 1 — Infrastructure Setup", icon:"🔧", entries:[
        { type:"h3", label:"Create S3 Bucket (AWS GovCloud)" },
        { type:"commands", content:[
          "# Create versioned, KMS-encrypted bucket",
          "aws s3 mb s3://dod-audit-agent-docs --region us-gov-west-1",
          "aws s3api put-bucket-versioning --bucket dod-audit-agent-docs \\",
          "  --versioning-configuration Status=Enabled",
          "aws s3api put-bucket-encryption --bucket dod-audit-agent-docs \\",
          "  --server-side-encryption-configuration",
          "  '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"aws:kms\"}}]}'",
          "",
          "# Create folder structure",
          "for prefix in audit-findings caps policy/fmr policy/fasab policy/fiar",
          "              gfebs contracts receiving apportionment internal-controls; do",
          "  aws s3api put-object --bucket dod-audit-agent-docs --key $prefix/",
          "done",
        ]},
        { type:"h3", label:"Provision pgvector in Neon Postgres" },
        { type:"commands", content:[
          "-- Run in Neon SQL Editor",
          "CREATE EXTENSION IF NOT EXISTS vector;",
          "CREATE EXTENSION IF NOT EXISTS 'uuid-ossp';",
          "",
          "CREATE TABLE documents (",
          "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  s3_key TEXT NOT NULL, title TEXT NOT NULL,",
          "  doc_type TEXT,  -- 'nfr'|'cap'|'policy'|'contract'|'transaction'",
          "  fiscal_year INTEGER, created_at TIMESTAMPTZ DEFAULT now()",
          ");",
          "CREATE TABLE chunks (",
          "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,",
          "  content TEXT NOT NULL, embedding vector(768),",
          "  chunk_index INTEGER, created_at TIMESTAMPTZ DEFAULT now()",
          ");",
          "CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);",
          "",
          "CREATE TABLE audit_findings (",
          "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  finding_ref TEXT UNIQUE NOT NULL,  -- e.g. NFR-FY24-001",
          "  fiscal_year INTEGER, category TEXT,",
          "  risk_level TEXT CHECK (risk_level IN ('high','medium','low')),",
          "  status TEXT DEFAULT 'open',",
          "  description TEXT, root_cause TEXT, cap_text TEXT,",
          "  target_close DATE, created_at TIMESTAMPTZ DEFAULT now()",
          ");",
        ]},
        { type:"h3", label:"Install Dependencies" },
        { type:"commands", content:[
          "npm init -y",
          "npm install @anthropic-ai/sdk @neondatabase/serverless @aws-sdk/client-s3 \\",
          "  @google/generative-ai ioredis zod dotenv tsx",
          "npm install -D typescript @types/node vitest",
          "",
          "# .env.example — populate all keys; store actuals in AWS Secrets Manager",
          "ANTHROPIC_API_KEY=sk-ant-...",
          "DATABASE_URL=postgres://neondb...neon.tech/main?sslmode=require",
          "AWS_ACCESS_KEY_ID=AKIA...",
          "AWS_SECRET_ACCESS_KEY=...",
          "AWS_REGION=us-gov-west-1",
          "S3_BUCKET=dod-audit-agent-docs",
          "GEMINI_API_KEY=...   # for text-embedding-004",
          "REDIS_URL=redis://...",
        ]},
      ]},
      { title:"Phase 2 — Document Ingestion Pipeline", icon:"📥", entries:[
        { type:"text", content:"The ingestion pipeline: (1) lists new files from S3 prefix, (2) downloads each PDF/DOCX, (3) extracts text, (4) splits into 800-char chunks with 120-char overlap, (5) generates 768-dim embeddings via Gemini text-embedding-004, (6) stores chunks + embeddings in pgvector." },
        { type:"commands", content:[
          "# Ingest unclassified policy docs first (safe starting point)",
          "npx tsx src/ingest/run.ts --prefix policy/fmr/ --type policy",
          "npx tsx src/ingest/run.ts --prefix policy/fasab/ --type policy",
          "",
          "# After ISSO confirms env is ready — ingest FOUO audit findings",
          "npx tsx src/ingest/run.ts --prefix audit-findings/fy2024/ --type nfr",
          "",
          "# Full ingestion from scratch",
          "npx tsx src/ingest/run.ts --all",
          "# Expected: ✅ 47 documents → 1,832 chunks → 1,832 embeddings stored",
        ]},
        { type:"tip", content:"Schedule nightly ingestion via GitHub Actions cron (0 2 * * *). Use S3 ETag checksums to skip documents that haven't changed — avoids re-embedding unchanged files." },
      ]},
      { title:"Phase 3 — Audit Finding Classifier", icon:"🔍", entries:[
        { type:"text", content:"The classifier sends GFEBS transaction batches to Claude 3.5 Sonnet with DoD FMR compliance criteria as context. It returns structured JSON: finding category, risk level, applicable FMR paragraph reference, and initial root cause hypothesis." },
        { type:"tip", content:"Include 3–5 prior-year finding examples in the Claude system prompt as few-shot examples. This dramatically improves classification accuracy — the model learns your auditor's exact terminology and finding format." },
        { type:"commands", content:[
          "# Test classifier on a single transaction",
          "npx tsx src/classify/run.ts --transaction-id TXN-2024-000123",
          "",
          "# Batch classify a GFEBS extract (dry-run first)",
          "npx tsx src/classify/batch.ts --file gfebs-q3-fy2024.csv --dry-run",
          "npx tsx src/classify/batch.ts --file gfebs-q3-fy2024.csv",
        ]},
      ]},
      { title:"Phase 4 — ReAct Loop & Evidence Assembly", icon:"🔄", entries:[
        { type:"text", content:"For each flagged finding the ReAct loop iterates: (1) retrieve semantically similar prior findings via pgvector, (2) search supporting documentation (contracts, receiving reports), (3) verify against applicable DoD FMR paragraph, (4) assemble evidence package with source citations, (5) score confidence 0–100." },
        { type:"warning", content:"Set MAX_STEPS=8 in your agent config. An unbounded loop can exhaust your Anthropic API quota and generate large unexpected costs on a sizable GFEBS dataset." },
        { type:"commands", content:[
          "# Run agent on a specific finding",
          "npx tsx src/agent/react.ts --finding NFR-FY24-001",
          "",
          "# Batch — all open high-risk findings",
          "npx tsx src/agent/batch.ts --status open --risk high",
          "# Results written to audit_findings table + S3 /evidence-packages/",
        ]},
      ]},
      { title:"Phase 5 — CAP Generation", icon:"📝", entries:[
        { type:"text", content:"Claude generates a structured Corrective Action Plan for each confirmed finding in DoD standard format: (1) finding description, (2) root cause analysis, (3) corrective actions with responsible office and due date, (4) interim milestones, (5) estimated completion date." },
        { type:"tip", content:"Export your existing CAP Word template structure to JSON schema and pass it as Claude's responseSchema. This ensures every CAP can be imported directly into your audit management system without reformatting." },
        { type:"commands", content:[
          "# Generate CAPs for all open high-risk findings",
          "npx tsx src/cap/generate.ts --risk high --format json",
          "",
          "# Generate as DOCX for submission",
          "npx tsx src/cap/generate.ts --finding NFR-FY24-001 --format docx",
          "",
          "# Upload generated CAPs to S3",
          "aws s3 cp caps/ s3://dod-audit-agent-docs/caps/ --recursive",
        ]},
      ]},
      { title:"Deployment", icon:"🚀", entries:[
        { type:"bullets", content:[
          "Step 1: Push code to GitHub — CI runs TypeScript check + unit tests on every commit",
          "Step 2: Build Docker image: docker build -t audit-agent . (multi-stage build, ~180 MB final image)",
          "Step 3: Push image to Amazon ECR GovCloud or Google Artifact Registry",
          "Step 4: Deploy worker to Cloud Run (us-gov-central1) with --memory=2Gi --concurrency=1",
          "Step 5: Deploy Next.js dashboard to Vercel — add all env vars in Vercel dashboard (never in code)",
          "Step 6: Set CloudWatch alarms: error rate > 2%, cost per batch run > $5, ingestion failure",
          "Step 7: Schedule nightly GitHub Actions cron for ingestion (0 2 * * * ET)",
          "Step 8: User Acceptance Testing — validate 5 known prior-year findings are correctly detected and categorized before going live",
        ]},
      ]},
      { title:"Sustainment Calendar", icon:"📅", entries:[
        { type:"bullets", content:[
          "Daily (automated): Ingest new GFEBS extracts and WAWF receiving reports from S3 watched prefixes",
          "Weekly (5 min): Finance analyst reviews new agent-flagged findings — approve, dismiss, or escalate",
          "Monthly: Verify DoD FMR and FASAB documents are current; upload revised volumes if needed",
          "Monthly: Review agent cost dashboard — target < $50/month for a mid-size command",
          "Quarterly: Re-embed all chunks if embedding model is upgraded (text-embedding-004 → 005 etc.)",
          "Quarterly: Update finding classification prompts with patterns from the current audit cycle",
          "Annually: Archive prior FY findings to S3 Glacier; reset audit_findings table for new FY",
          "Annually: Re-validate ISSO ATO — confirm infrastructure changes haven't introduced new risks",
        ]},
      ]},
      { title:"Future Enhancements", icon:"🔭", entries:[
        { type:"bullets", content:[
          "Real-time GFEBS API: Replace batch CSV exports with direct GFEBS OData/REST API calls when available",
          "Multi-system coverage: Add DEAMS, Navy ERP, and LMP connectors for all-component audit coverage",
          "Multi-agent architecture: Separate Discovery Agent, Evidence Agent, and CAP Drafting Agent orchestrated by a coordinator",
          "Domain embedding model: Fine-tune text-embedding on DoD audit terminology to improve retrieval precision by 15–25%",
          "FIAR readiness score: Calculate and trend a 0–100 readiness score by assertion category in the executive dashboard",
          "Automated portal submission: Connect to DoD audit resolution portal API for one-click CAP filing",
          "PII scrubber: Add pre-ingestion PII detection and redaction before any document is vectorized",
          "Human feedback loop: Track analyst accept/reject decisions to continuously improve classifier accuracy",
        ]},
      ]},
    ],
  },
  {
    id: "budget-execution", icon: "💰", color: "#34d399",
    title: "Budget Execution & Obligation Tracker",
    domain: "DoD Financial Management — Budget & Finance Operations",
    goal: "AI agent that monitors obligation rates, detects unobligated balance risk, forecasts year-end spend, and surfaces potential anti-deficiency violations before they occur — enabling DoD comptrollers to maintain execution within apportionment.",
    challenge: "Budget execution across DoD spans GFEBS, DEAMS, PBIS, and Excel-based spend plans. Comptrollers manually reconcile these systems daily. AI can automate reconciliation, predict obligation rates, and alert on variances exceeding threshold.",
    architecture: "Gemini 2.5 Flash queries SFIS-equivalent SQL tables for current obligations → AWS S3 holds apportionment files and budget documents → Databricks runs spend projection models → Sequential Chain: load budget → query actuals → compare plan vs. actual → forecast EOY → generate alerts → RAGAS validates forecast accuracy.",
    outcomes: [
      "Real-time obligation rate monitoring vs. phased target curve",
      "Anti-deficiency violation early-warning alerts with root cause",
      "Year-end unobligated balance (UB) forecasting by program element",
      "Automated reconciliation between GFEBS, DEAMS, and spend plans",
    ],
    blocks: [
      { id:"s2b1", typeId:"gemini25",   catId:"llm",           label:"Gemini 2.5 Flash",  icon:"✨", color:"#4f8ef7", x:40,  y:120, deps:["@google/generative-ai"], env:["GEMINI_API_KEY"] },
      { id:"s2b2", typeId:"sqlquery",   catId:"tool",          label:"SQL Query",         icon:"🗄️", color:"#34d399", x:260, y:60,  deps:["@neondatabase/serverless"], env:["DATABASE_URL"] },
      { id:"s2b3", typeId:"awss3",      catId:"execution",     label:"AWS S3",            icon:"🪣", color:"#fb923c", x:260, y:160, deps:["@aws-sdk/client-s3"], env:["AWS_ACCESS_KEY_ID","AWS_SECRET_ACCESS_KEY","AWS_REGION","S3_BUCKET"] },
      { id:"s2b4", typeId:"databricks", catId:"execution",     label:"Databricks",        icon:"🔷", color:"#fb923c", x:260, y:260, deps:["@databricks/sdk"], env:["DATABRICKS_HOST","DATABRICKS_TOKEN"] },
      { id:"s2b5", typeId:"sequential", catId:"orchestration", label:"Sequential Chain",  icon:"➡️", color:"#e879f9", x:490, y:150, deps:[], env:[] },
      { id:"s2b6", typeId:"ragas",      catId:"evaluation",    label:"RAGAS Metrics",     icon:"📈", color:"#fbbf24", x:720, y:150, deps:[], env:[] },
    ],
    connections: [
      { id:"s2c1", fromId:"s2b1", toId:"s2b5", color:"#4f8ef7" },
      { id:"s2c2", fromId:"s2b2", toId:"s2b5", color:"#34d399" },
      { id:"s2c3", fromId:"s2b3", toId:"s2b5", color:"#fb923c" },
      { id:"s2c4", fromId:"s2b4", toId:"s2b5", color:"#fb923c" },
      { id:"s2c5", fromId:"s2b5", toId:"s2b6", color:"#e879f9" },
    ],
    manual: [
      { title:"Prerequisites & Overview", icon:"📋", entries:[
        { type:"text", content:"This manual guides a DoD comptroller office through deploying the Budget Execution & Obligation Tracker Agent. The agent monitors obligation rates vs. phased targets, forecasts year-end unobligated balances, and alerts on potential Anti-Deficiency Act (ADA) violations before they occur. Estimated effort: 6–10 weeks for a 2-person team." },
        { type:"warning", content:"Budget execution data (GFEBS, DEAMS, apportionment documents) is FOUO. Ensure infrastructure meets DoD IL4 requirements before ingesting live execution data." },
        { type:"h3", label:"Prerequisites" },
        { type:"bullets", content:[
          "GFEBS reporting access — Budget Execution module and BI/BW extract capability",
          "DEAMS read-only credentials for Air Force appropriation data",
          "OMB MAX credentials for SF-132 apportionment access (if applicable)",
          "Databricks workspace provisioned for forecasting Delta tables and ML models",
          "AWS GovCloud S3 account for document and CSV storage",
          "Neon Postgres for obligation tracking database",
          "Gemini API key for LLM analysis and budget narrative generation",
          "ISSO approval for the hosting environment at IL4 or higher",
        ]},
      ]},
      { title:"Data Inventory", icon:"📦", entries:[
        { type:"text", content:"Establish recurring data pulls from GFEBS and DEAMS with your Resource Management Officer and G8/J8. Prioritize daily GFEBS execution extracts above all other feeds." },
        { type:"table", content:{ headers:["Data Asset","Source System","Format","Sensitivity","Storage Target"], rows:[
          ["GFEBS Budget Execution Reports (daily)","GFEBS BI/BW module","CSV, XLSX","FOUO","S3 raw + Postgres + Databricks"],
          ["Apportionment Documents (SF-132)","OMB MAX / GFEBS","PDF, Excel","FOUO","S3: /apportionment/ + Postgres"],
          ["Phased Funding Targets / Spend Plans","Resource Management office","Excel","FOUO","S3: /spend-plans/ + Postgres"],
          ["Program Element (PE) / BA / Sub-Activity Mapping","President's Budget / GFEBS","Excel","Unclassified","Postgres reference table"],
          ["Prior Year Execution Rate History (5 years)","DFAS management reports","CSV","FOUO","Databricks Delta table"],
          ["Unliquidated Obligations (ULO) Aging Report","GFEBS","CSV","FOUO","Databricks Delta table"],
          ["Continuing Resolution / Omnibus Guidance","OMB, DoD Comptroller (public)","PDF","Unclassified","S3: /cr-guidance/"],
          ["ADA Violation History","OMB / DoD IG reports (public)","PDF","Unclassified","S3: /ada-history/"],
        ]}},
      ]},
      { title:"Data Architecture", icon:"🏗️", entries:[
        { type:"table", content:{ headers:["Component","Technology","Purpose","Estimated Size"], rows:[
          ["Raw Data Lake","AWS S3 GovCloud","Apportionment docs, spend plans, GFEBS CSV extracts","~20 GB initial, +5 GB/quarter"],
          ["Obligation Tracker DB","Neon Postgres","Current obligations by PE/BA, daily snapshots, alert history","~5 GB"],
          ["Forecasting Platform","Databricks (Delta Lake)","Historical execution rates, ULO aging, ML training features","~50 GB"],
          ["Execution Cache","Redis","Daily obligation rate summaries for fast dashboard load","512 MB"],
          ["Secrets","AWS Secrets Manager","GFEBS API credentials, DB passwords, API keys","N/A"],
        ]}},
        { type:"tip", content:"Use Databricks Delta Live Tables to build an incremental pipeline: raw GFEBS CSV → cleaned obligations table → forecasting features. This ensures the model always trains on the latest data without manual intervention." },
      ]},
      { title:"Phase 1 — Infrastructure Setup", icon:"🔧", entries:[
        { type:"commands", content:[
          "# AWS S3 bucket",
          "aws s3 mb s3://dod-budget-execution --region us-gov-west-1",
          "for prefix in gfebs-extracts apportionment spend-plans cr-guidance ada-history; do",
          "  aws s3api put-object --bucket dod-budget-execution --key $prefix/",
          "done",
          "",
          "-- Neon Postgres schema",
          "CREATE TABLE obligations (",
          "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  fiscal_year INTEGER NOT NULL,",
          "  pe_number TEXT NOT NULL,       -- e.g. 0603123A",
          "  ba_number TEXT, sub_activity TEXT, appropriation TEXT,",
          "  allotment NUMERIC(18,2),",
          "  obligations_ytd NUMERIC(18,2),",
          "  commitments NUMERIC(18,2),",
          "  unobligated_balance NUMERIC(18,2),",
          "  as_of_date DATE NOT NULL,",
          "  source_file TEXT,",
          "  created_at TIMESTAMPTZ DEFAULT now()",
          ");",
          "CREATE INDEX ON obligations (fiscal_year, pe_number, as_of_date);",
          "",
          "CREATE TABLE obligation_targets (",
          "  pe_number TEXT, fiscal_year INTEGER, month INTEGER,",
          "  target_rate NUMERIC(5,4),  -- 0.45 = 45% obligated by month 6",
          "  PRIMARY KEY (pe_number, fiscal_year, month)",
          ");",
          "",
          "CREATE TABLE ada_alerts (",
          "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  pe_number TEXT, fiscal_year INTEGER,",
          "  alert_type TEXT,  -- 'overobligation'|'rate_deviation'|'ulo_aging'",
          "  severity TEXT,    -- 'critical'|'warning'|'info'",
          "  message TEXT, acknowledged BOOLEAN DEFAULT false,",
          "  created_at TIMESTAMPTZ DEFAULT now()",
          ");",
        ]},
      ]},
      { title:"Phase 2 — GFEBS Data Integration", icon:"🔌", entries:[
        { type:"text", content:"Establish a daily automated extract from GFEBS BI/BW into S3. Work with your GFEBS system admin to schedule the extract at GFEBS EOD close (~19:00 ET). Configure an S3 Event Notification to auto-trigger the ingestion job." },
        { type:"commands", content:[
          "# After GFEBS extract lands in S3, run ingestion:",
          "npx tsx src/ingest/gfebs.ts --file gfebs-extract-20241015.csv --fy 2024",
          "",
          "# Verify load",
          "npx tsx src/db/verify.ts --date 2024-10-15",
          "# Expected: ✅ 4,832 PE/BA records loaded, 0 duplicates",
        ]},
        { type:"tip", content:"Configure an S3 Event Notification on the gfebs-extracts/ prefix to automatically trigger a Lambda or Cloud Run job whenever GFEBS pushes a new extract file. Zero manual intervention after initial setup." },
      ]},
      { title:"Phase 3 — Obligation Rate Monitoring", icon:"📊", entries:[
        { type:"text", content:"The monitoring agent compares YTD obligation rates vs. the phased target curve for each Program Element. It flags programs that are under-executing (risk of year-end cancellation of funds) or over-executing (risk of ADA violation)." },
        { type:"commands", content:[
          "# Run daily obligation rate check",
          "npx tsx src/monitor/rates.ts --fy 2024 --as-of today",
          "",
          "# Example output:",
          "# ⚠️  PE 0603123A: 32% obligated vs 45% target (−13%) — UNDER-EXECUTING",
          "# 🔴 PE 0805012A: 98% obligated vs 85% target (+13%) — ADA RISK",
          "# ✅ PE 0400121A: 67% obligated vs 65% target (+2%) — ON TRACK",
        ]},
      ]},
      { title:"Phase 4 — Year-End Forecasting (Databricks)", icon:"🔮", entries:[
        { type:"text", content:"Train a forecasting model in Databricks using 5 years of historical execution data. Features: current YTD rate, historical Q1–Q3 patterns, CR-period flags, appropriation type (O&M vs. Procurement vs. RDT&E). MLflow tracks experiments and model versions." },
        { type:"warning", content:"ML forecasts are estimates. Always pair automated ADA alerts with a human comptroller review before escalating to leadership or taking any corrective action." },
        { type:"commands", content:[
          "# Train model in Databricks notebook: databricks/notebooks/train_forecast_model.py",
          "",
          "# Run daily inference",
          "npx tsx src/forecast/run.ts --fy 2024",
          "",
          "# Example output:",
          "# PE 0603123A: EOY forecast = 87% (target 100%) — $12.4M at cancellation risk",
          "# PE 0805012A: EOY forecast = 103% — $2.1M over authority — ADA VIOLATION RISK",
        ]},
      ]},
      { title:"Phase 5 — Alert & Daily Brief System", icon:"🔔", entries:[
        { type:"text", content:"Gemini 2.5 Flash generates human-readable alert narratives from raw obligation data and forecast scores. Alerts are sent via email (Resend), Teams webhook, or Slack, and stored in the ada_alerts table for tracking." },
        { type:"commands", content:[
          "# Generate and send daily execution brief",
          "npx tsx src/alerts/daily-brief.ts --recipients comptroller@command.mil",
          "",
          "# Subject line example:",
          "# [BUDGET ALERT] FY2024 Execution Brief — 3 programs require action by COB",
        ]},
      ]},
      { title:"Deployment", icon:"🚀", entries:[
        { type:"bullets", content:[
          "Step 1: Containerize the agent worker — Docker multi-stage build targeting Cloud Run",
          "Step 2: Push image to Amazon ECR GovCloud or Google Artifact Registry",
          "Step 3: Deploy worker to Cloud Run with --memory=1Gi --max-instances=3",
          "Step 4: Deploy Next.js execution dashboard to Vercel (connect to Neon Postgres for live data)",
          "Step 5: Set up GitHub Actions: test → build → push image → deploy on merge to main",
          "Step 6: Configure CloudWatch alarms: ADA alert generated, daily brief failure, forecast model drift",
          "Step 7: Schedule GFEBS ingestion cron via GitHub Actions: daily at 06:00 ET (after DFAS EOD close)",
          "Step 8: UAT — verify 3 known prior-year ADA near-misses are detected correctly before go-live",
        ]},
      ]},
      { title:"Sustainment Calendar", icon:"📅", entries:[
        { type:"bullets", content:[
          "Daily (automated): Ingest GFEBS extract → update obligation table → re-run forecast → send alert brief",
          "Weekly (15 min): Comptroller reviews alert queue, acknowledges resolved items",
          "Monthly: Verify apportionment documents in S3 match latest OMB SF-132 actions",
          "Monthly: Review forecast accuracy — compare model predictions vs. actual obligation rates",
          "Quarterly: Retrain Databricks forecasting model with latest execution data",
          "Annually: Roll over fiscal year — archive FY data to S3 Glacier, initialize new FY targets",
          "Annually: Update appropriation type mappings if budget structure changes (new PEs, colors of money)",
        ]},
      ]},
      { title:"Future Enhancements", icon:"🔭", entries:[
        { type:"bullets", content:[
          "DEAMS real-time feed: Replace batch extracts with DEAMS API calls for Air Force appropriations",
          "Multi-appropriation dashboard: Consolidate O&M, Procurement, RDT&E, and MILCON on one screen",
          "Reprogramming assistant: AI agent that drafts DD-1415 reprogramming requests when UB exceeds threshold",
          "Congressional budget justification (CBJ) generator: Auto-draft PB narrative paragraphs from execution data",
          "Continuing resolution mode: Auto-adjust obligation targets when CR is in effect (pro-rata calculation)",
          "Cross-command benchmarking: Compare obligation rates across similar commands (anonymized)",
          "Natural language query: Ask 'What is the obligation rate for PE 0603123A as of Q3 FY24?' in plain English",
        ]},
      ]},
    ],
  },
  {
    id: "finance-ops", icon: "⚙️", color: "#e879f9",
    title: "Finance Operations Reconciliation Agent",
    domain: "DoD Financial Management — AP/AR & Financial Reporting",
    goal: "Multi-agent system for automated AP/AR reconciliation, SPS/MOCAS invoice matching, unmatched disbursements resolution, and FASAB-compliant financial statement generation — reducing manual effort for DoD finance offices.",
    challenge: "DoD processes millions of invoices through MOCAS, SPS, and GFEBS. Unmatched disbursements and entitlement errors cause audit findings. AI agents can match invoices, flag anomalies, and draft corrective journal entries at scale.",
    architecture: "GPT-4o orchestrates a parallel fan-out: SQL agent queries MOCAS/SPS data concurrently with Palantir Foundry dataset reads → Databricks runs anomaly detection models on journal entries → Summarizer compresses large transaction sets → LLM Judge scores reconciliation quality and flags items needing human review.",
    outcomes: [
      "Automated invoice-to-obligation matching across SPS, MOCAS, and GFEBS",
      "Unmatched disbursement root cause analysis with recommended remediation",
      "FASAB-compliant financial statement draft generation",
      "Anomaly detection on journal entries for fraud indicators",
    ],
    blocks: [
      { id:"s3b1", typeId:"gpt4o",      catId:"llm",           label:"GPT-4o",            icon:"🤖", color:"#4f8ef7", x:40,  y:150, deps:["openai"], env:["OPENAI_API_KEY"] },
      { id:"s3b2", typeId:"sqlquery",   catId:"tool",          label:"SQL Query",         icon:"🗄️", color:"#34d399", x:260, y:60,  deps:["@neondatabase/serverless"], env:["DATABASE_URL"] },
      { id:"s3b3", typeId:"palantir",   catId:"execution",     label:"Palantir Foundry",  icon:"🏛️", color:"#fb923c", x:260, y:160, deps:[], env:["FOUNDRY_TOKEN","FOUNDRY_URL"] },
      { id:"s3b4", typeId:"databricks", catId:"execution",     label:"Databricks",        icon:"🔷", color:"#fb923c", x:260, y:260, deps:["@databricks/sdk"], env:["DATABRICKS_HOST","DATABRICKS_TOKEN"] },
      { id:"s3b5", typeId:"parallel",   catId:"orchestration", label:"Parallel Fan-out",  icon:"⑂",  color:"#e879f9", x:490, y:160, deps:[], env:[] },
      { id:"s3b6", typeId:"summarizer", catId:"processing",    label:"Summarizer",        icon:"📝", color:"#fb923c", x:710, y:160, deps:[], env:[] },
      { id:"s3b7", typeId:"llmjudge",   catId:"evaluation",    label:"LLM Judge",         icon:"⚖️", color:"#fbbf24", x:930, y:160, deps:[], env:[] },
    ],
    connections: [
      { id:"s3c1", fromId:"s3b1", toId:"s3b5", color:"#4f8ef7" },
      { id:"s3c2", fromId:"s3b2", toId:"s3b5", color:"#34d399" },
      { id:"s3c3", fromId:"s3b3", toId:"s3b5", color:"#fb923c" },
      { id:"s3c4", fromId:"s3b4", toId:"s3b5", color:"#fb923c" },
      { id:"s3c5", fromId:"s3b5", toId:"s3b6", color:"#e879f9" },
      { id:"s3c6", fromId:"s3b6", toId:"s3b7", color:"#fb923c" },
    ],
    manual: [
      { title:"Prerequisites & Overview", icon:"📋", entries:[
        { type:"text", content:"This manual guides a DoD finance operations team through deploying the Finance Operations Reconciliation Agent — a multi-agent system for automated AP/AR 3-way matching, unmatched disbursement resolution, anomaly detection on journal entries, and FASAB-compliant financial statement draft generation. Estimated effort: 10–14 weeks for a team of 2 engineers + 1 finance SME." },
        { type:"warning", content:"Invoice and disbursement data is FOUO-Controlled. MOCAS and SPS data may contain sensitive contractor payment information. Confirm data handling approvals with your Finance Officer and ISSO before ingesting any payment data." },
        { type:"h3", label:"Prerequisites" },
        { type:"bullets", content:[
          "MOCAS (Contract Management System) read-only extract access via DFAS Columbus",
          "SPS (Standard Procurement System) SFTP extract feed or API access",
          "GFEBS disbursement module access — FI transaction-level data extract",
          "Palantir Foundry tenant provisioned with FOUO data governance policies applied",
          "Databricks workspace for anomaly detection model training (MLflow)",
          "OpenAI API key for GPT-4o (or Anthropic key for Claude 3.5 Sonnet as alternative)",
          "WAWF API credentials for receiving report validation",
          "ISSO ATO for the hosting environment at IL4 or higher",
        ]},
      ]},
      { title:"Data Inventory", icon:"📦", entries:[
        { type:"text", content:"The reconciliation agent requires four core data streams for the 3-way match framework: Purchase Orders (SPS) → Receiving Reports (WAWF/DD-250) → Invoices (MOCAS) → Disbursements (GFEBS). All four must be present before any matching can begin." },
        { type:"table", content:{ headers:["Data Asset","Source System","Format","Sensitivity","Storage Target"], rows:[
          ["MOCAS Invoice Data (all open invoices)","DFAS Columbus MOCAS extract","CSV, XML","FOUO-Controlled","Palantir Foundry dataset"],
          ["SPS Purchase Orders & Modifications","Standard Procurement System extract","XML, CSV","FOUO","Postgres + Palantir Foundry"],
          ["GFEBS Disbursement Ledger","GFEBS BI/BW — FI module","CSV","FOUO-Controlled","Databricks Delta table"],
          ["WAWF Receiving Reports (DD-250)","WAWF API / bulk export","XML, PDF","FOUO","S3 + Postgres"],
          ["USSGL Chart of Accounts","Treasury / GFEBS reference","Excel","Unclassified","Postgres reference table"],
          ["Vendor Master Data","SAM.gov + GFEBS vendor master","CSV","FOUO","Postgres vendor table"],
          ["Unmatched Disbursement Reports","DFAS monthly report","Excel","FOUO-Controlled","Databricks Delta table"],
          ["Journal Entry / Suspense Account Data","GFEBS FI module","CSV","FOUO-Controlled","Databricks Delta table"],
          ["Prior Year Reconciliation Results","Finance office records","Excel, PDF","FOUO","S3: /prior-year-recon/"],
        ]}},
      ]},
      { title:"Data Architecture", icon:"🏗️", entries:[
        { type:"text", content:"Federated architecture: Palantir Foundry for governed invoice/PO datasets with lineage tracking; Databricks for ML-intensive anomaly detection; Postgres for matching results and human review queue." },
        { type:"table", content:{ headers:["Component","Technology","Purpose","Estimated Size"], rows:[
          ["Invoice/PO Canonical Dataset","Palantir Foundry (Datasets)","MOCAS and SPS data with governance, lineage, and FOUO labels","~100 GB (5-yr history)"],
          ["Disbursement Analytics","Databricks (Delta Lake)","GFEBS disbursements, anomaly detection features, ML models","~200 GB"],
          ["Reconciliation DB","Neon Postgres","Match results, unmatched queue, human review decisions","~20 GB"],
          ["Document Store","AWS S3 GovCloud","WAWF PDFs, receiving reports, evidence packages","~30 GB"],
          ["Secrets","AWS Secrets Manager","All credentials — never in code or .env files","N/A"],
        ]}},
        { type:"tip", content:"Set up Palantir Foundry data governance policies before ingesting MOCAS data. Apply 'FOUO-Controlled' sensitivity labels and restrict access to the finance reconciliation role only." },
      ]},
      { title:"Phase 1 — Infrastructure Setup", icon:"🔧", entries:[
        { type:"commands", content:[
          "-- Postgres schema for 3-way match tracking",
          "CREATE TABLE po_invoices (",
          "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  contract_number TEXT NOT NULL,",
          "  po_number TEXT NOT NULL,",
          "  invoice_number TEXT,",
          "  vendor_cage TEXT,",
          "  po_amount NUMERIC(18,2),",
          "  invoiced_amount NUMERIC(18,2),",
          "  disbursed_amount NUMERIC(18,2),",
          "  receiving_report_id TEXT,",
          "  match_status TEXT DEFAULT 'unmatched', -- 'matched'|'partial'|'unmatched'|'dispute'",
          "  match_confidence NUMERIC(5,4),          -- AI score 0.0–1.0",
          "  anomaly_score NUMERIC(5,4),             -- Databricks score 0.0–1.0",
          "  human_reviewed BOOLEAN DEFAULT false,",
          "  created_at TIMESTAMPTZ DEFAULT now()",
          ");",
          "CREATE INDEX ON po_invoices (match_status, anomaly_score DESC);",
          "CREATE INDEX ON po_invoices (contract_number, vendor_cage);",
          "",
          "CREATE TABLE review_queue (",
          "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),",
          "  po_invoice_id UUID REFERENCES po_invoices(id),",
          "  reason TEXT, priority INTEGER, -- 1=critical, 2=high, 3=routine",
          "  assigned_to TEXT, resolved_at TIMESTAMPTZ, resolution TEXT,",
          "  created_at TIMESTAMPTZ DEFAULT now()",
          ");",
        ]},
      ]},
      { title:"Phase 2 — 3-Way Match Engine (MOCAS/SPS/GFEBS)", icon:"🔗", entries:[
        { type:"text", content:"The matching engine runs the core 3-way match: Purchase Order (SPS) → Receiving Report (WAWF/DD-250) → Invoice (MOCAS). GPT-4o handles fuzzy matching where exact numeric matching fails — e.g., contract modifications change the PO amount, or a vendor submits a partial invoice." },
        { type:"commands", content:[
          "# Run 3-way match for all open MOCAS invoices",
          "npx tsx src/match/run.ts --source mocas --status open",
          "",
          "# Expected output:",
          "# ✅ Matched:       1,247 invoices ($42.3M)",
          "# ⚠️  Partial match:   89 invoices  ($4.1M) — needs review",
          "# ❌ Unmatched:        34 invoices  ($2.8M) — queued for investigation",
          "",
          "# Run parallel match (SPS + Palantir Foundry simultaneously)",
          "npx tsx src/match/parallel.ts --fy 2024 --quarter 3",
        ]},
        { type:"tip", content:"Use GPT-4o function-calling mode to let the LLM call your Postgres query tool when it can't match an invoice on first pass. This agentic lookup resolves ~60% of partial matches automatically without human intervention." },
      ]},
      { title:"Phase 3 — Anomaly Detection (Databricks)", icon:"🔬", entries:[
        { type:"text", content:"Train an Isolation Forest model in Databricks on the GFEBS journal entry history to detect: (1) round-number disbursements (fraud indicator), (2) duplicate payments, (3) payments outside normal vendor amount range, (4) suspense account entries not cleared within 30 days." },
        { type:"warning", content:"High anomaly scores are signals for review — not proof of fraud. Always route flagged transactions to a Certifying Officer or finance compliance team for final determination before any action is taken." },
        { type:"commands", content:[
          "# Train anomaly model in Databricks: databricks/notebooks/train_anomaly_model.py",
          "# Uses MLflow for model versioning and experiment tracking",
          "",
          "# Run daily anomaly scoring on GFEBS disbursements",
          "npx tsx src/anomaly/score.ts --source gfebs --date today",
          "",
          "# Example high-risk flags:",
          "# 🔴 TXN-2024-089432: $50,000.00 (round number) to CAGE 3X492 — score 0.94",
          "# 🔴 TXN-2024-091234: Duplicate of TXN-2024-088901 (same vendor, amount, +2 days)",
          "# ⚠️  TXN-2024-094001: Suspense acct 2139 open 45 days — score 0.71",
        ]},
      ]},
      { title:"Phase 4 — Financial Statement Generation", icon:"📄", entries:[
        { type:"text", content:"GPT-4o generates draft financial statement note disclosures based on reconciliation results. It reads the USSGL chart of accounts, applies SFFAS standards, and formats notes compliant with the Treasury Financial Manual and OUSD(C) guidance." },
        { type:"tip", content:"Include the Treasury Financial Manual (TFM) and OUSD(C) Financial Statement Preparation Guide in your S3 knowledge base. The LLM uses these as grounding references to ensure disclosure language meets federal reporting requirements — dramatically reducing the risk of non-compliant language in drafts." },
        { type:"commands", content:[
          "# Generate draft Notes to Financial Statements",
          "npx tsx src/statements/generate.ts --fy 2024 --quarter 3 --output pdf",
          "",
          "# Specific note types:",
          "#   --note accounts-payable",
          "#   --note unexpended-appropriations",
          "#   --note unmatched-transactions",
        ]},
      ]},
      { title:"Phase 5 — Human Review Workflow", icon:"👤", entries:[
        { type:"text", content:"The Human-in-Loop step routes partial matches, anomaly-flagged transactions, and unresolved disbursements to a prioritized review queue. Finance staff see the AI's evidence and recommendation, then approve or override with one click." },
        { type:"commands", content:[
          "# View current critical review queue",
          "npx tsx src/review/queue.ts --priority critical",
          "",
          "# The Next.js dashboard at /review shows for each item:",
          "#   - AI match confidence score and reasoning",
          "#   - PO details, receiving report, invoice PDF side-by-side",
          "#   - Recommended action (approve match / investigate / reject invoice)",
          "#   - 1-click Approve / Override / Escalate buttons",
        ]},
      ]},
      { title:"Deployment", icon:"🚀", entries:[
        { type:"bullets", content:[
          "Step 1: Provision Palantir Foundry datasets for MOCAS/SPS with FOUO labels and role-based access controls",
          "Step 2: Deploy Databricks anomaly detection job — schedule nightly after GFEBS EOD close (~20:00 ET)",
          "Step 3: Containerize the matching engine (Docker multi-stage) and deploy to Cloud Run",
          "Step 4: Deploy the human review dashboard (Next.js) to Vercel or Cloud Run",
          "Step 5: Set up GitHub Actions CI/CD: test → build → push image → deploy on merge to main",
          "Step 6: Configure alert notifications: Teams/Slack webhook for critical anomaly flags",
          "Step 7: Integrate CAC/PKI authentication for the review dashboard (DoD identity requirement)",
          "Step 8: Parallel operation for 30 days — compare agent match results vs. manual process; target > 92% auto-match accuracy before full deployment",
        ]},
      ]},
      { title:"Sustainment Calendar", icon:"📅", entries:[
        { type:"bullets", content:[
          "Daily (automated): Ingest MOCAS invoices + GFEBS disbursements → run 3-way match → score anomalies → update review queue",
          "Daily (manual, 30 min): Finance staff processes critical review queue items — approve, dispute, or escalate",
          "Weekly: Reconciliation supervisor reviews queue backlog and resolution rate KPIs",
          "Monthly: Verify Palantir Foundry pipeline completeness — confirm no missing source extracts",
          "Monthly: Retrain anomaly model if new fraud patterns identified by auditors or IG",
          "Quarterly: Review match accuracy (target > 94% auto-match) — adjust fuzzy match thresholds",
          "Annually: Archive prior FY data to cold storage; reset anomaly detection baselines for new FY",
          "Annually: Review USSGL chart of accounts and SFFAS references for Treasury updates",
        ]},
      ]},
      { title:"Future Enhancements", icon:"🔭", entries:[
        { type:"bullets", content:[
          "Real-time WAWF webhook: Replace batch receiving report pulls with WAWF push for same-day 3-way matching",
          "LLM contract interpreter: GPT-4o reads contract clauses to auto-apply correct USSGL account mapping for complex multi-CLIN contracts",
          "Vendor risk scoring: Aggregate anomaly history per vendor CAGE code to build a persistent vendor risk profile",
          "IPAC reconciliation: Extend the match engine to cover IPAC (Intra-Governmental Payment and Collection) transactions",
          "Digital signature workflow: Integrate with DoD e-signature so Certifying Officers can approve matches directly in the system",
          "Cross-fund reconciliation: Handle transfers between appropriation types (O&M → Procurement) with correct USSGL split accounting",
          "NLP contract parser: Auto-extract CLIN amounts, delivery dates, and payment terms from unstructured contract PDFs to improve match precision",
        ]},
      ]},
    ],
  },
];

// ─── MANUAL ENTRY RENDERER ───────────────────────────────────────────────────
function ManualEntryBlock({ entry, color }: { entry: ManualEntry; color: string }) {
  const [copied, setCopied] = useState(false);
  if (entry.type === "h3") return (
    <div style={{ fontSize: 12, fontWeight: 800, color, marginTop: 14, marginBottom: 6, letterSpacing: "0.03em" }}>{entry.label}</div>
  );
  if (entry.type === "text") return (
    <p style={{ fontSize: 12.5, color: "#9aa3c0", lineHeight: 1.7, margin: "0 0 10px" }}>{entry.content as string}</p>
  );
  if (entry.type === "tip") return (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.22)", marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: "#34d399", fontWeight: 800 }}>💡 Tip: </span>
      <span style={{ fontSize: 11.5, color: "#7dbfa0", lineHeight: 1.65 }}>{entry.content as string}</span>
    </div>
  );
  if (entry.type === "warning") return (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800 }}>⚠️ Warning: </span>
      <span style={{ fontSize: 11.5, color: "#b59a5a", lineHeight: 1.65 }}>{entry.content as string}</span>
    </div>
  );
  if (entry.type === "bullets") return (
    <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>
      {(entry.content as string[]).map((b, i) => (
        <li key={i} style={{ fontSize: 12, color: "#8892b0", lineHeight: 1.7, marginBottom: 3 }}>{b}</li>
      ))}
    </ul>
  );
  if (entry.type === "commands") {
    const lines = entry.content as string[];
    const copyAll = () => { navigator.clipboard.writeText(lines.filter(l => !l.startsWith("#") && l.trim()).join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
      <div style={{ borderRadius: 9, background: "#07090f", border: "1px solid #1a1d2e", overflow: "hidden", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "#0b0d18", borderBottom: "1px solid #1a1d2e" }}>
          <div style={{ display: "flex", gap: 5 }}>
            {["#f87171","#fbbf24","#34d399"].map((c, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />)}
          </div>
          <button onClick={copyAll} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700, cursor: "pointer", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
            {copied ? <><Check size={8} />Copied!</> : <><Copy size={8} />Copy</>}
          </button>
        </div>
        <pre style={{ margin: 0, padding: "10px 14px", fontSize: 11, lineHeight: 1.7, fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace", color: "#c9d1f0", overflowX: "auto", whiteSpace: "pre" }}>
          {lines.map((line, i) => (
            <div key={i} style={{ color: line.startsWith("#") || line.startsWith("--") ? "#3a4060" : "#c9d1f0" }}>{line || " "}</div>
          ))}
        </pre>
      </div>
    );
  }
  if (entry.type === "table") {
    const tbl = entry.content as { headers: string[]; rows: string[][] };
    return (
      <div style={{ overflowX: "auto", marginBottom: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: `${color}18` }}>
              {tbl.headers.map((h, i) => <th key={i} style={{ padding: "7px 10px", textAlign: "left", color, fontWeight: 800, borderBottom: `1px solid ${color}30`, whiteSpace: "nowrap" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {tbl.rows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                {row.map((cell, ci) => <td key={ci} style={{ padding: "7px 10px", color: ci === 0 ? "#c9d1f0" : "#7d88a8", borderBottom: "1px solid #1a1d2e", lineHeight: 1.4 }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

// ─── SCENARIOS VIEW ───────────────────────────────────────────────────────────
function ScenariosView({ onLoad }: { onLoad: (blocks: CanvasBlock[], conns: Connection[]) => void }) {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "manual">("overview");
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0]));

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

      {/* Scenario list */}
      <div style={{ width: 310, flexShrink: 0, borderRight: "1px solid #1a1d2e", overflowY: "auto", background: "#0a0c15", padding: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#3d4460", letterSpacing: "0.1em", marginBottom: 6 }}>🎯 DOD FINANCIAL MANAGEMENT</div>
        <div style={{ fontSize: 11, color: "#4a5270", marginBottom: 16, lineHeight: 1.5 }}>
          Pre-built agent architectures for DoD finance. Click a scenario, then load it into the canvas to customize and generate production code.
        </div>
        {SCENARIOS.map(sc => (
          <div key={sc.id} onClick={() => { setSelected(sc); setDetailTab("overview"); setExpandedChapters(new Set([0])); }}
            style={{ padding: "14px 16px", borderRadius: 10, marginBottom: 10, cursor: "pointer",
              background: selected?.id === sc.id ? `${sc.color}12` : "#12141f",
              border: `1px solid ${selected?.id === sc.id ? sc.color : `${sc.color}30`}`,
              transition: "all 0.15s" }}
            onMouseEnter={e => { if (selected?.id !== sc.id) e.currentTarget.style.borderColor = `${sc.color}60`; }}
            onMouseLeave={e => { if (selected?.id !== sc.id) e.currentTarget.style.borderColor = `${sc.color}30`; }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{sc.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: sc.color }}>{sc.title}</div>
                <div style={{ fontSize: 10, color: "#5c6480", marginTop: 2 }}>{sc.domain}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#7d88a8", lineHeight: 1.5 }}>{sc.goal.slice(0, 110)}…</div>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {sc.blocks.slice(0, 4).map(b => (
                <span key={b.id} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 8, background: `${b.color}15`, border: `1px solid ${b.color}30`, color: b.color }}>{b.icon} {b.label}</span>
              ))}
              {sc.blocks.length > 4 && <span style={{ fontSize: 9, color: "#4a5270" }}>+{sc.blocks.length - 4} more</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Scenario detail */}
      <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        {selected ? (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 36 }}>{selected.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#eaedf8", marginBottom: 3 }}>{selected.title}</div>
                <div style={{ fontSize: 11, color: selected.color, fontWeight: 600 }}>{selected.domain}</div>
              </div>
              <button onClick={() => onLoad(selected.blocks, selected.connections)}
                style={{ flexShrink: 0, padding: "9px 18px", borderRadius: 9, fontSize: 12, fontWeight: 800, cursor: "pointer",
                  background: `${selected.color}20`, border: `1px solid ${selected.color}60`, color: selected.color }}>
                🧩 Load into Canvas →
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1a1d2e", marginBottom: 20 }}>
              {(["overview", "manual"] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)} style={{
                  padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  background: "transparent", border: "none",
                  borderBottom: detailTab === t ? `2px solid ${selected.color}` : "2px solid transparent",
                  color: detailTab === t ? selected.color : "#5c6480",
                  transition: "all 0.15s",
                }}>
                  {t === "overview" ? "📋 Overview" : "📖 Deployment Manual"}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {detailTab === "overview" && (
              <>
                <div style={{ marginBottom: 14, padding: "14px 18px", borderRadius: 10, background: `${selected.color}08`, border: `1px solid ${selected.color}20` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: selected.color, letterSpacing: "0.1em", marginBottom: 7 }}>🎯 MISSION GOAL</div>
                  <p style={{ fontSize: 13, color: "#c9d1f0", lineHeight: 1.7, margin: 0 }}>{selected.goal}</p>
                </div>
                <div style={{ marginBottom: 14, padding: "14px 18px", borderRadius: 10, background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.18)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#f87171", letterSpacing: "0.1em", marginBottom: 7 }}>⚡ THE CHALLENGE</div>
                  <p style={{ fontSize: 12.5, color: "#9aa3c0", lineHeight: 1.7, margin: 0 }}>{selected.challenge}</p>
                </div>
                <div style={{ marginBottom: 14, padding: "14px 18px", borderRadius: 10, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.18)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.1em", marginBottom: 7 }}>🏗️ AGENT ARCHITECTURE</div>
                  <p style={{ fontSize: 12.5, color: "#9aa3c0", lineHeight: 1.7, margin: 0 }}>{selected.architecture}</p>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#5c6480", letterSpacing: "0.1em", marginBottom: 9 }}>🧩 PRE-BUILT BLOCKS ({selected.blocks.length}) + {selected.connections.length} CONNECTIONS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {selected.blocks.map(b => (
                      <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, background: "#12141f", border: `1px solid ${b.color}30` }}>
                        <span style={{ fontSize: 13 }}>{b.icon}</span>
                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: b.color }}>{b.label}</div>
                          <div style={{ fontSize: 9, color: "#4a5270" }}>{b.catId.toUpperCase()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#5c6480", letterSpacing: "0.1em", marginBottom: 9 }}>✅ EXPECTED OUTCOMES</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {selected.outcomes.map((o, i) => (
                      <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "9px 12px", borderRadius: 8, background: "#12141f", border: `1px solid ${selected.color}15` }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: `${selected.color}18`, border: `1px solid ${selected.color}35`, color: selected.color, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                        <span style={{ fontSize: 12, color: "#9aa3c0", lineHeight: 1.6 }}>{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => onLoad(selected.blocks, selected.connections)}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer",
                    background: `linear-gradient(135deg, ${selected.color}ee, ${selected.color}99)`, border: "none", color: "#0d0f1a" }}>
                  🧩 Load into Canvas → Generate Code
                </button>
              </>
            )}

            {/* Manual tab */}
            {detailTab === "manual" && (
              <div>
                <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 9, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.2)" }}>
                  <div style={{ fontSize: 11, color: "#38bdf8", lineHeight: 1.6 }}>
                    📖 <strong>Deployment Manual</strong> — Step-by-step guide covering prep work, data architecture, development phases, deployment, sustainment, and future enhancements.
                  </div>
                </div>
                {selected.manual.map((chapter, ci) => {
                  const isOpen = expandedChapters.has(ci);
                  return (
                    <div key={ci} style={{ marginBottom: 10, borderRadius: 10, background: "#0d0f1a", border: `1px solid ${isOpen ? selected.color + "50" : "#1a1d2e"}`, overflow: "hidden", transition: "border-color 0.15s" }}>
                      <button onClick={() => setExpandedChapters(prev => { const n = new Set(prev); n.has(ci) ? n.delete(ci) : n.add(ci); return n; })}
                        style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ fontSize: 16 }}>{chapter.icon}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: isOpen ? selected.color : "#c9d1f0" }}>{chapter.title}</span>
                        <span style={{ fontSize: 10, color: "#4a5270" }}>{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: "4px 16px 16px" }}>
                          {chapter.entries.map((entry, ei) => (
                            <ManualEntryBlock key={ei} entry={entry} color={selected.color} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={() => onLoad(selected.blocks, selected.connections)}
                  style={{ marginTop: 12, width: "100%", padding: "12px 0", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer",
                    background: `linear-gradient(135deg, ${selected.color}ee, ${selected.color}99)`, border: "none", color: "#0d0f1a" }}>
                  🧩 Load into Canvas → Generate Code
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
            <span style={{ fontSize: 52, opacity: 0.2 }}>🎯</span>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#3d4460" }}>Select a DoD financial scenario</div>
            <div style={{ fontSize: 13, color: "#2a2e46", textAlign: "center", maxWidth: 420, lineHeight: 1.7 }}>
              Each scenario pre-loads a production-ready agent architecture tailored to DoD financial management — FIAR, budget execution, and finance operations.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function LearnPage() {
  type Mode = "canvas" | "curriculum" | "builder" | "scenarios";
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

  const handleLoadScenario = useCallback((blocks: CanvasBlock[], conns: Connection[]) => {
    setCanvasBlocks(blocks);
    setConnections(conns);
    setSelectedBlock(null);
    setConnectingFrom(null);
    setMode("canvas");
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
        {(["canvas", "curriculum", "builder", "scenarios"] as Mode[]).map((m, i) => {
          const labels: Record<Mode, string> = { canvas: "🧩 LEGO Canvas", curriculum: "📚 Curriculum", builder: "🔨 Builder", scenarios: "🎯 DoD Scenarios" };
          const colors: Record<Mode, string> = { canvas: "#f59e0b", curriculum: "#a78bfa", builder: "#34d399", scenarios: "#f87171" };
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
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8, background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.40)" }}>
                <span style={{ fontSize: 13 }}>🔗</span>
                <div style={{ fontSize: 11, color: "#38bdf8" }}>
                  <span style={{ opacity: 0.7 }}>Step 1 done — output port clicked on </span>
                  <strong style={{ color: "#fff" }}>{connectingBlock?.label}</strong>
                  <span style={{ opacity: 0.7 }}>. Now: </span>
                  <span style={{ fontWeight: 800 }}>click the </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "rgba(56,189,248,0.18)", border: "1px solid #38bdf8", borderRadius: 8, padding: "1px 7px", fontWeight: 800 }}>◀ left dot</span>
                  <span style={{ fontWeight: 800 }}> on the target block</span>
                </div>
                <button onClick={() => setConnectingFrom(null)}
                  style={{ marginLeft: 4, padding: "2px 9px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)", color: "#f87171" }}>
                  Cancel
                </button>
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
            <div style={{ padding: "10px 12px 4px", fontSize: 10, fontWeight: 800, color: "#3d4460", letterSpacing: "0.1em" }}>DRAG BLOCKS TO CANVAS</div>
            <div style={{ margin: "0 8px 8px", padding: "8px 10px", borderRadius: 7, background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <div style={{ fontSize: 9.5, color: "#5c6480", lineHeight: 1.55 }}>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>◀ Left dot</span> = input &nbsp;·&nbsp; <span style={{ color: "#f59e0b", fontWeight: 700 }}>Right dot ▶</span> = output<br />
                Click <strong>right dot</strong> first → then <strong>left dot</strong> of target
              </div>
            </div>
            {[...BLOCK_PALETTE].sort((a, b) => {
              const ORD = ["knowledge","execution","memory","processing","llm","tool","workflow","orchestration","protocol","evaluation","deployment"];
              return (ORD.indexOf(a.cat) === -1 ? 99 : ORD.indexOf(a.cat)) - (ORD.indexOf(b.cat) === -1 ? 99 : ORD.indexOf(b.cat));
            }).map(cat => (
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
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, pointerEvents: "none" }}>
                <div style={{ fontSize: 48, opacity: 0.15 }}>🧩</div>
                <div style={{ fontSize: 15, color: "#3d4460", fontWeight: 700 }}>Drag blocks from the left panel to build your agent</div>
                <div style={{ fontSize: 12, color: "#2a2e46", marginBottom: 4 }}>Or use 🎯 DoD Scenarios to load a pre-built architecture</div>
                {/* Port guide */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "14px 20px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid #1a1d2e" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#3d4460", letterSpacing: "0.08em", marginBottom: 2 }}>HOW TO CONNECT BLOCKS</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#3d4460" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#1a1d2e", border: "2px solid #4f8ef7" }} />
                      <span>◀ <strong style={{ color: "#4f8ef7" }}>Left dot</strong> = Input port (receives data)</span>
                    </div>
                    <span style={{ opacity: 0.3 }}>│</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#1a1d2e", border: "2px solid #4f8ef7" }} />
                      <span><strong style={{ color: "#4f8ef7" }}>Right dot</strong> ▶ = Output port (click first)</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#2a2e46" }}>
                    <strong style={{ color: "#3d4460" }}>Steps:</strong> 1) Drop 2 blocks · 2) Click RIGHT dot of Block A · 3) Click LEFT dot of Block B · 4) Connection drawn ✓
                  </div>
                </div>
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
                  {/* Input port — ◀ left dot, click here to receive a connection */}
                  <div onClick={e => handlePortClick(e, block.id, "in")}
                    title="◀ Input port — click here when connecting from another block"
                    style={{
                      position: "absolute",
                      left: connectingFrom && connectingFrom !== block.id ? -11 : -7,
                      top: "50%", transform: "translateY(-50%)",
                      width: connectingFrom && connectingFrom !== block.id ? 22 : 14,
                      height: connectingFrom && connectingFrom !== block.id ? 22 : 14,
                      borderRadius: "50%",
                      background: connectingFrom && connectingFrom !== block.id ? block.color : "#1a1d2e",
                      border: `2px solid ${block.color}`,
                      cursor: connectingFrom && connectingFrom !== block.id ? "crosshair" : "pointer",
                      zIndex: 3,
                      transition: "all 0.15s",
                      boxShadow: connectingFrom && connectingFrom !== block.id ? `0 0 10px ${block.color}90, 0 0 20px ${block.color}40` : "none",
                    }} />
                  {/* Block content */}
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{block.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: block.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{block.label}</div>
                    <div style={{ fontSize: 9, color: "#5c6480", marginTop: 1 }}>{block.catId.toUpperCase()}</div>
                  </div>
                  {/* Output port — ▶ right dot, click first to start a connection */}
                  <div onClick={e => handlePortClick(e, block.id, "out")}
                    title="▶ Output port — click here first to start a connection"
                    style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: isConnFrom ? block.color : "#1a1d2e", border: `2px solid ${block.color}`, cursor: "pointer", zIndex: 3, transition: "all 0.15s", boxShadow: isConnFrom ? `0 0 8px ${block.color}80` : "none" }} />
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
              <div style={{ padding: "20px 0" }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>🎛️</div>
                  <div style={{ fontSize: 12, color: "#3d4460" }}>Click a block to see its config</div>
                  <div style={{ fontSize: 10, color: "#2a2e46", marginTop: 4 }}>
                    {canvasBlocks.length} block{canvasBlocks.length !== 1 ? "s" : ""} · {connections.length} connection{connections.length !== 1 ? "s" : ""}
                  </div>
                </div>
                {/* Connection guide */}
                <div style={{ padding: "14px", borderRadius: 9, background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.18)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", letterSpacing: "0.08em", marginBottom: 10 }}>🔗 HOW TO CONNECT BLOCKS</div>
                  {[
                    { step: "1", icon: "▶", text: "Click the RIGHT dot on Block A — it glows to show it's active" },
                    { step: "2", icon: "◀", text: "Click the LEFT dot on Block B — connection is drawn automatically" },
                    { step: "3", icon: "✓", text: "A curved line appears. Repeat for more connections." },
                  ].map(({ step, icon, text }) => (
                    <div key={step} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{step}</div>
                      <div style={{ fontSize: 10.5, color: "#5c7080", lineHeight: 1.5 }}>
                        <span style={{ color: "#38bdf8", fontWeight: 800 }}>{icon} </span>{text}
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, fontSize: 10, color: "#3d4460", padding: "6px 8px", borderRadius: 6, background: "rgba(255,255,255,0.02)" }}>
                    💡 Or select a block and click "Start connection from this block"
                  </div>
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

      {/* ── CURRICULUM MODE ── */}
      {mode === "curriculum" && (
        <CurriculumView />
      )}

      {/* ── BUILDER ── */}
      {mode === "builder" && <BuilderView />}

      {/* ── SCENARIOS ── */}
      {mode === "scenarios" && <ScenariosView onLoad={handleLoadScenario} />}

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
