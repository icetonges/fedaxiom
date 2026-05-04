"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Play, Trash2, RotateCcw, ChevronDown, Loader2, CheckCircle,
  Zap, Brain, Search, Database, Cpu, BookOpen, Code2, Save,
  GitBranch, X, Plus, ArrowRight, Sparkles, Network, Layers,
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
    icon: <Zap size={14}/>, desc: "The user's message — starting point of every pipeline",
    learnNote: "Every agent pipeline starts with user intent. This node represents what the human asks.",
    configFields: [{ key: "placeholder", label: "Example prompt", default: "What is RAG and when should I use it?" }],
  },
  "file-input": {
    label: "File Input", cat: "Input", color: "#4f8ef7",
    icon: <BookOpen size={14}/>, desc: "Load a document (PDF, TXT, MD) as pipeline input",
    learnNote: "Use when you want to analyze or summarize an uploaded document.",
    configFields: [{ key: "fileType", label: "Accepted types", default: "PDF, TXT, MD, DOCX" }],
  },
  "llm": {
    label: "LLM Engine", cat: "LLM Core", color: "#818cf8",
    icon: <Brain size={14}/>, desc: "Call an AI model — the reasoning and generation powerhouse",
    learnNote: "The core of every AI pipeline. Receives context, reasons, generates output. Choose model carefully for cost/quality tradeoffs.",
    configFields: [
      { key: "model", label: "Model", default: "gemini-2.5-flash" },
      { key: "temperature", label: "Temperature (0=precise, 1=creative)", default: "0.7" },
      { key: "systemPrompt", label: "System Prompt", default: "You are a helpful AI assistant. Be concise and accurate.", multiline: true },
    ],
  },
  "system-prompt": {
    label: "System Prompt", cat: "LLM Core", color: "#818cf8",
    icon: <Settings size={14}/>, desc: "Define the agent's persona, rules, and output format",
    learnNote: "The single highest-leverage prompt engineering artifact. Think of it as the agent's job description.",
    configFields: [
      { key: "role", label: "Agent Role", default: "AI Research Assistant" },
      { key: "instructions", label: "Instructions", default: "Always cite sources.\nRespond in structured Markdown.\nSay 'I don't know' rather than guessing.", multiline: true },
    ],
  },
  "prompt-tmpl": {
    label: "Prompt Template", cat: "LLM Core", color: "#818cf8",
    icon: <Code2 size={14}/>, desc: "Reusable template with {{variable}} placeholders",
    learnNote: "Templates let you inject dynamic values (user input, retrieved docs) into structured prompts reliably.",
    configFields: [
      { key: "template", label: "Template (use {{input}} for data)", default: "Analyze the following and extract key points:\n\n{{input}}\n\nReturn: {summary, keyPoints: [], confidence}", multiline: true },
    ],
  },
  "rag": {
    label: "RAG Retrieve", cat: "Knowledge", color: "#34d399",
    icon: <Database size={14}/>, desc: "Semantic search your knowledge base — grounded answers",
    learnNote: "RAG = Retrieval-Augmented Generation. Fetches relevant document chunks to give the LLM real, traceable facts.",
    configFields: [
      { key: "topK", label: "Top-K chunks to retrieve", default: "5" },
      { key: "minScore", label: "Min relevance score (0-1)", default: "0.7" },
    ],
  },
  "web-search": {
    label: "Web Search", cat: "Knowledge", color: "#34d399",
    icon: <Search size={14}/>, desc: "Live web search — real-time information beyond training data",
    learnNote: "Agents without web search have a knowledge cutoff. This tool gives them current information.",
    configFields: [
      { key: "maxResults", label: "Max results", default: "5" },
      { key: "searchType", label: "Search type", default: "general" },
    ],
  },
  "session-mem": {
    label: "Session Memory", cat: "Memory", color: "#fbbf24",
    icon: <Layers size={14}/>, desc: "Remember conversation history across turns",
    learnNote: "Without session memory, every turn is a fresh start. This makes agents feel coherent and contextual.",
    configFields: [
      { key: "maxTurns", label: "Max turns to remember", default: "20" },
      { key: "compression", label: "Compress old turns", default: "true" },
    ],
  },
  "working-mem": {
    label: "Working Memory", cat: "Memory", color: "#fbbf24",
    icon: <GitBranch size={14}/>, desc: "Agent scratchpad — tracks goal, steps, findings for current task",
    learnNote: "Working memory prevents agents from losing track on complex multi-step tasks. Essential for ReAct agents.",
    configFields: [
      { key: "schema", label: "Memory schema", default: "goal, steps_taken, key_findings, current_focus" },
    ],
  },
  "calculator": {
    label: "Calculator Tool", cat: "Tools", color: "#38bdf8",
    icon: <Cpu size={14}/>, desc: "Safe math evaluation and code execution",
    learnNote: "LLMs are unreliable at arithmetic. Offload math to a deterministic calculator tool.",
    configFields: [
      { key: "sandbox", label: "Execution sandbox", default: "safe-eval" },
    ],
  },
  "api-call": {
    label: "API Call", cat: "Tools", color: "#38bdf8",
    icon: <Network size={14}/>, desc: "Call any external REST API — weather, databases, services",
    learnNote: "API tools extend the agent's reach to any external system: CRMs, databases, IoT, payment APIs.",
    configFields: [
      { key: "url", label: "Endpoint URL", default: "https://api.example.com/data" },
      { key: "method", label: "HTTP Method", default: "GET" },
      { key: "headers", label: "Headers (JSON)", default: '{"Authorization": "Bearer {{api_key}}"}' },
    ],
  },
  "guardrail": {
    label: "Guardrail", cat: "Safety", color: "#f87171",
    icon: <AlertCircle size={14}/>, desc: "Input/output safety filter — blocks harmful content",
    learnNote: "Production AI must have guardrails. This node inspects text and blocks PII, prompt injection, harmful content.",
    configFields: [
      { key: "checks", label: "Enabled checks", default: "pii, injection, toxicity, off-topic" },
      { key: "action", label: "On violation", default: "block" },
    ],
  },
  "evaluator": {
    label: "LLM Evaluator", cat: "Safety", color: "#f87171",
    icon: <CheckCircle size={14}/>, desc: "LLM-as-a-Judge: score output quality (1-5 per dimension)",
    learnNote: "Use a strong model to judge your agent's outputs. Critical for CI/CD quality gates.",
    configFields: [
      { key: "judgeModel", label: "Judge model", default: "gemini-2.5-pro" },
      { key: "criteria", label: "Eval criteria", default: "correctness, helpfulness, safety" },
    ],
  },
  "output": {
    label: "Final Answer", cat: "Output", color: "#fb923c",
    icon: <Sparkles size={14}/>, desc: "Terminal output — streams final response to user",
    learnNote: "The terminal node. Every pipeline needs at least one output. Can also route to APIs or save to file.",
    configFields: [
      { key: "format", label: "Output format", default: "markdown" },
      { key: "streaming", label: "Stream tokens", default: "true" },
    ],
  },
};

