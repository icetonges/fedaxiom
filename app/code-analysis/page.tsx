"use client";

import React, { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Code2, FolderOpen, Folder, FileText, ChevronRight, ChevronDown,
         Send, Download, Map, LayoutPanelLeft, Cpu, Sparkles, Bug, BookOpen,
         Copy, Check, Zap, RefreshCw, FileCode2, AlignLeft } from "lucide-react";

// ─── FILE TREE DATA ────────────────────────────────────────────────────────
type TreeNode = { name: string; type: "file" | "dir"; children?: TreeNode[]; lines?: number; desc?: string };

const FILE_TREE: TreeNode[] = [
  { name: "src", type: "dir", children: [
    { name: "main.tsx",         type: "file", lines: 4683,  desc: "CLI entry (Commander.js + React/Ink renderer)" },
    { name: "QueryEngine.ts",   type: "file", lines: 890,   desc: "LLM orchestration & message dispatch loop" },
    { name: "Tool.ts",          type: "file", lines: 140,   desc: "Base Tool interface & registration types" },
    { name: "Task.ts",          type: "file", lines: 220,   desc: "Task polymorphism — 6 task type implementations" },
    { name: "AppState.tsx",     type: "file", lines: 360,   desc: "Central reactive state (session, messages, permissions)" },
    { name: "context.ts",       type: "file", lines: 88,    desc: "Global application context providers" },
    { name: "commands.ts",      type: "file", lines: 312,   desc: "Slash command registry & routing" },
    { name: "query.ts",         type: "file", lines: 280,   desc: "Query execution pipeline (pre/post processing)" },
    { name: "history.ts",       type: "file", lines: 185,   desc: "Session history management & persistence" },
    { name: "cost-tracker.ts",  type: "file", lines: 130,   desc: "Token usage & cost aggregation" },
    { name: "tools", type: "dir", children: [
      { name: "FileReadTool.ts",    type: "file", lines: 95,  desc: "Read files from local filesystem" },
      { name: "FileEditTool.ts",    type: "file", lines: 280, desc: "Precise string-replace file editing" },
      { name: "FileWriteTool.ts",   type: "file", lines: 120, desc: "Write/overwrite full file contents" },
      { name: "GlobTool.ts",        type: "file", lines: 88,  desc: "Fast glob pattern file matching" },
      { name: "GrepTool.ts",        type: "file", lines: 102, desc: "Ripgrep-powered content search" },
      { name: "BashTool.ts",        type: "file", lines: 195, desc: "Execute Bash commands with timeout" },
      { name: "PowerShellTool.ts",  type: "file", lines: 180, desc: "Execute PowerShell commands (Windows)" },
      { name: "AgentTool.ts",       type: "file", lines: 310, desc: "Spawn async sub-agents as background tasks" },
      { name: "MCPTool.ts",         type: "file", lines: 175, desc: "Dynamic MCP protocol tool execution" },
      { name: "WebFetchTool.ts",    type: "file", lines: 145, desc: "HTTP fetch with markdown conversion" },
      { name: "WebSearchTool.ts",   type: "file", lines: 130, desc: "Web search via search engine API" },
      { name: "TodoWriteTool.ts",   type: "file", lines: 88,  desc: "Structured todo list management" },
      { name: "AgentTool.ts (spawn)", type: "file", lines: 310, desc: "Spawns LocalAgentTask or RemoteAgentTask" },
    ]},
    { name: "services", type: "dir", children: [
      { name: "api",       type: "dir", desc: "Anthropic Claude SDK — cost tracking, retry, streaming" },
      { name: "mcp",       type: "dir", desc: "MCP server management, auth, dynamic tool generation" },
      { name: "autoDream", type: "dir", desc: "Background memory consolidation (DreamTask)" },
      { name: "oauth",     type: "dir", desc: "GitHub/Google OAuth providers" },
      { name: "compact",   type: "dir", desc: "Message history compaction & snipping" },
      { name: "lsp",       type: "dir", desc: "Language Server Protocol for code navigation" },
      { name: "analytics", type: "dir", desc: "GrowthBook feature gates & telemetry" },
      { name: "plugins",   type: "dir", desc: "Plugin lifecycle: discovery, versioning, cache" },
    ]},
    { name: "bridge", type: "dir", desc: "IDE integration (VS Code / JetBrains) — 32 files, JWT WebSocket",
      children: [
        { name: "bridgeApi.ts",        type: "file", lines: 240, desc: "Bridge REST API surface" },
        { name: "bridgeMessaging.ts",  type: "file", lines: 310, desc: "Message framing & dispatch" },
        { name: "bridgeUI.ts",         type: "file", lines: 195, desc: "UI state sync to IDE" },
        { name: "replBridge.ts",       type: "file", lines: 280, desc: "REPL session tunneling" },
        { name: "remoteBridgeCore.ts", type: "file", lines: 355, desc: "Remote execution core" },
        { name: "jwtUtils.ts",         type: "file", lines: 90,  desc: "JWT signing for bridge sessions" },
      ]},
    { name: "buddy", type: "dir", desc: "Tamagotchi companion — 18 species, PRNG from userId hash",
      children: [
        { name: "companion.ts",  type: "file", lines: 410, desc: "Deterministic generation via Mulberry32 PRNG" },
        { name: "species.ts",    type: "file", lines: 680, desc: "18 species × ASCII art × 3-frame animation" },
        { name: "soulGen.ts",    type: "file", lines: 120, desc: "Claude-generated personality caching" },
        { name: "stats.ts",      type: "file", lines: 95,  desc: "5 stats: DEBUGGING/PATIENCE/CHAOS/WISDOM/SNARK" },
      ]},
    { name: "coordinator", type: "dir", desc: "Multi-agent swarm orchestration (feature-gated)",
      children: [
        { name: "coordinatorMode.ts", type: "file", lines: 480, desc: "Swarm spawning & team tool coordination" },
      ]},
    { name: "components", type: "dir", desc: "60+ React/Ink terminal UI components",
      children: [
        { name: "design-system", type: "dir", desc: "Base design tokens & primitives" },
        { name: "TrustDialog.tsx",    type: "file", lines: 145, desc: "First-run user consent dialog" },
        { name: "Messages.tsx",       type: "file", lines: 390, desc: "Chat message rendering pipeline" },
        { name: "PromptInput.tsx",    type: "file", lines: 285, desc: "Multi-line prompt editor with history" },
        { name: "HighlightedCode.tsx",type: "file", lines: 180, desc: "Syntax-highlighted code blocks" },
        { name: "Diff.tsx",           type: "file", lines: 240, desc: "Side-by-side diff visualization" },
      ]},
    { name: "utils", type: "dir", desc: "100+ utility modules across 15 domains",
      children: [
        { name: "permissions", type: "dir", desc: "Tool permission rules & enforcement engine" },
        { name: "messages",    type: "dir", desc: "SDK↔internal type normalization & mappers" },
        { name: "git",         type: "dir", desc: "Git & GitHub integration utilities" },
        { name: "shell",       type: "dir", desc: "Shell execution with sandbox & timeout" },
        { name: "model",       type: "dir", desc: "Model string parsing & context windows" },
        { name: "settings",    type: "dir", desc: "Config loading: MDM, keychain, env vars" },
        { name: "undercover.ts", type: "file", lines: 85, desc: "Blocks internal codenames (Tengu, Capybara)" },
      ]},
    { name: "commands", type: "dir", desc: "70+ CLI commands",
      children: [
        { name: "session",  type: "dir", desc: "session, resume, rewind, teleport" },
        { name: "review",   type: "dir", desc: "PR review, diff, export" },
        { name: "model",    type: "dir", desc: "Model selection & config" },
        { name: "mcp",      type: "dir", desc: "MCP server management" },
        { name: "agents",   type: "dir", desc: "Agent spawning & monitoring" },
        { name: "doctor",   type: "dir", desc: "Environment health checks" },
      ]},
    { name: "vim", type: "dir", desc: "Full modal Vim editing — motions, operators, text objects" },
    { name: "ink", type: "dir",  desc: "Custom React/Ink terminal renderer with Yoga layout" },
    { name: "native-ts", type: "dir", desc: "TS bindings: file-index, color-diff, yoga-layout" },
  ]},
];

