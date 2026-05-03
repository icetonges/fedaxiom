"use client";

import { useState, useRef, useEffect } from "react";
import {
  Brain, Database, Wrench, Network, BarChart2, Rocket,
  Activity, Code2, GitBranch, Cpu, Zap, Bot, User, Send,
  ArrowRight, Sparkles, RefreshCw, Clock, Loader2,
  Check, AlertCircle, CheckCircle, Terminal, Copy,
  CloudSun, Search, ChevronRight, ChevronDown,
  Layers, FileText,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Tab = "blueprint" | "chat" | "sandbox" | "a2a" | "updates";
type PillarId = "knowledge" | "core" | "skills" | "tools" | "orchestration" | "a2a_fw" | "evaluate" | "production";

interface Difference { concept: string; thisIs: string; thatIs: string; }
interface Block {
  id: string; pillar: PillarId; name: string; color: string;
  status: "live" | "beta" | "soon"; isNew?: boolean;
  what: string; why: string; vs: Difference[]; how: string[]; code?: string;
}
interface Update {
  id: string; date: string; type: "model" | "tool" | "framework" | "suggestion";
  title: string; desc: string; isNew?: boolean;
}
interface AgentStep {
  type: "agent_start"|"step_start"|"thought"|"tool_call"|"tool_result"|"final_answer"|"error"|"done";
  step?: number; content?: string; tool?: string; args?: Record<string,unknown>; result?: string; message?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// PILLAR CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const PILLARS: { id: PillarId; label: string; color: string; icon: React.ReactNode }[] = [
  { id: "knowledge",     label: "Knowledge Layer",  color: "var(--em)",  icon: <Database size={13}/> },
  { id: "core",          label: "Agent Core",       color: "var(--bl)",  icon: <Cpu size={13}/> },
  { id: "skills",        label: "Agent Skills",     color: "var(--vi)",  icon: <Brain size={13}/> },
  { id: "tools",         label: "Live Tools",       color: "var(--cy)",  icon: <Wrench size={13}/> },
  { id: "orchestration", label: "Orchestration",    color: "var(--or)",  icon: <GitBranch size={13}/> },
  { id: "a2a_fw",        label: "A2A Framework",    color: "var(--am)",  icon: <Network size={13}/> },
  { id: "evaluate",      label: "Evaluation",       color: "var(--ro)",  icon: <BarChart2 size={13}/> },
  { id: "production",    label: "Production",       color: "#94a3b8",    icon: <Rocket size={13}/> },
];

// ═══════════════════════════════════════════════════════════════════════════
// BLOCK DATA — the lego pieces
// ═══════════════════════════════════════════════════════════════════════════

const BLOCKS: Block[] = [
  // ── KNOWLEDGE LAYER ──────────────────────────────────────────────────────
  {
    id: "knowledge-base", pillar: "knowledge", name: "Knowledge Base", color: "var(--em)", status: "live",
    what: "A curated, external collection of facts, documents, and procedures your agent retrieves at runtime. Unlike the LLM's baked-in weights, a KB is yours to control — update it without retraining, cite every source, audit every fact.",
    why: "LLMs hallucinate because they blend training patterns. A KB grounds every answer in real content you own. This is the difference between a confident guesser and a reliable expert.",
    vs: [
      { concept: "Agent Skills", thisIs: "KNOW — static facts and documents the agent looks up", thatIs: "DO — dynamic capabilities the agent executes (search, calculate, write code)" },
      { concept: "Fine-tuning",  thisIs: "Runtime lookup — instantly updatable, traceable, no GPU cost", thatIs: "Weights update — persistent style changes, requires training, no source tracing" },
    ],
    how: ["Collect documents: PDFs, web pages, internal wikis, FAQs", "Chunk into 512-token segments with 50-token overlap", "Embed each chunk with text-embedding-3-small", "Store in vector DB: Pinecone, pgvector, Qdrant, or Weaviate", "At query time: embed query → retrieve top-k → inject as context"],
    code: `// Build KB
const chunks = await splitDocuments(docs, { size: 512, overlap: 50 });
const store = await PineconeStore.fromDocuments(chunks, new OpenAIEmbeddings());

// Query KB
const context = await store.similaritySearch(query, 5);
const answer = await llm.complete({ context, question: query });`,
  },
  {
    id: "vector-store", pillar: "knowledge", name: "Vector Store", color: "var(--em)", status: "live",
    what: "A database optimized for high-dimensional embedding vectors. Finds semantically similar content using cosine similarity — so 'car' matches 'automobile' and 'vehicle', not just exact keywords.",
    why: "Traditional SQL misses synonyms and paraphrases. Vector similarity finds meaning. This is what makes RAG scale to millions of documents without losing precision.",
    vs: [
      { concept: "Knowledge Graph", thisIs: "Semantic similarity search — finds related concepts without exact words", thatIs: "Explicit relationship mapping — structured facts like 'Paris is_capital_of France'" },
      { concept: "PostgreSQL",      thisIs: "ANN on 1536-dim float vectors — fast approximate nearest neighbor",      thatIs: "Exact row/column matching — deterministic, great for structured data, not vectors" },
    ],
    how: ["Choose: Pinecone (managed SaaS), pgvector (Postgres plugin), Qdrant (self-hosted), Weaviate (hybrid)", "Create index with correct dimensions (1536 for text-embedding-3-small)", "Upsert vectors with rich metadata: source, date, chunk_id, section", "Query with cosine similarity + metadata filters for precision", "Monitor index size and query latency in production"],
    code: `const client = new QdrantClient({ url: "http://localhost:6333" });
await client.upsert("my_kb", {
  points: chunks.map((c, i) => ({
    id: i, vector: c.embedding,
    payload: { text: c.text, source: c.source, date: c.date }
  }))
});
const results = await client.search("my_kb", { vector: queryEmbedding, limit: 5 });`,
  },
  {
    id: "rag-pipeline", pillar: "knowledge", name: "RAG Pipeline", color: "var(--em)", status: "live",
    what: "End-to-end system: chunk → embed → store offline. At query time: embed query → retrieve top-k → rerank → inject into prompt → generate grounded answer with citations.",
    why: "RAG is the #1 production AI pattern. Solves hallucination, knowledge staleness, and lack of citations in one architecture. Every serious AI product has a RAG layer.",
    vs: [
      { concept: "Fine-tuning",       thisIs: "Data stays external — update KB in minutes, no model change, full traceability", thatIs: "Data baked into weights — better for style/format, not for factual accuracy" },
      { concept: "Long-context LLM",  thisIs: "Retrieves only relevant 3-5 chunks — cheap, focused, scales to millions of docs", thatIs: "Stuff everything in context — simple, but expensive and loses focus past 32K tokens" },
    ],
    how: ["Offline: Ingest → Chunk (512 tok, 50 overlap) → Embed → Upsert to vector DB", "Online: Query → Embed → Retrieve top-k → Rerank → Build prompt → Generate", "Add metadata filters (date, source, category) for precision retrieval", "Implement hybrid search: BM25 (keyword) + vector for best recall", "Evaluate with RAGAS: faithfulness, relevance, context precision"],
    code: `async function rag(question: string) {
  const qVec = await embed(question);
  const docs = await vectorDB.query(qVec, { topK: 5 });
  const reranked = await cohere.rerank(question, docs);
  return llm.complete(
    \`Context: \${reranked.join("\\n---\\n")}\\n\\nQuestion: \${question}\`
  );
}`,
  },
  {
    id: "embeddings", pillar: "knowledge", name: "Embeddings", color: "var(--em)", status: "live",
    what: "Neural networks that convert text into dense numerical vectors where semantic similarity = mathematical closeness. 'King − Man + Woman ≈ Queen' is the classic example. Foundation of all vector search.",
    why: "Embeddings are the universal language of AI memory. They power semantic search, clustering, anomaly detection, classification — all from the same representation.",
    vs: [
      { concept: "Sparse Vectors (BM25)", thisIs: "Dense: captures meaning and synonyms, 1536 float dimensions", thatIs: "Sparse: counts word frequency — fast exact-match, misses paraphrases" },
      { concept: "LLM Tokens",            thisIs: "Output space: continuous vector (meaning)",                   thatIs: "Input space: discrete token IDs (subword units)" },
    ],
    how: ["Pick model: text-embedding-3-small (cost), text-embedding-3-large (quality), Nomic (open-source)", "Embed full sentences, not isolated keywords — full context gives better vectors", "Normalize vectors before storing (required for cosine similarity)", "Batch embed for cost efficiency: up to 2048 texts per API call", "Cache embeddings — re-embedding the same text is pure waste"],
    code: `const { data } = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: chunks,       // batch up to 2048
  dimensions: 1536,
});
const vectors = data.map(d => d.embedding);`,
  },

  // ── AGENT CORE ───────────────────────────────────────────────────────────
  {
    id: "llm-engine", pillar: "core", name: "LLM Engine", color: "var(--bl)", status: "live",
    what: "The foundation model powering all reasoning, language understanding, and generation. The LLM is the brain — all other components (KB, tools, memory) are its senses and hands.",
    why: "Model choice determines your ceiling. The best RAG with a weak LLM still produces weak answers. Pick the model that fits your latency, cost, and capability requirements for each task.",
    vs: [
      { concept: "Agent Skills", thisIs: "Reasons and generates — the intelligence layer", thatIs: "Acts on the world — extends what the LLM can do beyond its training" },
      { concept: "Fine-tuned Model", thisIs: "General-purpose reasoning, broad knowledge, flexible prompting", thatIs: "Narrowly specialized, cheaper to run on-task, less flexible off-task" },
    ],
    how: ["Benchmark on YOUR task type — generate 50 representative test cases first", "For agents: prefer strong tool-use models (Claude 3.5, GPT-4o, Gemini 2.0 Flash)", "For reasoning chains: use thinking models (o3, Gemini 2.5 Pro, DeepSeek R1)", "For high-volume: use small fast models (Gemini Flash, Haiku) for intermediate steps", "For cost: match model tier to task importance — don't use GPT-4o to classify intent"],
    code: `const MODELS = {
  fast_cheap:   "gemini-2.0-flash",       // $0.10/M tok, 1M ctx
  balanced:     "claude-3-5-sonnet",      // $3/M tok, best tool use
  reasoning:    "gemini-2.5-pro",         // $1.25/M tok, thinking mode
  open_source:  "llama-3.3-70b",          // Free on Groq, 128K ctx
  local:        "ollama/llama3.1:8b",     // Offline, private
};`,
  },
  {
    id: "system-prompt", pillar: "core", name: "System Prompt", color: "var(--bl)", status: "live",
    what: "The persistent instruction set that defines the agent's role, constraints, tone, output format, and capabilities. It's the job description that frames every conversation turn.",
    why: "The system prompt is the single highest-leverage engineering artifact. A well-crafted system prompt reduces hallucinations, improves tool use, and shapes consistent behavior — no model change needed.",
    vs: [
      { concept: "User Prompt",      thisIs: "Sets agent role and constraints — persistent across all conversation turns", thatIs: "The specific task or question for one turn" },
      { concept: "Few-shot Examples", thisIs: "Describes behavior in natural language — flexible, easy to iterate",         thatIs: "Shows correct examples — more reliable for edge cases, but costs more tokens" },
    ],
    how: ["Define role clearly: 'You are an anomaly detection expert...'", "Specify output format: 'Always respond as JSON: {finding, severity, recommendation}'", "Add hard constraints: 'Only use provided tools. Never fabricate data.'", "Include tool descriptions and when to use each", "Version-control your prompts — treat them as code, track changes"],
    code: `const SYSTEM = \`You are ARIA, an AI analytics agent.

Capabilities:
- Analyze time-series data for anomalies
- Search for domain context with web_search
- Run calculations with calculate

Rules:
- Reason before every tool call
- Cite confidence: High / Medium / Low
- If unsure, say so — never fabricate\`;`,
  },
  {
    id: "context-window", pillar: "core", name: "Context Window", color: "var(--bl)", status: "live",
    what: "The total tokens an LLM can process in one call — system prompt + conversation history + retrieved docs + tool results + output. Gemini 2.5 Pro: 1M tokens. GPT-4o: 128K. Claude: 200K.",
    why: "Context window size is the main practical constraint in agent design. It shapes how much history you keep, how many KB chunks you inject, and how complex your tool results can be.",
    vs: [
      { concept: "Working Memory",    thisIs: "Physical hardware limit — the maximum the model can process",         thatIs: "A design choice — what does the agent choose to track and prioritize?" },
      { concept: "Long-context LLM",  thisIs: "Still use RAG for precision — retrieval keeps context focused",      thatIs: "Stuff all docs in — simpler but loses focus past ~50K tokens ('lost in the middle')" },
    ],
    how: ["Measure average prompt size: system + history + context + tools", "Compress old turns: summarize rather than delete", "Implement sliding window: always-keep recent N turns + relevant KB chunks", "Alert when utilization exceeds 80% of context limit in production", "For 1M-ctx models: still use RAG — it improves precision, not just size"],
    code: `function compressHistory(messages: Message[], maxTokens = 4000) {
  const tokens = messages.reduce((sum, m) => sum + countTokens(m.content), 0);
  if (tokens < maxTokens) return messages;
  const summary = summarizeOldTurns(messages.slice(0, -4));
  return [...summary, ...messages.slice(-4)];
}`,
  },

  // ── AGENT SKILLS ─────────────────────────────────────────────────────────
  {
    id: "tool-use", pillar: "skills", name: "Tool Use", color: "var(--vi)", status: "live",
    what: "The LLM's ability to call external functions — search, calculate, query a DB, call an API — during generation. The model decides when and how based on its system prompt and context.",
    why: "Tool use is what separates an AI chatbot from an AI agent. Without tools, the LLM can only recall. With tools, it can act, retrieve real-time data, and change the world.",
    vs: [
      { concept: "Knowledge Base",    thisIs: "DO — dynamic actions with side effects: search, write file, call API", thatIs: "KNOW — passive lookup of stored documents, no side effects" },
      { concept: "Code Execution",    thisIs: "Predefined typed functions with JSON Schema — predictable, safe",       thatIs: "Arbitrary code the agent writes on the fly — flexible, needs sandboxing" },
    ],
    how: ["Define each tool with JSON Schema: name, description, parameter types", "Write clear descriptions — the LLM reads these to decide when to call each tool", "Handle errors gracefully: retry, fallback, or surface the error to the LLM", "Validate all tool inputs before execution — never trust LLM-generated args blindly", "Log all tool calls: what was called, with what args, what was returned"],
    code: `const tools = [{
  type: "function",
  function: {
    name: "web_search",
    description: "Search the web for current information. Use for real-time data.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  }
}];`,
  },
  {
    id: "working-memory", pillar: "skills", name: "Working Memory", color: "var(--vi)", status: "live",
    what: "What the agent actively holds in context during a task — current goal, steps taken, tool results, key findings. The agent's short-term memory for a single task execution.",
    why: "Without explicit working memory, agents drift. They forget what they've found, repeat tool calls, or lose the original goal. Structured memory keeps them coherent on long-horizon tasks.",
    vs: [
      { concept: "Knowledge Base",    thisIs: "Temporary — exists only during the current task, lost when done",       thatIs: "Persistent — survives across sessions, requires explicit retrieval" },
      { concept: "Context Window",    thisIs: "A design choice — what the agent tracks and prioritizes",               thatIs: "A hardware constraint — the physical maximum the model can process" },
    ],
    how: ["Design a working memory schema: { goal, steps_taken, key_findings, current_focus }", "Inject working memory at the start of each agent step as a JSON block", "Compress completed steps to summaries — free context for new work", "Use structured JSON objects, not prose — more reliable for the LLM to parse", "Implement memory writes as explicit tool calls for full auditability"],
    code: `interface WorkingMemory {
  goal: string;
  stepsTaken: { action: string; result: string }[];
  keyFindings: string[];
  currentFocus: string;
}

// Inject at each step:
const memoryBlock = \`Working memory: \${JSON.stringify(memory, null, 2)}\`;`,
  },
  {
    id: "planning", pillar: "skills", name: "Planning & Reasoning", color: "var(--vi)", status: "live",
    what: "The agent's ability to decompose a complex goal into ordered subtasks, anticipate dependencies, and adapt when new information changes the situation.",
    why: "Without a planning step, agents operate one move at a time and get lost. An upfront plan is a roadmap — it dramatically reduces wasted tool calls and improves completion on complex goals.",
    vs: [
      { concept: "ReAct (reactive)", thisIs: "Makes a plan first, then executes — better for known multi-step workflows",   thatIs: "Discovers the path step-by-step — better for exploratory, unpredictable tasks" },
      { concept: "Chain-of-Thought",  thisIs: "Separate planning pass stored in memory — persistent, updatable",             thatIs: "Implicit reasoning in a single prompt — not stored, not revisited" },
    ],
    how: ["Add an explicit planning step BEFORE execution: 'Given goal X, list the steps you'll take as JSON'", "Store the plan in working memory and update it as you learn", "For complex tasks: use a separate 'planner' LLM call before the 'executor' calls", "Include step dependencies: 'Step 3 requires output from Step 1'", "Track plan adherence vs. deviations as an evaluation signal"],
    code: `const plan = await llm.complete(\`
  Goal: \${goal}
  Tools: \${tools.map(t => t.name).join(", ")}
  Create a step-by-step plan as JSON:
  { steps: [{id, action, tool?, depends_on?}] }
\`);
for (const step of JSON.parse(plan).steps) {
  const result = await execute(step);
  memory.stepsTaken.push({ action: step.action, result });
}`,
  },
  {
    id: "self-reflection", pillar: "skills", name: "Self-Reflection", color: "var(--vi)", status: "live",
    what: "After generating an output, the agent evaluates its own work against the original goal — identifies gaps or errors — then rewrites. An automated quality loop within a single agent.",
    why: "First drafts from LLMs are good but rarely great. A single reflection pass catches ~40% of errors without human review. This is how agents approach human-level output quality.",
    vs: [
      { concept: "Supervisor Agent", thisIs: "Self-review within one agent — fast, one extra LLM call", thatIs: "External review by a separate agent — more objective, catches blind spots, needs A2A setup" },
      { concept: "RLHF / Fine-tuning", thisIs: "Runtime quality loop — works on any input without retraining", thatIs: "Training-time quality improvement — bakes quality into weights, needs labeled data" },
    ],
    how: ["Generate initial output", "Prompt same (or stronger) model: 'Critique the above against: [criteria]'", "Parse critique into specific actionable items", "Regenerate with critique as additional context", "Limit to 2-3 cycles — diminishing returns beyond that"],
    code: `async function withReflection(goal: string, draft: string) {
  const critique = await llm.complete(
    \`Goal: \${goal}\\nDraft: \${draft}\\nCritique: What's missing, wrong, or improvable?\`
  );
  return llm.complete(
    \`Goal: \${goal}\\nDraft: \${draft}\\nCritique: \${critique}\\nImproved version:\`
  );
}`,
  },

  // ── LIVE TOOLS ───────────────────────────────────────────────────────────
  {
    id: "google-search", pillar: "tools", name: "Web Search", color: "var(--cy)", status: "live",
    what: "Real-time web search returning current news, facts, and web content. Agents use this to answer questions about anything after their training cutoff — today's prices, latest releases, current events.",
    why: "Without search, an agent's knowledge is frozen in time. Search is the most universally valuable tool — 80% of real-world agent tasks benefit from current web data.",
    vs: [
      { concept: "RAG (vector search)", thisIs: "Searches the entire public web in real time — broad, current, unpredictable quality", thatIs: "Searches your curated private documents — precise, controlled, offline" },
    ],
    how: ["Get Brave Search API key — free tier: 2000 searches/month", "Define tool with: query, num_results, freshness params", "Parse results: title + URL + snippet — pick top 3-5", "For deep content: chain with a 'fetch URL' call after searching", "Cache repeated queries within a session — don't re-search the same thing twice"],
    code: `async function web_search(query: string) {
  const res = await fetch(
    \`https://api.search.brave.com/res/v1/web/search?q=\${encodeURIComponent(query)}&count=5\`,
    { headers: { "X-Subscription-Token": process.env.BRAVE_API_KEY } }
  );
  const data = await res.json();
  return data.web.results
    .map((r: any) => \`\${r.title}: \${r.description} [\${r.url}]\`)
    .join("\\n");
}`,
  },
  {
    id: "weather-api", pillar: "tools", name: "Weather API", color: "var(--cy)", status: "live",
    what: "Real-time and forecast weather data by location. A simple but illustrative example showing how any REST API becomes a first-class agent tool — the pattern applies to finance, health, logistics, IoT.",
    why: "Weather is the 'hello world' of tool integration. Mastering how to wrap, describe, and parse a weather API teaches you to connect any external service to an agent.",
    vs: [],
    how: ["Use Open-Meteo (free, no key required) or OpenWeatherMap (free tier)", "Define tool params: location (string), days (1-7), units (metric/imperial)", "Return structured summary: temperature, humidity, conditions, wind", "Handle errors: location not found, API rate limit, network failure", "This exact pattern applies to any REST API: finance, health, logistics"],
    code: `async function get_weather(location: string) {
  // Open-Meteo: free, no API key
  const geo = await fetch(
    \`https://geocoding-api.open-meteo.com/v1/search?name=\${encodeURIComponent(location)}\`
  ).then(r => r.json());
  const { latitude, longitude } = geo.results[0];
  const wx = await fetch(
    \`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current_weather=true\`
  ).then(r => r.json());
  return \`\${location}: \${wx.current_weather.temperature}°C, wind \${wx.current_weather.windspeed} km/h\`;
}`,
  },
  {
    id: "anomaly-detection", pillar: "tools", name: "Anomaly Detection", color: "var(--cy)", status: "live", isNew: true,
    what: "A tool that analyzes time-series or tabular data to find outliers using z-score, IQR, or isolation forest. The agent calls this to surface unusual patterns, then interprets them in natural language.",
    why: "Anomaly detection is one of the highest-ROI AI applications: fraud, infrastructure monitoring, quality control, cybersecurity. An agent with this tool proactively finds problems before users do.",
    vs: [
      { concept: "Rule-based Alerts", thisIs: "Adaptive — learns data distribution, catches novel anomalies, explains in context", thatIs: "Static thresholds — fast and transparent, but misses novel patterns and generates false positives" },
    ],
    how: ["Implement z-score baseline: |value - mean| / std > 3 = anomaly", "Use rolling window (last N points) as the baseline — adapts to trends", "Format output for LLM: 'Anomaly at t=X: value=Y, expected=Z, z-score=3.8'", "Let the LLM interpret and explain the anomaly to the user", "Severity levels: z > 5 = HIGH, z > 3 = MEDIUM — always include recommended action"],
    code: `function detect_anomalies(data: number[], windowSize = 20) {
  return data.flatMap((val, i) => {
    if (i < windowSize) return [];
    const w = data.slice(i - windowSize, i);
    const mean = w.reduce((a, b) => a + b) / windowSize;
    const std = Math.sqrt(w.map(x => (x-mean)**2).reduce((a,b)=>a+b) / windowSize);
    const z = Math.abs((val - mean) / std);
    return z > 3 ? [{ index: i, value: val, zScore: z, severity: z > 5 ? "HIGH" : "MEDIUM" }] : [];
  });
}`,
  },
  {
    id: "code-executor", pillar: "tools", name: "Code Executor", color: "var(--cy)", status: "live",
    what: "A sandboxed runtime letting the agent write and execute Python or JavaScript — for data analysis, math, file manipulation, or any computation that is easier in code than in a prompt.",
    why: "Some problems are intractable in natural language but trivial in 3 lines of code. A code executor turns your LLM into a data scientist and programmer on demand.",
    vs: [
      { concept: "Predefined Tool Functions", thisIs: "Arbitrary code — unlimited flexibility, generates its own logic on the fly", thatIs: "Predefined schemas — predictable and safe, but limited to what you pre-built" },
    ],
    how: ["Use E2B or Modal for production-grade sandboxed execution", "Pass data as JSON in, get results back as JSON out", "Time-limit all executions: 30 seconds max to prevent runaway", "Capture stdout, stderr, and exceptions separately", "Never exec on your host machine — always sandbox. Code injection is a real threat."],
    code: `import { Sandbox } from "@e2b/code-interpreter";
const sb = await Sandbox.create();
const { text, results, error } = await sb.runCode(\`
import pandas as pd, json
df = pd.DataFrame(json.loads(data_json))
print(df.describe().to_json())
\`);
await sb.kill();`,
  },

  // ── ORCHESTRATION ────────────────────────────────────────────────────────
  {
    id: "react-loop", pillar: "orchestration", name: "ReAct Loop", color: "var(--or)", status: "live",
    what: "The fundamental agentic control loop: Thought → Action (tool call) → Observation → Thought → repeat until Final Answer. The model reasons about what to do, acts, observes, and repeats.",
    why: "ReAct is the battle-tested foundation for 90% of production agents. Its explicit reasoning trace is debuggable, and its iterative nature handles uncertainty that single-pass generation cannot.",
    vs: [
      { concept: "Plan-and-Execute", thisIs: "Reactive — discovers path step by step, adapts to surprises in real time",      thatIs: "Upfront plan then execute — more efficient for known multi-step workflows" },
      { concept: "CoT (prompt only)", thisIs: "Can call external tools — grounded in real retrieved data",                   thatIs: "Pure in-prompt reasoning — only uses trained knowledge, no real-world grounding" },
    ],
    how: ["Prompt: 'Use tools. Format: Thought: ... Action: tool_name({args}) Observation: ...'", "Parse model output to extract tool name and args", "Execute tool, format result as Observation, append to history", "Feed history back into next turn — repeat", "Stop when: Final Answer tag, max steps reached, or explicit done signal"],
    code: `while (step < MAX_STEPS) {
  const output = await llm.complete(buildPrompt(goal, history));
  if (output.includes("Final Answer:")) return extractAnswer(output);
  const { tool, args } = parseAction(output);
  const result = await tools[tool](args);
  history.push({ thought: output, observation: result });
  step++;
}`,
  },
  {
    id: "langgraph", pillar: "orchestration", name: "LangGraph", color: "var(--or)", status: "live", isNew: true,
    what: "A framework modeling agent workflows as a directed graph: nodes (agent steps) and edges (routing logic). Supports cycles, conditional branching, checkpointing, and parallel execution.",
    why: "LangGraph handles complexity that ad-hoc loops cannot — retries, human-in-the-loop, parallel branches, stateful persistence. It is the production standard for complex agentic systems.",
    vs: [
      { concept: "Simple while loop", thisIs: "Stateful graph — explicit nodes, conditional routing, persistence, parallelism", thatIs: "Simple iteration — works for linear chains, brittle for complex branching workflows" },
    ],
    how: ["Define state as TypedDict with all fields the workflow needs", "Create nodes: pure functions (state) → state updates", "Add conditional edges: routing logic based on state values", "Compile and invoke: graph.compile().invoke(initialState)", "Add MemorySaver checkpointer for human-in-the-loop workflows"],
    code: `const graph = new StateGraph({ channels: { messages, isDone } })
  .addNode("research", researchAgent)
  .addNode("analyze",  analyzeAgent)
  .addConditionalEdges("analyze",
    (state) => state.isDone ? END : "research"
  )
  .addEdge("research", "analyze")
  .setEntryPoint("research");

const result = await graph.compile().invoke({ messages: [goal] });`,
  },
  {
    id: "routing", pillar: "orchestration", name: "Intent Routing", color: "var(--or)", status: "live",
    what: "A classifier (LLM call or embedding similarity) that reads user input and routes it to the right agent, tool, or workflow — so each request reaches the specialist best suited for it.",
    why: "One agent trying to handle all request types gets mediocre at all of them. A router separates concerns and lets each specialist stay focused.",
    vs: [],
    how: ["LLM router: fast prompt that classifies intent into N categories (most flexible)", "Embedding classifier: cosine similarity against labeled examples per category (more scalable)", "Return: { intent, confidence, agent_id } — route below 0.7 confidence to a fallback handler", "Track routing accuracy in production — misroutes are silent quality failures"],
    code: `async function route(query: string) {
  const result = await llm.complete(\`
    Classify into one of: [anomaly_detection, data_analysis, web_research, general]
    Query: "\${query}"
    Return JSON: { intent: string, confidence: number }
  \`);
  return JSON.parse(result);
}`,
  },

  // ── A2A FRAMEWORK ────────────────────────────────────────────────────────
  {
    id: "supervisor-agent", pillar: "a2a_fw", name: "Supervisor Agent", color: "var(--am)", status: "live",
    what: "An agent that validates, critiques, and approves outputs from worker agents before they are returned. The Supervisor focuses on QUALITY CONTROL — not task delegation.",
    why: "Worker agents optimize for task completion. Supervisors optimize for correctness. A Supervisor catches hallucinations, off-topic responses, and safety violations that workers overlook.",
    vs: [
      { concept: "Orchestrator Agent", thisIs: "Validates quality AFTER task completion — 'Is this answer correct and safe?'",   thatIs: "Delegates and coordinates DURING execution — 'Which agent should do what next?'" },
      { concept: "Coordinator Agent",  thisIs: "Focused on output quality — the final quality gate",                            thatIs: "Manages execution flow, dependencies, and sequencing of work" },
    ],
    how: ["Define clear acceptance criteria for the Supervisor's evaluation rubric", "Give Supervisor access to the original goal so it can check alignment", "Structured output: { approved: bool, score: number, issues: string[], revision: string }", "Limit to 1-2 revision cycles — prevents infinite loops", "Log all rejections: they are valuable training data"],
    code: `const supervise = async (goal: string, output: string) => {
  return llm.complete(\`
    Goal: \${goal}
    Worker output: \${output}

    Evaluate on: accuracy, completeness, safety, on-topic.
    Return JSON: { approved: boolean, score: 1-5, issues: string[], suggestion: string }
  \`, { model: "claude-3-5-sonnet" });  // Use strongest model as judge
};`,
  },
  {
    id: "research-agent", pillar: "a2a_fw", name: "Research Agent", color: "var(--am)", status: "live",
    what: "A specialist agent equipped with web search, RAG retrieval, and summarization tools — focused exclusively on finding, extracting, and synthesizing information from multiple sources.",
    why: "Information gathering is a distinct skill from analysis or writing. A dedicated Research Agent is deeper and faster than a general agent trying to research and analyze simultaneously.",
    vs: [
      { concept: "General Agent", thisIs: "Deep research specialization — multi-source validation, citation tracking, exhaustive search", thatIs: "Balanced but shallow — does everything adequately but research is not optimized" },
    ],
    how: ["Equip with: web_search, rag_retrieve, fetch_url, summarize tools only", "System prompt: 'Always cite sources. Cross-check facts across 2+ sources. Output structured findings.'", "Output schema: { findings: string[], sources: URL[], confidence: 'high'|'medium'|'low' }", "Set a research budget: max N tool calls, time limit", "Pass findings to Analysis Agent — don't output directly to end user"],
    code: `const researchAgent = new Agent({
  model: "gemini-2.0-flash",  // Fast + cheap for search iteration
  system: "Research specialist. Always cite sources. Cross-check 2+ sources.",
  tools: [web_search, rag_retrieve, fetch_url, summarize],
  maxSteps: 8,
  outputSchema: { findings: "string[]", sources: "string[]", confidence: "string" }
});`,
  },
  {
    id: "anomaly-agent", pillar: "a2a_fw", name: "Anomaly Expert Agent", color: "var(--am)", status: "live", isNew: true,
    what: "A domain-specialist agent with anomaly detection, statistical analysis, and search tools — it finds unusual patterns in data, looks up context, and explains findings in plain language.",
    why: "Anomaly detection requires both statistical rigor and contextual interpretation. A dedicated expert agent does analysis + explanation + root cause hypothesis in one step.",
    vs: [
      { concept: "Rule-based Alert System", thisIs: "Adaptive — learns data patterns, explains anomalies, suggests root causes", thatIs: "Static thresholds — fast and simple, generates false positives, can't explain" },
    ],
    how: ["Equip with: detect_anomalies, calculate, web_search, statistical_summary", "System prompt: 'You are an anomaly detection expert. For each anomaly: severity, root cause hypothesis, recommended action.'", "Output always includes: severity (HIGH/MEDIUM/LOW), explanation, and next action", "Route to human for HIGH severity anomalies", "Feed anomaly history into future sessions for trend detection"],
    code: `const anomalyAgent = new Agent({
  model: "llama-3.3-70b",  // Strong reasoning, fast inference
  system: \`Anomaly detection expert.
For each anomaly found:
1. Classify severity: HIGH / MEDIUM / LOW
2. Hypothesize root cause
3. Recommend immediate action\`,
  tools: [detect_anomalies, calculate, web_search],
});`,
  },
  {
    id: "coordinator", pillar: "a2a_fw", name: "Coordinator Agent", color: "var(--am)", status: "live",
    what: "The conductor of a multi-agent system — receives a goal, creates an execution plan, assigns tasks to specialist agents, tracks progress, and aggregates results into a final output.",
    why: "Coordination is a distinct cognitive task from execution. A dedicated coordinator keeps the big picture while specialists stay deep — this is exactly how human expert teams work.",
    vs: [
      { concept: "Supervisor Agent", thisIs: "Plans and delegates work — active during execution",                                 thatIs: "Validates quality — active after work is done" },
      { concept: "LangGraph",        thisIs: "An agent that reasons about coordination in natural language — flexible",           thatIs: "A code-level graph that defines coordination rules explicitly — more predictable" },
    ],
    how: ["Coordinator receives goal → generates execution plan with agent assignments", "Manage sequential vs parallel: research can run parallel, writing needs research first", "Pass context between agents: research output → analyst input → writer input", "Handle failures: if Research Agent fails, retry or route to fallback", "Final step: synthesize all outputs into one coherent report"],
    code: `const coordinator = new Agent({
  model: "gemini-2.5-pro",  // Most capable for complex coordination
  system: \`You are a task coordinator.
Given a goal: create a plan, delegate to specialists, aggregate results.
Available agents: research_agent, anomaly_agent, general_agent\`,
  tools: [delegate_to_research, delegate_to_anomaly, aggregate_results],
});`,
  },

  // ── EVALUATION ───────────────────────────────────────────────────────────
  {
    id: "ragas", pillar: "evaluate", name: "RAGAS Metrics", color: "var(--ro)", status: "live",
    what: "A framework evaluating RAG systems on 4 axes: Faithfulness (does the answer stay within the retrieved context?), Answer Relevancy (does it answer the question?), Context Precision (were retrieved docs relevant?), Context Recall (were all relevant docs retrieved?).",
    why: "RAG can look accurate but fail silently on faithfulness (hallucinating beyond context) or context precision (retrieving irrelevant documents). RAGAS catches all four failure modes simultaneously.",
    vs: [],
    how: ["Build evaluation dataset: 50-100 question/answer/context triplets from your domain", "Run: ragas.evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision])", "Target: faithfulness > 0.85, answer_relevancy > 0.80, context_precision > 0.75", "Re-run on every RAG configuration change", "Use LLM-as-judge for scalable evaluation without expensive human annotation"],
    code: `from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

results = evaluate(
  dataset=dataset,  # question, contexts, answer, ground_truth
  metrics=[faithfulness, answer_relevancy, context_precision]
)
# { faithfulness: 0.87, answer_relevancy: 0.82, context_precision: 0.79 }`,
  },
  {
    id: "llm-judge", pillar: "evaluate", name: "LLM-as-Judge", color: "var(--ro)", status: "live",
    what: "Use a strong model (GPT-4o, Claude 3.5) to evaluate outputs from your production agent — scoring accuracy, helpfulness, safety, and format adherence at scale without human annotation.",
    why: "Human evaluation does not scale. LLM-as-judge gives 80-90% of the signal at 1% of the cost. It is how you continuously evaluate agents in production without hiring annotation teams.",
    vs: [
      { concept: "Human Evaluation", thisIs: "Scalable, cheap, fast — run on every deployment",                     thatIs: "Ground truth, nuanced, catches subtle errors — run for final release and calibration" },
      { concept: "Unit Tests",        thisIs: "Semantic, fuzzy quality assessment — good for language quality",     thatIs: "Exact string matching — good for format and factual checks, brittle for language" },
    ],
    how: ["Define evaluation rubric: 5-point scale for accuracy, helpfulness, safety, format", "Use strongest available judge — Claude 3.5 Sonnet or GPT-4o", "Add chain-of-thought to the judge: 'Explain your rating before giving the score'", "Calibrate judge vs human ratings on 100 samples to quantify agreement", "Automate: run evals on every PR merge as a CI gate"],
    code: `async function judgeOutput(question: string, answer: string) {
  return llm.complete(\`
    Question: \${question}
    Answer: \${answer}
    Rate 1-5: { accuracy, helpfulness, safety, format }
    Explain each, then return JSON scores.
  \`, { model: "claude-3-5-sonnet" });
}`,
  },
  {
    id: "prompt-eval", pillar: "evaluate", name: "Prompt Engineering", color: "var(--ro)", status: "live",
    what: "The systematic practice of designing, testing, and iterating prompts to improve outputs — system prompts, few-shot examples, chain-of-thought, output format instructions.",
    why: "Prompt engineering is the fastest, cheapest quality lever. A 2-hour prompt rewrite often outperforms a $50K fine-tuning run. Always exhaust prompt engineering before fine-tuning.",
    vs: [
      { concept: "Fine-tuning",  thisIs: "Free, instant, iterates in minutes — always try first",                        thatIs: "Expensive, slow (hours), needed only when prompt engineering hits its ceiling" },
      { concept: "RAG context",  thisIs: "Shapes HOW the model reasons and formats its response",                         thatIs: "Shapes WHAT facts the model has access to" },
    ],
    how: ["Start with the ideal output: what does perfect look like?", "Add format instructions: 'Return JSON with fields: x, y, z'", "Add few-shot examples for complex or ambiguous tasks", "Add chain-of-thought: 'Think step by step before answering'", "A/B test variants on 50+ samples with LLM-as-judge for objective comparison"],
    code: `const variants = {
  v1: "Answer the question:",
  v2: "Answer using only provided context. Say 'I don't know' if unsure:",
  v3: "You are an expert. Think step by step, then answer as JSON:",
};

for (const [v, prompt] of Object.entries(variants)) {
  const scores = await evalOnTestset(prompt, testCases);
  console.log(v, scores);  // Pick highest scorer
}`,
  },

  // ── PRODUCTION ───────────────────────────────────────────────────────────
  {
    id: "api-gateway", pillar: "production", name: "API Gateway", color: "#94a3b8", status: "live",
    what: "Entry point for your AI application — handles auth, rate limiting, request routing, caching, and observability for all agent API calls.",
    why: "Production AI without an API gateway is an incident waiting to happen. No rate limits = cost explosion. No auth = public access. No logging = blind when things break.",
    vs: [],
    how: ["Auth: API keys or JWT — every request authenticated", "Rate limits: per-user and global — protect against abuse and cost overruns", "Caching: cache identical prompt+response pairs — 30-50% cost reduction typical", "Logging: every request with latency, token count, model, and user id", "Streaming: handle SSE properly — don't buffer stream responses"],
    code: `export async function POST(req: Request) {
  const key = req.headers.get("X-API-Key");
  if (!key || !isValid(key)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const remaining = await rateLimit(key, { limit: 100, window: "1h" });
  if (remaining <= 0) return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  const cached = await cache.get(hashRequest(req));
  if (cached) return Response.json(cached);
  // ... process
}`,
  },
  {
    id: "monitoring", pillar: "production", name: "Monitoring", color: "#94a3b8", status: "live",
    what: "Instrumentation that tracks every aspect of your AI system in production: latency, token usage, cost per request, error rates, tool call patterns, and output quality over time.",
    why: "AI systems degrade silently. A RAG pipeline that worked in staging may return poor context in production without any error. Observability is how you catch this before users complain.",
    vs: [],
    how: ["Instrument every LLM call: model, tokens in/out, latency, cost, tool calls made", "Use Langfuse, LangSmith, or Helicone for AI-specific tracing", "Alert on: p95 latency > 5s, error rate > 1%, cost/request spike > 3×", "Log user feedback (thumbs up/down) linked to request traces", "Build weekly dashboard: cost trend, quality trend, most-called tools"],
    code: `import { Langfuse } from "langfuse";
const lf = new Langfuse();
const trace = lf.trace({ name: "agent-run", userId, input: { goal } });
const span = trace.span({ name: "llm-call", input: { model, prompt } });
const response = await llm.complete(prompt);
span.end({ output: response, usage: { input: inputTok, output: outputTok } });`,
  },
  {
    id: "fine-tuning", pillar: "production", name: "Fine-tuning", color: "#94a3b8", status: "live",
    what: "A training process that adapts a base LLM's weights to a specific task, domain, or output style using your labeled data. Fine-tuned models are faster, cheaper, and more consistent on their target task.",
    why: "Prompt engineering hits a ceiling on specialized tasks. Fine-tuning bakes the task into the model — improving accuracy 20-40% on domain-specific work while reducing inference cost via a smaller model.",
    vs: [
      { concept: "RAG",               thisIs: "Improves model behavior and consistency — great for output format and tone",          thatIs: "Adds dynamic knowledge at runtime — great for updatable facts and private documents" },
      { concept: "Prompt Engineering", thisIs: "Requires 200+ labeled examples, GPU time, days to iterate",                         thatIs: "No labeled data, free, iterates in minutes — always try this first" },
    ],
    how: ["Collect 200-1000 high-quality input/output pairs from your domain", "Format as JSONL: { messages: [{role, content}] } per line", "Fine-tune via OpenAI API, Anthropic, or LoRA on Hugging Face", "Evaluate fine-tuned vs base model on held-out test set (20% split)", "Use fine-tuned model for high-frequency tasks to reduce per-call cost"],
    code: `const file = await openai.files.create({
  file: fs.createReadStream("training.jsonl"),
  purpose: "fine-tune"
});
const job = await openai.fineTuning.jobs.create({
  training_file: file.id,
  model: "gpt-4o-mini"   // Fine-tune small, fast, cheap model
});
// Poll job.status → "succeeded" → use job.fine_tuned_model`,
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// UPDATES FEED
// ═══════════════════════════════════════════════════════════════════════════

const UPDATES: Update[] = [
  { id:"u1", date:"May 2025",  type:"model",     isNew:true,  title:"Gemini 2.5 Pro GA",           desc:"Google's flagship thinking model now production-ready. 1M context, strong multi-step reasoning." },
  { id:"u2", date:"May 2025",  type:"model",     isNew:true,  title:"Claude 4 Sonnet",              desc:"Anthropic's new Sonnet — improved tool use, 200K context. Best choice for production agents." },
  { id:"u3", date:"Apr 2025",  type:"model",     isNew:true,  title:"Llama 4 Scout / Maverick",    desc:"Meta's open multimodal models. Scout: 10M token context — longest in any open model." },
  { id:"u4", date:"Apr 2025",  type:"framework", isNew:true,  title:"Google A2A Protocol",          desc:"Open standard for agent-to-agent communication. Framework-agnostic. Start testing now." },
  { id:"u5", date:"Mar 2025",  type:"tool",      isNew:false, title:"MCP Is Now the Industry Standard", desc:"Anthropic's Model Context Protocol adopted by OpenAI, Google, and major platforms." },
  { id:"u6", date:"Mar 2025",  type:"framework", isNew:false, title:"LangGraph 0.3 Released",       desc:"Streaming, parallel branches, human-in-the-loop checkpointing. Upgrade if you're using it." },
  { id:"u7", date:"Feb 2025",  type:"model",     isNew:false, title:"DeepSeek R1",                  desc:"Open-source model matching GPT-4 on reasoning. Free via Groq API." },
  { id:"s1", date:"",          type:"suggestion",             title:"Add Perplexity Search",        desc:"Real-time search with inline citations. Cuts hallucination in research tasks by anchoring to sources." },
  { id:"s2", date:"",          type:"suggestion",             title:"Add E2B Code Interpreter",     desc:"Sandboxed Python execution as a tool. Unlocks data analysis and complex math for your agents." },
  { id:"s3", date:"",          type:"suggestion",             title:"Add Cohere Reranker",           desc:"Post-retrieval reranking cuts irrelevant chunks. Often improves RAG faithfulness 15-20%." },
  { id:"s4", date:"",          type:"suggestion",             title:"Set Up RAGAS Evaluation",      desc:"You have RAG — now measure it. Automated RAGAS evals catch quality regressions before users do." },
  { id:"s5", date:"",          type:"suggestion",             title:"Add Langfuse Observability",   desc:"One SDK line for full LLM tracing and cost tracking. Essential before going to production." },
];

// ═══════════════════════════════════════════════════════════════════════════
// CHAT MODELS
// ═══════════════════════════════════════════════════════════════════════════

interface Message { id: string; role: "user"|"assistant"; content: string; model?: string; }

const CHAT_MODELS = [
  { id: "gemini-2.0-flash",        label: "Gemini 2.0 Flash",  hex: "#60a5fa", provider: "Google"    },
  { id: "gemini-2.0-flash-lite",   label: "Gemini Flash Lite", hex: "#22d3ee", provider: "Google"    },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B",     hex: "#a78bfa", provider: "Groq"      },
  { id: "mistral-saba-24b",        label: "Mistral Saba 24B",  hex: "#fb923c", provider: "Groq"      },
  { id: "gemma2-9b-it",            label: "Gemma 2 9B",        hex: "#34d399", provider: "Groq"      },
  { id: "qwen-qwq-32b",            label: "Qwen QwQ 32B",      hex: "#fbbf24", provider: "Groq"      },
];

const CHAT_STARTERS = [
  "Explain RAG vs fine-tuning — when do I use each?",
  "Write a minimal ReAct agent in TypeScript",
  "What's the difference between a Knowledge Base and Agent Skills?",
  "How do I evaluate my RAG pipeline with RAGAS?",
  "Compare Gemini 2.5 Pro vs Claude 3.7 Sonnet for production agents",
];

function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(CHAT_MODELS[0].id);
  const [system, setSystem] = useState("You are AXIOM — an expert AI engineering mentor. Be precise, technical, and teach through real examples.");
  const [showSys, setShowSys] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState<string|null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    const asstId = crypto.randomUUID();
    setMessages(m => [...m, userMsg, { id: asstId, role: "assistant", content: "", model }]);
    setInput("");
    setStreaming(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          model, systemPrompt: system,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let full = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n"))
          if (line.startsWith("0:")) try { full += JSON.parse(line.slice(2)); } catch { /* skip */ }
        setMessages(m => m.map(msg => msg.id === asstId ? { ...msg, content: full } : msg));
      }
    } catch (err) {
      setMessages(m => m.map(msg => msg.id === asstId ? { ...msg, content: `Error: ${err}` } : msg));
    } finally { setStreaming(false); }
  };

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const sel = CHAT_MODELS.find(m => m.id === model)!;

  return (
    <div className="chat-wrap">
      <div className="chat-toolbar">
        <div className="model-select-wrap">
          <div className="mdot" style={{ background: sel.hex }} />
          <select className="model-select" value={model} onChange={e => setModel(e.target.value)}>
            {CHAT_MODELS.map(m => <option key={m.id} value={m.id}>{m.label} ({m.provider})</option>)}
          </select>
          <ChevronDown size={11} className="select-arr" />
        </div>
        <button className="chat-cfg-btn" onClick={() => setShowSys(s => !s)}>System prompt</button>
        <button className="chat-cfg-btn" onClick={() => setMessages([])} disabled={!messages.length}>Clear</button>
      </div>

      {showSys && (
        <div className="sys-bar">
          <textarea className="sys-input" value={system} onChange={e => setSystem(e.target.value)} rows={2} />
        </div>
      )}

      <div className="messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <Bot size={28} style={{ color: "#60a5fa", opacity: 0.45 }} />
            <p className="chat-empty-title">AI Engineering Mentor</p>
            <p className="chat-empty-sub">{CHAT_MODELS.length} models · streaming · system prompt control</p>
            <div className="starters">
              {CHAT_STARTERS.map(q => (
                <button key={q} className="starter-btn" onClick={() => { setInput(q); inputRef.current?.focus(); }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`msg msg-${msg.role}`}>
            <div className="msg-av">
              {msg.role === "user" ? <User size={11} /> : <Bot size={11} />}
            </div>
            <div className="msg-bdy">
              {msg.role === "assistant" && msg.model && (
                <div className="msg-model" style={{ color: CHAT_MODELS.find(m => m.id === msg.model)?.hex }}>
                  {CHAT_MODELS.find(m => m.id === msg.model)?.label}
                </div>
              )}
              <div className="msg-txt">
                {msg.content || (msg.role === "assistant" && streaming ? <span className="caret">▋</span> : "")}
              </div>
              {msg.content && msg.role === "assistant" && (
                <button className="copy-msg" onClick={() => copy(msg.id, msg.content)}>
                  {copied === msg.id ? <Check size={10} /> : <Copy size={10} />}
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea ref={inputRef} className="chat-input" rows={1}
          placeholder="Ask anything about AI engineering…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
        <button className="chat-send" onClick={() => send()} disabled={!input.trim() || streaming}>
          {streaming ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT MODELS (for sandbox)
// ═══════════════════════════════════════════════════════════════════════════

const SANDBOX_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B",   color: "var(--vi)" },
  { id: "mistral-saba-24b",        label: "Mistral Saba 24B", color: "var(--or)" },
];

// ═══════════════════════════════════════════════════════════════════════════
// BLOCK DETAIL PANEL
// ═══════════════════════════════════════════════════════════════════════════

function BlockDetail({ block, onPractice }: { block: Block | null; onPractice?: (goal: string) => void }) {
  const [detailTab, setDetailTab] = useState<"what"|"diff"|"how"|"code">("what");

  if (!block) return (
    <div className="detail-empty">
      <Layers size={28} style={{ color: "var(--mu)", opacity: 0.5 }} />
      <p style={{ fontWeight: 700, color: "var(--tx)", marginTop: 8 }}>Select any block</p>
      <p style={{ color: "var(--mu)", fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>
        Click a lego piece in the blueprint to see what it is, how it compares to similar concepts, and how to build it.
      </p>
    </div>
  );

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div className="detail-dot" style={{ background: block.color }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="detail-name">{block.name}</span>
            {block.isNew && <span className="badge-new">NEW</span>}
            <span className={`badge-status ${block.status}`}>{block.status}</span>
          </div>
          <div style={{ fontSize: 10, color: "var(--mu)", marginTop: 2 }}>
            {PILLARS.find(p => p.id === block.pillar)?.label}
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        {(["what","diff","how","code"] as const).map(t => (
          <button key={t} className={`dtab ${detailTab === t ? "active" : ""}`} onClick={() => setDetailTab(t)}>
            {t === "what" ? "WHAT" : t === "diff" ? "vs OTHERS" : t === "how" ? "HOW" : "CODE"}
          </button>
        ))}
      </div>
      {onPractice && (
        <button className="practice-btn" style={{ borderColor: block.color, color: block.color }}
          onClick={() => onPractice(`Help me build and understand: ${block.name}. ${block.what.slice(0,120)}`)}>
          <Zap size={11} /> Practice in Sandbox
        </button>
      )}

      <div className="detail-body">
        {detailTab === "what" && (
          <div>
            <p className="detail-text">{block.what}</p>
            <div style={{ marginTop: 14 }}>
              <div className="detail-section-label">WHY IT MATTERS</div>
              <p className="detail-text">{block.why}</p>
            </div>
          </div>
        )}

        {detailTab === "diff" && (
          block.vs.length === 0
            ? <p className="detail-text" style={{ color: "var(--mu)", fontStyle: "italic" }}>No direct comparisons for this concept. Select HOW to see implementation steps.</p>
            : block.vs.map((v, i) => (
              <div key={i} className="vs-card">
                <div className="vs-title">{block.name} vs {v.concept}</div>
                <div className="vs-grid">
                  <div className="vs-col">
                    <div className="vs-col-label" style={{ color: block.color }}>This ({block.name})</div>
                    <p className="vs-text">{v.thisIs}</p>
                  </div>
                  <div className="vs-divider" />
                  <div className="vs-col">
                    <div className="vs-col-label" style={{ color: "var(--mu)" }}>That ({v.concept})</div>
                    <p className="vs-text">{v.thatIs}</p>
                  </div>
                </div>
              </div>
            ))
        )}

        {detailTab === "how" && (
          <ol className="how-list">
            {block.how.map((step, i) => (
              <li key={i} className="how-item">
                <span className="how-num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}

        {detailTab === "code" && (
          block.code
            ? <pre className="code-block">{block.code}</pre>
            : <p className="detail-text" style={{ color: "var(--mu)", fontStyle: "italic" }}>No code snippet for this concept.</p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BLUEPRINT TAB
// ═══════════════════════════════════════════════════════════════════════════

function BlueprintTab({ selectedBlock, onSelect, onPractice }: {
  selectedBlock: Block | null;
  onSelect: (b: Block) => void;
  onPractice: (goal: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase().trim();
  const matchBlock = (b: Block) =>
    !q || b.name.toLowerCase().includes(q) || b.pillar.includes(q) ||
    b.what.toLowerCase().includes(q) || b.how.some(h => h.toLowerCase().includes(q));

  return (
    <div className="blueprint-layout">
      <div className="blueprint-canvas">
        {/* Search bar */}
        <div className="bp-search-row">
          <div className="bp-search">
            <Search size={12} style={{ color: "var(--mu)", flexShrink: 0 }} />
            <input className="bp-search-input" placeholder="Search any concept — RAG, anomaly, A2A, embeddings…"
              value={query} onChange={e => setQuery(e.target.value)} />
            {query && <button className="bp-clear" onClick={() => setQuery("")}>×</button>}
          </div>
          <span className="bp-count">{BLOCKS.filter(matchBlock).length} blocks</span>
        </div>

        {PILLARS.map(pillar => {
          const blocks = BLOCKS.filter(b => b.pillar === pillar.id && matchBlock(b));
          if (!blocks.length) return null;
          return (
            <div key={pillar.id} className="pillar-row">
              <div className="pillar-label" style={{ color: pillar.color }}>
                {pillar.icon}
                <span>{pillar.label}</span>
                <span className="pillar-count">{blocks.length}</span>
              </div>
              <div className="blocks-row">
                {blocks.map(block => (
                  <button key={block.id}
                    className={`lego-block ${selectedBlock?.id === block.id ? "selected" : ""}`}
                    style={{ "--block-color": block.color } as React.CSSProperties}
                    onClick={() => onSelect(block)}
                    title={block.what.slice(0, 120) + "…"}
                  >
                    <div className="lego-top" />
                    <div className="lego-face">
                      <div className="lego-name-row">
                        <span className="lego-name">{block.name}</span>
                        {block.isNew && <span className="badge-new" style={{ fontSize: 7 }}>NEW</span>}
                      </div>
                      {block.status === "beta" && <span style={{ fontSize: 9, color: "var(--am)" }}>β beta</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {BLOCKS.filter(matchBlock).length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--mu)", fontSize: 13 }}>
            No blocks match "{query}"
          </div>
        )}
        <div className="blueprint-footer">
          Click any block to learn it · See how it compares · Practice it in Sandbox
        </div>
      </div>
      <div className="detail-sidebar">
        <BlockDetail block={selectedBlock} onPractice={onPractice} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SANDBOX TAB — live agent with real tools
// ═══════════════════════════════════════════════════════════════════════════

const SANDBOX_TOOLS = [
  { id: "web_search",        name: "Web Search",     hex: "#60a5fa", icon: <Search size={11} /> },
  { id: "calculate",         name: "Calculator",     hex: "#22d3ee", icon: <Code2 size={11} /> },
  { id: "anomaly_detection", name: "Anomaly Detect", hex: "#fbbf24", icon: <Activity size={11} /> },
  { id: "weather",           name: "Weather",        hex: "#34d399", icon: <CloudSun size={11} /> },
  { id: "summarize_url",     name: "Summarize URL",  hex: "#a78bfa", icon: <FileText size={11} /> },
  { id: "analyze_data",      name: "Analyze Data",   hex: "#fb923c", icon: <BarChart2 size={11} /> },
];

function SandboxTab({ initialGoal }: { initialGoal?: string }) {
  const [goal, setGoal] = useState(initialGoal ?? "");
  useEffect(() => { if (initialGoal) setGoal(initialGoal); }, [initialGoal]);
  const [model, setModel] = useState(SANDBOX_MODELS[0].id);
  const [activeTools, setActiveTools] = useState<string[]>(["web_search", "calculate"]);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [running, setRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [steps]);

  const toggleTool = (id: string) => setActiveTools(prev =>
    prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
  );

  const run = async () => {
    if (!goal.trim() || running) return;
    setSteps([]); setRunning(true);
    const toolsDesc = activeTools.join(", ");
    const enhancedGoal = `[Active tools: ${toolsDesc}] ${goal}`;
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: enhancedGoal, model }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as AgentStep;
              setSteps(s => [...s, data]);
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setSteps(s => [...s, { type: "error", message: String(err) }]);
    } finally { setRunning(false); }
  };

  const STEP_ICONS: Record<string, React.ReactNode> = {
    thought:      <Brain size={12} style={{ color: "var(--bl)" }} />,
    tool_call:    <Terminal size={12} style={{ color: "var(--vi)" }} />,
    tool_result:  <CheckCircle size={12} style={{ color: "var(--em)" }} />,
    final_answer: <Zap size={12} style={{ color: "var(--am)" }} />,
    error:        <AlertCircle size={12} style={{ color: "var(--ro)" }} />,
    agent_start:  <Cpu size={12} style={{ color: "var(--cy)" }} />,
  };

  return (
    <div className="sandbox-layout">
      {/* Tool selector */}
      <div className="sandbox-toolbar">
        <div className="toolbar-section">
          <span className="toolbar-label">Tools</span>
          <div className="tools-palette">
            {SANDBOX_TOOLS.map(t => {
              const on = activeTools.includes(t.id);
              return (
                <button key={t.id}
                  className="tool-pill"
                  style={on ? { color: t.hex, borderColor: t.hex, background: t.hex + "22" } : {}}
                  onClick={() => toggleTool(t.id)}>
                  {t.icon} {t.name}
                  {on && <Check size={9} />}
                </button>
              );
            })}
          </div>
        </div>
        <div className="toolbar-section" style={{ marginLeft: "auto" }}>
          <span className="toolbar-label">Model</span>
          <div className="model-select-wrap">
            <div className="mdot" style={{ background: SANDBOX_MODELS.find(m => m.id === model)?.color }} />
            <select className="model-select" value={model} onChange={e => setModel(e.target.value)}>
              {SANDBOX_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
            <ChevronDown size={11} className="select-arr" />
          </div>
        </div>
      </div>

      {/* Goal input */}
      <div className="sandbox-input-area">
        <textarea className="sandbox-input"
          placeholder={`Give your agent a goal. Try: "Search for the latest AI agent frameworks released in 2025 and compare their features" or "Analyze this data for anomalies: [12, 14, 13, 15, 47, 13, 12, 14]"`}
          value={goal} onChange={e => setGoal(e.target.value)} rows={3} />
        <button className="run-btn" onClick={run} disabled={!goal.trim() || running}>
          {running ? <><Loader2 size={14} className="spin" /> Running…</> : <><Zap size={14} /> Run Agent</>}
        </button>
      </div>

      {/* Reasoning trace */}
      <div className="trace-area">
        {steps.length === 0 && !running && (
          <div className="trace-empty">
            <Brain size={28} style={{ color: "var(--vi)", opacity: 0.4 }} />
            <p style={{ fontWeight: 700, fontSize: 14 }}>ReAct Agent Sandbox</p>
            <p style={{ fontSize: 12, color: "var(--mu)" }}>Select tools · write a goal · see live reasoning trace</p>
          </div>
        )}
        {steps.map((step, i) => (
          <div key={i} className={`trace-step ts-${step.type}`}>
            <div className="ts-icon">{STEP_ICONS[step.type] ?? <ChevronRight size={12} />}</div>
            <div className="ts-body">
              {step.type === "agent_start" && <span style={{ fontSize: 12, color: "var(--di)" }}>{step.message}</span>}
              {step.type === "step_start"  && <span style={{ fontSize: 11, color: "var(--mu)" }}>Step {step.step}</span>}
              {step.type === "thought"     && <><span className="ts-tag thought-tag">THOUGHT</span><p className="ts-text">{step.content}</p></>}
              {step.type === "tool_call"   && <><span className="ts-tag tool-tag">TOOL → {step.tool}</span><pre className="ts-pre">{JSON.stringify(step.args, null, 2)}</pre></>}
              {step.type === "tool_result" && <><span className="ts-tag result-tag">RESULT</span><p className="ts-text">{String(step.result ?? "").slice(0, 400)}</p></>}
              {step.type === "final_answer"&& <><span className="ts-tag answer-tag">FINAL ANSWER</span><p className="ts-text" style={{ color: "var(--tx)", fontSize: 14 }}>{step.content}</p></>}
              {step.type === "error"       && <p className="ts-text" style={{ color: "var(--ro)" }}>{step.message}</p>}
            </div>
          </div>
        ))}
        {running && steps.length > 0 && <div style={{ textAlign: "center", color: "var(--mu)", fontSize: 12, padding: 8 }}><Loader2 size={12} className="spin" style={{ display: "inline" }} /> Reasoning…</div>}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// A2A STUDIO TAB
// ═══════════════════════════════════════════════════════════════════════════

const A2A_AGENTS = [
  {
    id: "coordinator", name: "Coordinator", color: "var(--cy)",
    role: "Plans the task, delegates to specialists, aggregates results",
    tools: ["delegate_to_research", "delegate_to_anomaly", "aggregate"],
    model: "Gemini 2.5 Pro",
  },
  {
    id: "researcher", name: "Research Agent", color: "var(--bl)",
    role: "Searches web and KB, cross-validates sources, returns structured findings",
    tools: ["web_search", "rag_retrieve", "summarize"],
    model: "Gemini 2.0 Flash",
  },
  {
    id: "anomaly", name: "Anomaly Expert", color: "var(--am)",
    role: "Detects statistical anomalies, classifies severity, recommends actions",
    tools: ["detect_anomalies", "calculate", "web_search"],
    model: "Llama 3.3 70B",
  },
  {
    id: "supervisor", name: "Supervisor", color: "var(--ro)",
    role: "Validates all outputs for accuracy, safety, and completeness",
    tools: ["evaluate_output", "request_revision"],
    model: "Claude 3.5 Sonnet",
  },
];

function A2ATab() {
  const [task, setTask] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [running, setRunning] = useState(false);
  const [model, setModel] = useState(SANDBOX_MODELS[0].id);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [steps]);

  const run = async () => {
    if (!task.trim() || running) return;
    setSteps([]); setRunning(true);
    const a2aPrompt = `You are a Coordinator Agent in a multi-agent system. You have access to: research_agent (web search + RAG), anomaly_expert (statistical analysis + anomaly detection), and supervisor (quality validation).

Your task: ${task}

Plan which agents to involve, simulate their contributions with your tools (web_search, calculate, analyze_data), then produce a final coordinated report.`;
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: a2aPrompt, model }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ")) {
            try { setSteps(s => [...s, JSON.parse(line.slice(6)) as AgentStep]); } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setSteps(s => [...s, { type: "error", message: String(err) }]);
    } finally { setRunning(false); }
  };

  return (
    <div className="a2a-layout">
      {/* Agent network diagram */}
      <div className="a2a-network">
        <div className="network-title">Agent Network — Coordinator Pattern</div>
        <div className="network-graph">
          {A2A_AGENTS.map((agent, i) => (
            <div key={agent.id} className="agent-node" style={{ "--ac": agent.color } as React.CSSProperties}>
              <div className="agent-node-header">
                <div className="agent-dot" style={{ background: agent.color }} />
                <span className="agent-node-name">{agent.name}</span>
                <span className="agent-node-model">{agent.model}</span>
              </div>
              <p className="agent-node-role">{agent.role}</p>
              <div className="agent-tools">
                {agent.tools.map(t => <span key={t} className="agent-tool">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
        <div className="network-flow">
          <span className="nf-step">User Task</span>
          <ArrowRight size={12} style={{ color: "var(--mu)" }} />
          <span className="nf-step" style={{ color: "var(--cy)" }}>Coordinator</span>
          <ArrowRight size={12} style={{ color: "var(--mu)" }} />
          <span className="nf-step" style={{ color: "var(--bl)" }}>Research ∥ Anomaly</span>
          <ArrowRight size={12} style={{ color: "var(--mu)" }} />
          <span className="nf-step" style={{ color: "var(--ro)" }}>Supervisor</span>
          <ArrowRight size={12} style={{ color: "var(--mu)" }} />
          <span className="nf-step">Final Output</span>
        </div>
      </div>

      {/* Task input */}
      <div className="a2a-input-area">
        <div className="model-select-wrap" style={{ marginBottom: 8 }}>
          <div className="mdot" style={{ background: SANDBOX_MODELS.find(m => m.id === model)?.color }} />
          <select className="model-select" value={model} onChange={e => setModel(e.target.value)}>
            {SANDBOX_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <ChevronDown size={11} className="select-arr" />
        </div>
        <textarea className="sandbox-input"
          placeholder={`Give the multi-agent system a task. Try: "Research the latest AI agent frameworks and check the data [5,4,6,5,42,5,6] for anomalies"`}
          value={task} onChange={e => setTask(e.target.value)} rows={2} />
        <button className="run-btn" style={{ background: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.35)", color: "var(--am)" }}
          onClick={run} disabled={!task.trim() || running}>
          {running ? <><Loader2 size={14} className="spin" /> Running A2A…</> : <><Network size={14} /> Run A2A System</>}
        </button>
      </div>

      {/* Trace */}
      <div className="trace-area" style={{ flex: 1 }}>
        {steps.length === 0 && !running && (
          <div className="trace-empty">
            <Network size={28} style={{ color: "var(--am)", opacity: 0.4 }} />
            <p style={{ fontWeight: 700, fontSize: 14 }}>Multi-Agent System</p>
            <p style={{ fontSize: 12, color: "var(--mu)" }}>Coordinator · Research · Anomaly Expert · Supervisor</p>
          </div>
        )}
        {steps.map((step, i) => (
          <div key={i} className={`trace-step ts-${step.type}`}>
            <div className="ts-icon">
              {step.type === "thought"      ? <Brain size={12} style={{ color: "var(--bl)" }} />
              : step.type === "tool_call"   ? <Terminal size={12} style={{ color: "var(--vi)" }} />
              : step.type === "tool_result" ? <CheckCircle size={12} style={{ color: "var(--em)" }} />
              : step.type === "final_answer"? <Zap size={12} style={{ color: "var(--am)" }} />
              : step.type === "error"       ? <AlertCircle size={12} style={{ color: "var(--ro)" }} />
              : <ChevronRight size={12} />}
            </div>
            <div className="ts-body">
              {step.type === "thought"      && <><span className="ts-tag thought-tag">THOUGHT</span><p className="ts-text">{step.content}</p></>}
              {step.type === "tool_call"    && <><span className="ts-tag tool-tag">→ {step.tool}</span><pre className="ts-pre">{JSON.stringify(step.args, null, 2)}</pre></>}
              {step.type === "tool_result"  && <><span className="ts-tag result-tag">RESULT</span><p className="ts-text">{String(step.result ?? "").slice(0, 400)}</p></>}
              {step.type === "final_answer" && <><span className="ts-tag answer-tag">FINAL ANSWER</span><p className="ts-text" style={{ color: "var(--tx)", fontSize: 14 }}>{step.content}</p></>}
              {step.type === "agent_start"  && <span style={{ fontSize: 12, color: "var(--di)" }}>{step.message}</span>}
              {step.type === "step_start"   && <span style={{ fontSize: 11, color: "var(--mu)" }}>Step {step.step}</span>}
              {step.type === "error"        && <p className="ts-text" style={{ color: "var(--ro)" }}>{step.message}</p>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATES TAB
// ═══════════════════════════════════════════════════════════════════════════

function UpdatesTab({ onGoBlueprint }: { onGoBlueprint: () => void }) {
  const news = UPDATES.filter(u => u.type !== "suggestion");
  const suggestions = UPDATES.filter(u => u.type === "suggestion");
  const typeColor: Record<string, string> = {
    model: "var(--bl)", tool: "var(--cy)", framework: "var(--vi)", suggestion: "var(--or)"
  };
  const typeLabel: Record<string, string> = {
    model: "MODEL", tool: "TOOL", framework: "FRAMEWORK", suggestion: "💡 SUGGESTION"
  };

  return (
    <div className="updates-layout">
      <div className="updates-col">
        <div className="updates-col-header">
          <Clock size={13} /> What's New in AI
          <span className="updates-live"><RefreshCw size={9} /> auto-tracked</span>
        </div>
        {news.map(u => (
          <div key={u.id} className="update-card">
            <div className="update-meta">
              <span className="update-type" style={{ color: typeColor[u.type] }}>{typeLabel[u.type]}</span>
              {u.isNew && <span className="badge-new">NEW</span>}
              {u.date && <span style={{ color: "var(--mu)", fontSize: 10, marginLeft: "auto" }}>{u.date}</span>}
            </div>
            <div className="update-title">{u.title}</div>
            <div className="update-desc">{u.desc}</div>
          </div>
        ))}
      </div>

      <div className="updates-col">
        <div className="updates-col-header">
          <Sparkles size={13} /> Suggested Enhancements
          <span className="updates-live">based on what's trending</span>
        </div>
        {suggestions.map(s => (
          <div key={s.id} className="suggestion-card">
            <div className="update-meta">
              <span className="update-type" style={{ color: typeColor.suggestion }}>{typeLabel.suggestion}</span>
            </div>
            <div className="update-title">{s.title}</div>
            <div className="update-desc">{s.desc}</div>
            <button className="try-btn" onClick={onGoBlueprint}>
              Explore in Blueprint <ChevronRight size={11} />
            </button>
          </div>
        ))}
        <div className="updates-principle">
          <Layers size={14} style={{ color: "var(--mu)" }} />
          <p>
            <strong style={{ color: "var(--tx)" }}>Stay current:</strong> AI moves fast. Each suggestion above
            reflects a real-world release or pattern gaining adoption. Click any to explore it in the Blueprint.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function StudioPage() {
  const [tab, setTab] = useState<Tab>("blueprint");
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [practiceGoal, setPracticeGoal] = useState<string | undefined>();

  const handlePractice = (goal: string) => {
    setPracticeGoal(goal);
    setTab("sandbox");
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "blueprint", label: "Blueprint",  icon: <Layers size={13} /> },
    { id: "chat",      label: "Chat",       icon: <Bot size={13} /> },
    { id: "sandbox",   label: "Sandbox",    icon: <Zap size={13} /> },
    { id: "a2a",       label: "A2A Studio", icon: <Network size={13} /> },
    { id: "updates",   label: "Updates",    icon: <Sparkles size={13} /> },
  ];

  return (
    <div className="root">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-icon"><Cpu size={16} /></div>
          <div>
            <div className="topbar-title">AI Engineer Sandbox</div>
            <div className="topbar-sub">Blueprint · Chat · Build · A2A · Stay current</div>
          </div>
        </div>
        <div className="tab-row">
          {TABS.map(t => (
            <button key={t.id} className={`main-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="content">
        {tab === "blueprint" && <BlueprintTab selectedBlock={selectedBlock} onSelect={setSelectedBlock} onPractice={handlePractice} />}
        {tab === "chat"      && <ChatTab />}
        {tab === "sandbox"   && <SandboxTab initialGoal={practiceGoal} />}
        {tab === "a2a"       && <A2ATab />}
        {tab === "updates"   && <UpdatesTab onGoBlueprint={() => setTab("blueprint")} />}
      </div>

      <style jsx global>{`
        /* ── Root ─────────────────────────────────────────────────────── */
        .root { display: flex; flex-direction: column; height: 100%; overflow: hidden; background: var(--bg); }

        /* ── Topbar ───────────────────────────────────────────────────── */
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px 0; border-bottom: 1px solid var(--bd); flex-shrink: 0; flex-wrap: wrap; gap: 8px; }
        .topbar-left { display: flex; align-items: center; gap: 10px; padding-bottom: 10px; }
        .topbar-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(96,165,250,0.12); border: 1px solid rgba(96,165,250,0.25); display: flex; align-items: center; justify-content: center; color: var(--bl); }
        .topbar-title { font-size: 14px; font-weight: 800; color: var(--tx); }
        .topbar-sub { font-size: 10px; color: var(--mu); margin-top: 1px; }
        .tab-row { display: flex; gap: 2px; }
        .main-tab { display: flex; align-items: center; gap: 6px; padding: 9px 16px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--mu); font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; white-space: nowrap; }
        .main-tab.active { color: var(--cy); border-bottom-color: var(--cy); }
        .main-tab:hover:not(.active) { color: var(--di); }

        /* ── Content ──────────────────────────────────────────────────── */
        .content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

        /* ── Blueprint layout ─────────────────────────────────────────── */
        .blueprint-layout { flex: 1; display: flex; overflow: hidden; }
        .blueprint-canvas { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 20px; }
        .detail-sidebar { width: 300px; border-left: 1px solid var(--bd); overflow: hidden; display: flex; flex-direction: column; flex-shrink: 0; }

        /* ── Blueprint search ─────────────────────────────────────────── */
        .bp-search-row { display: flex; align-items: center; gap: 10px; }
        .bp-search { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--bg1); border: 1px solid var(--bd); border-radius: 8px; padding: 7px 12px; transition: border-color 0.15s; }
        .bp-search:focus-within { border-color: var(--cy); }
        .bp-search-input { flex: 1; background: none; border: none; outline: none; font-size: 13px; color: var(--tx); font-family: inherit; }
        .bp-search-input::placeholder { color: var(--mu); }
        .bp-clear { background: none; border: none; color: var(--mu); cursor: pointer; font-size: 16px; padding: 0; line-height: 1; }
        .bp-count { font-size: 11px; color: var(--mu); white-space: nowrap; }
        .pillar-count { font-size: 10px; color: var(--mu); background: var(--bg2); border: 1px solid var(--bd); border-radius: 10px; padding: 1px 6px; margin-left: 4px; font-weight: 400; }
        .lego-name-row { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }

        /* ── Pillar rows ──────────────────────────────────────────────── */
        .pillar-row { display: flex; flex-direction: column; gap: 8px; }
        .pillar-label { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; }
        .blocks-row { display: flex; flex-wrap: wrap; gap: 8px; }

        /* ── Lego blocks ──────────────────────────────────────────────── */
        .lego-block { position: relative; cursor: pointer; background: none; border: none; padding: 0; transition: transform 0.1s; }
        .lego-block:hover { transform: translateY(-2px); }
        .lego-block.selected .lego-face { border-color: var(--block-color); box-shadow: 0 0 0 1px var(--block-color); }
        .lego-top { height: 6px; background: var(--block-color); border-radius: 4px 4px 0 0; opacity: 0.6; margin: 0 6px; }
        .lego-face { min-width: 110px; padding: 8px 12px; background: var(--bg1); border: 1px solid var(--bd); border-top: 2px solid var(--block-color); border-radius: 0 0 7px 7px; display: flex; flex-direction: column; gap: 4px; transition: all 0.15s; }
        .lego-block:hover .lego-face { background: var(--bg2); border-color: var(--bdh); }
        .lego-name { font-size: 11px; font-weight: 700; color: var(--tx); white-space: nowrap; }

        /* ── Practice button ─────────────────────────────────────────── */
        .practice-btn { display: flex; align-items: center; gap: 6px; margin: 0 16px 12px; padding: 7px 12px; border-radius: 7px; border: 1px solid; background: transparent; font-size: 11px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s; opacity: 0.85; }
        .practice-btn:hover { opacity: 1; filter: brightness(1.2); }

        /* ── Detail panel ─────────────────────────────────────────────── */
        .detail-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 20px; gap: 6px; }
        .detail-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
        .detail-header { padding: 12px 16px; border-bottom: 1px solid var(--bd); display: flex; align-items: flex-start; gap: 10px; flex-shrink: 0; }
        .detail-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
        .detail-name { font-size: 14px; font-weight: 800; color: var(--tx); }
        .detail-tabs { display: flex; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
        .dtab { flex: 1; padding: 8px 4px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--mu); font-size: 10px; font-weight: 700; letter-spacing: 0.06em; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .dtab.active { color: var(--cy); border-bottom-color: var(--cy); }
        .dtab:hover:not(.active) { color: var(--di); }
        .detail-body { flex: 1; overflow-y: auto; padding: 14px 16px; }
        .detail-text { font-size: 12px; color: var(--di); line-height: 1.75; margin: 0; }
        .detail-section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--mu); margin-bottom: 6px; }

        /* ── VS comparison cards ──────────────────────────────────────── */
        .vs-card { background: var(--bg1); border: 1px solid var(--bd); border-radius: 8px; padding: 12px; margin-bottom: 10px; }
        .vs-title { font-size: 10px; font-weight: 700; color: var(--mu); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
        .vs-grid { display: grid; grid-template-columns: 1fr 1px 1fr; gap: 10px; }
        .vs-divider { background: var(--bd); }
        .vs-col { display: flex; flex-direction: column; gap: 5px; }
        .vs-col-label { font-size: 10px; font-weight: 700; }
        .vs-text { font-size: 11px; color: var(--di); line-height: 1.6; margin: 0; }

        /* ── HOW list ─────────────────────────────────────────────────── */
        .how-list { padding: 0; margin: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .how-item { display: flex; align-items: flex-start; gap: 10px; font-size: 12px; color: var(--di); line-height: 1.6; }
        .how-num { width: 20px; height: 20px; border-radius: 50%; background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.25); color: var(--cy); font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }

        /* ── Code block ───────────────────────────────────────────────── */
        .code-block { font-size: 10px; background: var(--bg0); border: 1px solid var(--bd); border-radius: 8px; padding: 12px; overflow: auto; color: var(--cy); font-family: 'JetBrains Mono', 'Fira Code', monospace; line-height: 1.65; white-space: pre; margin: 0; }

        /* ── Blueprint footer ─────────────────────────────────────────── */
        .blueprint-footer { font-size: 11px; color: var(--mu); text-align: center; padding: 8px 0 4px; }

        /* ── Chat tab ────────────────────────────────────────────────── */
        .chat-wrap { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .chat-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-bottom: 1px solid var(--bd); flex-wrap: wrap; flex-shrink: 0; }
        .chat-cfg-btn { padding: 5px 10px; border-radius: 6px; background: var(--bg2); border: 1px solid var(--bd); color: var(--di); font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .chat-cfg-btn:hover { color: var(--tx); border-color: var(--bdh); }
        .chat-cfg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sys-bar { padding: 8px 14px; border-bottom: 1px solid var(--bd); background: rgba(255,255,255,0.02); flex-shrink: 0; }
        .sys-input { width: 100%; background: var(--bg2); border: 1px solid var(--bd); border-radius: 7px; padding: 7px 10px; color: var(--tx); font-size: 12px; outline: none; resize: vertical; font-family: monospace; line-height: 1.5; }
        .sys-input:focus { border-color: var(--cy); }
        .messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .chat-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 8px; text-align: center; padding: 40px 20px; }
        .chat-empty-title { font-size: 15px; font-weight: 700; color: var(--tx); }
        .chat-empty-sub { font-size: 12px; color: var(--mu); }
        .starters { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin-top: 8px; max-width: 560px; }
        .starter-btn { padding: 6px 12px; border-radius: 7px; background: var(--bg2); border: 1px solid var(--bd); color: var(--di); font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.15s; text-align: left; }
        .starter-btn:hover { border-color: var(--bdh); color: var(--tx); }
        .msg { display: flex; gap: 8px; align-items: flex-start; }
        .msg-user { flex-direction: row-reverse; }
        .msg-av { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .msg-user .msg-av { background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.22); color: #22d3ee; }
        .msg-assistant .msg-av { background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.2); color: #60a5fa; }
        .msg-bdy { max-width: 78%; position: relative; }
        .msg-model { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 3px; }
        .msg-txt { font-size: 13px; line-height: 1.75; color: var(--tx); white-space: pre-wrap; word-break: break-word; }
        .msg-user .msg-txt { background: rgba(34,211,238,0.07); border: 1px solid rgba(34,211,238,0.16); border-radius: 10px 3px 10px 10px; padding: 8px 12px; }
        .msg-assistant .msg-txt { background: var(--bg2); border: 1px solid var(--bd); border-radius: 3px 10px 10px 10px; padding: 8px 12px; }
        .copy-msg { position: absolute; top: 5px; right: 5px; background: none; border: none; cursor: pointer; color: var(--mu); opacity: 0; transition: opacity 0.15s; padding: 3px; border-radius: 4px; display: flex; }
        .msg-bdy:hover .copy-msg { opacity: 1; }
        .copy-msg:hover { color: var(--cy); }
        .caret { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .chat-input-bar { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--bd); flex-shrink: 0; }
        .chat-input { flex: 1; background: var(--bg2); border: 1px solid var(--bd); border-radius: 9px; padding: 9px 12px; color: var(--tx); font-size: 13px; outline: none; resize: none; font-family: inherit; line-height: 1.6; transition: border-color 0.15s; }
        .chat-input:focus { border-color: var(--cy); }
        .chat-input::placeholder { color: var(--mu); }
        .chat-send { width: 38px; height: 38px; border-radius: 9px; background: var(--cy); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--bg0); flex-shrink: 0; align-self: flex-end; transition: opacity 0.2s; }
        .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Sandbox & A2A shared ─────────────────────────────────────── */
        .sandbox-layout, .a2a-layout { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .sandbox-toolbar { display: flex; align-items: center; gap: 16px; padding: 10px 16px; border-bottom: 1px solid var(--bd); flex-wrap: wrap; flex-shrink: 0; }
        .toolbar-section { display: flex; align-items: center; gap: 8px; }
        .toolbar-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mu); white-space: nowrap; }
        .tools-palette { display: flex; flex-wrap: wrap; gap: 5px; }
        .tool-pill { display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; background: var(--bg2); border: 1px solid var(--bd); color: var(--mu); font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .tool-pill:hover { border-color: var(--bdh); color: var(--di); }

        .model-select-wrap { position: relative; display: flex; align-items: center; gap: 7px; background: var(--bg2); border: 1px solid var(--bd); border-radius: 7px; padding: 5px 10px; }
        .mdot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .model-select { background: none; border: none; outline: none; color: var(--tx); font-size: 12px; padding-right: 16px; cursor: pointer; font-family: inherit; appearance: none; }
        .select-arr { position: absolute; right: 7px; color: var(--mu); pointer-events: none; }

        .sandbox-input-area { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
        .a2a-input-area { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
        .sandbox-input { background: var(--bg2); border: 1px solid var(--bd); border-radius: 9px; padding: 10px 13px; color: var(--tx); font-size: 13px; outline: none; resize: vertical; font-family: inherit; line-height: 1.6; width: 100%; transition: border-color 0.15s; }
        .sandbox-input:focus { border-color: var(--cy); }
        .sandbox-input::placeholder { color: var(--mu); }
        .run-btn { align-self: flex-end; display: flex; align-items: center; gap: 7px; padding: 8px 18px; border-radius: 8px; background: rgba(167,139,250,0.12); border: 1px solid rgba(167,139,250,0.3); color: var(--vi); font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .run-btn:hover { background: rgba(167,139,250,0.22); }
        .run-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Trace ────────────────────────────────────────────────────── */
        .trace-area { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 5px; }
        .trace-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; color: var(--tx); padding: 40px 20px; }
        .trace-step { display: flex; gap: 9px; align-items: flex-start; padding: 7px 10px; border-radius: 7px; background: var(--bg1); border: 1px solid var(--bd); }
        .ts-icon { flex-shrink: 0; margin-top: 2px; }
        .ts-body { flex: 1; min-width: 0; }
        .ts-tag { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 2px 6px; border-radius: 3px; margin-bottom: 4px; }
        .thought-tag { background: rgba(96,165,250,0.1); color: var(--bl); }
        .tool-tag    { background: rgba(167,139,250,0.1); color: var(--vi); }
        .result-tag  { background: rgba(52,211,153,0.08); color: var(--em); }
        .answer-tag  { background: rgba(252,211,77,0.1); color: var(--am); }
        .ts-text { font-size: 12px; color: var(--di); line-height: 1.6; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .ts-pre  { font-size: 10px; color: var(--mu); font-family: monospace; background: var(--bg2); padding: 4px 8px; border-radius: 4px; overflow-x: auto; margin: 0; }

        /* ── A2A network ──────────────────────────────────────────────── */
        .a2a-network { padding: 14px 16px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
        .network-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mu); margin-bottom: 12px; }
        .network-graph { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-bottom: 12px; }
        .agent-node { background: var(--bg1); border: 1px solid var(--bd); border-top: 2px solid var(--ac); border-radius: 8px; padding: 10px; }
        .agent-node-header { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
        .agent-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .agent-node-name { font-size: 12px; font-weight: 700; color: var(--tx); flex: 1; }
        .agent-node-model { font-size: 9px; color: var(--mu); }
        .agent-node-role { font-size: 10px; color: var(--di); line-height: 1.5; margin: 0 0 6px; }
        .agent-tools { display: flex; flex-wrap: wrap; gap: 3px; }
        .agent-tool { padding: 1px 5px; background: var(--bg2); border: 1px solid var(--bd); border-radius: 3px; font-size: 9px; color: var(--mu); font-family: monospace; }
        .network-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .nf-step { font-size: 11px; color: var(--di); padding: 3px 8px; background: var(--bg2); border: 1px solid var(--bd); border-radius: 5px; }

        /* ── Updates ──────────────────────────────────────────────────── */
        .updates-layout { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 0; overflow-y: auto; }
        .updates-col { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; border-right: 1px solid var(--bd); }
        .updates-col:last-child { border-right: none; }
        .updates-col-header { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 700; color: var(--tx); padding-bottom: 8px; border-bottom: 1px solid var(--bd); margin-bottom: 2px; }
        .updates-live { font-size: 10px; color: var(--mu); margin-left: auto; display: flex; align-items: center; gap: 4px; }
        .update-card, .suggestion-card { background: var(--bg1); border: 1px solid var(--bd); border-radius: 9px; padding: 12px; display: flex; flex-direction: column; gap: 5px; transition: border-color 0.15s; }
        .update-card:hover, .suggestion-card:hover { border-color: var(--bdh); }
        .update-meta { display: flex; align-items: center; gap: 6px; }
        .update-type { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
        .update-title { font-size: 13px; font-weight: 700; color: var(--tx); }
        .update-desc { font-size: 11px; color: var(--mu); line-height: 1.6; }
        .try-btn { display: flex; align-items: center; gap: 4px; align-self: flex-start; margin-top: 4px; padding: 4px 10px; border-radius: 5px; background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.25); color: var(--or); font-size: 11px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .try-btn:hover { background: rgba(251,146,60,0.16); }
        .updates-principle { display: flex; gap: 10px; padding: 12px; background: var(--bg0); border: 1px solid var(--bd); border-radius: 8px; }
        .updates-principle p { font-size: 11px; color: var(--mu); line-height: 1.6; margin: 0; }

        /* ── Badges ───────────────────────────────────────────────────── */
        .badge-new { padding: 1px 5px; background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.28); border-radius: 3px; font-size: 9px; font-weight: 700; color: var(--em); }
        .badge-status { padding: 1px 5px; border-radius: 3px; font-size: 9px; font-weight: 600; }
        .badge-status.live { background: rgba(52,211,153,0.08); color: var(--em); }
        .badge-status.beta { background: rgba(252,211,77,0.08); color: var(--am); }
        .badge-status.soon { background: rgba(148,163,184,0.08); color: var(--mu); }

        /* ── Shared utils ─────────────────────────────────────────────── */
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Mobile ───────────────────────────────────────────────────── */
        @media (max-width: 768px) {
          .detail-sidebar { display: none; }
          .updates-layout { grid-template-columns: 1fr; }
          .network-graph { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