const PALETTE_CATS = [
  { name: "Input",    color: "#4f8ef7", types: ["user-input", "file-input"] },
  { name: "LLM Core",color: "#818cf8", types: ["llm", "system-prompt", "prompt-tmpl"] },
  { name: "Knowledge",color: "#34d399", types: ["rag", "web-search"] },
  { name: "Memory",  color: "#fbbf24", types: ["session-mem", "working-mem"] },
  { name: "Tools",   color: "#38bdf8", types: ["calculator", "api-call"] },
  { name: "Safety",  color: "#f87171", types: ["guardrail", "evaluator"] },
  { name: "Output",  color: "#fb923c", types: ["output"] },
];

const NODE_W = 165;
const NODE_H = 70;

// ─── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES: { name: string; desc: string; useCase: string; nodes: FlowNode[]; edges: FlowEdge[] }[] = [
  {
    name: "Simple RAG Chat",
    desc: "Grounded Q&A — retrieves context from your knowledge base before answering",
    useCase: "Customer support bots, document Q&A, internal knowledge assistants",
    nodes: [
      { id: "n1", type: "user-input",   label: "User Question", x: 40,  y: 200, config: { placeholder: "What are the refund policies?" } },
      { id: "n2", type: "rag",          label: "RAG Retrieve",  x: 280, y: 200, config: { topK: "5", minScore: "0.7" } },
      { id: "n3", type: "llm",          label: "LLM Engine",    x: 520, y: 200, config: { model: "gemini-2.5-flash", systemPrompt: "Answer only based on the provided context. Cite the source document. If the answer is not in the context, say so." } },
      { id: "n4", type: "output",       label: "Grounded Answer",x: 760, y: 200, config: { format: "markdown" } },
    ],
    edges: [{ id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" }, { id: "e3", source: "n3", target: "n4" }],
  },
  {
    name: "ReAct Research Agent",
    desc: "Autonomous research agent with memory — searches web, stores findings, synthesizes report",
    useCase: "Market research, competitive analysis, technical research reports",
    nodes: [
      { id: "n1", type: "user-input",    label: "Research Goal",  x: 40,  y: 80,  config: { placeholder: "Analyze the current state of multimodal AI models" } },
      { id: "n2", type: "system-prompt", label: "Agent Persona",  x: 40,  y: 240, config: { role: "Research Analyst", instructions: "Search multiple sources. Cross-validate facts. Cite every claim. Structure output with sections." } },
      { id: "n3", type: "working-mem",   label: "Working Memory", x: 280, y: 80,  config: { schema: "goal, steps_taken, key_findings, sources_checked" } },
      { id: "n4", type: "web-search",    label: "Web Search",     x: 280, y: 240, config: { maxResults: "5" } },
      { id: "n5", type: "llm",           label: "Reasoner + Synth",x: 520, y: 160, config: { model: "gemini-2.5-flash", temperature: "0.3" } },
      { id: "n6", type: "output",        label: "Research Report",x: 760, y: 160, config: { format: "markdown" } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n3" }, { id: "e2", source: "n1", target: "n4" },
      { id: "e3", source: "n2", target: "n5" }, { id: "e4", source: "n3", target: "n5" },
      { id: "e5", source: "n4", target: "n5" }, { id: "e6", source: "n5", target: "n6" },
    ],
  },
  {
    name: "Safe Production Agent",
    desc: "Input guardrail → LLM → evaluator → output — the production safety pattern",
    useCase: "Any customer-facing AI feature where safety and quality are non-negotiable",
    nodes: [
      { id: "n1", type: "user-input",  label: "User Input",      x: 40,  y: 200, config: {} },
      { id: "n2", type: "guardrail",   label: "Input Guard",     x: 260, y: 200, config: { checks: "pii, injection, toxicity", action: "block" } },
      { id: "n3", type: "llm",         label: "LLM Engine",      x: 480, y: 200, config: { model: "gemini-2.5-flash", temperature: "0.5" } },
      { id: "n4", type: "evaluator",   label: "Quality Judge",   x: 700, y: 200, config: { judgeModel: "gemini-2.5-flash", criteria: "correctness, safety, helpfulness" } },
      { id: "n5", type: "guardrail",   label: "Output Guard",    x: 700, y: 340, config: { checks: "pii, harmful-content", action: "sanitize" } },
      { id: "n6", type: "output",      label: "Safe Response",   x: 920, y: 270, config: { format: "markdown" } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" },
      { id: "e3", source: "n3", target: "n4" }, { id: "e4", source: "n3", target: "n5" },
      { id: "e5", source: "n4", target: "n6" }, { id: "e6", source: "n5", target: "n6" },
    ],
  },
  {
    name: "Memory-Augmented Chat",
    desc: "Stateful conversation with session + working memory — feels genuinely intelligent",
    useCase: "Tutors, personal assistants, long-horizon task agents",
    nodes: [
      { id: "n1", type: "user-input",  label: "User Message",   x: 40,  y: 200, config: {} },
      { id: "n2", type: "session-mem", label: "Session History", x: 280, y: 100, config: { maxTurns: "20", compression: "true" } },
      { id: "n3", type: "working-mem", label: "Task Memory",    x: 280, y: 300, config: { schema: "current_goal, open_questions, agreed_facts" } },
      { id: "n4", type: "llm",         label: "LLM + Context",  x: 520, y: 200, config: { model: "gemini-2.5-flash", systemPrompt: "You have access to conversation history and working memory. Use them to give personalised, context-aware responses." } },
      { id: "n5", type: "output",      label: "Response",       x: 760, y: 200, config: { streaming: "true" } },
    ],
    edges: [
      { id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n1", target: "n3" },
      { id: "e3", source: "n2", target: "n4" }, { id: "e4", source: "n3", target: "n4" },
      { id: "e5", source: "n4", target: "n5" },
    ],
  },
];

// ─── SVG edge helper ──────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

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

  // ── Drag node from canvas ──────────────────────────────────────────────────
  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    if ((e.target as HTMLElement).closest(".port-btn")) return;
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

  // ── Drop from palette ──────────────────────────────────────────────────────
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

  // ── Port connection logic ──────────────────────────────────────────────────
  const onOutPortClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnecting({ sourceId: nodeId });
  }, []);

  const onInPortClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (!connecting || connecting.sourceId === nodeId) { setConnecting(null); return; }
    const dup = edges.find(ed => ed.source === connecting.sourceId && ed.target === nodeId);
    if (!dup) {
      setEdges(es => [...es, { id: `e${Date.now()}`, source: connecting.sourceId, target: nodeId }]);
    }
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

    log("▶ Flow execution started…");

    // Topological order via simple BFS from input nodes
    const inDegree = new Map<string, number>();
    nodes.forEach(n => inDegree.set(n.id, 0));
    edges.forEach(e => inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1));
    const queue = nodes.filter(n => (inDegree.get(n.id) || 0) === 0).map(n => n.id);
    const order: string[] = [];
    const tempDegree = new Map(inDegree);
    const q = [...queue];
    while (q.length > 0) {
      const id = q.shift()!;
      order.push(id);
      edges.filter(e => e.source === id).forEach(e => {
        const d = (tempDegree.get(e.target) || 1) - 1;
        tempDegree.set(e.target, d);
        if (d === 0) q.push(e.target);
      });
    }
    // Include any remaining nodes
    nodes.forEach(n => { if (!order.includes(n.id)) order.push(n.id); });

    for (const nodeId of order) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;
      const def = BLOCK_DEFS[node.type];
      setActiveNodes(a => [...a, nodeId]);
      log(`  ⚡ ${def?.label ?? node.label} — processing…`);
      await delay(800 + Math.random() * 700);

      // Simulate node-specific output
      switch (node.type) {
        case "user-input":   log(`     → Input: "${node.config.placeholder || 'User message'}"`); break;
        case "rag":          log(`     → Retrieved ${node.config.topK || 5} chunks (avg score 0.87)`); break;
        case "web-search":   log(`     → Found ${node.config.maxResults || 5} results from web`); break;
        case "llm":          log(`     → ${node.config.model || 'gemini-2.5-flash'}: 312 tokens generated`); break;
        case "session-mem":  log(`     → Loaded ${node.config.maxTurns || 20} turns of history`); break;
        case "working-mem":  log(`     → Memory updated: goal + 3 key findings`); break;
        case "guardrail":    log(`     → ✓ Safe: no violations detected`); break;
        case "evaluator":    log(`     → Score: correctness 4.2/5, safety 5/5, helpfulness 4.5/5`); break;
        case "api-call":     log(`     → HTTP ${node.config.method || 'GET'} → 200 OK (42ms)`); break;
        case "output":       log(`     → ✅ Final answer streamed to user`); break;
        default:             log(`     → Processing complete`);
      }

      setActiveNodes(a => a.filter(id => id !== nodeId));
      setCompletedNodes(c => [...c, nodeId]);
    }

    log("✅ Flow completed successfully!");
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
    const json = JSON.stringify({ nodes, edges }, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : null;
  const selectedDef = selectedNode ? BLOCK_DEFS[selectedNode.type] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#0a0c15" }}>

      {/* ── Top toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
        borderBottom: "1px solid var(--bd)", background: "#12141f", flexShrink: 0, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#818cf8,#4f8ef7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Layers size={14} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#eaedf8" }}>AI Pipeline Builder</div>
            <div style={{ fontSize: 10, color: "#4f8ef7" }}>Lego-style visual canvas</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {/* Templates */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowTemplates(s => !s)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7,
              background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.3)",
              color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              <Sparkles size={12}/> Templates <ChevronDown size={10}/>
            </button>
            {showTemplates && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50, minWidth: 280,
                background: "#1c1f30", border: "1px solid var(--bd)", borderRadius: 10,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)", padding: 8,
              }}>
                {TEMPLATES.map((t, i) => (
                  <button key={i} onClick={() => loadTemplate(t)} style={{
                    display: "block", width: "100%", textAlign: "left", padding: "10px 12px",
                    borderRadius: 7, background: "transparent", border: "none", cursor: "pointer",
                    fontFamily: "inherit", transition: "background 0.12s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#eaedf8" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#6b7499", marginTop: 2, lineHeight: 1.4 }}>{t.desc}</div>
                    <div style={{ fontSize: 10, color: "#38bdf8", marginTop: 3 }}>📋 {t.useCase}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => { setShowLog(s => !s); }} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7,
            background: showLog ? "rgba(34,211,153,0.12)" : "var(--bg2)",
            border: `1px solid ${showLog ? "rgba(34,211,153,0.3)" : "var(--bd)"}`,
            color: showLog ? "var(--em)" : "var(--tx2)", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>
            Exec Log {runLog.length > 0 && <span style={{ background: "var(--em)", color: "#0a0c14", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>{runLog.length}</span>}
          </button>

          <button onClick={exportFlow} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 7,
            background: "var(--bg2)", border: "1px solid var(--bd)", color: "var(--tx2)", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>
            {copied ? <><Check size={11}/> Copied!</> : <><Copy size={11}/> Export</>}
          </button>

          <button onClick={clearCanvas} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 7,
            background: "var(--bg2)", border: "1px solid var(--bd)", color: "var(--tx2)", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>
            <RotateCcw size={11}/> Clear
          </button>

          <button onClick={runFlow} disabled={running || nodes.length === 0} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 7,
            background: running ? "rgba(52,211,153,0.1)" : "linear-gradient(135deg,rgba(52,211,153,0.2),rgba(34,211,238,0.15))",
            border: "1px solid rgba(52,211,153,0.4)",
            color: "#34d399", fontSize: 13, fontWeight: 700, cursor: running ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>
            {running ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }}/> Running…</>
                     : <><Play size={13}/> Run Flow</>}
          </button>
        </div>
      </div>

      {/* ── Main area: Palette + Canvas + Config ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── LEFT: Block palette ── */}
        <div style={{
          width: 168, flexShrink: 0, borderRight: "1px solid var(--bd)",
          background: "#12141f", overflowY: "auto", padding: "8px 0",
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#3d4460", textTransform: "uppercase", letterSpacing: "0.12em", padding: "4px 12px 8px" }}>
            ← Drag onto canvas
          </div>
          {PALETTE_CATS.map(cat => {
            const collapsed = paletteCollapsed[cat.name];
            return (
              <div key={cat.name}>
                <button onClick={() => setPaletteCollapsed(p => ({ ...p, [cat.name]: !collapsed }))} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "5px 12px", background: "transparent", border: "none",
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: cat.color, textTransform: "uppercase", letterSpacing: "0.1em" }}>{cat.name}</span>
                  <ChevronDown size={10} style={{ color: "#3d4460", transform: collapsed ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }}/>
                </button>
                {!collapsed && cat.types.map(type => {
                  const def = BLOCK_DEFS[type];
                  if (!def) return null;
                  return (
                    <div
                      key={type}
                      draggable
                      onDragStart={e => { paletteDragType.current = type; e.dataTransfer.setData("blockType", type); }}
                      onDragEnd={() => { paletteDragType.current = null; }}
                      style={{
                        display: "flex", alignItems: "center", gap: 7,
                        margin: "2px 8px", padding: "7px 9px", borderRadius: 7, cursor: "grab",
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = cat.color + "18";
                        (e.currentTarget as HTMLElement).style.borderColor = cat.color + "44";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                      }}
                    >
                      <div style={{ color: cat.color, flexShrink: 0 }}>{def.icon}</div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#c9d1f0", lineHeight: 1.2 }}>{def.label}</div>
                        <div style={{ fontSize: 9, color: "#4a5070", lineHeight: 1.3, marginTop: 1 }}>{def.desc.slice(0, 32)}…</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Hint */}
          <div style={{ margin: "12px 8px 4px", padding: "8px 9px", borderRadius: 7, background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.12)" }}>
            <div style={{ fontSize: 10, color: "#4f8ef7", fontWeight: 700, marginBottom: 3 }}>💡 How to connect</div>
            <div style={{ fontSize: 10, color: "#3d4460", lineHeight: 1.5 }}>Click the <span style={{ color: "#34d399" }}>▶</span> port on a node's right edge, then click the <span style={{ color: "#4f8ef7" }}>◀</span> port on the target node's left edge.</div>
          </div>
        </div>

        {/* ── CENTER: Canvas ── */}
        <div
          ref={canvasRef}
          style={{
            flex: 1, position: "relative", overflow: "auto",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            cursor: connecting ? "crosshair" : "default",
            minWidth: 0,
          }}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onClick={onCanvasClick}
          onDragOver={e => e.preventDefault()}
          onDrop={onCanvasDrop}
        >
          {/* Empty state */}
          {nodes.length === 0 && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🧱</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#3d4460", marginBottom: 6 }}>Canvas is empty</div>
              <div style={{ fontSize: 12, color: "#2a2e46", textAlign: "center", maxWidth: 260, lineHeight: 1.6 }}>
                Drag blocks from the left palette, or choose a template above to get started
              </div>
            </div>
          )}

          {/* SVG layer — edges */}
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#4f8ef7" opacity="0.7"/>
              </marker>
            </defs>
            {edges.map(edge => {
              const src = getNode(edge.source);
              const tgt = getNode(edge.target);
              if (!src || !tgt) return null;
              const p1 = getPortPos(src, "out");
              const p2 = getPortPos(tgt, "in");
              const isActive = activeNodes.includes(edge.source) || activeNodes.includes(edge.target);
              return (
                <g key={edge.id} style={{ pointerEvents: "auto" }}>
                  <path d={bezierPath(p1.x, p1.y, p2.x, p2.y)} fill="none"
                    stroke="transparent" strokeWidth={12}
                    onClick={() => deleteEdge(edge.id)} style={{ cursor: "pointer" }}
                  />
                  <path d={bezierPath(p1.x, p1.y, p2.x, p2.y)} fill="none"
                    stroke={isActive ? "#34d399" : "#2a3448"}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeDasharray={isActive ? "6 3" : "none"}
                    markerEnd="url(#arrowhead)"
                    style={{ transition: "stroke 0.3s" }}
                  />
                  {/* Animated packet when active */}
                  {isActive && (
                    <circle r="4" fill="#34d399" opacity="0.9">
                      <animateMotion dur="1s" repeatCount="indefinite"
                        path={bezierPath(p1.x, p1.y, p2.x, p2.y)}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
            {/* Pending connection line */}
            {connecting && (() => {
              const src = getNode(connecting.sourceId);
              if (!src) return null;
              const p1 = getPortPos(src, "out");
              return (
                <path d={bezierPath(p1.x, p1.y, mousePos.x, mousePos.y)} fill="none"
                  stroke="#818cf8" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.7}
                />
              );
            })()}
          </svg>

          {/* Node cards */}
          {nodes.map(node => {
            const def = BLOCK_DEFS[node.type];
            const isSelected = selectedNodeId === node.id;
            const isActive = activeNodes.includes(node.id);
            const isDone = completedNodes.includes(node.id);
            const color = def?.color ?? "#6b7499";
            return (
              <div
                key={node.id}
                style={{
                  position: "absolute", left: node.x, top: node.y,
                  width: NODE_W, height: NODE_H,
                  background: isActive ? "#1a2a1e" : "#1c1f30",
                  border: `1.5px solid ${isSelected ? color : isActive ? "#34d399" : isDone ? color + "60" : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 10, cursor: "grab", userSelect: "none",
                  boxShadow: isSelected ? `0 0 0 2px ${color}40` : isActive ? "0 0 16px rgba(52,211,153,0.3)" : "none",
                  transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
                  overflow: "visible",
                }}
                onMouseDown={e => onNodeMouseDown(e, node.id)}
              >
                {/* Color header strip */}
                <div style={{
                  height: 4, background: color, borderRadius: "8px 8px 0 0",
                  opacity: isDone ? 1 : 0.7,
                }}/>
                {/* Node content */}
                <div style={{ padding: "6px 8px 4px", display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ color }}>{def?.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#eaedf8", lineHeight: 1 }}>{node.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {def?.learnNote && (
                        <button className="port-btn" onClick={e => { e.stopPropagation(); setShowLearnTip(showLearnTip === node.id ? null : node.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3d4460", padding: 1, display: "flex" }}>
                          <Info size={10}/>
                        </button>
                      )}
                      <button className="port-btn" onClick={e => { e.stopPropagation(); deleteNode(node.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#3d4460", padding: 1, display: "flex" }}>
                        <X size={10}/>
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 9, color: "#4a5070", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {def?.cat} {isDone ? "✓" : isActive ? "⚡" : ""}
                  </div>
                  {/* Config preview */}
                  {node.config.model && <div style={{ fontSize: 9, color: "#38bdf8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.config.model}</div>}
                </div>

                {/* INPUT port — left center */}
                <div className="port-btn" onClick={e => onInPortClick(e, node.id)} style={{
                  position: "absolute", left: -7, top: NODE_H / 2 - 7,
                  width: 14, height: 14, borderRadius: "50%",
                  background: connecting ? "#4f8ef7" : "#12141f",
                  border: `2px solid ${connecting ? "#4f8ef7" : "#2a3448"}`,
                  cursor: connecting ? "pointer" : "default",
                  transition: "all 0.15s", zIndex: 2,
                }}/>

                {/* OUTPUT port — right center */}
                <div className="port-btn" onClick={e => onOutPortClick(e, node.id)} style={{
                  position: "absolute", right: -7, top: NODE_H / 2 - 7,
                  width: 14, height: 14, borderRadius: "50%",
                  background: connecting?.sourceId === node.id ? "#818cf8" : "#12141f",
                  border: `2px solid ${connecting?.sourceId === node.id ? "#818cf8" : "#34d399"}`,
                  cursor: "pointer", transition: "all 0.15s", zIndex: 2,
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#34d399")}
                  onMouseLeave={e => (e.currentTarget.style.background = connecting?.sourceId === node.id ? "#818cf8" : "#12141f")}
                />

                {/* Learn tip popup */}
                {showLearnTip === node.id && def?.learnNote && (
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
                    background: "#1c1f30", border: `1px solid ${color}44`, borderRadius: 8, padding: "8px 10px",
                    fontSize: 11, color: "#b0bcd4", lineHeight: 1.5, maxWidth: 240, zIndex: 10,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.5)", whiteSpace: "normal",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color, marginBottom: 4 }}>💡 Learning Note</div>
                    {def.learnNote}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── RIGHT: Config panel ── */}
        <div style={{
          width: selectedNode ? 220 : 0,
          flexShrink: 0, borderLeft: "1px solid var(--bd)",
          background: "#12141f", overflowY: "auto", overflowX: "hidden",
          transition: "width 0.2s ease",
        }}>
          {selectedNode && selectedDef && (
            <div style={{ padding: 14, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: selectedDef.color + "20", border: `1px solid ${selectedDef.color}40`, display: "flex", alignItems: "center", justifyContent: "center", color: selectedDef.color }}>
                    {selectedDef.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#eaedf8" }}>{selectedNode.label}</div>
                    <div style={{ fontSize: 9, color: selectedDef.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{selectedDef.cat}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedNodeId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3d4460" }}>
                  <X size={13}/>
                </button>
              </div>

              <div style={{ fontSize: 11, color: "#6b7499", lineHeight: 1.5, marginBottom: 12, padding: "7px 9px", background: selectedDef.color + "08", borderRadius: 6, border: `1px solid ${selectedDef.color}18` }}>
                {selectedDef.desc}
              </div>

              {/* Label rename */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7499", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Label</div>
                <input
                  value={selectedNode.label}
                  onChange={e => setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n))}
                  style={{ width: "100%", padding: "5px 8px", borderRadius: 6, background: "var(--bg2)", border: "1px solid var(--bd)", color: "var(--tx)", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              {/* Config fields */}
              {selectedDef.configFields.map(field => (
                <div key={field.key} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7499", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{field.label}</div>
                  {field.multiline ? (
                    <textarea
                      value={selectedNode.config[field.key] ?? field.default}
                      onChange={e => setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.key]: e.target.value } } : n))}
                      rows={3}
                      style={{ width: "100%", padding: "5px 8px", borderRadius: 6, background: "var(--bg2)", border: "1px solid var(--bd)", color: "var(--tx)", fontSize: 11, outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }}
                    />
                  ) : (
                    <input
                      value={selectedNode.config[field.key] ?? field.default}
                      onChange={e => setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, [field.key]: e.target.value } } : n))}
                      style={{ width: "100%", padding: "5px 8px", borderRadius: 6, background: "var(--bg2)", border: "1px solid var(--bd)", color: "var(--tx)", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                    />
                  )}
                </div>
              ))}

              {/* Learn note */}
              {selectedDef.learnNote && (
                <div style={{ marginTop: 8, padding: "8px 9px", borderRadius: 6, background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.15)" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4f8ef7", marginBottom: 3 }}>💡 Learn</div>
                  <div style={{ fontSize: 11, color: "#6b7499", lineHeight: 1.55 }}>{selectedDef.learnNote}</div>
                </div>
              )}

              <button onClick={() => deleteNode(selectedNode.id)} style={{
                display: "flex", alignItems: "center", gap: 5, width: "100%", justifyContent: "center",
                marginTop: 14, padding: "7px", borderRadius: 7,
                background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)",
                color: "var(--ro)", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}>
                <Trash2 size={12}/> Delete Node
              </button>
            </div>
          )}

          {!selectedNode && (
            <div style={{ padding: 14, color: "#2a3448", fontSize: 11, textAlign: "center", marginTop: 20 }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>⚙️</div>
              Click any node to configure it
            </div>
          )}
        </div>
      </div>

      {/* ── Execution log panel ── */}
      {showLog && (
        <div style={{
          height: 140, borderTop: "1px solid var(--bd)", background: "#0d0f1a",
          display: "flex", flexDirection: "column", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#3d4460", textTransform: "uppercase", letterSpacing: "0.1em" }}>Execution Log</span>
            <button onClick={() => setShowLog(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#3d4460" }}><X size={12}/></button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 12px", fontFamily: "'JetBrains Mono', monospace" }}>
            {runLog.length === 0 ? (
              <div style={{ fontSize: 11, color: "#2a3448", paddingTop: 4 }}>Run the flow to see execution trace here…</div>
            ) : (
              runLog.map((line, i) => (
                <div key={i} style={{ fontSize: 11, color: line.startsWith("✅") ? "#34d399" : line.startsWith("  ⚡") ? "#818cf8" : line.startsWith("     →") ? "#6b7499" : "#b0bcd4", lineHeight: 1.7 }}>{line}</div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
