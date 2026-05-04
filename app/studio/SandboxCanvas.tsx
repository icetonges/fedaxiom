"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Play, Trash2, RotateCcw, ChevronDown, Loader2, CheckCircle,
  Zap, Brain, Search, Database, Cpu, BookOpen, Code2,
  GitBranch, X, ArrowRight, Sparkles, Network, Layers,
  AlertCircle, Copy, Check, Settings, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  config: Record<string, string>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

interface ConfigField { key: string; label: string; default: string; multiline?: boolean }

interface BlockDef {
  label: string;
  cat: string;
  color: string;
  icon: React.ReactNode;
  desc: string;
  configFields: ConfigField[];
  learnNote?: string;
}

// ─── Block definitions ────────────────────────────────────────────────────────

const BLOCK_DEFS: Record<string, BlockDef> = {
  "user-input": {
    label: "User Input", cat: "Input", color: "#4f8ef7",
    icon: <Zap size={16}/>, desc: "Starting point — the user's message or query",
    learnNote: "Every agent pipeline starts with user intent. This node represents what the human asks or uploads.",
    configFields: [{ key: "placeholder", label: "Example prompt", default: "What is RAG and when should I use it?" }],
  },
  "file-input": {
    label: "File Input", cat: "Input", color: "#4f8ef7",
    icon: <BookOpen size={16}/>, desc: "Load a document (PDF, TXT, MD) as pipeline input",
    learnNote: "Use when you want to analyse or summarise an uploaded document rather than a live user message.",
    configFields: [{ key: "fileType", label: "Accepted types", default: "PDF, TXT, MD, DOCX" }],
  },
  "llm": {
    label: "LLM Engine", cat: "LLM Core", color: "#818cf8",
    icon: <Brain size={16}/>, desc: "Call an AI model — reasoning and generation powerhouse",
    learnNote: "The core of every AI pipeline. Receives context, reasons, and generates output. Choose model carefully for cost/quality trade-offs.",
    configFields: [
      { key: "model", label: "Model", default: "gemini-2.5-flash" },
      { key: "temperature", label: "Temperature (0 = precise, 1 = creative)", default: "0.7" },
      { key: "systemPrompt", label: "System Prompt", default: "You are a helpful AI assistant. Be concise and accurate.", multiline: true },
    ],
  },
  "system-prompt": {
    label: "System Prompt", cat: "LLM Core", color: "#818cf8",
    icon: <Settings size={16}/>, desc: "Define the agent's persona, rules, and output format",
    learnNote: "The single highest-leverage prompt-engineering artifact. Think of it as the agent's job description.",
    configFields: [
      { key: "role", label: "Agent Role", default: "AI Research Assistant" },
      { key: "instructions", label: "Instructions", default: "Always cite sources.\nRespond in structured Markdown.\nSay 'I don't know' rather than guessing.", multiline: true },
    ],
  },
  "prompt-tmpl": {
    label: "Prompt Template", cat: "LLM Core", color: "#818cf8",
    icon: <Code2 size={16}/>, desc: "Reusable template with {{variable}} placeholders",
    learnNote: "Templates let you inject dynamic values (user input, retrieved docs) into structured prompts reliably.",
    configFields: [
      { key: "template", label: "Template (use {{input}} for data)", default: "Analyse the following and extract key points:\n\n{{input}}\n\nReturn: { summary, keyPoints: [], confidence }", multiline: true },
    ],
  },
  "rag": {
    label: "RAG Retrieve", cat: "Knowledge", color: "#34d399",
    icon: <Database size={16}/>, desc: "Semantic search your knowledge base — grounded answers",
    learnNote: "RAG = Retrieval-Augmented Generation. Fetches relevant document chunks to give the LLM real, traceable facts.",
    configFields: [
      { key: "topK", label: "Top-K chunks to retrieve", default: "5" },
      { key: "minScore", label: "Min relevance score (0–1)", default: "0.7" },
    ],
  },
  "web-search": {
    label: "Web Search", cat: "Knowledge", color: "#34d399",
    icon: <Search size={16}/>, desc: "Live web search — real-time info beyond training data",
    learnNote: "Agents without web search have a knowledge cutoff. This tool gives them current information.",
    configFields: [
      { key: "maxResults", label: "Max results", default: "5" },
      { key: "searchType", label: "Search type", default: "general" },
    ],
  },
  "session-mem": {
    label: "Session Memory", cat: "Memory", color: "#fbbf24",
    icon: <Layers size={16}/>, desc: "Remember conversation history across turns",
    learnNote: "Without session memory every turn is a fresh start. This makes agents feel coherent and contextual.",
    configFields: [
      { key: "maxTurns", label: "Max turns to remember", default: "20" },
      { key: "compression", label: "Compress old turns", default: "true" },
    ],
  },
  "working-mem": {
    label: "Working Memory", cat: "Memory", color: "#fbbf24",
    icon: <GitBranch size={16}/>, desc: "Agent scratchpad — tracks goal, steps, findings",
    learnNote: "Working memory prevents agents from losing track on complex multi-step tasks. Essential for ReAct agents.",
    configFields: [
      { key: "schema", label: "Memory schema", default: "goal, steps_taken, key_findings, current_focus" },
    ],
  },
  "calculator": {
    label: "Calculator Tool", cat: "Tools", color: "#38bdf8",
    icon: <Cpu size={16}/>, desc: "Safe math evaluation and code execution",
    learnNote: "LLMs are unreliable at arithmetic. Offload maths to a deterministic calculator tool.",
    configFields: [
      { key: "sandbox", label: "Execution sandbox", default: "safe-eval" },
    ],
  },
  "api-call": {
    label: "API Call", cat: "Tools", color: "#38bdf8",
    icon: <Network size={16}/>, desc: "Call any external REST API — weather, databases, services",
    learnNote: "API tools extend the agent's reach to any external system: CRMs, databases, IoT, payment APIs.",
    configFields: [
      { key: "url", label: "Endpoint URL", default: "https://api.example.com/data" },
      { key: "method", label: "HTTP Method", default: "GET" },
      { key: "headers", label: "Headers (JSON)", default: '{"Authorization": "Bearer {{api_key}}"}' },
    ],
  },
  "guardrail": {
    label: "Guardrail", cat: "Safety", color: "#f87171",
    icon: <AlertCircle size={16}/>, desc: "Input/output safety filter — blocks harmful content",
    learnNote: "Production AI must have guardrails. Inspects text and blocks PII, prompt injection, harmful content.",
    configFields: [
      { key: "checks", label: "Enabled checks", default: "pii, injection, toxicity, off-topic" },
      { key: "action", label: "On violation", default: "block" },
    ],
  },
  "evaluator": {
    label: "LLM Evaluator", cat: "Safety", color: "#f87171",
    icon: <CheckCircle size={16}/>, desc: "LLM-as-a-Judge: score output quality (1–5 per dimension)",
    learnNote: "Use a strong model to judge your agent's outputs. Critical for CI/CD quality gates.",
    configFields: [
      { key: "judgeModel", label: "Judge model", default: "gemini-2.5-pro" },
      { key: "criteria", label: "Eval criteria", default: "correctness, helpfulness, safety" },
    ],
  },
  "output": {
    label: "Final Answer", cat: "Output", color: "#fb923c",
    icon: <Sparkles size={16}/>, desc: "Terminal output — streams final response to user",
    learnNote: "The terminal node. Every pipeline needs at least one output. Can also route to APIs or save to file.",
    configFields: [
      { key: "format", label: "Output format", default: "markdown" },
      { key: "streaming", label: "Stream tokens", default: "true" },
    ],
  },
};

