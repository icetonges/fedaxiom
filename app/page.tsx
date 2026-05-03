"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Brain, Database, Wrench, Network, BarChart2, Rocket,
  GitBranch, Cpu, Zap, Bot, ArrowRight, ChevronDown, ChevronRight,
  BookOpen, Shield, TrendingUp, Layers, Code2, Activity,
  CheckCircle, ExternalLink, Sparkles, RefreshCw,
} from "lucide-react";

// ─── Process flow steps ───────────────────────────────────────────────────────

const FLOW_STEPS = [
  { n: 1,  icon: <Brain size={16}/>,      label: "Define Goal",     color: "#4f8ef7", desc: "Requirements, success criteria, quality rubric" },
  { n: 2,  icon: <Cpu size={16}/>,        label: "Select Model",    color: "#818cf8", desc: "Benchmark on your task, match tier to importance" },
  { n: 3,  icon: <Database size={16}/>,   label: "Build Knowledge", color: "#34d399", desc: "RAG pipeline, vector store, embeddings" },
  { n: 4,  icon: <Wrench size={16}/>,     label: "Design Tools",    color: "#38bdf8", desc: "MCP servers, API wrappers, function schemas" },
  { n: 5,  icon: <RefreshCw size={16}/>,  label: "Agent Loop",      color: "#a78bfa", desc: "ReAct: Thought → Action → Observation" },
  { n: 6,  icon: <Layers size={16}/>,     label: "Add Memory",      color: "#fbbf24", desc: "Sessions, context engineering, memory ETL" },
  { n: 7,  icon: <Network size={16}/>,    label: "Orchestrate",     color: "#fb923c", desc: "Multi-agent: Coordinator, Supervisor, A2A" },
  { n: 8,  icon: <BarChart2 size={16}/>,  label: "Evaluate",        color: "#f472b6", desc: "LLM-as-Judge, Golden Set, trajectory review" },
  { n: 9,  icon: <Shield size={16}/>,     label: "Guardrails",      color: "#f87171", desc: "Input/output filters, safety classifiers" },
  { n: 10, icon: <Rocket size={16}/>,     label: "Deploy & Scale",  color: "#94a3b8", desc: "Canary rollout, CI/CD gates, observability" },
];

// ─── 5-Day course days ────────────────────────────────────────────────────────