// ─── CODE SNIPPETS ─────────────────────────────────────────────────────────
const FILE_CONTENTS: Record<string, string> = {
  "src/main.tsx": `#!/usr/bin/env bun
// Claude Code — main CLI entry point (4,683 lines)
// Commander.js CLI + React/Ink terminal renderer

import { Command } from "commander";
import { render }   from "ink";
import React        from "react";

import { QueryEngine }   from "./QueryEngine.js";
import { AppState }      from "./state/AppState.js";
import { loadAllTools }  from "./tools.js";
import { bootstrapState } from "./bootstrap/state.js";
import { initAnalytics } from "./services/analytics/index.js";

const program = new Command("claude")
  .description("Anthropic Claude Code")
  .version(PKG_VERSION);

// 70+ subcommands registered here...
program.addCommand(require("./commands/session/index.js").default);
program.addCommand(require("./commands/review/index.js").default);
// ... etc.

program
  .option("--model <id>", "Override default model")
  .option("--dangerously-skip-permissions", "Bypass permission checks")
  .option("--auto-mode", "Non-interactive auto mode")
  .action(async (opts) => {
    const state   = await bootstrapState(opts);
    const tools   = loadAllTools(state);
    const engine  = new QueryEngine({ tools, state });
    await initAnalytics(state);

    // React/Ink renders the terminal UI
    const { unmount } = render(
      <AppRoot engine={engine} state={state} />,
      { exitOnCtrlC: false }
    );

    process.on("SIGINT",  () => { engine.abort(); unmount(); });
    process.on("SIGTERM", () => { engine.abort(); unmount(); });
  });

program.parse(process.argv);`,

  "src/QueryEngine.ts": `// QueryEngine.ts — LLM orchestration & tool dispatch loop
import Anthropic from "@anthropic-ai/sdk";
import type { Tool }    from "./Tool.js";
import type { AppState } from "./state/AppState.js";
import { composeSystemPrompt } from "./utils/systemPromptType.js";

export class QueryEngine {
  private client: Anthropic;
  private tools:  Map<string, Tool>;
  private state:  AppState;
  private aborted = false;

  constructor({ tools, state }: { tools: Map<string, Tool>; state: AppState }) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.tools  = tools;
    this.state  = state;
  }

  abort() { this.aborted = true; }

  async *query(userMessage: string): AsyncGenerator<QueryEvent> {
    const systemPrompt = composeSystemPrompt(this.state);
    const messages     = this.state.getMessages();

    // Add user message
    messages.push({ role: "user", content: userMessage });
    this.state.addMessage({ role: "user", content: userMessage });

    // Main ReAct loop — Thought → Action → Observation
    while (!this.aborted) {
      const stream = this.client.messages.stream({
        model:      this.state.model,
        max_tokens: 8096,
        system:     systemPrompt,
        tools:      this.getToolSchemas(),
        messages,
      });

      let assistantContent: Anthropic.ContentBlock[] = [];

      for await (const event of stream) {
        if (this.aborted) break;
        if (event.type === "content_block_delta") {
          yield { type: "text_delta", delta: event.delta };
        }
        // ... accumulate content blocks
      }

      const response = await stream.finalMessage();
      assistantContent = response.content;
      messages.push({ role: "assistant", content: assistantContent });

      // Check stop reason
      if (response.stop_reason !== "tool_use") break;

      // Execute tool calls
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of assistantContent) {
        if (block.type !== "tool_use") continue;
        const tool   = this.tools.get(block.name);
        if (!tool) continue;
        const result = await tool.execute(block.input, this.state);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        yield { type: "tool_result", toolName: block.name, result };
      }
      messages.push({ role: "user", content: toolResults });
    }
  }

  private getToolSchemas(): Anthropic.Tool[] {
    return Array.from(this.tools.values()).map(t => ({
      name:         t.name,
      description:  t.description,
      input_schema: t.inputJSONSchema,
    }));
  }
}`,

  "src/Tool.ts": `// Tool.ts — Base Tool interface & registration types
import type { AppState } from "./state/AppState.js";
import type { JSONSchema7 } from "json-schema";

/** Every tool in Claude Code implements this interface */
export interface Tool<TInput = Record<string, unknown>> {
  /** Unique identifier used in tool_use blocks */
  name: string;
  /** Human-readable description sent to the LLM */
  description: string;
  /** JSON Schema for the tool's input parameters */
  inputJSONSchema: JSONSchema7;
  /** Execute the tool and return a result string */
  execute(input: TInput, state: AppState): Promise<string>;
  /** Optional: can this tool be used in plan mode? */
  allowInPlanMode?: boolean;
  /** Optional: is this tool dangerous (needs extra confirmation)? */
  isDangerous?: boolean;
}

/** Tool metadata for permission checks */
export interface ToolMeta {
  name:       string;
  isDangerous: boolean;
  allowInPlanMode: boolean;
}

/** Central tool registry — populated by loadAllTools() */
export type Tools = Map<string, Tool>;

/** Tool execution result types */
export type ToolResult =
  | { type: "success"; content: string }
  | { type: "error";   message: string }
  | { type: "abort";   reason:  string };`,

  "src/Task.ts": `// Task.ts — Task polymorphism (6 task types)
export type TaskStatus   = "pending" | "running" | "completed" | "failed" | "killed";
export type TaskType     =
  | "local_bash"
  | "local_agent"
  | "remote_agent"
  | "in_process_teammate"
  | "local_workflow"
  | "dream";

/** Unique task ID: prefix + 8 random base-36 chars = 2.8T combinations */
export function generateTaskId(type: TaskType): string {
  const PREFIXES: Record<TaskType, string> = {
    local_bash:           "b",
    local_agent:          "a",
    remote_agent:         "r",
    in_process_teammate:  "t",
    local_workflow:       "w",
    dream:                "d",
  };
  const rand = Math.random().toString(36).slice(2, 10);
  return \`\${PREFIXES[type]}\${rand}\`;
}

/** Base Task — only kill() is called polymorphically */
export interface Task {
  id:     string;
  type:   TaskType;
  status: TaskStatus;
  kill(): Promise<void>;
}

/** Shell task wraps a child process */
export class LocalShellTask implements Task {
  id:     string;
  type:   TaskType = "local_bash";
  status: TaskStatus = "pending";
  private proc?: import("child_process").ChildProcess;

  constructor(id: string) { this.id = id; }

  async kill() {
    this.proc?.kill("SIGTERM");
    this.status = "killed";
  }
}

/** Agent task manages a spawned sub-agent loop */
export class LocalAgentTask implements Task {
  id:     string;
  type:   TaskType = "local_agent";
  status: TaskStatus = "pending";
  private abortController = new AbortController();

  constructor(id: string) { this.id = id; }

  async kill() {
    this.abortController.abort();
    this.status = "killed";
  }
}`,

  "src/buddy/companion.ts": `// companion.ts — Deterministic buddy generation via Mulberry32 PRNG
// Same userId → same species, rarity, stats, appearance every time

import { SPECIES, type Species } from "./species.js";
import { generateSoul }          from "./soulGen.js";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type Eye    = "·" | "✦" | "×" | "◉" | "@" | "°";
export type Hat    = "crown" | "tophat" | "propeller" | "halo" | "wizard" | "beanie" | "tinyduck";

export interface BuddyStats {
  DEBUGGING: number;  // 0-100
  PATIENCE:  number;
  CHAOS:     number;
  WISDOM:    number;
  SNARK:     number;
}

export interface Companion {
  species:  Species;
  rarity:   Rarity;
  eye:      Eye;
  hat?:     Hat;
  stats:    BuddyStats;
  name:     string;
  soul:     string;  // Claude-generated personality (cached)
}

/** Mulberry32 PRNG — fast, deterministic, good distribution */
function mulberry32(seed: number) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Hash userId string → u32 seed (FNV-1a) */
function hashUserId(userId: string): number {
  let hash = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash;
}

const RARITY_THRESHOLDS: [Rarity, number][] = [
  ["legendary", 0.01],
  ["epic",      0.05],
  ["rare",      0.15],
  ["uncommon",  0.40],
  ["common",    1.00],
];

export async function generateCompanion(userId: string): Promise<Companion> {
  const prng    = mulberry32(hashUserId(userId));
  const r1      = prng();
  const rarity  = RARITY_THRESHOLDS.find(([, t]) => r1 <= t)![0];

  const speciesPool = SPECIES.filter(s => s.minRarity === rarity || rarity === "common");
  const species     = speciesPool[Math.floor(prng() * speciesPool.length)];

  const EYES: Eye[] = ["·", "✦", "×", "◉", "@", "°"];
  const eye         = EYES[Math.floor(prng() * EYES.length)];

  const hat = prng() > 0.7
    ? (["crown","tophat","propeller","halo","wizard","beanie","tinyduck"] as Hat[])[Math.floor(prng() * 7)]
    : undefined;

  const stats: BuddyStats = {
    DEBUGGING: Math.floor(prng() * 100),
    PATIENCE:  Math.floor(prng() * 100),
    CHAOS:     Math.floor(prng() * 100),
    WISDOM:    Math.floor(prng() * 100),
    SNARK:     Math.floor(prng() * 100),
  };

  const soul = await generateSoul(species, rarity, stats);
  return { species, rarity, eye, hat, stats, name: species.name, soul };
}`,

  "src/utils/permissions/index.ts": `// permissions/index.ts — Tool permission rules & enforcement engine

export type PermissionMode =
  | "default"             // Ask for each sensitive operation
  | "auto"                // Allow everything non-destructive
  | "bypass_permissions"  // Allow ALL (--dangerously-skip-permissions)
  | "plan_mode";          // Read-only, no tool execution

export interface PermissionRule {
  tool:    string;
  pattern?: string;
  source:   "user" | "project" | "enterprise_mdm";
}

export interface PermissionContext {
  mode:               PermissionMode;
  alwaysAllowRules:   PermissionRule[];
  alwaysDenyRules:    PermissionRule[];
}

export function checkToolPermission(
  toolName:   string,
  input:      unknown,
  ctx:        PermissionContext
): "allow" | "deny" | "ask" {
  if (ctx.mode === "bypass_permissions") return "allow";
  if (ctx.mode === "plan_mode" && !PLAN_MODE_SAFE_TOOLS.has(toolName)) return "deny";

  const denyMatch = ctx.alwaysDenyRules.find(r => r.tool === toolName);
  if (denyMatch) return "deny";

  const allowMatch = ctx.alwaysAllowRules.find(r => r.tool === toolName);
  if (allowMatch) return "allow";

  return ctx.mode === "auto" ? "allow" : "ask";
}

const PLAN_MODE_SAFE_TOOLS = new Set([
  "FileReadTool", "GlobTool", "GrepTool", "WebFetchTool",
  "WebSearchTool", "ListMcpResourcesTool", "ReadMcpResourceTool",
]);`,
};