const PALETTE_CATS = [
  { name: "Input",     color: "#4f8ef7", types: ["user-input", "file-input"] },
  { name: "LLM Core", color: "#818cf8", types: ["llm", "system-prompt", "prompt-tmpl"] },
  { name: "Knowledge",color: "#34d399", types: ["rag", "web-search"] },
  { name: "Memory",   color: "#fbbf24", types: ["session-mem", "working-mem"] },
  { name: "Tools",    color: "#38bdf8", types: ["calculator", "api-call"] },
  { name: "Safety",   color: "#f87171", types: ["guardrail", "evaluator"] },
  { name: "Output",   color: "#fb923c", types: ["output"] },
];

const NODE_W = 200;
const NODE_H = 90;

// ─── Templates ────────────────────────────────────────────────────────────────

const TEMPLATES: { name: string; emoji: string; desc: string; useCase: string; nodes: FlowNode[]; edges: FlowEdge[] }[] = [
  {
    name: "Simple RAG Chat", emoji: "📚",
    desc: "Grounded Q&A — retrieves context from your knowledge base before answering",
    useCase: "Customer support bots, document Q&A, internal knowledge assistants",
    nodes: [
      { id: "n1", type: "user-input",  label: "User Question",   x: 40,  y: 220, config: { placeholder: "What are the refund policies?" } },
      { id: "n2", type: "rag",         label: "RAG Retrieve",    x: 310, y: 220, config: { topK: "5", minScore: "0.7" } },
      { id: "n3", type: "llm",         label: "LLM Engine",      x: 580, y: 220, config: { model: "gemini-2.5-flash", systemPrompt: "Answer only based on the provided context. Cite the source document. If not in context, say so." } },
      { id: "n4", type: "output",      label: "Grounded Answer", x: 850, y: 220, config: { format: "markdown" } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
      { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" },
    ],
  },
  {
    name: "ReAct Research Agent", emoji: "🔬",
    desc: "Autonomous research agent with memory — searches web, stores findings, synthesises report",
    useCase: "Market research, competitive analysis, technical research reports",
    nodes: [
      { id: "n1", type: "user-input",    label: "Research Goal",   x: 40,  y: 90,  config: { placeholder: "Analyse the current state of multimodal AI models" } },
      { id: "n2", type: "system-prompt", label: "Agent Persona",   x: 40,  y: 280, config: { role: "Research Analyst", instructions: "Search multiple sources. Cross-validate facts. Cite every claim." } },
      { id: "n3", type: "working-mem",   label: "Working Memory",  x: 310, y: 90,  config: { schema: "goal, steps_taken, key_findings, sources_checked" } },
      { id: "n4", type: "web-search",    label: "Web Search",      x: 310, y: 280, config: { maxResults: "5" } },
      { id: "n5", type: "llm",           label: "Reasoner + Synth",x: 580, y: 185, config: { model: "gemini-2.5-flash", temperature: "0.3" } },
      { id: "n6", type: "output",        label: "Research Report", x: 850, y: 185, config: { format: "markdown" } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n3" }, { id: "e2", source: "n1", target: "n4" },
      { id: "e3", source: "n2", target: "n5" }, { id: "e4", source: "n3", target: "n5" },
      { id: "e5", source: "n4", target: "n5" }, { id: "e6", source: "n5", target: "n6" },
    ],
  },
  {
    name: "Safe Production Agent", emoji: "🛡️",
    desc: "Input guardrail → LLM → evaluator → output — the production safety pattern",
    useCase: "Any customer-facing AI feature where safety and quality are non-negotiable",
    nodes: [
      { id: "n1", type: "user-input", label: "User Input",     x: 40,  y: 220, config: {} },
      { id: "n2", type: "guardrail",  label: "Input Guard",    x: 300, y: 220, config: { checks: "pii, injection, toxicity", action: "block" } },
      { id: "n3", type: "llm",        label: "LLM Engine",     x: 560, y: 220, config: { model: "gemini-2.5-flash", temperature: "0.5" } },
      { id: "n4", type: "evaluator",  label: "Quality Judge",  x: 820, y: 120, config: { judgeModel: "gemini-2.5-flash", criteria: "correctness, safety, helpfulness" } },
      { id: "n5", type: "guardrail",  label: "Output Guard",   x: 820, y: 320, config: { checks: "pii, harmful-content", action: "sanitize" } },
      { id: "n6", type: "output",     label: "Safe Response",  x: 1080, y: 220, config: { format: "markdown" } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" }, { id: "e4", source: "n3", target: "n5" },
      { id: "e5", source: "n4", target: "n6" }, { id: "e6", source: "n5", target: "n6" },
    ],
  },
  {
    name: "Memory-Augmented Chat", emoji: "🧠",
    desc: "Stateful conversation with session + working memory — feels genuinely intelligent",
    useCase: "Tutors, personal assistants, long-horizon task agents",
    nodes: [
      { id: "n1", type: "user-input",  label: "User Message",    x: 40,  y: 220, config: {} },
      { id: "n2", type: "session-mem", label: "Session History",  x: 310, y: 100, config: { maxTurns: "20", compression: "true" } },
      { id: "n3", type: "working-mem", label: "Task Memory",      x: 310, y: 320, config: { schema: "current_goal, open_questions, agreed_facts" } },
      { id: "n4", type: "llm",         label: "LLM + Context",    x: 580, y: 220, config: { model: "gemini-2.5-flash", systemPrompt: "Use conversation history and working memory to give personalised, context-aware responses." } },
      { id: "n5", type: "output",      label: "Response",         x: 850, y: 220, config: { streaming: "true" } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n1", target: "n3" },
      { id: "e3", source: "n2", target: "n4" }, { id: "e4", source: "n3", target: "n4" },
      { id: "e5", source: "n4", target: "n5" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPortPos(node: FlowNode, side: "in" | "out") {
  return {
    x: side === "out" ? node.x + NODE_W : node.x,
    y: node.y + NODE_H / 2,
  };
}

function bezierPath(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.abs(x2 - x1) * 0.55;
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SandboxCanvas() {
  const [nodes, setNodes] = useState<FlowNode[]>(TEMPLATES[0].nodes);
  const [edges, setEdges] = useState<FlowEdge[]>(TEMPLATES[0].edges);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{ sourceId: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLearnTip, setShowLearnTip] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState<Record<string, boolean>>({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const paletteDragType = useRef<string | null>(null);

  const getNode = (id: string) => nodes.find(n => n.id === id);

  // ── Node drag ──────────────────────────────────────────────────────────────
  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if ((e.target as HTMLElement).closest(".sc-port")) return;
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId)!;
    const rect = canvasRef.current!.getBoundingClientRect();
    setDraggingNodeId(nodeId);
    setDragOffset({ x: e.clientX - rect.left - node.x, y: e.clientY - rect.top - node.y });
    setSelectedNodeId(nodeId);
    setConnecting(null);
  }, [nodes]);

  const onCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMousePos({ x: mx, y: my });
    if (draggingNodeId) {
      setNodes(ns => ns.map(n => n.id !== draggingNodeId ? n : {
        ...n, x: Math.max(0, mx - dragOffset.x), y: Math.max(0, my - dragOffset.y),
      }));
    }
  }, [draggingNodeId, dragOffset]);

  const onCanvasMouseUp = useCallback(() => setDraggingNodeId(null), []);

  const onCanvasClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement) === canvasRef.current) {
      setSelectedNodeId(null);
      setConnecting(null);
    }
  }, []);

  // ── Palette drop ──────────────────────────────────────────────────────────
  const onCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = paletteDragType.current || e.dataTransfer.getData("blockType");
    if (!type) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const def = BLOCK_DEFS[type];
    if (!def) return;
    const newNode: FlowNode = {
      id: `n${Date.now()}`,
      type, label: def.label,
      x: e.clientX - rect.left - NODE_W / 2,
      y: e.clientY - rect.top - NODE_H / 2,
      config: Object.fromEntries(def.configFields.map(f => [f.key, f.default])),
    };
    setNodes(ns => [...ns, newNode]);
    setSelectedNodeId(newNode.id);
    paletteDragType.current = null;
  }, []);

  // ── Connections ────────────────────────────────────────────────────────────
  const onOutPortClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnecting({ sourceId: nodeId });
  }, []);

  const onInPortClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!connecting || connecting.sourceId === nodeId) { setConnecting(null); return; }
    const dup = edges.find(ed => ed.source === connecting.sourceId && ed.target === nodeId);
    if (!dup) setEdges(es => [...es, { id: `e${Date.now()}`, source: connecting.sourceId, target: nodeId }]);
    setConnecting(null);
  }, [connecting, edges]);

  const deleteEdge = useCallback((id: string) => setEdges(es => es.filter(e => e.id !== id)), []);

  const deleteNode = useCallback((id: string) => {
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  }, [selectedNodeId]);

  // ── Run simulation ─────────────────────────────────────────────────────────
  const runFlow = useCallback(async () => {
    setRunning(true);
    setActiveNodes([]); setCompletedNodes([]); setRunLog([]);
    setShowLog(true);

    const log = (msg: string) => setRunLog(l => [...l, msg]);
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    log("▶  Flow execution started…");

    const inDegree = new Map<string, number>();
    nodes.forEach(n => inDegree.set(n.id, 0));
    edges.forEach(e => inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1));

    const tempDegree = new Map(inDegree);
    const q = nodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);
    const order: string[] = [];
    while (q.length > 0) {
      const id = q.shift()!;
      order.push(id);
      edges.filter(e => e.source === id).forEach(e => {
        const d = (tempDegree.get(e.target) || 1) - 1;
        tempDegree.set(e.target, d);
        if (d === 0) q.push(e.target);
      });
    }
    nodes.forEach(n => { if (!order.includes(n.id)) order.push(n.id); });

    for (const nodeId of order) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      const def = BLOCK_DEFS[node.type];
      setActiveNodes(a => [...a, nodeId]);
      log(`  ⚡  ${def?.label ?? node.label}  —  processing…`);
      await delay(800 + Math.random() * 700);

      switch (node.type) {
        case "user-input":   log(`      → Input: "${node.config.placeholder || "User message"}"`); break;
        case "rag":          log(`      → Retrieved ${node.config.topK || 5} chunks  ·  avg score 0.87`); break;
        case "web-search":   log(`      → Found ${node.config.maxResults || 5} results from web`); break;
        case "llm":          log(`      → ${node.config.model || "gemini-2.5-flash"}  ·  312 tokens generated`); break;
        case "session-mem":  log(`      → Loaded ${node.config.maxTurns || 20} turns of history`); break;
        case "working-mem":  log(`      → Memory updated: goal + 3 key findings`); break;
        case "guardrail":    log(`      → ✓ Safe — no violations detected`); break;
        case "evaluator":    log(`      → Score  correctness 4.2 / 5  ·  safety 5 / 5  ·  helpfulness 4.5 / 5`); break;
        case "api-call":     log(`      → HTTP ${node.config.method || "GET"}  →  200 OK  (42 ms)`); break;
        case "output":       log(`      → ✅ Final answer streamed to user`); break;
        default:             log(`      → Processing complete`);
      }

      setActiveNodes(a => a.filter(id => id !== nodeId));
      setCompletedNodes(c => [...c, nodeId]);
    }

    log("✅  Flow completed successfully!");
    setRunning(false);
  }, [nodes, edges]);

  const loadTemplate = (t: typeof TEMPLATES[0]) => {
    setNodes(t.nodes); setEdges(t.edges);
    setSelectedNodeId(null); setConnecting(null);
    setActiveNodes([]); setCompletedNodes([]); setRunLog([]);
    setShowTemplates(false);
  };

  const clearCanvas = () => {
    setNodes([]); setEdges([]); setSelectedNodeId(null);
    setConnecting(null); setActiveNodes([]); setCompletedNodes([]); setRunLog([]);
  };

  const exportFlow = () => {
    navigator.clipboard.writeText(JSON.stringify({ nodes, edges }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : null;
  const selectedDef  = selectedNode ? BLOCK_DEFS[selectedNode.type] : null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="sc-root">

      {/* ══ TOP TOOLBAR ══════════════════════════════════════════════════════ */}
      <div className="sc-toolbar">
        <div className="sc-brand">
          <div className="sc-brand-icon">
            <Layers size={15} color="#fff"/>
          </div>
          <div>
            <div className="sc-brand-title">AI Pipeline Builder</div>
            <div className="sc-brand-sub">Drag · Connect · Run</div>
          </div>
        </div>

        <div className="sc-toolbar-actions">
          {/* Templates dropdown */}
          <div style={{ position: "relative" }}>
            <button className="sc-btn sc-btn-vi" onClick={() => setShowTemplates(s => !s)}>
              <Sparkles size={14}/> Templates <ChevronDown size={12}/>
            </button>
            {showTemplates && (
              <div className="sc-dropdown">
                <div className="sc-dropdown-header">Choose a starter pipeline</div>
                {TEMPLATES.map((t, i) => (
                  <button key={i} className="sc-dropdown-item" onClick={() => loadTemplate(t)}>
                    <span style={{ fontSize: 18 }}>{t.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sc-dropdown-name">{t.name}</div>
                      <div className="sc-dropdown-desc">{t.desc}</div>
                      <div className="sc-dropdown-use">📋 {t.useCase}</div>
                    </div>
                    <ArrowRight size={13} style={{ color: "var(--mu)", flexShrink: 0 }}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className={`sc-btn ${showLog ? "sc-btn-em" : "sc-btn-ghost"}`}
            onClick={() => setShowLog(s => !s)}
          >
            Exec Log
            {runLog.length > 0 && <span className="sc-badge">{runLog.length}</span>}
          </button>

          <button className="sc-btn sc-btn-ghost" onClick={exportFlow}>
            {copied ? <><Check size={13}/> Copied!</> : <><Copy size={13}/> Export JSON</>}
          </button>

          <button className="sc-btn sc-btn-ghost" onClick={clearCanvas}>
            <RotateCcw size={13}/> Clear
          </button>

          <button
            className="sc-btn sc-btn-run"
            onClick={runFlow}
            disabled={running || nodes.length === 0}
          >
            {running
              ? <><Loader2 size={14} className="sc-spin"/> Running…</>
              : <><Play size={14}/> Run Flow</>}
          </button>
        </div>
      </div>

      {/* ══ MIDDLE: Palette + Canvas + Config ════════════════════════════════ */}
      <div className="sc-body">

        {/* ── LEFT PALETTE ──────────────────────────────────────────────── */}
        <div className="sc-palette">
          <div className="sc-palette-hint">
            ← Drag blocks onto canvas
          </div>

          {PALETTE_CATS.map(cat => {
            const collapsed = paletteCollapsed[cat.name];
            return (
              <div key={cat.name} className="sc-cat">
                <button
                  className="sc-cat-header"
                  onClick={() => setPaletteCollapsed(p => ({ ...p, [cat.name]: !collapsed }))}
                >
                  <span className="sc-cat-label" style={{ color: cat.color }}>{cat.name}</span>
                  <ChevronDown
                    size={12}
                    style={{
                      color: "var(--mu)",
                      transform: collapsed ? "rotate(-90deg)" : "none",
                      transition: "transform 0.15s",
                    }}
                  />
                </button>

                {!collapsed && cat.types.map(type => {
                  const def = BLOCK_DEFS[type];
                  if (!def) return null;
                  return (
                    <div
                      key={type}
                      className="sc-palette-block"
                      draggable
                      onDragStart={e => { paletteDragType.current = type; e.dataTransfer.setData("blockType", type); }}
                      onDragEnd={() => { paletteDragType.current = null; }}
                      style={{ "--cat-color": cat.color } as React.CSSProperties}
                    >
                      <div className="sc-palette-icon" style={{ color: cat.color }}>{def.icon}</div>
                      <div className="sc-palette-text">
                        <div className="sc-palette-name">{def.label}</div>
                        <div className="sc-palette-desc">{def.desc.slice(0, 38)}…</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="sc-connect-hint">
            <div className="sc-hint-title">💡 Connect nodes</div>
            <div className="sc-hint-body">
              Click the <span style={{ color: "#34d399", fontWeight: 700 }}>●</span> right port,
              then the <span style={{ color: "#4f8ef7", fontWeight: 700 }}>●</span> left port
              on the target node.
              <br/><br/>
              Click an edge to delete it.
            </div>
          </div>
        </div>

        {/* ── CANVAS ────────────────────────────────────────────────────── */}
        <div
          ref={canvasRef}
          className="sc-canvas"
          style={{ cursor: connecting ? "crosshair" : "default" }}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onClick={onCanvasClick}
          onDragOver={e => e.preventDefault()}
          onDrop={onCanvasDrop}
        >
          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="sc-empty">
              <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.3 }}>🧱</div>
              <div className="sc-empty-title">Canvas is empty</div>
              <div className="sc-empty-sub">
                Drag blocks from the left palette onto here, or choose a starter template above.
              </div>
              <button className="sc-btn sc-btn-vi" style={{ marginTop: 16 }} onClick={() => setShowTemplates(true)}>
                <Sparkles size={14}/> Browse Templates
              </button>
            </div>
          )}

          {/* ── SVG: edges ──────────────────────────────────────────────── */}
          <svg className="sc-svg">
            <defs>
              <marker id="arr" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 9 3.5, 0 7" fill="#4f8ef7" opacity="0.8"/>
              </marker>
              <marker id="arr-active" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 9 3.5, 0 7" fill="#34d399"/>
              </marker>
            </defs>

            {edges.map(edge => {
              const src = getNode(edge.source);
              const tgt = getNode(edge.target);
              if (!src || !tgt) return null;
              const p1 = getPortPos(src, "out");
              const p2 = getPortPos(tgt, "in");
              const isActive = activeNodes.includes(edge.source) || activeNodes.includes(edge.target);
              const path = bezierPath(p1.x, p1.y, p2.x, p2.y);
              return (
                <g key={edge.id} style={{ pointerEvents: "auto" }}>
                  {/* Wide invisible hit area */}
                  <path d={path} fill="none" stroke="transparent" strokeWidth={14}
                    onClick={() => deleteEdge(edge.id)} style={{ cursor: "pointer" }}/>
                  {/* Visible edge */}
                  <path d={path} fill="none"
                    stroke={isActive ? "#34d399" : "rgba(255,255,255,0.18)"}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    strokeDasharray={isActive ? "7 3" : "none"}
                    markerEnd={isActive ? "url(#arr-active)" : "url(#arr)"}
                    style={{ transition: "stroke 0.3s, stroke-width 0.3s" }}
                  />
                  {/* Data packet animation */}
                  {isActive && (
                    <circle r="5" fill="#34d399" opacity="0.9" filter="url(#glow)">
                      <animateMotion dur="0.9s" repeatCount="indefinite" path={path}/>
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Pending connection preview */}
            {connecting && (() => {
              const src = getNode(connecting.sourceId);
              if (!src) return null;
              const p1 = getPortPos(src, "out");
              return (
                <path
                  d={bezierPath(p1.x, p1.y, mousePos.x, mousePos.y)}
                  fill="none" stroke="var(--vi)" strokeWidth={2}
                  strokeDasharray="6 3" opacity={0.8}
                />
              );
            })()}
          </svg>

          {/* ── Node cards ────────────────────────────────────────────── */}
          {nodes.map(node => {
            const def      = BLOCK_DEFS[node.type];
            const isSelected = selectedNodeId === node.id;
            const isActive   = activeNodes.includes(node.id);
            const isDone     = completedNodes.includes(node.id);
            const color      = def?.color ?? "var(--mu)";

            return (
              <div
                key={node.id}
                className={`sc-node ${isSelected ? "sc-node-selected" : ""} ${isActive ? "sc-node-active" : ""} ${isDone ? "sc-node-done" : ""}`}
                style={{
                  left: node.x, top: node.y,
                  width: NODE_W, height: NODE_H,
                  "--node-color": color,
                } as React.CSSProperties}
                onMouseDown={e => onNodeMouseDown(e, node.id)}
              >
                {/* Top color strip */}
                <div className="sc-node-strip" style={{ background: color }}/>

                {/* Body */}
                <div className="sc-node-body">
                  <div className="sc-node-header">
                    <div className="sc-node-icon" style={{ color }}>{def?.icon}</div>
                    <span className="sc-node-label">{node.label}</span>
                    <div className="sc-node-btns">
                      {def?.learnNote && (
                        <button
                          className="sc-port sc-node-btn"
                          title="Learn about this block"
                          onClick={e => { e.stopPropagation(); setShowLearnTip(showLearnTip === node.id ? null : node.id); }}
                        >
                          <Info size={12}/>
                        </button>
                      )}
                      <button
                        className="sc-port sc-node-btn"
                        title="Delete node"
                        onClick={e => { e.stopPropagation(); deleteNode(node.id); }}
                      >
                        <X size={12}/>
                      </button>
                    </div>
                  </div>

                  <div className="sc-node-meta">
                    <span style={{ color }} className="sc-node-cat">{def?.cat}</span>
                    {isDone && <span className="sc-node-status sc-done">✓ done</span>}
                    {isActive && <span className="sc-node-status sc-active">⚡ running</span>}
                    {node.config.model && (
                      <span className="sc-node-model">{node.config.model}</span>
                    )}
                  </div>
                </div>

                {/* INPUT port — left */}
                <div
                  className={`sc-port sc-port-in ${connecting ? "sc-port-hot" : ""}`}
                  onClick={e => onInPortClick(e, node.id)}
                  title="Input port — click to connect"
                />

                {/* OUTPUT port — right */}
                <div
                  className={`sc-port sc-port-out ${connecting?.sourceId === node.id ? "sc-port-active" : ""}`}
                  onClick={e => onOutPortClick(e, node.id)}
                  title="Output port — click to start connection"
                />

                {/* Learn tip popup */}
                {showLearnTip === node.id && def?.learnNote && (
                  <div className="sc-learn-tip" style={{ borderColor: color + "44" }}>
                    <div className="sc-learn-tip-title" style={{ color }}>💡 Learning Note</div>
                    {def.learnNote}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── RIGHT CONFIG PANEL ────────────────────────────────────────── */}
        <div className="sc-config-wrap" style={{ width: selectedNode ? 264 : 0 }}>
          {selectedNode && selectedDef && (
            <div className="sc-config">
              {/* Header */}
              <div className="sc-config-header">
                <div className="sc-config-icon" style={{ background: selectedDef.color + "22", border: `1px solid ${selectedDef.color}44`, color: selectedDef.color }}>
                  {selectedDef.icon}
                </div>
                <div className="sc-config-title-wrap">
                  <div className="sc-config-title">{selectedNode.label}</div>
                  <div className="sc-config-cat" style={{ color: selectedDef.color }}>{selectedDef.cat}</div>
                </div>
                <button className="sc-icon-btn" onClick={() => setSelectedNodeId(null)} title="Close panel">
                  <X size={14}/>
                </button>
              </div>

              {/* Description */}
              <div className="sc-config-desc" style={{ borderColor: selectedDef.color + "22" }}>
                {selectedDef.desc}
              </div>

              {/* Label */}
              <div className="sc-field">
                <label className="sc-field-label">Node Label</label>
                <input
                  className="sc-input"
                  value={selectedNode.label}
                  onChange={e => setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))}
                />
              </div>

              {/* Config fields */}
              {selectedDef.configFields.map(field => (
                <div key={field.key} className="sc-field">
                  <label className="sc-field-label">{field.label}</label>
                  {field.multiline ? (
                    <textarea
                      className="sc-input sc-textarea"
                      rows={4}
                      value={selectedNode.config[field.key] ?? field.default}
                      onChange={e => setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.key]: e.target.value } } : n))}
                    />
                  ) : (
                    <input
                      className="sc-input"
                      value={selectedNode.config[field.key] ?? field.default}
                      onChange={e => setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.key]: e.target.value } } : n))}
                    />
                  )}
                </div>
              ))}

              {/* Learn note */}
              {selectedDef.learnNote && (
                <div className="sc-learn-box">
                  <div className="sc-learn-box-title">💡 Learn</div>
                  <div className="sc-learn-box-text">{selectedDef.learnNote}</div>
                </div>
              )}

              <button className="sc-delete-btn" onClick={() => deleteNode(selectedNode.id)}>
                <Trash2 size={13}/> Delete Node
              </button>
            </div>
          )}

          {!selectedNode && (
            <div className="sc-config-empty">
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚙️</div>
              <div>Click any node<br/>to configure it</div>
            </div>
          )}
        </div>
      </div>

      {/* ══ EXECUTION LOG ════════════════════════════════════════════════════ */}
      {showLog && (
        <div className="sc-log">
          <div className="sc-log-header">
            <span className="sc-log-title">Execution Log</span>
            {running && <Loader2 size={13} className="sc-spin" style={{ color: "var(--em)" }}/>}
            <span className="sc-log-count">{runLog.length} lines</span>
            <button className="sc-icon-btn" onClick={() => setShowLog(false)}><X size={13}/></button>
          </div>
          <div className="sc-log-body">
            {runLog.length === 0 ? (
              <div className="sc-log-empty">Run the flow to see execution trace here…</div>
            ) : (
              runLog.map((line, i) => (
                <div key={i} className={`sc-log-line ${
                  line.startsWith("✅") ? "sc-log-ok" :
                  line.startsWith("  ⚡") ? "sc-log-node" :
                  line.startsWith("      →") ? "sc-log-detail" :
                  "sc-log-info"
                }`}>{line}</div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ══ STYLES ═══════════════════════════════════════════════════════════ */}
      <style>{`
        /* ── Root layout ─────────────────────────────────────────── */
        .sc-root {
          display: flex; flex-direction: column; height: 100%; overflow: hidden;
          background: var(--bg); font-family: inherit;
        }

        /* ── Toolbar ─────────────────────────────────────────────── */
        .sc-toolbar {
          display: flex; align-items: center; gap: 10px; padding: 10px 16px;
          border-bottom: 1px solid var(--bd); background: var(--bg1);
          flex-shrink: 0; flex-wrap: wrap;
        }
        .sc-brand { display: flex; align-items: center; gap: 10px; }
        .sc-brand-icon {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: linear-gradient(135deg, #818cf8, #4f8ef7);
          display: flex; align-items: center; justify-content: center;
        }
        .sc-brand-title { font-size: 15px; font-weight: 700; color: var(--tx); }
        .sc-brand-sub { font-size: 12px; color: var(--bl); }
        .sc-toolbar-actions { display: flex; gap: 7px; margin-left: auto; flex-wrap: wrap; align-items: center; }

        /* Buttons */
        .sc-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
          cursor: pointer; border: 1px solid transparent; font-family: inherit;
          transition: all 0.15s; white-space: nowrap;
        }
        .sc-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sc-btn-ghost {
          background: var(--bg2); border-color: var(--bd); color: var(--tx2);
        }
        .sc-btn-ghost:hover { background: var(--bg1); color: var(--tx); border-color: var(--bdh); }
        .sc-btn-vi {
          background: rgba(129,140,248,0.12); border-color: rgba(129,140,248,0.3); color: var(--vi);
        }
        .sc-btn-vi:hover { background: rgba(129,140,248,0.22); }
        .sc-btn-em {
          background: rgba(52,211,153,0.12); border-color: rgba(52,211,153,0.3); color: var(--em);
        }
        .sc-btn-em:hover { background: rgba(52,211,153,0.2); }
        .sc-btn-run {
          background: linear-gradient(135deg, rgba(52,211,153,0.2), rgba(34,211,238,0.15));
          border-color: rgba(52,211,153,0.4); color: var(--em);
        }
        .sc-btn-run:hover { background: linear-gradient(135deg, rgba(52,211,153,0.3), rgba(34,211,238,0.25)); }
        .sc-badge {
          background: var(--em); color: #0a0c14; border-radius: 99px;
          padding: 0 6px; font-size: 11px; font-weight: 800; min-width: 18px; text-align: center;
        }
        .sc-icon-btn {
          background: none; border: none; cursor: pointer; color: var(--mu);
          display: flex; align-items: center; padding: 4px; border-radius: 5px; transition: color 0.15s;
        }
        .sc-icon-btn:hover { color: var(--tx); }

        /* ── Dropdown ─────────────────────────────────────────────── */
        .sc-dropdown {
          position: absolute; top: calc(100% + 7px); left: 0; z-index: 60;
          min-width: 320px; background: var(--bg1); border: 1px solid var(--bd);
          border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.55); padding: 8px; overflow: hidden;
        }
        .sc-dropdown-header {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
          color: var(--mu); padding: 4px 10px 8px;
        }
        .sc-dropdown-item {
          display: flex; align-items: flex-start; gap: 12px; width: 100%; text-align: left;
          padding: 10px 12px; border-radius: 8px; background: transparent; border: none;
          cursor: pointer; font-family: inherit; transition: background 0.12s;
        }
        .sc-dropdown-item:hover { background: rgba(255,255,255,0.05); }
        .sc-dropdown-name { font-size: 14px; font-weight: 700; color: var(--tx); }
        .sc-dropdown-desc { font-size: 12px; color: var(--mu); margin-top: 2px; line-height: 1.4; }
        .sc-dropdown-use { font-size: 11px; color: var(--cy); margin-top: 4px; }

        /* ── Body ─────────────────────────────────────────────────── */
        .sc-body { display: flex; flex: 1; overflow: hidden; min-height: 0; }

        /* ── Palette ──────────────────────────────────────────────── */
        .sc-palette {
          width: 212px; flex-shrink: 0; border-right: 1px solid var(--bd);
          background: var(--bg1); overflow-y: auto; padding: 6px 0 12px;
        }
        .sc-palette-hint {
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
          color: var(--mu); padding: 6px 14px 10px; opacity: 0.7;
        }
        .sc-cat { }
        .sc-cat-header {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 6px 14px; background: transparent; border: none;
          cursor: pointer; font-family: inherit;
        }
        .sc-cat-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
        .sc-palette-block {
          display: flex; align-items: center; gap: 9px;
          margin: 3px 8px; padding: 9px 10px; border-radius: 8px; cursor: grab;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.12s; user-select: none;
        }
        .sc-palette-block:hover {
          background: color-mix(in srgb, var(--cat-color, #818cf8) 12%, transparent);
          border-color: color-mix(in srgb, var(--cat-color, #818cf8) 35%, transparent);
        }
        .sc-palette-icon { flex-shrink: 0; }
        .sc-palette-name { font-size: 13px; font-weight: 600; color: var(--tx2); line-height: 1.2; }
        .sc-palette-desc { font-size: 11px; color: var(--mu); line-height: 1.3; margin-top: 2px; }
        .sc-connect-hint {
          margin: 14px 8px 4px; padding: 10px 11px; border-radius: 8px;
          background: rgba(79,142,247,0.06); border: 1px solid rgba(79,142,247,0.15);
        }
        .sc-hint-title { font-size: 12px; font-weight: 700; color: var(--bl); margin-bottom: 5px; }
        .sc-hint-body { font-size: 12px; color: var(--mu); line-height: 1.6; }

        /* ── Canvas ───────────────────────────────────────────────── */
        .sc-canvas {
          flex: 1; position: relative; overflow: auto; min-width: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
        .sc-svg {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          pointer-events: none; overflow: visible;
        }

        /* Empty state */
        .sc-empty {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center; pointer-events: none;
        }
        .sc-empty > .sc-btn { pointer-events: auto; }
        .sc-empty-title { font-size: 17px; font-weight: 700; color: var(--mu); margin-bottom: 8px; }
        .sc-empty-sub { font-size: 14px; color: var(--bd); text-align: center; max-width: 300px; line-height: 1.6; }

        /* ── Node cards ───────────────────────────────────────────── */
        .sc-node {
          position: absolute; border-radius: 11px; cursor: grab; user-select: none;
          background: var(--bg1);
          border: 1.5px solid rgba(255,255,255,0.12);
          overflow: visible;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .sc-node:hover { border-color: rgba(255,255,255,0.22); }
        .sc-node-selected {
          border-color: var(--node-color, var(--vi)) !important;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--node-color, var(--vi)) 20%, transparent);
        }
        .sc-node-active {
          background: color-mix(in srgb, var(--node-color, var(--em)) 8%, var(--bg1));
          border-color: var(--em) !important;
          box-shadow: 0 0 18px rgba(52,211,153,0.25) !important;
        }
        .sc-node-done { border-color: color-mix(in srgb, var(--node-color, var(--em)) 50%, transparent) !important; }

        .sc-node-strip { height: 5px; border-radius: 9px 9px 0 0; }

        .sc-node-body { padding: 8px 10px 7px; display: flex; flex-direction: column; gap: 4px; }

        .sc-node-header {
          display: flex; align-items: center; gap: 6px;
        }
        .sc-node-icon { flex-shrink: 0; }
        .sc-node-label {
          flex: 1; font-size: 14px; font-weight: 700; color: var(--tx); line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sc-node-btns { display: flex; gap: 1px; flex-shrink: 0; }
        .sc-node-btn {
          background: none; border: none; cursor: pointer; color: var(--mu);
          padding: 2px; border-radius: 4px; display: flex; align-items: center;
          transition: color 0.12s;
        }
        .sc-node-btn:hover { color: var(--tx); }

        .sc-node-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .sc-node-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .sc-node-status { font-size: 11px; font-weight: 600; }
        .sc-done { color: var(--em); }
        .sc-active { color: var(--am); }
        .sc-node-model { font-size: 11px; color: var(--cy); font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }

        /* Ports */
        .sc-port-in, .sc-port-out {
          position: absolute; top: calc(50% - 8px);
          width: 16px; height: 16px; border-radius: 50%;
          transition: all 0.15s; z-index: 2; cursor: pointer;
        }
        .sc-port-in {
          left: -8px;
          background: var(--bg);
          border: 2.5px solid rgba(79,142,247,0.4);
        }
        .sc-port-in.sc-port-hot {
          border-color: #4f8ef7; background: rgba(79,142,247,0.2); cursor: pointer;
        }
        .sc-port-in:hover { border-color: #4f8ef7; background: rgba(79,142,247,0.3); }
        .sc-port-out {
          right: -8px;
          background: var(--bg);
          border: 2.5px solid rgba(52,211,153,0.5);
        }
        .sc-port-out:hover, .sc-port-active { border-color: #34d399; background: rgba(52,211,153,0.3); }

        /* Learn tip popup */
        .sc-learn-tip {
          position: absolute; bottom: calc(100% + 8px); left: 50%;
          transform: translateX(-50%);
          background: var(--bg1); border: 1px solid var(--bd); border-radius: 9px;
          padding: 10px 12px; font-size: 13px; color: var(--di); line-height: 1.6;
          max-width: 260px; z-index: 20; box-shadow: 0 6px 24px rgba(0,0,0,0.55);
          white-space: normal; pointer-events: none;
        }
        .sc-learn-tip-title { font-size: 12px; font-weight: 700; margin-bottom: 5px; }

        /* ── Config panel ─────────────────────────────────────────── */
        .sc-config-wrap {
          flex-shrink: 0; border-left: 1px solid var(--bd);
          background: var(--bg1); overflow-y: auto; overflow-x: hidden;
          transition: width 0.2s ease;
        }
        .sc-config { padding: 16px; min-width: 264px; }
        .sc-config-header {
          display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px;
        }
        .sc-config-icon {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .sc-config-title-wrap { flex: 1; min-width: 0; }
        .sc-config-title { font-size: 15px; font-weight: 700; color: var(--tx); }
        .sc-config-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }
        .sc-config-desc {
          font-size: 13px; color: var(--di); line-height: 1.55;
          padding: 9px 11px; background: rgba(255,255,255,0.03);
          border: 1px solid; border-radius: 7px; margin-bottom: 14px;
        }

        /* Fields */
        .sc-field { margin-bottom: 12px; }
        .sc-field-label {
          display: block; font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.08em; color: var(--mu); margin-bottom: 5px;
        }
        .sc-input {
          width: 100%; padding: 7px 10px; border-radius: 7px;
          background: var(--bg2); border: 1px solid var(--bd); color: var(--tx);
          font-size: 13px; outline: none; font-family: inherit; box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .sc-input:focus { border-color: var(--vi); }
        .sc-textarea { resize: vertical; line-height: 1.55; }

        /* Learn box */
        .sc-learn-box {
          margin: 4px 0 14px; padding: 10px 11px; border-radius: 7px;
          background: rgba(79,142,247,0.06); border: 1px solid rgba(79,142,247,0.18);
        }
        .sc-learn-box-title { font-size: 12px; font-weight: 700; color: var(--bl); margin-bottom: 4px; }
        .sc-learn-box-text { font-size: 13px; color: var(--mu); line-height: 1.6; }

        .sc-delete-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%; padding: 8px; border-radius: 8px; margin-top: 4px;
          background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.22);
          color: var(--ro); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .sc-delete-btn:hover { background: rgba(248,113,113,0.16); }

        .sc-config-empty {
          padding: 24px 16px; color: var(--mu); font-size: 13px;
          text-align: center; line-height: 1.6;
        }

        /* ── Execution log ────────────────────────────────────────── */
        .sc-log {
          height: 170px; border-top: 1px solid var(--bd); background: var(--bg);
          display: flex; flex-direction: column; flex-shrink: 0;
        }
        .sc-log-header {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 14px; border-bottom: 1px solid var(--bd); flex-shrink: 0;
        }
        .sc-log-title {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--mu);
        }
        .sc-log-count { font-size: 11px; color: var(--mu); margin-left: auto; }
        .sc-log-body {
          flex: 1; overflow-y: auto; padding: 8px 14px;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        .sc-log-empty { font-size: 13px; color: var(--mu); padding-top: 4px; }
        .sc-log-line { font-size: 13px; line-height: 1.75; }
        .sc-log-ok     { color: var(--em); }
        .sc-log-node   { color: var(--vi); }
        .sc-log-detail { color: var(--mu); }
        .sc-log-info   { color: var(--tx2); }

        /* ── Spin animation ───────────────────────────────────────── */
        .sc-spin { animation: sc-spin 1s linear infinite; }
        @keyframes sc-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