const COURSE_DAYS = [
  {
    day: 1,
    title: "Introduction to Agents",
    color: "#4f8ef7",
    icon: <Bot size={16}/>,
    tagline: "What makes an agent different from a chatbot — and how the loop works",
    concepts: [
      { term: "AI Agent", def: "An LLM augmented with Tools, Memory, and Planning — operating in a loop rather than a single pass" },
      { term: "Agentic Loop", def: "Reasoning → Tool Call → Observation → Reasoning, cycling until the task is complete — this loop is autonomy" },
      { term: "ReAct Pattern", def: "Thought: [reasoning] → Action: [tool(args)] → Observation: [result] — makes decision-making transparent and auditable" },
      { term: "Tool Use", def: "The mechanism by which agents invoke external capabilities (APIs, code, DBs) and receive structured observations" },
      { term: "Multi-Agent Architecture", def: "Orchestrator decomposes the goal, delegates to specialists, aggregates results — enables parallelism and specialization" },
    ],
    tools: ["Google ADK", "Vertex AI Agent Engine", "LangGraph", "OpenAI Function Calling"],
    links: [
      { label: "Google ADK Docs", url: "https://google.github.io/adk-docs/" },
      { label: "Vertex AI Agent Engine", url: "https://cloud.google.com/vertex-ai/generative-ai/docs/agent-engine/overview" },
    ],
    flow: "User Request → LLM Reasoning → Tool Call → Observation → LLM Reasoning → … → Final Response",
  },
  {
    day: 2,
    title: "Tools & MCP",
    color: "#818cf8",
    icon: <Wrench size={16}/>,
    tagline: "Model Context Protocol — the USB standard for connecting AI to everything",
    concepts: [
      { term: "Model Context Protocol (MCP)", def: "Open standard that lets any AI host communicate with external tool/data servers uniformly — no custom integration per pairing" },
      { term: "MCP Primitives", def: "Three primitives: Tools (callable actions), Resources (readable data/files), Prompts (reusable parameterized templates)" },
      { term: "Host / Client / Server", def: "Host = the AI app; Client = protocol adapter in the host; Server = external service. One host connects to many servers" },
      { term: "Transport Layers", def: "stdio (local child process, fast) vs SSE over HTTP (remote cloud-hosted tools)" },
      { term: "A2A Protocol", def: "Agent-to-Agent: agents publish an Agent Card describing capabilities, orchestrators discover and invoke them across frameworks" },
    ],
    tools: ["MCP Python SDK", "MCP TypeScript SDK", "ADK MCPToolset", "FastMCP", "A2A Protocol"],
    links: [
      { label: "MCP Official Spec", url: "https://modelcontextprotocol.io/" },
      { label: "A2A Protocol Spec", url: "https://a2a-protocol.org/latest/specification/" },
      { label: "ADK A2A Docs", url: "https://google.github.io/adk-docs/a2a/" },
    ],
    flow: "Host → MCP Client → JSON-RPC request → MCP Server → structured response → Client → Host",
  },
  {
    day: 3,
    title: "Context Engineering & Memory",
    color: "#34d399",
    icon: <Database size={16}/>,
    tagline: "What goes into the context window matters as much as the model itself",
    concepts: [
      { term: "Context Engineering", def: "Deliberately managing what information enters the context window — memories to retrieve, history to compress, instructions to include" },
      { term: "Session", def: "A bounded sequence of turns sharing a single context thread — session services persist turn history for resumption across requests" },
      { term: "Memory Types", def: "In-Context (active window), External (vector DB at runtime), Semantic (domain knowledge), Episodic (specific past interactions)" },
      { term: "Memory ETL Pipeline", def: "Ingestion → Extraction (LLM filters facts by topic) → Consolidation (UPDATE/CREATE/DELETE vs existing) → Storage" },
      { term: "Memory Provenance", def: "Source type + age tag per memory. Trust hierarchy: Bootstrapped > User Input > Tool Output. Enables conflict resolution" },
    ],
    tools: ["Google ADK Memory", "Vertex AI Memory Bank", "MemO", "Zep", "pgvector / Pinecone"],
    links: [
      { label: "Memory Bank Setup", url: "https://cloud.google.com/agent-builder/agent-engine/memory-bank/set-up" },
    ],
    flow: "Session turns → Ingestion → LLM extracts facts → Consolidation (UPDATE/CREATE/DELETE) → Vector DB",
  },
  {
    day: 4,
    title: "Agent Quality",
    color: "#f472b6",
    icon: <BarChart2 size={16}/>,
    tagline: "Non-deterministic systems need a new quality model — trajectory is the truth",
    concepts: [
      { term: "Four Pillars of Quality", def: "Effectiveness (task success), Cost-Efficiency (tokens/cost), Safety (no harmful output), User Trust (confidence to rely on it)" },
      { term: "Trajectory Evaluation", def: "Evaluate the full reasoning chain and tool sequence — not just the final answer. Catches correct answers via wrong paths" },
      { term: "LLM-as-a-Judge", def: "A stronger LLM scores outputs against a rubric: correctness, helpfulness, safety, trajectory adherence. Scalable alternative to human labeling" },
      { term: "Observability Three Pillars", def: "Logs (diary of every step), Traces (causal narrative linking logs across a request), Metrics (aggregated report card)" },
      { term: "Quality Flywheel", def: "Define Quality → Instrument → Evaluate Process → Feed failures back as regression tests → repeat. Self-reinforcing loop" },
    ],
    tools: ["OpenTelemetry", "Vertex AI Evaluation", "BLEU / ROUGE / BERTScore", "LLM-as-Judge framework"],
    links: [
      { label: "LLM-as-Judge Guide", url: "https://galileo.ai/blog/llm-as-a-judge-guide-evaluation" },
      { label: "OpenTelemetry for AI", url: "https://coralogix.com/ai-blog/opentelemetry-for-ai-tracing-prompts-tools-and-inferences/" },
      { label: "NIST AI RMF", url: "https://trustarc.com/regulations/nist-ai-rmf/" },
    ],
    flow: "Define Quality → Instrument (OTel) → LLM-as-Judge + HITL → Failures → Regression tests → Golden Set",
  },
  {
    day: 5,
    title: "Prototype to Production",
    color: "#fb923c",
    icon: <Rocket size={16}/>,
    tagline: "Production is not deployment — it's the system around the agent that keeps it trustworthy",
    concepts: [
      { term: "Evaluatable-by-Design", def: "Instrument from line 1. Quality cannot be retrofitted. Agents emit logs + traces required for judgment by construction" },
      { term: "Canary / Blue-Green Deploy", def: "New version receives X% of traffic → monitor quality dashboards → promote or rollback. Zero-downtime safe rollout" },
      { term: "Guardrails", def: "Input guardrails filter harmful/off-topic before the LLM. Output guardrails inspect responses before users see them — block, flag, or rewrite" },
      { term: "Cost Optimization", def: "Semantic caching, model routing (simple→cheap, complex→powerful), prompt compression, batching, token budget enforcement" },
      { term: "Scaling Pattern", def: "Stateless agent workers + shared session store (AlloyDB) + shared vector store → horizontal scale without state coupling" },
    ],
    tools: ["Vertex AI Agent Engine", "AlloyDB", "Cloud SQL", "GitHub Actions / Cloud Build", "OpenTelemetry"],
    links: [
      { label: "AlloyDB", url: "https://cloud.google.com/alloydb" },
      { label: "Cloud SQL", url: "https://cloud.google.com/sql" },
      { label: "A2A Production Spec", url: "https://a2a-protocol.org/latest/specification/" },
      { label: "ADK YouTube Demo", url: "https://www.youtube.com/watch?v=kJRgj58ujEk" },
    ],
    flow: "Commit → Eval Suite (Golden Set) → Quality Gates → Canary Deploy → Monitor → Promote/Rollback",
  },
];