// ─── MERMAID DIAGRAM ──────────────────────────────────────────────────────
const MERMAID_CODE = `graph LR
  subgraph Entry["🚀 Entry"]
    main["main.tsx\\n4,683 lines"]
  end
  subgraph Core["⚙️ Core Engine"]
    QE["QueryEngine.ts\\nLLM Orchestration"]
    Tool["Tool.ts\\nInterface"]
    Task["Task.ts\\n6 Task Types"]
    State["AppState.tsx\\nReactive State"]
  end
  subgraph ToolsGrp["🔧 40+ Tools"]
    FileTool["File Tools\\nRead/Edit/Write/Glob/Grep"]
    ShellTool["Shell Tools\\nBash/PowerShell/REPL"]
    AgentTool["AgentTool\\nSpawns Sub-agents"]
    MCPTool["MCP Tool\\nProtocol Tools"]
    WebTool["Web Tools\\nFetch/Search"]
  end
  subgraph SvcGrp["🏗️ Services"]
    API["services/api\\nClaude SDK + Cost"]
    MCPSvc["services/mcp\\nServer Manager"]
    Dream["autoDream\\nMemory Consolidation"]
    Analytics["analytics\\nGrowthBook Gates"]
  end
  subgraph UIGrp["🖥️ UI Layer"]
    Components["60+ Components\\nReact/Ink Terminal"]
    Bridge["bridge/\\nIDE WebSocket"]
    Buddy["buddy/\\nCompanion PRNG"]
  end
  subgraph SecurityGrp["🔒 Security"]
    Perms["Permission System\\n4 Modes"]
    OAuth["OAuth/Keychain\\nAuth Layer"]
    Undercover["undercover.ts\\nCodename Filter"]
  end
  main --> QE
  main --> Components
  QE --> Tool
  QE --> State
  QE --> API
  QE --> Dream
  Tool --> FileTool
  Tool --> ShellTool
  Tool --> AgentTool
  Tool --> MCPTool
  Tool --> WebTool
  AgentTool --> Task
  API --> MCPSvc
  MCPSvc --> MCPTool
  State --> Perms
  Perms --> OAuth
  Bridge --> QE
  Components --> Buddy
  QE --> Analytics`;

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: "summarize_folder", label: "Summarize Folder",       icon: AlignLeft,  color: "#4f8ef7" },
  { id: "find_bugs",        label: "Find Potential Bugs",    icon: Bug,        color: "#f87171" },
  { id: "explain_pattern",  label: "Explain Design Pattern", icon: Sparkles,   color: "#818cf8" },
  { id: "generate_docs",    label: "Generate Docs",          icon: BookOpen,   color: "#34d399" },
] as const;