// ─── Advanced / trending topics ───────────────────────────────────────────────

const ADVANCED = [
  {
    icon: <Cpu size={17}/>,       color: "#818cf8",
    title: "Gemini 2.5 Flash",
    tag: "NEW MODEL",
    desc: "Google's best price-performance model. Free tier, 1M context, native multimodal (text + vision + audio + code). Replaces 2.0 Flash across all production workloads.",
    links: [{ label: "Model Card", url: "https://ai.google.dev/gemini-api/docs/models" }],
  },
  {
    icon: <Network size={17}/>,   color: "#34d399",
    title: "MCP v2 + Remote Servers",
    tag: "HOT",
    desc: "MCP is now the de-facto tool standard. Claude Desktop, Cursor, Windsurf, VS Code all support it. SSE transport enables cloud-hosted MCP servers — share tools across teams.",
    links: [{ label: "MCP Spec", url: "https://modelcontextprotocol.io/" }],
  },
  {
    icon: <Bot size={17}/>,       color: "#f472b6",
    title: "Agent-to-Agent (A2A)",
    tag: "HOT",
    desc: "Google's open protocol for inter-agent communication. Agents publish Agent Cards, orchestrators discover and invoke them. Enables polyglot multi-agent systems across frameworks.",
    links: [{ label: "A2A Spec", url: "https://a2a-protocol.org/latest/specification/" }],
  },
  {
    icon: <Layers size={17}/>,    color: "#38bdf8",
    title: "Gemini Embedding 2",
    tag: "NEW",
    desc: "3072-dim multimodal embeddings for text, images, video, audio, PDF. Flexible dimensions (128–3072). Powers semantic search, RAG, duplicate detection, clustering.",
    links: [{ label: "Embeddings Docs", url: "https://ai.google.dev/gemini-api/docs/embeddings" }],
  },
  {
    icon: <Sparkles size={17}/>,  color: "#e879f9",
    title: "Imagen 4",
    tag: "NEW",
    desc: "Google's latest image generation model via Gemini API. Fast / Standard / Ultra tiers. Returns base64 images from text prompts. Requires billing on Google Cloud.",
    links: [{ label: "Imagen Docs", url: "https://ai.google.dev/gemini-api/docs/imagen" }],
  },
  {
    icon: <Zap size={17}/>,       color: "#fbbf24",
    title: "DeepSeek R1 (Free on Groq)",
    tag: "TRENDING",
    desc: "Open-source reasoning model with explicit chain-of-thought. Competitive with o1 on math/code. Free via Groq API at 128K context. Great for deep analysis tasks.",
    links: [{ label: "Groq Models", url: "https://console.groq.com/docs/models" }],
  },
  {
    icon: <Shield size={17}/>,    color: "#f87171",
    title: "Guardrails as Architecture",
    tag: "BEST PRACTICE",
    desc: "Input + output safety layers are now standard in production. Classify intent, detect PII, filter harmful outputs, enforce schema. Build them at the agent framework level, not the prompt level.",
    links: [],
  },
  {
    icon: <TrendingUp size={17}/>, color: "#fb923c",
    title: "LLM-as-Judge at Scale",
    tag: "BEST PRACTICE",
    desc: "Automated evaluation that scales to millions of inferences. Judge model scores correctness, helpfulness, safety, trajectory adherence. Critical for CI/CD quality gates and the Quality Flywheel.",
    links: [{ label: "Galileo Guide", url: "https://galileo.ai/blog/llm-as-a-judge-guide-evaluation" }],
  },
  {
    icon: <GitBranch size={17}/>, color: "#94a3b8",
    title: "Agentic CI/CD",
    tag: "PRODUCTION",
    desc: "Eval suites run on every commit. Quality gates (correctness, safety, cost thresholds) block bad deploys. Failures become regression tests. The Quality Flywheel in your pipeline.",
    links: [],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

function DayCard({ d }: { d: typeof COURSE_DAYS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid ${open ? d.color + "44" : "var(--bd)"}`,
      borderRadius: 12,
      background: open ? `color-mix(in srgb, ${d.color} 4%, var(--bg1))` : "var(--bg1)",
      transition: "all 0.2s",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: d.color + "18", border: `1px solid ${d.color}44`,
          display: "flex", alignItems: "center", justifyContent: "center", color: d.color,
        }}>{d.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: d.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>Day {d.day}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--tx)", marginTop: 2 }}>{d.title}</div>
          <div style={{ fontSize: 12, color: "var(--mu)", marginTop: 2, lineHeight: 1.4 }}>{d.tagline}</div>
        </div>
        <div style={{ color: "var(--mu)", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "none" }}>
          <ChevronRight size={16} />
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Process flow */}
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg2)", border: "1px solid var(--bd)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Flow</div>
            <div style={{ fontSize: 11, color: d.color, fontFamily: "monospace", lineHeight: 1.7 }}>{d.flow}</div>
          </div>

          {/* Key concepts */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Key Concepts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {d.concepts.map(c => (
                <div key={c.term} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <CheckCircle size={13} style={{ color: d.color, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>{c.term}</span>
                    <span style={{ fontSize: 12, color: "var(--di)", marginLeft: 8 }}>— {c.def}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tools row */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Tools & Frameworks</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {d.tools.map(t => (
                <span key={t} style={{
                  padding: "3px 10px", borderRadius: 5,
                  background: d.color + "14", border: `1px solid ${d.color}33`,
                  fontSize: 11, fontWeight: 600, color: d.color,
                }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Links */}
          {d.links.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--mu)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Resources</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {d.links.map(l => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 6,
                    background: "var(--bg2)", border: "1px solid var(--bdh)",
                    fontSize: 12, color: "var(--cy)", textDecoration: "none",
                    transition: "all 0.15s",
                  }}>
                    <ExternalLink size={11} />
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 80px" }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 14px", borderRadius: 20,
          background: "rgba(79,142,247,0.1)", border: "1px solid rgba(79,142,247,0.25)",
          fontSize: 11, fontWeight: 700, color: "var(--bl)",
          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 18,
        }}>
          <Cpu size={12} /> AI Engineering Sandbox
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800, color: "var(--tx)", lineHeight: 1.15, marginBottom: 16 }}>
          From{" "}<span style={{ color: "var(--bl)" }}>Concept</span>{" "}to{" "}
          <span style={{ color: "var(--em)" }}>Production</span>
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)", color: "var(--di)", maxWidth: 600, margin: "0 auto 28px", lineHeight: 1.7 }}>
          Your go-to practice sandbox for every layer of AI engineering — from the agentic loop to production deployments. Interactive tools, live model chains, and a reference guide grounded in real course material.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/studio" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 10,
            background: "var(--bl)", color: "#fff",
            fontSize: 14, fontWeight: 700, textDecoration: "none",
            transition: "opacity 0.2s",
          }}>
            <Zap size={15} /> Open AI Studio
          </Link>
          <a href="#process" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 22px", borderRadius: 10,
            background: "var(--bg2)", border: "1px solid var(--bdh)",
            color: "var(--tx)", fontSize: 14, fontWeight: 600, textDecoration: "none",
          }}>
            <ChevronDown size={15} /> View Process Flow
          </a>
        </div>
      </div>

      {/* ── PROCESS FLOW ─────────────────────────────────────────────────── */}
      <section id="process" style={{ marginBottom: 60 }}>
        <SectionHeader
          icon={<GitBranch size={17}/>}
          label="End-to-End Process"
          title="AI Agent Engineering — Full Lifecycle"
          sub="10 stages from goal definition to production monitoring"
          color="var(--bl)"
        />

        {/* Flow diagram */}
        <div style={{
          background: "var(--bg1)", border: "1px solid var(--bd)", borderRadius: 14,
          padding: "28px 20px", overflow: "visible",
        }}>
          {/* Row 1: steps 1-5 */}
          <FlowRow steps={FLOW_STEPS.slice(0, 5)} />
          {/* Connector down */}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "calc(10% + 20px)", margin: "4px 0" }}>
            <div style={{ width: 2, height: 22, background: "var(--bd)" }} />
          </div>
          {/* Row 2: steps 6-10 (reversed for snake pattern) */}
          <FlowRow steps={FLOW_STEPS.slice(5, 10)} reverse />
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          {FLOW_STEPS.map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--di)" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ color: s.color, fontWeight: 700 }}>{s.n}.</span> {s.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── 5-DAY KNOWLEDGE GUIDE ────────────────────────────────────────── */}
      <section id="fundamentals" style={{ marginBottom: 60 }}>
        <SectionHeader
          icon={<BookOpen size={17}/>}
          label="5-Day AI Agents Course"
          title="Fundamental Knowledge — Job Aid"
          sub="Google's 5-Day AI Agents Intensive — condensed into actionable reference cards"
          color="var(--em)"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {COURSE_DAYS.map(d => <DayCard key={d.day} d={d} />)}
        </div>

        {/* Cross-day summary table */}
        <div style={{
          marginTop: 20, borderRadius: 12, overflow: "hidden",
          border: "1px solid var(--bd)", background: "var(--bg1)",
        }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--bd)", background: "var(--bg2)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--tx)" }}>Full Stack Summary</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["Layer", "Day", "Core Concept", "Go Practice"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "var(--mu)", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid var(--bd)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { layer: "Foundation",       day: 1, concept: "Agentic loop, ReAct, tool use, multi-agent", href: "/studio" },
                  { layer: "Interoperability", day: 2, concept: "MCP (tools/resources/prompts), A2A protocol", href: "/studio" },
                  { layer: "Memory",           day: 3, concept: "Sessions, memory taxonomy, ETL pipeline",     href: "/knowledge" },
                  { layer: "Quality",          day: 4, concept: "Four Pillars, LLM-as-Judge, observability",   href: "/studio" },
                  { layer: "Production",       day: 5, concept: "CI/CD, guardrails, cost optimisation, A2A",   href: "/projects" },
                ].map((row, i) => (
                  <tr key={row.layer} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                    <td style={{ padding: "10px 16px", color: "var(--tx)", fontWeight: 600 }}>{row.layer}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, background: COURSE_DAYS[row.day - 1].color + "18", color: COURSE_DAYS[row.day - 1].color, fontSize: 11, fontWeight: 700 }}>Day {row.day}</span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "var(--di)", lineHeight: 1.5 }}>{row.concept}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <Link href={row.href} style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--cy)", textDecoration: "none", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                        Practice <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── ADVANCED & TRENDING ──────────────────────────────────────────── */}
      <section id="advanced" style={{ marginBottom: 60 }}>
        <SectionHeader
          icon={<TrendingUp size={17}/>}
          label="Advanced Topics"
          title="Trending Technology & Best Practices"
          sub="What's shipping in production AI engineering right now"
          color="var(--or)"
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 14,
        }}>
          {ADVANCED.map(card => (
            <div key={card.title} style={{
              background: "var(--bg1)", border: "1px solid var(--bd)",
              borderRadius: 12, padding: "18px 20px",
              display: "flex", flexDirection: "column", gap: 10,
              transition: "border-color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = card.color + "55")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--bd)")}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: card.color + "16", border: `1px solid ${card.color}33`,
                  display: "flex", alignItems: "center", justifyContent: "center", color: card.color,
                }}>{card.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)" }}>{card.title}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 3,
                      background: card.color + "20", color: card.color,
                      letterSpacing: "0.07em", textTransform: "uppercase",
                    }}>{card.tag}</span>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: "var(--di)", lineHeight: 1.7, margin: 0 }}>{card.desc}</p>
              {card.links.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {card.links.map(l => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--cy)", textDecoration: "none", fontWeight: 600 }}>
                      <ExternalLink size={10} /> {l.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── QUICK LAUNCH ─────────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={<Zap size={17}/>}
          label="Quick Launch"
          title="Jump In"
          sub="All the tools in one place"
          color="var(--vi)"
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
          {[
            { href: "/studio",    icon: <Bot size={16}/>,       color: "var(--vi)", label: "AI Studio",      sub: "Chat · Chain · Agent · A2A" },
            { href: "/knowledge", icon: <Database size={16}/>,  color: "var(--em)", label: "Knowledge Base",  sub: "Upload docs · RAG · Embed" },
            { href: "/live-feed", icon: <Activity size={16}/>,  color: "var(--cy)", label: "Live Feed",       sub: "AI news · model releases" },
            { href: "/notebook",  icon: <BookOpen size={16}/>,  color: "var(--am)", label: "Notebook",        sub: "AI-assisted notes" },
            { href: "/career",    icon: <TrendingUp size={16}/>,color: "var(--ro)", label: "Career Tracker",  sub: "Skills · roadmap · gaps" },
            { href: "/projects",  icon: <Code2 size={16}/>,     color: "#94a3b8",   label: "Projects",        sub: "Builds · prototypes" },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px 16px", borderRadius: 10,
              background: "var(--bg1)", border: "1px solid var(--bd)",
              textDecoration: "none", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--bdh)"; e.currentTarget.style.background = "var(--bg2)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--bd)";  e.currentTarget.style.background = "var(--bg1)"; }}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: item.color + "14", border: `1px solid ${item.color}33`,
                display: "flex", alignItems: "center", justifyContent: "center", color: item.color,
              }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--tx)" }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "var(--mu)", marginTop: 2 }}>{item.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label, title, sub, color }: { icon: React.ReactNode; label: string; title: string; sub: string; color: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ color, display: "flex" }}>{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      </div>
      <h2 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.7rem)", fontWeight: 800, color: "var(--tx)", lineHeight: 1.2, marginBottom: 6 }}>{title}</h2>
      <p style={{ fontSize: 13, color: "var(--mu)", lineHeight: 1.6 }}>{sub}</p>
    </div>
  );
}

function FlowRow({ steps, reverse }: { steps: typeof FLOW_STEPS; reverse?: boolean }) {
  const ordered = reverse ? [...steps].reverse() : steps;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4 }}>
      {ordered.map((s, i) => (
        <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 120 }}>
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            padding: "12px 8px", borderRadius: 10,
            background: s.color + "0e", border: `1px solid ${s.color}33`,
            gap: 7, position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
              width: 20, height: 20, borderRadius: "50%",
              background: s.color, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 800, color: "#0a0c14",
            }}>{s.n}</div>
            <div style={{ color: s.color, marginTop: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tx)", textAlign: "center", lineHeight: 1.3 }}>{s.label}</div>
            <div style={{ fontSize: 10, color: "var(--mu)", textAlign: "center", lineHeight: 1.4 }}>{s.desc}</div>
          </div>
          {i < ordered.length - 1 && (
            <div style={{ flexShrink: 0, color: "var(--bd)", display: "flex", alignItems: "center", padding: "0 4px" }}>
              {reverse ? <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> : <ArrowRight size={14} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