type QuickActionId = typeof QUICK_ACTIONS[number]["id"];

// ─── SYNTAX HIGHLIGHTER (lightweight) ─────────────────────────────────────
function highlight(code: string): string {
  return code
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    // strings
    .replace(/(`[^`]*`|"[^"]*"|'[^']*')/g,'<span style="color:#a3e635">$1</span>')
    // keywords
    .replace(/\b(import|export|from|const|let|var|function|class|interface|type|extends|implements|return|async|await|new|if|else|for|while|of|in|true|false|null|undefined|void|break|continue|throw|try|catch|finally|default)\b/g,'<span style="color:#c084fc">$1</span>')
    // types / capitalized
    .replace(/\b([A-Z][A-Za-z0-9_]+)\b/g,'<span style="color:#38bdf8">$1</span>')
    // function calls
    .replace(/\b([a-z_][a-zA-Z0-9_]*)(?=\()/g,'<span style="color:#fbbf24">$1</span>')
    // line comments
    .replace(/(\/\/[^\n]*)/g,'<span style="color:#6b7499">$1</span>')
    // numbers
    .replace(/\b(\d+)\b/g,'<span style="color:#fb923c">$1</span>');
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────
export default function CodeAnalysisPage() {
  const [selectedFile, setSelectedFile]     = useState<string>("src/main.tsx");
  const [expandedDirs, setExpandedDirs]     = useState<Set<string>>(new Set(["src","src/tools","src/services","src/bridge","src/buddy"]));
  const [viewMode, setViewMode]             = useState<"code"|"map">("code");
  const [chatInput, setChatInput]           = useState("");
  const [chatMessages, setChatMessages]     = useState<{role:"user"|"assistant";content:string}[]>([
    { role: "assistant", content: "👋 Hi! I've analyzed the full **claude_code_Template** codebase — **182,039 lines** across **1,884 TypeScript files**.\n\nAsk me anything about the architecture, design patterns, or specific modules. Try the Quick Actions to get started!" }
  ]);
  const [isStreaming, setIsStreaming]       = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [mermaidReady, setMermaidReady]     = useState(false);
  const [exportStatus, setExportStatus]     = useState<"idle"|"exporting">("idle");
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const mermaidRef  = useRef<HTMLDivElement>(null);

  // Load Mermaid
  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.getElementById("mermaid-cdn");
    if (existing) { setMermaidReady(true); return; }
    const s = document.createElement("script");
    s.id  = "mermaid-cdn";
    s.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
    s.onload = () => {
      (window as any).mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
      setMermaidReady(true);
    };
    document.head.appendChild(s);
  }, []);

  // Render Mermaid when tab switches
  useEffect(() => {
    if (!mermaidReady || viewMode !== "map" || !mermaidRef.current) return;
    const el = mermaidRef.current;
    el.innerHTML = `<pre class="mermaid">${MERMAID_CODE}</pre>`;
    (window as any).mermaid.run({ nodes: el.querySelectorAll(".mermaid") }).catch(() => {});
  }, [mermaidReady, viewMode]);

  // Auto scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  const sendMessage = useCallback(async (msg: string, action?: QuickActionId) => {
    if (!msg.trim() || isStreaming) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsStreaming(true);
    let acc = "";
    setChatMessages(prev => [...prev, { role: "assistant", content: "▋" }]);
    try {
      const res = await fetch("/api/code-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, file: selectedFile, action }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = dec.decode(value).split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try { acc += JSON.parse(line.slice(2)); } catch {}
            setChatMessages(prev => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: "assistant", content: acc + "▋" };
              return copy;
            });
          }
        }
      }
      setChatMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: acc };
        return copy;
      });
    } catch (e) {
      setChatMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: "⚠️ Analysis failed. Please try again." };
        return copy;
      });
    } finally { setIsStreaming(false); }
  }, [isStreaming, selectedFile]);

  const handleQuickAction = useCallback((actionId: QuickActionId, label: string) => {
    const msg = `${label}: ${selectedFile}`;
    sendMessage(msg, actionId);
  }, [selectedFile, sendMessage]);

  const copyCode = useCallback(() => {
    const content = FILE_CONTENTS[selectedFile] ?? `// ${selectedFile}\n// (Content not in pre-loaded set — ask the AI assistant for details)`;
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [selectedFile]);

  // Static Export
  const handleExport = useCallback(() => {
    setExportStatus("exporting");
    const history = chatMessages.map(m =>
      `<div class="msg ${m.role}"><span class="role">${m.role === "user" ? "You" : "AI"}</span><div class="content">${m.content.replace(/\n/g,"<br>")}</div></div>`
    ).join("");

    const treeHtml = (nodes: TreeNode[], depth=0): string => nodes.map(n => {
      const pad = "&nbsp;".repeat(depth * 3);
      if (n.type === "dir") return `<details><summary>${pad}📁 <b>${n.name}</b>${n.desc ? ` <i>— ${n.desc}</i>` : ""}</summary>${treeHtml(n.children ?? [],depth+1)}</details>`;
      return `<div class="file-item">${pad}📄 ${n.name}${n.lines ? ` <span>(${n.lines}L)</span>` : ""}${n.desc ? ` — ${n.desc}` : ""}</div>`;
    }).join("");

    const snippetsHtml = Object.entries(FILE_CONTENTS).map(([path, code]) =>
      `<details><summary><b>${path}</b></summary><pre><code>${code.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre></details>`
    ).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Claude Code — Source Analysis Report</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  body{font-family:monospace;background:#12141f;color:#eaedf8;line-height:1.6;padding:2rem}
  h1{color:#4f8ef7;font-size:2rem;margin-bottom:0.5rem}
  h2{color:#818cf8;border-bottom:1px solid #252840;padding-bottom:0.3rem;margin:2rem 0 1rem}
  h3{color:#38bdf8;margin:1.5rem 0 0.5rem}
  details{margin:0.3rem 0;background:#1c1f30;border-radius:6px;padding:0.4rem 0.8rem}
  summary{cursor:pointer;color:#9aa3c0;padding:0.2rem 0}
  summary:hover{color:#eaedf8}
  pre{background:#0d0f1a;padding:1rem;border-radius:6px;overflow-x:auto;font-size:0.8rem;color:#c9d1f0;margin:0.5rem 0}
  .file-item{padding:0.15rem 0.5rem;color:#9aa3c0;font-size:0.85rem}
  .file-item span{color:#5c6480}
  .msg{margin:0.5rem 0;padding:0.7rem 1rem;border-radius:8px}
  .msg.user{background:#252840;border-left:3px solid #4f8ef7}
  .msg.assistant{background:#1c1f30;border-left:3px solid #34d399}
  .role{font-weight:bold;font-size:0.75rem;text-transform:uppercase;opacity:0.6;display:block;margin-bottom:0.3rem}
  .search-bar{width:100%;padding:0.6rem 1rem;background:#1c1f30;border:1px solid #252840;border-radius:6px;color:#eaedf8;font-size:1rem;margin-bottom:1.5rem}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.7rem;font-weight:700;margin:2px}
  .stat-card{display:inline-block;background:#252840;border-radius:8px;padding:1rem 1.5rem;margin:0.5rem;text-align:center;min-width:120px}
  .stat-num{font-size:1.5rem;font-weight:700;color:#4f8ef7}
  .stat-lbl{font-size:0.75rem;color:#9aa3c0;margin-top:0.2rem}
</style>
</head>
<body>
<h1>🔬 Claude Code — Source Analysis Report</h1>
<p style="color:#9aa3c0">Generated by AXIOM Code Intelligence · ${new Date().toLocaleString()}</p>

<input class="search-bar" placeholder="🔍 Search this document..." oninput="
  const q=this.value.toLowerCase();
  document.querySelectorAll('details,div').forEach(el=>{
    if(el.textContent.toLowerCase().includes(q)||!q){el.style.opacity='1'}else{el.style.opacity='0.3'}
  })">

<h2>📊 Project Statistics</h2>
<div>
  <div class="stat-card"><div class="stat-num">182K</div><div class="stat-lbl">Lines of Code</div></div>
  <div class="stat-card"><div class="stat-num">1,884</div><div class="stat-lbl">TypeScript Files</div></div>
  <div class="stat-card"><div class="stat-num">40+</div><div class="stat-lbl">Built-in Tools</div></div>
  <div class="stat-card"><div class="stat-num">70+</div><div class="stat-lbl">CLI Commands</div></div>
  <div class="stat-card"><div class="stat-num">60+</div><div class="stat-lbl">UI Components</div></div>
  <div class="stat-card"><div class="stat-num">18</div><div class="stat-lbl">Buddy Species</div></div>
</div>

<h2>🗺️ Architecture Diagram</h2>
<div class="mermaid" style="background:#1c1f30;border-radius:8px;padding:1rem">${MERMAID_CODE}</div>

<h2>📁 File Tree</h2>
${treeHtml(FILE_TREE)}

<h2>💻 Key File Snippets</h2>
${snippetsHtml}

<h2>🤖 AI Analysis Session</h2>
<div id="chat-log">${history}</div>

<h2>🏗️ Architecture Notes</h2>
<h3>Design Patterns</h3>
<ul style="color:#b0bcd4;padding-left:1.5rem">
  <li><b>Feature Gates:</b> GrowthBook flags drive dead-code elimination at bundle time</li>
  <li><b>Tool Registration:</b> Central Map&lt;string, Tool&gt; — QueryEngine dispatches by name</li>
  <li><b>Task Polymorphism:</b> Base Task interface with kill() — 6 concrete implementations</li>
  <li><b>Lazy Imports:</b> require() in closures breaks circular dependency chains</li>
  <li><b>Message Normalization:</b> SDK↔internal bidirectional type mappers</li>
  <li><b>Async Streaming Output:</b> Per-task output files with byte-offset tracking</li>
  <li><b>Deterministic Companion:</b> PRNG seeded from userId hash — same user = same buddy</li>
  <li><b>Permission Context:</b> Immutable context injected through entire query pipeline</li>
  <li><b>MCP Integration:</b> Dynamic tool generation from MCP server capability declarations</li>
</ul>

<script>mermaid.initialize({startOnLoad:true,theme:'dark'});</script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `claude-code-analysis-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus("idle");
  }, [chatMessages]);

  // ─── RENDER TREE ────────────────────────────────────────────────────────
  function renderTree(nodes: TreeNode[], path = "", depth = 0): ReactNode {
    return nodes.map(node => {
      const fullPath = path ? `${path}/${node.name}` : node.name;
      const isExpanded = expandedDirs.has(fullPath);
      const isSelected = selectedFile === fullPath;

      if (node.type === "dir") {
        return (
          <div key={fullPath}>
            <div
              onClick={() => toggleDir(fullPath)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: `4px 8px 4px ${12 + depth * 14}px`,
                cursor: "pointer", borderRadius: 5,
                color: "#9aa3c0", fontSize: 13,
                background: "transparent",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#252840")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
              {isExpanded ? <FolderOpen size={13} color="#fbbf24"/> : <Folder size={13} color="#fbbf24"/>}
              <span style={{ fontWeight: 600 }}>{node.name}</span>
              {node.desc && <span style={{ fontSize: 10, color: "#5c6480", marginLeft: 4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 120 }}>{node.desc}</span>}
            </div>
            {isExpanded && node.children && (
              <div>{renderTree(node.children, fullPath, depth + 1)}</div>
            )}
          </div>
        );
      }

      return (
        <div
          key={fullPath}
          onClick={() => setSelectedFile(fullPath)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: `3px 8px 3px ${22 + depth * 14}px`,
            cursor: "pointer", borderRadius: 5, fontSize: 12,
            color: isSelected ? "#eaedf8" : "#6b7499",
            background: isSelected ? "rgba(79,142,247,0.15)" : "transparent",
            borderLeft: isSelected ? "2px solid #4f8ef7" : "2px solid transparent",
            transition: "all 0.1s",
          }}
          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#1c1f30"; }}
          onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
        >
          <FileText size={11} color={isSelected ? "#4f8ef7" : "#5c6480"}/>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.name}</span>
          {node.lines && <span style={{ fontSize: 9, color: "#3d4460", flexShrink: 0 }}>{node.lines}L</span>}
        </div>
      );
    });
  }

  const codeContent = FILE_CONTENTS[selectedFile]
    ?? `// ${selectedFile}\n// Full content not pre-loaded.\n// Click "Explain Design Pattern" or ask the AI: "Show me the source of ${selectedFile}"`;

  const highlighted = highlight(codeContent);

  // ─── LAYOUT ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "240px 1fr 360px",
      height: "calc(100dvh - 58px)",
      background: "var(--bg)",
      overflow: "hidden",
    }}>

      {/* ── LEFT: FILE EXPLORER ── */}
      <div style={{
        display: "flex", flexDirection: "column",
        borderRight: "1px solid var(--bd)",
        background: "#0d0f1a",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "10px 12px 8px",
          borderBottom: "1px solid var(--bd)",
          display: "flex", alignItems: "center", gap: 6,
          flexShrink: 0,
        }}>
          <LayoutPanelLeft size={14} color="#4f8ef7"/>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#eaedf8", letterSpacing: "0.08em" }}>EXPLORER</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#3d4460" }}>1,884 files</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 4px" }}>
          {renderTree(FILE_TREE)}
        </div>
        {/* Legend */}
        <div style={{ padding: "8px 12px", borderTop: "1px solid var(--bd)", flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#3d4460", marginBottom: 4 }}>LEGEND</div>
          {[["#4f8ef7","Entry"],["#34d399","Services"],["#fbbf24","Tools"],["#818cf8","UI"]].map(([c,l])=>(
            <div key={l} style={{ display:"flex", alignItems:"center", gap:4, marginBottom:2 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:c, flexShrink:0 }}/>
              <span style={{ fontSize:10, color:"#6b7499" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MIDDLE: CODE VIEWER / MAP ── */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--bd)" }}>
        {/* Toolbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "8px 12px", borderBottom: "1px solid var(--bd)",
          background: "#12141f", flexShrink: 0,
        }}>
          <FileCode2 size={13} color="#4f8ef7"/>
          <span style={{ fontSize: 12, color: "#9aa3c0", fontFamily: "monospace", flex: 1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {selectedFile}
          </span>
          {/* View tabs */}
          {(["code","map"] as const).map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: viewMode === mode ? "rgba(79,142,247,0.2)" : "transparent",
              border: viewMode === mode ? "1px solid rgba(79,142,247,0.4)" : "1px solid transparent",
              color: viewMode === mode ? "#4f8ef7" : "#6b7499",
              cursor: "pointer",
            }}>
              {mode === "code" ? <><Code2 size={11} style={{display:"inline",marginRight:4}}/>Code</> : <><Map size={11} style={{display:"inline",marginRight:4}}/>Map</>}
            </button>
          ))}
          <button onClick={copyCode} title="Copy code" style={{
            padding: "4px 8px", borderRadius: 6, fontSize: 11,
            background: copied ? "rgba(52,211,153,0.15)" : "var(--bg2)",
            border: "1px solid var(--bd)", color: copied ? "#34d399" : "#6b7499", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {copied ? <Check size={11}/> : <Copy size={11}/>}
            {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={handleExport} title="Export analysis as HTML" style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 11,
            background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.35)",
            color: "#818cf8", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
          }}>
            {exportStatus === "exporting" ? <RefreshCw size={11} style={{animation:"spin 1s linear infinite"}}/> : <Download size={11}/>}
            Export
          </button>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflow: "auto", padding: "0" }}>
          {viewMode === "code" ? (
            <pre style={{
              margin: 0, padding: "16px", fontSize: 12.5, lineHeight: 1.65,
              fontFamily: "'Fira Code','JetBrains Mono','Courier New',monospace",
              background: "#0d0f1a", color: "#c9d1f0", minHeight: "100%",
              counterReset: "line",
            }}>
              {codeContent.split("\n").map((line, i) => (
                <div key={i} style={{ display: "flex" }}>
                  <span style={{ width: 36, flexShrink: 0, color: "#2a2e46", userSelect: "none", textAlign: "right", paddingRight: 12, fontSize: 11 }}>{i+1}</span>
                  <span dangerouslySetInnerHTML={{ __html: highlight(line) || "&nbsp;" }}/>
                </div>
              ))}
            </pre>
          ) : (
            <div style={{ padding: 16, minHeight: "100%" }}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ color: "#eaedf8", fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                  Module Dependency Map
                </h3>
                <p style={{ fontSize: 12, color: "#6b7499" }}>
                  Rendered with Mermaid.js — shows how the 15+ subsystems connect in the Claude Code architecture.
                </p>
              </div>
              <div ref={mermaidRef} style={{
                background: "#1c1f30", borderRadius: 8, padding: 16, minHeight: 400,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {!mermaidReady && (
                  <div style={{ color: "#6b7499", fontSize: 13 }}>
                    <RefreshCw size={16} style={{ marginRight: 6, animation: "spin 1s linear infinite", display: "inline" }}/>
                    Loading Mermaid.js…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* File info footer */}
        <div style={{
          padding: "6px 12px", borderTop: "1px solid var(--bd)",
          display: "flex", gap: 12, flexShrink: 0, background: "#0d0f1a",
        }}>
          {[
            ["File", selectedFile.split("/").pop()],
            ["Lines", codeContent.split("\n").length],
            ["Lang", "TypeScript"],
            ["Encoding", "UTF-8"],
          ].map(([k, v]) => (
            <span key={k as string} style={{ fontSize: 11, color: "#3d4460" }}>
              {k}: <span style={{ color: "#6b7499" }}>{v}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── RIGHT: AI CHAT ── */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#0d0f1a" }}>
        {/* Header */}
        <div style={{
          padding: "10px 14px", borderBottom: "1px solid var(--bd)",
          display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
          background: "#12141f",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg,#4f8ef7,#818cf8)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Cpu size={14} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#eaedf8" }}>Code Intelligence</div>
            <div style={{ fontSize: 10, color: "#4f8ef7" }}>● gemini-2.5-flash</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 10, color: "#3d4460" }}>182K LOC indexed</div>
        </div>

        {/* Quick actions */}
        <div style={{
          padding: "8px 10px", borderBottom: "1px solid var(--bd)",
          display: "flex", flexWrap: "wrap", gap: 4, flexShrink: 0,
        }}>
          {QUICK_ACTIONS.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => handleQuickAction(id, label)}
              disabled={isStreaming}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 9px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: `${color}18`, border: `1px solid ${color}30`,
                color, cursor: isStreaming ? "not-allowed" : "pointer",
                opacity: isStreaming ? 0.5 : 1, transition: "all 0.15s",
              }}
            >
              <Icon size={11}/>{label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{
              borderRadius: 8, padding: "10px 12px",
              background: msg.role === "user" ? "#1c1f30" : "#12141f",
              borderLeft: `3px solid ${msg.role === "user" ? "#4f8ef7" : "#34d399"}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: msg.role === "user" ? "#4f8ef7" : "#34d399", marginBottom: 4, letterSpacing: "0.08em" }}>
                {msg.role === "user" ? "YOU" : "AI ANALYST"}
              </div>
              <div style={{ fontSize: 13, color: "#c9d1f0", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: msg.content.startsWith("```") ? "monospace" : "inherit" }}>
                {msg.content.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7499", fontSize: 12, padding: "4px 0" }}>
              <Zap size={12} color="#4f8ef7" style={{ animation: "pulse 1s ease infinite" }}/>
              Analyzing codebase…
            </div>
          )}
          <div ref={chatEndRef}/>
        </div>

        {/* Input */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid var(--bd)", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(chatInput); }}}
              placeholder={`Ask about ${selectedFile.split("/").pop()}…`}
              disabled={isStreaming}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 8, fontSize: 13,
                background: "#1c1f30", border: "1px solid var(--bd)",
                color: "#eaedf8", outline: "none",
              }}
            />
            <button
              onClick={() => sendMessage(chatInput)}
              disabled={isStreaming || !chatInput.trim()}
              style={{
                width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                background: "rgba(79,142,247,0.2)", border: "1px solid rgba(79,142,247,0.4)",
                color: "#4f8ef7", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
                opacity: isStreaming || !chatInput.trim() ? 0.4 : 1,
              }}
            >
              <Send size={15}/>
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: "#2a2e46", textAlign: "center" }}>
            Powered by Gemini 2.5 Flash · 182,039 LOC indexed
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 900px) {
          .code-analysis-grid { grid-template-columns: 200px 1fr !important; }
        }
        @media (max-width: 640px) {
          .code-analysis-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
