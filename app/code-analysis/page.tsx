"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from "react";
import {
  Code2, FolderOpen, Folder, FileText, ChevronRight, ChevronDown,
  Send, Download, Map, LayoutPanelLeft, Cpu, Sparkles, Bug, BookOpen,
  Copy, Check, Zap, RefreshCw, FileCode2, AlignLeft,
  ArrowRight, Lightbulb, Link2, Layers, MessageSquare, HelpCircle,
  GraduationCap, Network, GitBranch, Shield, Star,
  Terminal, Building2, Search, Wrench, AlertCircle, CheckCircle, Boxes,
} from "lucide-react";

// ─── FILE TREE ────────────────────────────────────────────────────────────────
type TreeNode = { name: string; type: "file"|"dir"; children?: TreeNode[]; lines?: number; desc?: string };

const FILE_TREE: TreeNode[] = [
  { name: "src", type: "dir", children: [
    { name: "main.tsx",        type: "file", lines: 4683, desc: "CLI entry — Commander.js + React/Ink renderer" },
    { name: "QueryEngine.ts",  type: "file", lines: 890,  desc: "LLM orchestration & ReAct loop" },
    { name: "Tool.ts",         type: "file", lines: 140,  desc: "Base Tool interface every tool implements" },
    { name: "Task.ts",         type: "file", lines: 220,  desc: "Task polymorphism — 6 async task types" },
    { name: "AppState.tsx",    type: "file", lines: 360,  desc: "Central reactive state (session, messages, perms)" },
    { name: "context.ts",      type: "file", lines: 88,   desc: "Global React context providers" },
    { name: "commands.ts",     type: "file", lines: 312,  desc: "Slash command registry & routing" },
    { name: "query.ts",        type: "file", lines: 280,  desc: "Query pipeline (pre/post processing, history)" },
    { name: "history.ts",      type: "file", lines: 185,  desc: "Session history management & persistence" },
    { name: "cost-tracker.ts", type: "file", lines: 130,  desc: "Token usage & cost aggregation" },
    { name: "tools", type: "dir", children: [
      { name: "FileReadTool.ts",   type: "file", lines: 95,  desc: "Read any file from local filesystem" },
      { name: "FileEditTool.ts",   type: "file", lines: 280, desc: "Precise old→new string replacement editing" },
      { name: "FileWriteTool.ts",  type: "file", lines: 120, desc: "Write / overwrite full file contents" },
      { name: "GlobTool.ts",       type: "file", lines: 88,  desc: "Fast glob pattern file matching" },
      { name: "GrepTool.ts",       type: "file", lines: 102, desc: "Ripgrep-powered content search" },
      { name: "BashTool.ts",       type: "file", lines: 195, desc: "Execute Bash commands with timeout & sandbox" },
      { name: "PowerShellTool.ts", type: "file", lines: 180, desc: "Execute PowerShell (Windows)" },
      { name: "AgentTool.ts",      type: "file", lines: 310, desc: "Spawn async sub-agents as background tasks" },
      { name: "MCPTool.ts",        type: "file", lines: 175, desc: "Dynamic MCP protocol tool execution" },
      { name: "WebFetchTool.ts",   type: "file", lines: 145, desc: "HTTP fetch with Markdown conversion" },
      { name: "WebSearchTool.ts",  type: "file", lines: 130, desc: "Web search via search engine API" },
      { name: "TodoWriteTool.ts",  type: "file", lines: 88,  desc: "Structured todo list management" },
    ]},
    { name: "services", type: "dir", children: [
      { name: "api",       type: "dir", desc: "Anthropic Claude SDK — streaming, cost, retry" },
      { name: "mcp",       type: "dir", desc: "MCP server lifecycle — auth, dynamic tools" },
      { name: "autoDream", type: "dir", desc: "Background memory consolidation (DreamTask)" },
      { name: "oauth",     type: "dir", desc: "GitHub / Google OAuth providers" },
      { name: "compact",   type: "dir", desc: "Message history compaction & context snipping" },
      { name: "lsp",       type: "dir", desc: "Language Server Protocol for code navigation" },
      { name: "analytics", type: "dir", desc: "GrowthBook feature gates & telemetry" },
      { name: "plugins",   type: "dir", desc: "Plugin lifecycle: discovery, versioning, cache" },
    ]},
    { name: "bridge", type: "dir", desc: "IDE integration — 32 files, JWT WebSocket", children: [
      { name: "bridgeApi.ts",        type: "file", lines: 240, desc: "Bridge REST API surface" },
      { name: "bridgeMessaging.ts",  type: "file", lines: 310, desc: "Message framing & dispatch" },
      { name: "bridgeUI.ts",         type: "file", lines: 195, desc: "UI state sync to IDE" },
      { name: "replBridge.ts",       type: "file", lines: 280, desc: "REPL session tunneling" },
      { name: "remoteBridgeCore.ts", type: "file", lines: 355, desc: "Remote execution core" },
      { name: "jwtUtils.ts",         type: "file", lines: 90,  desc: "JWT signing for bridge sessions" },
    ]},
    { name: "buddy", type: "dir", desc: "Tamagotchi companion — 18 species, PRNG from userId hash", children: [
      { name: "companion.ts", type: "file", lines: 410, desc: "Deterministic generation via Mulberry32 PRNG" },
      { name: "species.ts",   type: "file", lines: 680, desc: "18 species × ASCII art × 3-frame animation" },
      { name: "soulGen.ts",   type: "file", lines: 120, desc: "Claude-generated personality caching" },
      { name: "stats.ts",     type: "file", lines: 95,  desc: "5 stats: DEBUGGING/PATIENCE/CHAOS/WISDOM/SNARK" },
    ]},
    { name: "coordinator", type: "dir", desc: "Multi-agent swarm — parallel worker orchestration", children: [
      { name: "coordinatorMode.ts", type: "file", lines: 480, desc: "Swarm spawning & team coordination" },
    ]},
    { name: "components", type: "dir", desc: "60+ React/Ink terminal UI components", children: [
      { name: "design-system",     type: "dir",  desc: "Base design tokens & primitives" },
      { name: "TrustDialog.tsx",   type: "file", lines: 145, desc: "First-run user consent dialog" },
      { name: "Messages.tsx",      type: "file", lines: 390, desc: "Chat message rendering pipeline" },
      { name: "PromptInput.tsx",   type: "file", lines: 285, desc: "Multi-line prompt editor with history" },
      { name: "HighlightedCode.tsx", type: "file", lines: 180, desc: "Syntax-highlighted code blocks" },
      { name: "Diff.tsx",          type: "file", lines: 240, desc: "Side-by-side diff visualization" },
    ]},
    { name: "utils", type: "dir", desc: "100+ utility modules across 15 domains", children: [
      { name: "permissions", type: "dir", desc: "Tool permission rules & enforcement engine" },
      { name: "messages",    type: "dir", desc: "SDK↔internal type normalization & mappers" },
      { name: "git",         type: "dir", desc: "Git & GitHub integration utilities" },
      { name: "shell",       type: "dir", desc: "Shell execution with sandbox & timeout" },
      { name: "model",       type: "dir", desc: "Model string parsing & context window math" },
      { name: "settings",    type: "dir", desc: "Config loading: MDM, keychain, env vars" },
      { name: "undercover.ts", type: "file", lines: 85, desc: "Blocks internal Anthropic codenames" },
    ]},
    { name: "commands", type: "dir", desc: "70+ CLI subcommands", children: [
      { name: "session",  type: "dir", desc: "session, resume, rewind, teleport" },
      { name: "review",   type: "dir", desc: "PR review, diff, export" },
      { name: "model",    type: "dir", desc: "Model selection & config" },
      { name: "mcp",      type: "dir", desc: "MCP server management" },
      { name: "agents",   type: "dir", desc: "Agent spawning & monitoring" },
      { name: "doctor",   type: "dir", desc: "Environment health checks" },
    ]},
    { name: "vim",       type: "dir", desc: "Full modal Vim editing — motions, operators, text objects" },
    { name: "ink",       type: "dir", desc: "Custom React/Ink terminal renderer with Yoga layout" },
    { name: "native-ts", type: "dir", desc: "TypeScript bindings: file-index, color-diff, yoga-layout" },
  ]},
];

// ─── FILE EXPLANATIONS ────────────────────────────────────────────────────────
interface FileExplanation {
  role: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  analogy: string;
  howItWorks: { step: string; detail: string }[];
  connections: { imports: { name: string; why: string }[]; usedBy: string[] };
  concepts: string[];
  hints: string[];
}

const FILE_EXPLANATIONS: Record<string, FileExplanation> = {
  "src/main.tsx": {
    role: "The application's front door — the very first code that runs when you type `claude` in your terminal.",
    difficulty: "Intermediate",
    analogy: "🛫 Think of it as an airport check-in system. You arrive (run `claude`), it reads your ticket (CLI args), checks your identity (auth), and routes you to the right gate (feature or interactive loop). Without it, the whole airport shuts down.",
    howItWorks: [
      { step: "Node.js executes this file", detail: "When you type `claude`, your shell finds the binary, which points Node to run main.tsx. This file owns the entire startup sequence." },
      { step: "Commander.js registers 70+ commands", detail: "Each subcommand (review, model, session…) is imported as a module and added to the program object. Commander handles --flags, --help, and argument parsing automatically." },
      { step: "React/Ink renders the terminal UI", detail: "React isn't just for browsers. Ink is a framework that lets React render into terminal output using box/text layout (similar to flexbox). Every chat bubble and spinner is a React component." },
      { step: "QueryEngine is created with all tools", detail: "loadAllTools() collects all 40+ tool implementations into a Map<string, Tool>. The QueryEngine gets this map — it never imports tools directly, only the Tool interface." },
      { step: "The agent loop begins", detail: "The app enters a readline-style loop: read user input → send to QueryEngine → stream response back. SIGINT (Ctrl+C) triggers a clean shutdown that aborts any running tool calls." },
    ],
    connections: {
      imports: [
        { name: "QueryEngine.ts", why: "Creates the LLM orchestration engine with tools" },
        { name: "AppState.tsx",   why: "Initialises the reactive state store" },
        { name: "tools.ts",       why: "Loads all 40+ tools into a registry Map" },
        { name: "services/analytics", why: "Initialises GrowthBook feature gates" },
      ],
      usedBy: ["Node.js runtime (nothing imports this — it IS the entry point)"],
    },
    concepts: ["Commander.js CLI framework", "React / Ink terminal UI", "Entry Point Pattern", "Dependency Injection", "Process signal handling"],
    hints: [
      "How does React/Ink render components into a terminal instead of a browser DOM?",
      "Walk me through the exact sequence of events in the first 200ms after I type 'claude'",
      "Why does main.tsx inject tools into QueryEngine instead of QueryEngine importing them directly?",
      "How does Commander.js handle --help generation automatically?",
    ],
  },

  "src/QueryEngine.ts": {
    role: "The brain of the operation — receives every user message, runs the ReAct reasoning loop, decides when to call tools, and returns the final answer.",
    difficulty: "Advanced",
    analogy: "🧑‍💼 A senior project manager at a consulting firm. A client brings a problem. The PM thinks about it (LLM reasoning), assigns sub-tasks to specialists (tool calls), collects their deliverables (observations), and synthesises the final report — repeating the cycle until nothing more is needed.",
    howItWorks: [
      { step: "Receive message + build context", detail: "Takes the user message, pulls conversation history from AppState, composes the system prompt (instructions + memory + context), and serialises all 40+ tool schemas into the API request." },
      { step: "Stream from Claude API", detail: "Calls Anthropic SDK `messages.stream()`. Tokens arrive chunk by chunk — each chunk is yielded to main.tsx which prints it immediately. You see text appear word by word." },
      { step: "Detect tool_use stop reason", detail: "Claude may stop mid-response with stop_reason: 'tool_use'. This means it wants to call a tool. The engine extracts the tool name + arguments from the content blocks." },
      { step: "Execute the tool", detail: "Looks up the tool by name in the tools Map. Runs execute(input, appState). The result (a string) is the 'Observation' in ReAct — it gets appended to the conversation." },
      { step: "Loop back to Claude", detail: "The observation is added as a new user message (tool_result block). Claude sees it and continues reasoning. This loop runs until stop_reason is 'end_turn'." },
    ],
    connections: {
      imports: [
        { name: "Tool.ts",          why: "Dispatches all tool calls through the Tool interface" },
        { name: "AppState.tsx",     why: "Reads/writes conversation history and session state" },
        { name: "services/api",     why: "The actual Anthropic SDK wrapper — handles retries, costs" },
        { name: "services/compact", why: "Compacts long conversation history to fit context window" },
      ],
      usedBy: ["main.tsx (interactive mode)", "bridge/replBridge.ts (IDE mode)"],
    },
    concepts: ["ReAct loop (Reason + Act)", "Anthropic SDK streaming", "Tool dispatch pattern", "Conversation history management", "Context window engineering"],
    hints: [
      "Show me exactly how Claude decides to call a tool vs respond directly — what does the API response look like?",
      "How does the ReAct loop prevent infinite tool call cycles?",
      "What's in the system prompt and how is it dynamically composed per turn?",
      "How does streaming work technically — why does text appear word by word instead of all at once?",
    ],
  },

  "src/Tool.ts": {
    role: "The contract every tool must honour. Defines the shape all 40+ tools share so QueryEngine can call any tool without knowing its implementation.",
    difficulty: "Beginner",
    analogy: "📋 A job description template at a company. It says: every employee must have a name, a description of their role, a list of what information they need (inputJSONSchema), and must deliver a result string. HR (QueryEngine) only reads the job description — it never needs to know what each person actually does all day.",
    howItWorks: [
      { step: "Define the interface", detail: "TypeScript interface with 4 fields: name (string ID), description (what the LLM reads to decide when to call it), inputJSONSchema (parameters the LLM must provide), execute() (the actual logic)." },
      { step: "Every tool implements this interface", detail: "FileReadTool, BashTool, WebSearchTool — all 40+ tools export a class or object that satisfies the Tool interface. TypeScript enforces this at compile time." },
      { step: "QueryEngine uses only the interface", detail: "The engine stores Map<string, Tool> — not Map<string, BashTool>. This is the Dependency Inversion Principle: high-level code (QueryEngine) depends on the abstraction (Tool), not the concrete implementation." },
      { step: "LLM uses the schema", detail: "At query time, QueryEngine serialises every tool's name + description + inputJSONSchema into the API request. Claude reads these schemas to know when and how to call each tool." },
    ],
    connections: {
      imports: [
        { name: "AppState.tsx",  why: "execute() receives AppState for reading session context" },
        { name: "json-schema",   why: "JSONSchema7 type for inputJSONSchema field" },
      ],
      usedBy: ["All 40+ tool files (implement it)", "QueryEngine.ts (dispatches through it)", "tools.ts (registers all tools)"],
    },
    concepts: ["TypeScript interfaces", "Dependency Inversion Principle", "JSON Schema", "Structural typing", "Abstraction over implementation"],
    hints: [
      "What is the Dependency Inversion Principle and why does using Tool.ts instead of importing BashTool directly matter?",
      "How does TypeScript's structural typing work — does BashTool need to explicitly say 'implements Tool'?",
      "Why does the LLM need inputJSONSchema — what does Claude actually do with it?",
      "What makes a great tool description that helps the LLM choose the right tool?",
    ],
  },

  "src/Task.ts": {
    role: "Defines what 'background work' looks like. Six types of async tasks that can run while the user does other things — all with a universal kill switch.",
    difficulty: "Intermediate",
    analogy: "🎫 A Jira/GitHub Issues ticket system for the agent's own work. Every piece of background work gets a ticket: a type (what kind of work), a status (where it is), and a cancel button. Six ticket types for six different kinds of work — from running shell commands to spawning AI sub-agents.",
    howItWorks: [
      { step: "Define the base Task interface", detail: "Just 3 fields + 1 method: id, type, status, kill(). The interface is intentionally minimal — QueryEngine only ever calls kill(). Other task-specific methods are on the concrete classes." },
      { step: "Generate unique IDs", detail: "generateTaskId() creates IDs like 'a8f3k2p1' (agent) or 'bb2n9x7r' (bash). The prefix letter encodes the type so you can tell at a glance what kind of task it is." },
      { step: "Six concrete implementations", detail: "LocalShellTask wraps a child_process. LocalAgentTask uses an AbortController. RemoteAgentTask talks over WebSocket. Each kill() method does what's appropriate for that task type." },
      { step: "Output streaming via files", detail: "Long-running tasks write their output to per-task files on disk (in a scratchpad directory). TaskOutputTool polls these files for new bytes — this is how you see live output from background tasks." },
    ],
    connections: {
      imports: [
        { name: "child_process", why: "LocalShellTask wraps a Node.js child process" },
        { name: "crypto",        why: "generateTaskId uses crypto.randomBytes for the random suffix" },
      ],
      usedBy: ["AgentTool.ts", "BashTool.ts", "TaskGetTool / TaskListTool", "QueryEngine.ts (tracks active tasks)"],
    },
    concepts: ["Polymorphism", "Interface segregation principle", "AbortController API", "Child process management", "File-based streaming output"],
    hints: [
      "What is polymorphism and how does having a base Task interface let QueryEngine cancel any task without knowing its type?",
      "Why does kill() return a Promise — why can't killing a task be synchronous?",
      "How do background tasks stream their output back without blocking the main thread?",
      "What's the difference between aborting an agent task vs terminating a bash task?",
    ],
  },

  "src/buddy/companion.ts": {
    role: "Generates your unique AI companion character. Completely deterministic from your userId — same user always gets the same pet, no database needed.",
    difficulty: "Intermediate",
    analogy: "🎮 Like a Pokémon permanently assigned to your trainer ID using pure math. No matter where you open the app — laptop, server, friend's machine — your exact Charizard (species, stats, personality) reappears because it's derived from your ID, not retrieved from a server.",
    howItWorks: [
      { step: "Hash the userId to a seed", detail: "FNV-1a hashing converts your userId string (e.g. 'user_peter_123') into a 32-bit integer. Same string → same integer, every time. This is your PRNG seed." },
      { step: "Mulberry32 generates a number sequence", detail: "Mulberry32 is a fast, deterministic pseudo-random number generator. Feed it your seed, call it repeatedly, and you get the same sequence of floats [0,1) every time. No actual randomness." },
      { step: "Map numbers to buddy attributes", detail: "First float → rarity tier (legendary if < 0.01, epic if < 0.05…). Next float → species index. Next → eye style. Next → hat (70% chance of having one). Five more floats → stats (DEBUGGING, PATIENCE, etc.)." },
      { step: "Generate soul (once, then cache)", detail: "First time only: sends species + rarity + stats to Claude and asks it to write a personality. The result is saved to your config file. On every subsequent launch it's read from disk — no re-generation." },
    ],
    connections: {
      imports: [
        { name: "species.ts",  why: "Contains all 18 species definitions and ASCII art frames" },
        { name: "soulGen.ts",  why: "Calls Claude to generate the personality description" },
        { name: "stats.ts",    why: "Defines the 5 stat types and their ranges" },
      ],
      usedBy: ["main.tsx (generates companion at startup)", "components/BuddyDisplay.tsx (renders it)"],
    },
    concepts: ["PRNG (pseudo-random number generator)", "Hash functions (FNV-1a)", "Deterministic generation", "Config-based caching", "Seed-based reproducibility"],
    hints: [
      "Explain the Mulberry32 algorithm step by step — why is it better than Math.random() for this use case?",
      "What is FNV-1a hashing? How is it different from SHA-256 and why use it here?",
      "How does seeding make randomness deterministic — isn't that a contradiction?",
      "What are the trade-offs of PRNG-based generation vs storing the companion in a database?",
    ],
  },

  "src/utils/permissions/index.ts": {
    role: "The security checkpoint every tool call passes through before it executes. Decides allow / deny / ask based on current mode and user-configured rules.",
    difficulty: "Beginner",
    analogy: "🏢 A corporate building's layered access control. Floor 1 (bypass mode): no badge needed, anyone enters. Floor 2 (auto mode): badge required, but every badge works. Floor 3 (default mode): badge scanned against an approved list. Basement (plan mode): only read-only visitors allowed, no modifications.",
    howItWorks: [
      { step: "Receive tool call + context", detail: "Called before every tool.execute(). Receives the tool name, its inputs, and an immutable PermissionContext that describes the current mode and user-configured rules." },
      { step: "Check bypass_permissions first", detail: "If the user ran claude --dangerously-skip-permissions, return 'allow' immediately. This is the nuclear option — nothing is blocked. Only for trusted automated workflows." },
      { step: "Check plan_mode restrictions", detail: "In plan mode, only read-only tools are whitelisted (FileRead, Glob, Grep, WebFetch). Anything that could modify state returns 'deny'. Planning must be safe." },
      { step: "Walk the deny/allow rule lists", detail: "alwaysDenyRules from enterprise MDM or user config are checked first — immediate hard block. Then alwaysAllowRules — immediate allow. Both lists come from .claude/settings.json." },
      { step: "Fall back to mode default", detail: "auto mode → 'allow' (agent runs without prompting). default mode → 'ask' (show the permission dialog to the user). User clicks Allow / Deny / Always Allow." },
    ],
    connections: {
      imports: [
        { name: "(none — pure TypeScript logic)", why: "No external imports. All types are defined inline." },
      ],
      usedBy: ["QueryEngine.ts (calls before each tool dispatch)", "BashTool.ts (extra check for dangerous commands)", "EnterpriseMDM (populates alwaysDenyRules)"],
    },
    concepts: ["Defense in depth", "Fail-safe defaults", "Policy enforcement", "Immutable context pattern", "RBAC (role-based access control)"],
    hints: [
      "Why is the PermissionContext passed as a parameter instead of accessed from a global singleton?",
      "What specific tools are in PLAN_MODE_SAFE_TOOLS and why exactly those?",
      "How does enterprise MDM populate alwaysDenyRules — what's the config format?",
      "Why is the 'ask' flow better UX than always blocking on sensitive operations?",
    ],
  },

  "src/utils/undercover.ts": {
    role: "Prevents internal Anthropic codenames from leaking into public-facing responses. A content filter for internal terminology.",
    difficulty: "Beginner",
    analogy: "🕵️ A redaction layer like declassified government documents. Certain code words (internal project names) are blacked out before the document goes public. Anthropic employees using Claude in public repos shouldn't accidentally reveal internal project names.",
    howItWorks: [
      { step: "Maintain a blocklist", detail: "Hard-coded list of internal codenames: 'Tengu' (Claude Code's internal name), 'Capybara' (a model codename), and others. The list is encoded as string operations, not literals, to avoid being found by grep." },
      { step: "Filter outgoing text", detail: "Before any response is shown to the user, this module scans for blocked terms. If found and the user is an Anthropic employee (detected via org), the term is replaced with a safe alternative." },
      { step: "Different rules per context", detail: "Public repo vs. internal chat contexts get different filtering levels. The goal is to prevent accidental disclosure, not to hide functionality from end users." },
    ],
    connections: {
      imports: [{ name: "AppState.tsx", why: "Reads user identity to determine if undercover mode applies" }],
      usedBy: ["QueryEngine.ts (filters before display)", "main.tsx (checks at startup)"],
    },
    concepts: ["Content filtering", "Information security", "String encoding to evade grep", "Context-sensitive redaction"],
    hints: [
      "Why encode the codenames as string operations instead of storing them as plain strings?",
      "What's the security threat model here — who are they hiding information from?",
      "How would you design a more robust content filtering system that handles paraphrasing?",
      "What does the discovery of this file tell us about how software companies manage internal project secrecy?",
    ],
  },

  "src/services": {
    role: "The service layer — 21 modules that handle all external integrations: Claude API, MCP servers, OAuth, memory, analytics, and more.",
    difficulty: "Intermediate",
    analogy: "🏗️ The utility infrastructure of a building: plumbing (API calls), electrical (analytics), HVAC (memory management), security (OAuth). The main floors (QueryEngine, tools) use these services but don't wire them directly — they go through the service layer.",
    howItWorks: [
      { step: "api/ — Claude SDK wrapper", detail: "Wraps @anthropic-ai/sdk to add retry logic, cost tracking, rate limiting, and streaming normalisation. All API calls go through here." },
      { step: "mcp/ — MCP server lifecycle", detail: "Manages spawning, authenticating, and querying MCP servers. Dynamically generates Tool objects from MCP capability declarations." },
      { step: "autoDream/ — memory consolidation", detail: "Background DreamTask that reads recent session history, extracts key facts via LLM, and merges them into MEMORY.md. Runs asynchronously between sessions." },
      { step: "analytics/ — GrowthBook integration", detail: "Feature flags control which experimental features are enabled per user/org. All major feature switches (coordinator mode, KAIROS) are gated here." },
    ],
    connections: {
      imports: [
        { name: "@anthropic-ai/sdk",   why: "api/ wraps the official SDK" },
        { name: "GrowthBook SDK",      why: "analytics/ reads feature flags" },
        { name: "MCP protocol types",  why: "mcp/ implements the MCP client protocol" },
      ],
      usedBy: ["QueryEngine.ts", "main.tsx", "bridge/", "coordinator/"],
    },
    concepts: ["Service layer pattern", "Dependency injection", "Feature flags", "SDK wrapping", "Background task processing"],
    hints: [
      "Why wrap the Anthropic SDK instead of importing it directly in QueryEngine?",
      "How do GrowthBook feature flags enable A/B testing of AI features?",
      "How does the autoDream memory pipeline decide what facts are worth keeping?",
      "What is the difference between a service and a utility in this architecture?",
    ],
  },

  "src/bridge": {
    role: "A secure bidirectional tunnel between the Claude Code CLI and your IDE (VS Code / JetBrains). Lets you trigger Claude from inside your editor.",
    difficulty: "Advanced",
    analogy: "🌐 An embassy communication system between two countries (your terminal and your IDE). Every message is encoded, signed with a diplomatic passport (JWT), and sent through a secure channel (WebSocket). Neither side can spoof the other.",
    howItWorks: [
      { step: "IDE extension connects via WebSocket", detail: "When you open VS Code with the Claude Code extension, it negotiates a port with the running CLI process and opens a WebSocket connection." },
      { step: "JWT signs every message", detail: "jwtUtils.ts signs each message payload with a session-specific secret. The receiver verifies the signature before processing. This prevents other processes from injecting messages." },
      { step: "bridgeMessaging.ts frames messages", detail: "Messages follow a JSON-RPC 2.0–style envelope: {id, method, params}. Both sides agree on methods like 'sendMessage', 'attachFile', 'syncConfig'." },
      { step: "replBridge.ts creates a virtual REPL", detail: "Each IDE window gets its own REPL session — an independent conversation context. This lets multiple IDE windows run separate Claude conversations simultaneously." },
      { step: "File selections flow as context", detail: "When you select code in VS Code and click 'Ask Claude', the selection is serialised as an attachment and prepended to your next message automatically." },
    ],
    connections: {
      imports: [
        { name: "QueryEngine.ts", why: "Bridge sessions run queries through the same engine as CLI sessions" },
        { name: "jwtUtils.ts",    why: "Signs and verifies all bridge messages" },
        { name: "AppState.tsx",   why: "Each bridge session gets its own AppState instance" },
      ],
      usedBy: ["VS Code Extension (external)", "JetBrains Plugin (external)", "main.tsx (starts bridge listener)"],
    },
    concepts: ["WebSocket protocol", "JWT authentication", "JSON-RPC message framing", "REPL session multiplexing", "IDE extension architecture"],
    hints: [
      "How does JWT prevent a malicious local process from injecting commands into the bridge?",
      "What's the latency difference between CLI mode and IDE bridge mode?",
      "How does the bridge handle the case where the CLI process dies while an IDE session is active?",
      "Why use WebSocket instead of Unix domain sockets or named pipes for local IPC?",
    ],
  },

  "src/coordinator": {
    role: "Multi-agent swarm orchestrator. Decomposes complex tasks into parallel subtasks and coordinates specialist worker agents to solve them simultaneously.",
    difficulty: "Advanced",
    analogy: "🏗️ A general contractor building a house. Instead of doing everything sequentially, they hire an electrician, plumber, and carpenter simultaneously, coordinate their schedules, check their work, and synthesise everything into the finished building. Speed is 3x because tasks run in parallel.",
    howItWorks: [
      { step: "Coordinator receives complex task", detail: "When the COORDINATOR_MODE feature flag is on, the main agent can spawn a Coordinator. The Coordinator reads the task and decides how to break it into independent subtasks." },
      { step: "Spawn worker agents via AgentTool", detail: "Each subtask becomes a LocalAgentTask. Workers run their own mini-ReAct loops in parallel. They get a restricted tool set — no spawning further agents (prevents exponential explosion)." },
      { step: "Team communication channel", detail: "TeamCreateTool creates a shared message channel. Workers use SendMessageTool to broadcast findings. The coordinator subscribes and aggregates in real time." },
      { step: "Scratchpad isolation", detail: "Each worker gets its own isolated scratch directory. Files written there don't conflict across workers. The coordinator reads all scratch dirs to assemble the final output." },
      { step: "Synthesis and return", detail: "When all workers complete (or timeout), the coordinator synthesises their outputs into a cohesive answer using another LLM pass." },
    ],
    connections: {
      imports: [
        { name: "AgentTool.ts",       why: "Used to spawn each worker agent as a background task" },
        { name: "Task.ts",            why: "Each worker is a LocalAgentTask" },
        { name: "TeamCreateTool.ts",  why: "Creates the shared communication channel" },
        { name: "SendMessageTool.ts", why: "Workers broadcast results to the channel" },
      ],
      usedBy: ["main.tsx (gated by COORDINATOR_MODE feature flag)"],
    },
    concepts: ["Multi-agent orchestration", "Parallel task execution", "Task decomposition", "Feature-flagged capabilities", "Scratchpad isolation"],
    hints: [
      "How does the coordinator decide which subtasks can run in parallel vs sequentially?",
      "What prevents a worker agent from going into an infinite tool-call loop?",
      "How does the team communication channel work technically — is it a message queue?",
      "When does parallel agent execution NOT help — what are the bottlenecks?",
    ],
  },

  "src/tools/AgentTool.ts": {
    role: "The tool that lets Claude spawn other Claude agents. Enables recursive AI delegation — agents that hire agents.",
    difficulty: "Advanced",
    analogy: "📞 An executive's 'delegate to assistant' button. Instead of handling every email personally, the executive (main agent) identifies work a junior agent can do and hands it off with specific instructions. The junior reports back when done.",
    howItWorks: [
      { step: "LLM calls AgentTool with a subtask", detail: "Claude decides a subtask would be better handled by a separate agent. It calls agent_task({instruction: '...', allowed_tools: [...]}) with the delegation details." },
      { step: "Spawn LocalAgentTask", detail: "AgentTool creates a new LocalAgentTask with its own QueryEngine instance, its own conversation history, and a restricted tool set (can't spawn further agents recursively)." },
      { step: "Task runs asynchronously", detail: "The worker agent runs its full ReAct loop in the background. Its output is written to a per-task file. The parent agent can continue other work while waiting." },
      { step: "Parent polls for result", detail: "The parent uses TaskOutputTool to check the worker's output file for new bytes. When the worker completes, its final answer is returned as the AgentTool result." },
    ],
    connections: {
      imports: [
        { name: "Task.ts",        why: "Creates LocalAgentTask to run the sub-agent" },
        { name: "QueryEngine.ts", why: "Each worker gets its own QueryEngine instance" },
        { name: "Tool.ts",        why: "Implements the Tool interface itself" },
      ],
      usedBy: ["QueryEngine.ts (dispatches when LLM calls agent_task)", "coordinator/coordinatorMode.ts"],
    },
    concepts: ["Recursive agent delegation", "Background task execution", "Tool subset restriction", "File-based result streaming"],
    hints: [
      "Why are worker agents restricted from spawning their own agents — what would happen without that restriction?",
      "How does the parent agent know when the worker is finished vs still running?",
      "What's the difference between calling AgentTool vs just giving Claude more tools directly?",
      "How would you implement a timeout for a worker agent that gets stuck in a loop?",
    ],
  },

  "src/tools/BashTool.ts": {
    role: "Executes shell commands in a sandboxed environment with timeout protection and permission checking.",
    difficulty: "Intermediate",
    analogy: "🤖 A supervised intern who can run any terminal command — but only after their manager (permission system) approves it, only for 2 minutes max (timeout), and all their work is logged. Dangerous commands like `rm -rf` need extra sign-off.",
    howItWorks: [
      { step: "Permission check first", detail: "Before running anything, calls checkToolPermission('BashTool', input, ctx). If mode is 'ask', shows the exact command to the user for approval. Never runs unapproved." },
      { step: "Spawn child process", detail: "Uses Node.js child_process.spawn() to run the command in a shell. stdout/stderr are streamed back in real time. The PID is stored in a LocalShellTask so it can be killed." },
      { step: "Timeout enforcement", detail: "A setTimeout kills the process after the configured timeout (default 2 minutes). The kill signal is SIGTERM first, then SIGKILL if the process doesn't exit cleanly." },
      { step: "Working directory context", detail: "Commands run in the user's current working directory (from AppState). Relative paths work as expected. The CWD doesn't change between commands unless explicitly `cd`-ed." },
    ],
    connections: {
      imports: [
        { name: "Tool.ts",           why: "Implements the Tool interface" },
        { name: "Task.ts",           why: "Creates LocalShellTask for the running process" },
        { name: "permissions/",      why: "Checks permission before executing" },
      ],
      usedBy: ["QueryEngine.ts (when LLM calls bash tool)", "main.tsx REPL mode"],
    },
    concepts: ["Child process management", "Signal handling (SIGTERM/SIGKILL)", "Security sandboxing", "Timeout patterns", "Output streaming"],
    hints: [
      "Why kill with SIGTERM first and then SIGKILL after a delay instead of SIGKILL immediately?",
      "How does the tool distinguish between a command that failed vs one that timed out?",
      "What makes certain bash commands 'dangerous' enough to require extra confirmation?",
      "How does the tool prevent shell injection attacks when the LLM provides command arguments?",
    ],
  },
};

// ─── CODE SNIPPETS ────────────────────────────────────────────────────────────
const FILE_CONTENTS: Record<string, string> = {
  "src/main.tsx": `#!/usr/bin/env bun
// main.tsx — Claude Code CLI entry point (4,683 lines)
// Commander.js CLI + React/Ink terminal renderer

import { Command } from "commander";
import { render }   from "ink";
import React        from "react";
import { QueryEngine }    from "./QueryEngine.js";
import { AppState }       from "./state/AppState.js";
import { loadAllTools }   from "./tools.js";
import { bootstrapState } from "./bootstrap/state.js";
import { initAnalytics }  from "./services/analytics/index.js";

const program = new Command("claude").description("Anthropic Claude Code").version(PKG_VERSION);

// 70+ subcommands registered here:
program.addCommand(require("./commands/session/index.js").default);
program.addCommand(require("./commands/review/index.js").default);
// ... (68 more commands)

program
  .option("--model <id>",                     "Override default model")
  .option("--dangerously-skip-permissions",    "Bypass permission checks")
  .option("--auto-mode",                       "Non-interactive auto mode")
  .action(async (opts) => {
    const state   = await bootstrapState(opts);
    const tools   = loadAllTools(state);           // Map<string, Tool>
    const engine  = new QueryEngine({ tools, state });
    await initAnalytics(state);

    // React/Ink renders the terminal UI (like React but in your terminal!)
    const { unmount } = render(<AppRoot engine={engine} state={state} />, { exitOnCtrlC: false });

    process.on("SIGINT",  () => { engine.abort(); unmount(); });
    process.on("SIGTERM", () => { engine.abort(); unmount(); });
  });

program.parse(process.argv);`,

  "src/QueryEngine.ts": `// QueryEngine.ts — LLM orchestration & ReAct loop
import Anthropic from "@anthropic-ai/sdk";
import type { Tool }     from "./Tool.js";
import type { AppState } from "./state/AppState.js";
import { composeSystemPrompt } from "./utils/systemPromptType.js";

export class QueryEngine {
  private client: Anthropic;
  private tools:  Map<string, Tool>;   // dependency-injected — no direct imports
  private aborted = false;

  constructor({ tools, state }: { tools: Map<string, Tool>; state: AppState }) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.tools  = tools;
  }

  async *query(userMessage: string): AsyncGenerator<QueryEvent> {
    const messages = this.state.getMessages();
    messages.push({ role: "user", content: userMessage });

    // ── ReAct loop: Reason → Act → Observe → Reason … ─────────────────────
    while (!this.aborted) {
      const stream = this.client.messages.stream({
        model:      this.state.model,
        max_tokens: 8096,
        system:     composeSystemPrompt(this.state),
        tools:      this.getToolSchemas(),   // Claude reads these to know available tools
        messages,
      });

      for await (const event of stream) {
        if (event.type === "content_block_delta")
          yield { type: "text_delta", delta: event.delta };   // stream text to UI
      }

      const response = await stream.finalMessage();

      if (response.stop_reason !== "tool_use") break;    // ← loop ends here

      // Execute tool calls — each result becomes an "Observation"
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const tool   = this.tools.get(block.name);   // dispatch by name
        const result = await tool.execute(block.input, this.state);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
        yield { type: "tool_result", toolName: block.name, result };
      }
      messages.push({ role: "user", content: toolResults });  // add observation, loop back
    }
  }
}`,

  "src/Tool.ts": `// Tool.ts — the contract all 40+ tools must honour
import type { AppState } from "./state/AppState.js";
import type { JSONSchema7 } from "json-schema";

/** Every tool implements this interface.
 *  QueryEngine only imports Tool — never BashTool, FileReadTool, etc.
 *  This is Dependency Inversion: depend on abstractions, not implementations. */
export interface Tool<TInput = Record<string, unknown>> {
  name:           string;        // "bash" — what Claude types to call this tool
  description:    string;        // What the LLM reads to decide WHEN to call it
  inputJSONSchema: JSONSchema7;  // What parameters the LLM must provide
  execute(input: TInput, state: AppState): Promise<string>;  // Do the work
  allowInPlanMode?: boolean;     // Safe for read-only planning? Default: false
  isDangerous?:     boolean;     // Needs extra confirmation in default mode?
}

// ── Example: how BashTool.ts implements this interface ──────────────────────
// export class BashTool implements Tool<{ command: string; timeout?: number }> {
//   name        = "bash";
//   description = "Execute a shell command. Use for file operations, running scripts, installing packages.";
//   inputJSONSchema = { type: "object", properties: { command: { type: "string" }, ... } }
//   async execute({ command }, state) { /* spawn child process */ }
//   isDangerous = true;
// }`,

  "src/Task.ts": `// Task.ts — background work management (6 task types)
export type TaskStatus = "pending" | "running" | "completed" | "failed" | "killed";
export type TaskType   = "local_bash" | "local_agent" | "remote_agent"
                       | "in_process_teammate" | "local_workflow" | "dream";

/** Unique ID: prefix encodes type + 8 random base-36 chars = 2.8 trillion combos */
export function generateTaskId(type: TaskType): string {
  const PREFIX = { local_bash: "b", local_agent: "a", remote_agent: "r",
                   in_process_teammate: "t", local_workflow: "w", dream: "d" };
  return PREFIX[type] + Math.random().toString(36).slice(2, 10);
  // e.g. "a8f3k2p1" = agent task, "bb2n9x7r" = bash task
}

/** Base interface — only kill() is called polymorphically by QueryEngine */
export interface Task {
  id: string;  type: TaskType;  status: TaskStatus;
  kill(): Promise<void>;          // Each impl does the right thing for its type
}

/** Shell task: wraps a Node.js child process */
export class LocalShellTask implements Task {
  type: TaskType = "local_bash";
  status: TaskStatus = "pending";
  private proc?: import("child_process").ChildProcess;

  async kill() {
    this.proc?.kill("SIGTERM");          // polite first
    setTimeout(() => this.proc?.kill("SIGKILL"), 3000);  // force after 3s
    this.status = "killed";
  }
}

/** Agent task: uses AbortController to stop the async agent loop */
export class LocalAgentTask implements Task {
  type: TaskType = "local_agent";
  status: TaskStatus = "pending";
  private ac = new AbortController();

  async kill() {
    this.ac.abort();                     // signals the agent loop to stop
    this.status = "killed";
  }
}`,

  "src/buddy/companion.ts": `// companion.ts — deterministic companion from userId (no database needed!)
import { SPECIES }    from "./species.js";
import { generateSoul } from "./soulGen.js";

/** Mulberry32: fast deterministic PRNG — same seed = same sequence always */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;  // float [0, 1)
  };
}

/** FNV-1a: hash userId string → u32 seed.
 *  "user_peter" → 2847302918 (same every time) */
function hashUserId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h;
}

export async function generateCompanion(userId: string) {
  const prng = mulberry32(hashUserId(userId));  // seed PRNG with user's hash

  // Each prng() call gives the next float — deterministic for this userId!
  const rarityRoll = prng();          // e.g. 0.23 → "uncommon"
  const speciesIdx = prng();          // e.g. 0.67 → species at index 12
  const eyeIdx     = prng();          // e.g. 0.41 → eye style "◉"
  const hasHat     = prng() > 0.7;   // 30% chance of hat
  const hatIdx     = prng();

  const stats = {
    DEBUGGING: Math.floor(prng() * 100),
    PATIENCE:  Math.floor(prng() * 100),
    CHAOS:     Math.floor(prng() * 100),
    WISDOM:    Math.floor(prng() * 100),
    SNARK:     Math.floor(prng() * 100),
  };

  // Soul generated ONCE by Claude, then saved to ~/.claude/config.json
  const soul = await generateSoul(species, rarity, stats);  // cached after first run
  return { species, rarity, eye, hat, stats, soul };
}`,

  "src/utils/permissions/index.ts": `// permissions/index.ts — security gateway for every tool call
export type PermissionMode = "default" | "auto" | "bypass_permissions" | "plan_mode";

export interface PermissionContext {
  mode:             PermissionMode;
  alwaysAllowRules: PermissionRule[];  // from .claude/settings.json
  alwaysDenyRules:  PermissionRule[];  // from enterprise MDM config
}

export function checkToolPermission(
  toolName: string,
  input:    unknown,
  ctx:      PermissionContext,         // immutable — passed through, not global
): "allow" | "deny" | "ask" {

  // Level 1 — nuclear option: skip all checks
  if (ctx.mode === "bypass_permissions") return "allow";

  // Level 2 — plan mode: read-only tools only
  if (ctx.mode === "plan_mode" && !PLAN_MODE_SAFE_TOOLS.has(toolName)) return "deny";

  // Level 3 — hard deny list (enterprise policy or user config)
  if (ctx.alwaysDenyRules.some(r => r.tool === toolName)) return "deny";

  // Level 4 — explicit allow list
  if (ctx.alwaysAllowRules.some(r => r.tool === toolName)) return "allow";

  // Level 5 — mode default: auto=allow, default=ask (show dialog)
  return ctx.mode === "auto" ? "allow" : "ask";
}

// Only these tools can run while the agent is in planning/read-only mode:
const PLAN_MODE_SAFE_TOOLS = new Set([
  "FileReadTool", "GlobTool", "GrepTool",
  "WebFetchTool", "WebSearchTool",
  "ListMcpResourcesTool", "ReadMcpResourceTool",
]);`,
};

// ─── MERMAID DIAGRAM ──────────────────────────────────────────────────────────
const MERMAID_CODE = `graph LR
  subgraph Entry["🚀 Entry"]
    main["main.tsx\\n4,683 lines"]
  end
  subgraph Core["⚙️ Core Engine"]
    QE["QueryEngine.ts\\nReAct Loop"]
    Tool["Tool.ts\\nInterface"]
    Task["Task.ts\\n6 Task Types"]
    State["AppState.tsx\\nReactive State"]
  end
  subgraph ToolsGrp["🔧 40+ Tools"]
    FileTool["File Tools\\nRead/Edit/Write/Glob/Grep"]
    ShellTool["Shell Tools\\nBash/PowerShell/REPL"]
    AgentTool["AgentTool\\nSpawns Sub-agents"]
    MCPTool["MCP Tool\\nProtocol"]
    WebTool["Web Tools\\nFetch/Search"]
  end
  subgraph SvcGrp["🏗️ Services"]
    API["services/api\\nClaude SDK + Cost"]
    MCPSvc["services/mcp\\nServer Manager"]
    Dream["autoDream\\nMemory ETL"]
    Analytics["analytics\\nFeature Gates"]
  end
  subgraph UIGrp["🖥️ UI + Bridge"]
    Components["60+ Components\\nReact/Ink Terminal"]
    Bridge["bridge/\\nIDE WebSocket JWT"]
    Buddy["buddy/\\nPRNG Companion"]
  end
  subgraph SecurityGrp["🔒 Security"]
    Perms["Permission System\\n4 Modes"]
    Undercover["undercover.ts\\nCodename Filter"]
  end
  main --> QE
  main --> Components
  QE --> Tool
  QE --> State
  QE --> API
  QE --> Dream
  Tool --> FileTool & ShellTool & AgentTool & MCPTool & WebTool
  AgentTool --> Task
  API --> MCPSvc
  MCPSvc --> MCPTool
  State --> Perms
  Bridge --> QE
  Components --> Buddy`;

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: "summarize_folder", label: "Summarize",       icon: AlignLeft,  color: "#4f8ef7" },
  { id: "find_bugs",        label: "Find Bugs",       icon: Bug,        color: "#f87171" },
  { id: "explain_pattern",  label: "Design Pattern",  icon: Sparkles,   color: "#818cf8" },
  { id: "generate_docs",    label: "Generate Docs",   icon: BookOpen,   color: "#34d399" },
] as const;
type QuickActionId = typeof QUICK_ACTIONS[number]["id"];

// ─── DICT CATEGORY COLORS (module scope for perf) ────────────────────────────
const DICT_CAT_COLOR: Record<string, string> = {
  "Agentic Core":"#4f8ef7","LLM & Models":"#34d399","Protocols":"#fbbf24",
  "Memory & Storage":"#a78bfa","Infrastructure":"#38bdf8","Security & Compliance":"#f87171",
};

// ─── SYNTAX HIGHLIGHT ─────────────────────────────────────────────────────────
function highlight(line: string): string {
  const esc = line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  // Bash / Dockerfile / Python: lines starting with # are comments
  if (esc.trimStart().startsWith("#"))
    return `<span style="color:#6b7499;font-style:italic">${esc}</span>`;
  return esc
    .replace(/(`[^`]*`|"[^"]*"|'[^']*')/g,'<span style="color:#a3e635">$1</span>')
    .replace(/\b(import|export|from|const|let|var|function|class|interface|type|extends|implements|return|async|await|new|if|else|for|while|of|in|true|false|null|undefined|void|break|continue|throw|try|catch|finally|default)\b/g,'<span style="color:#c084fc">$1</span>')
    .replace(/\b([A-Z][A-Za-z0-9_]+)\b/g,'<span style="color:#38bdf8">$1</span>')
    .replace(/\b([a-z_][a-zA-Z0-9_]*)(?=\()/g,'<span style="color:#fbbf24">$1</span>')
    .replace(/(\/\/[^\n]*)/g,'<span style="color:#6b7499;font-style:italic">$1</span>')
    .replace(/\b(\d+)\b/g,'<span style="color:#fb923c">$1</span>');
}

// ─── HELPER: get explanation for any path ─────────────────────────────────────
function getExplanation(path: string): FileExplanation | null {
  if (FILE_EXPLANATIONS[path]) return FILE_EXPLANATIONS[path];
  // Match parent dir
  const dir = path.split("/").slice(0, 3).join("/");
  if (FILE_EXPLANATIONS[dir]) return FILE_EXPLANATIONS[dir];
  const dir2 = path.split("/").slice(0, 2).join("/");
  if (FILE_EXPLANATIONS[dir2]) return FILE_EXPLANATIONS[dir2];
  return null;
}

// ─── DIFFICULTY BADGE ─────────────────────────────────────────────────────────
const DIFF_COLOR: Record<string, string> = {
  Beginner: "#34d399", Intermediate: "#fbbf24", Advanced: "#f87171",
};

// ─── PAGE TABS ────────────────────────────────────────────────────────────────
type PageTab = "codeintel" | "architecture" | "dictionary" | "dod" | "shell" | "blueprint" | "learn";
const PAGE_TABS: { id: PageTab; label: string; color: string; icon: ReactNode }[] = [
  { id: "codeintel",    label: "Code Intel",    color: "#4f8ef7", icon: <Code2 size={13}/> },
  { id: "architecture", label: "Architecture",  color: "#34d399", icon: <Layers size={13}/> },
  { id: "dictionary",   label: "AI Dictionary", color: "#a78bfa", icon: <BookOpen size={13}/> },
  { id: "dod",          label: "DoD Example",   color: "#fb923c", icon: <Building2 size={13}/> },
  { id: "shell",        label: "Prod Shell",    color: "#f472b6", icon: <Terminal size={13}/> },
  { id: "blueprint",    label: "AI Blueprint",  color: "#e879f9", icon: <Boxes size={13}/> },
  { id: "learn",        label: "🎓 Beginner Guide", color: "#f59e0b", icon: <GraduationCap size={13}/> },
];

// ─── ARCHITECTURE LAYERS ─────────────────────────────────────────────────────
const ARCH_LAYERS = [
  {
    id: 1, label: "Entry & CLI Bootstrap", color: "#4f8ef7", icon: "🚀",
    files: ["src/main.tsx (4,683L)", "src/commands.ts (312L)", "src/context.ts (88L)"],
    tech: ["Commander.js", "Bun Runtime", "React/Ink", "process.argv"],
    desc: "Application front door. Parses CLI flags, registers 70+ subcommands, injects all dependencies, and starts the React/Ink terminal renderer.",
    details: [
      "Commander.js registers subcommands as lazy-loaded modules — fast startup",
      "React/Ink renders JSX into terminal output using Yoga flexbox layout",
      "Dependency injection: Map<string,Tool> + AppState built here, injected down",
      "SIGINT/SIGTERM handlers call engine.abort() for graceful shutdown",
      "--dangerously-skip-permissions flag sets bypass mode in PermissionContext",
    ],
  },
  {
    id: 2, label: "ReAct Core Engine", color: "#34d399", icon: "⚙️",
    files: ["src/QueryEngine.ts (890L)", "src/query.ts (280L)", "src/history.ts (185L)"],
    tech: ["Anthropic SDK", "Async Generators", "SSE Streaming", "tool_use protocol"],
    desc: "The reasoning brain. Implements the Reason → Act → Observe loop. Every user message enters here; the final answer emerges after N cycles.",
    details: [
      "REASON: compose system prompt + serialize all tool schemas → stream from Claude API",
      "ACT: detect stop_reason='tool_use', dispatch tool by name from injected Map",
      "OBSERVE: append tool result as tool_result block → loop back to REASON",
      "TERMINATE: stop_reason='end_turn' breaks the while loop",
      "Async generators yield tokens in real-time so UI sees text word-by-word",
    ],
  },
  {
    id: 3, label: "Tool Abstraction Layer", color: "#a78bfa", icon: "🔧",
    files: ["src/Tool.ts (140L)", "src/tools/ (12+ files)", "src/tools/AgentTool.ts (310L)"],
    tech: ["TypeScript interfaces", "JSON Schema", "Dependency Inversion", "Zod"],
    desc: "Universal contract all 40+ tools implement. QueryEngine depends on the Tool interface, never on concrete tools — enabling hot-swap and testing.",
    details: [
      "Tool interface: name, description, inputJSONSchema, execute(input, state)",
      "Schemas serialized into API request — Claude reads them to pick the right tool",
      "allowInPlanMode?: read-only tools whitelist for safe planning mode",
      "isDangerous?: triggers extra confirmation dialog in default permission mode",
      "AgentTool spawns sub-agents — recursive delegation with depth limit",
    ],
  },
  {
    id: 4, label: "Task Management", color: "#fbbf24", icon: "🎫",
    files: ["src/Task.ts (220L)", "src/cost-tracker.ts (130L)"],
    tech: ["AbortController", "child_process", "File-based IPC", "SIGTERM/SIGKILL"],
    desc: "Six async task types for background work. Every task has a universal kill() method. Output streamed via per-task scratchpad files.",
    details: [
      "6 types: local_bash, local_agent, remote_agent, in_process_teammate, local_workflow, dream",
      "LocalShellTask: wraps Node.js child_process, SIGTERM→SIGKILL kill chain",
      "LocalAgentTask: AbortController signals the async ReAct loop to stop",
      "Output written to scratchpad dir — TaskOutputTool polls for new bytes",
      "generateTaskId prefix encodes type: 'a8f3k2p1' = agent, 'bb2n9x7r' = bash",
    ],
  },
  {
    id: 5, label: "Services Layer", color: "#38bdf8", icon: "🏗️",
    files: ["src/services/api/", "src/services/mcp/", "src/services/autoDream/", "src/services/analytics/"],
    tech: ["@anthropic-ai/sdk", "GrowthBook", "MCP Protocol", "OAuth 2.0"],
    desc: "21 service modules handling external integrations: Claude API, MCP servers, background memory ETL, feature flags, OAuth, history compaction.",
    details: [
      "services/api: wraps SDK with retry, rate limiting, cost tracking, streaming normalization",
      "services/mcp: spawns/authenticates MCP servers, dynamically creates Tool objects",
      "services/autoDream: DreamTask extracts key facts from history → writes MEMORY.md",
      "services/analytics: GrowthBook feature gates control COORDINATOR_MODE, KAIROS flags",
      "services/compact: trims long conversation history to fit model context window",
    ],
  },
  {
    id: 6, label: "Multi-Agent Coordinator", color: "#fb923c", icon: "🏗️",
    files: ["src/coordinator/coordinatorMode.ts (480L)", "src/tools/AgentTool.ts"],
    tech: ["Parallel Execution", "Team Channels", "Scratchpad Isolation", "Feature Flags"],
    desc: "Swarm orchestrator. Decomposes complex tasks, spawns parallel specialist workers, aggregates results. Up to 3× speed on parallelizable work.",
    details: [
      "Gated by COORDINATOR_MODE GrowthBook feature flag",
      "Coordinator reads task → decomposes into independent subtasks",
      "Each subtask = LocalAgentTask with restricted tool set (no agent spawning)",
      "TeamCreateTool creates shared channel; workers broadcast via SendMessageTool",
      "Each worker gets isolated scratchpad dir — no file conflicts across workers",
    ],
  },
  {
    id: 7, label: "IDE Bridge", color: "#f472b6", icon: "🌐",
    files: ["src/bridge/ (32 files)", "src/bridge/jwtUtils.ts (90L)", "src/bridge/replBridge.ts (280L)"],
    tech: ["WebSocket", "JWT HS256", "JSON-RPC 2.0", "REPL Multiplexing"],
    desc: "Secure bidirectional tunnel between CLI and IDE (VS Code / JetBrains). JWT-signed messages, per-window REPL sessions, file selection context.",
    details: [
      "IDE extension opens WebSocket to CLI after port negotiation",
      "jwtUtils.ts signs every message with session secret — prevents injection",
      "Messages follow JSON-RPC 2.0 envelope: {id, method, params}",
      "replBridge.ts: each IDE window gets own QueryEngine + AppState instance",
      "Code selections flow as attachment context prepended to next message",
    ],
  },
  {
    id: 8, label: "State, Permissions & Memory", color: "#94a3b8", icon: "🔒",
    files: ["src/AppState.tsx (360L)", "src/utils/permissions/ (dir)", "src/utils/undercover.ts (85L)"],
    tech: ["React Context", "LRU Cache", "MDM Config", "Content Filtering"],
    desc: "Reactive session state, 4-mode permission system, enterprise MDM config, and internal codename redaction filter.",
    details: [
      "AppState: messages, session, model, CWD, cost — reactive via React context",
      "4 permission modes: bypass_permissions → auto → default (ask) → plan_mode",
      "Permission chain: bypass → plan whitelist → deny list → allow list → mode default",
      "Enterprise MDM populates alwaysDenyRules from managed config registry",
      "undercover.ts: redacts internal codenames ('Tengu', 'Capybara') from outputs",
    ],
  },
];

// ─── AI DICTIONARY ────────────────────────────────────────────────────────────
interface DictTerm {
  term: string;
  category: string;
  short: string;
  definition: string;
  realWorld: string;
  codeRef?: string;
  related?: string[];
}

const DICT_CATEGORIES = [
  "All", "Agentic Core", "LLM & Models", "Protocols", "Memory & Storage", "Infrastructure", "Security & Compliance",
];

const DICTIONARY: DictTerm[] = [
  // ── Agentic Core ──
  { term: "ReAct Loop", category: "Agentic Core", short: "Reason + Act cycle",
    definition: "An iterative cognitive loop where an LLM alternates between reasoning (generating a thought) and acting (calling a tool), then observes the result and repeats until the task is complete.",
    realWorld: "When you ask Claude to 'fix the bug in auth.ts', it reads the file (Act), reasons about the cause (Reason), edits it (Act), runs tests (Act), and observes pass/fail — looping until tests pass.",
    codeRef: "src/QueryEngine.ts — while(!aborted) loop, stop_reason='tool_use' check",
    related: ["Tool Use", "Observation Space", "Chain-of-Thought"],
  },
  { term: "Tool Use / Function Calling", category: "Agentic Core", short: "LLM-invoked external functions",
    definition: "A capability where an LLM can pause generation and request execution of a named function with structured JSON arguments. The result is fed back as context for continued reasoning.",
    realWorld: "Claude sees a bug report, calls bash({command:'npm test'}) to get real test output, then uses that to write a targeted fix — not hallucinated output.",
    codeRef: "src/Tool.ts — inputJSONSchema fed to API; Tool.execute() called on tool_use stop",
    related: ["ReAct Loop", "JSON Schema", "Tool Schema"],
  },
  { term: "Chain-of-Thought (CoT)", category: "Agentic Core", short: "Explicit intermediate reasoning",
    definition: "Prompting technique that instructs the LLM to show its reasoning steps before giving a final answer. Extended thinking (ultrathink) uses a dedicated reasoning token budget.",
    realWorld: "Asking 'think step by step before answering' dramatically improves accuracy on math, code, and multi-step planning tasks because the model can self-correct during reasoning.",
    codeRef: "System prompt in src/utils/systemPromptType.ts — instructs Claude to think before acting",
    related: ["ReAct Loop", "System Prompt"],
  },
  { term: "Multi-Agent Orchestration", category: "Agentic Core", short: "Coordinating parallel AI workers",
    definition: "A pattern where a coordinator agent decomposes a complex task, spawns multiple specialist worker agents, and synthesizes their parallel outputs into a cohesive result.",
    realWorld: "Security audit: coordinator spawns 3 agents simultaneously — one reviews auth, one checks SQL, one scans dependencies — completing in 1/3 the time of sequential analysis.",
    codeRef: "src/coordinator/coordinatorMode.ts — team channels, scratchpad isolation",
    related: ["AgentTool", "Task Decomposition", "Scratchpad Memory"],
  },
  { term: "Task Decomposition", category: "Agentic Core", short: "Breaking complex tasks into subtasks",
    definition: "The process of analyzing a high-level goal and dividing it into smaller, independent, executable subtasks — ideally ones that can be parallelized across multiple agents.",
    realWorld: "'Migrate the database schema' decomposes to: (1) analyze current schema, (2) write migration scripts, (3) update ORM models, (4) write rollback scripts — done in parallel.",
    codeRef: "src/coordinator/coordinatorMode.ts — subtask generation via LLM pass",
    related: ["Multi-Agent Orchestration", "ReAct Loop"],
  },
  { term: "Agentic Loop", category: "Agentic Core", short: "Self-directing execution cycle",
    definition: "A program structure where an AI agent autonomously cycles through sense → plan → act until a terminal condition is met (task complete, error, timeout, or user interrupt).",
    realWorld: "A DevOps agent loops: read CI logs (sense) → diagnose failure (plan) → fix code (act) → rerun tests (act) → sense again — autonomously fixing the pipeline without human intervention.",
    codeRef: "src/QueryEngine.ts — while loop + AbortController for kill signal",
    related: ["ReAct Loop", "Task.ts", "AbortController"],
  },
  { term: "Human-in-the-Loop (HITL)", category: "Agentic Core", short: "Human approval checkpoints",
    definition: "Architecture pattern where an AI agent pauses execution at critical decision points and requests explicit human confirmation before proceeding with irreversible or sensitive actions.",
    realWorld: "Before deleting 50 database records, the agent shows the exact SQL and waits for Y/N approval — preventing a hallucinated WHERE clause from causing data loss.",
    codeRef: "src/utils/permissions/ — 'ask' mode shows TrustDialog before tool execution",
    related: ["Permission System", "TrustDialog", "Plan Mode"],
  },
  { term: "Agent Scaffolding", category: "Agentic Core", short: "Framework wrapping an LLM",
    definition: "The infrastructure code surrounding an LLM that handles tool dispatch, conversation history, streaming, error recovery, permission enforcement, and memory management.",
    realWorld: "Claude itself is just an API. Claude Code adds the scaffolding: terminal UI, file tools, git integration, permission dialogs, cost tracking — turning a model into a useful agent.",
    codeRef: "src/main.tsx + src/QueryEngine.ts — together form the scaffolding",
    related: ["ReAct Loop", "Tool Use", "Permission System"],
  },
  { term: "Observation", category: "Agentic Core", short: "Tool result fed back to LLM",
    definition: "In ReAct terminology, the output from executing a tool call. The observation is appended to the conversation as a tool_result message, giving the LLM grounded data to reason about.",
    realWorld: "After calling bash({command:'git diff HEAD~1'}), the actual diff text is the observation — the LLM uses this real output (not hallucinated) to write the changelog entry.",
    codeRef: "src/QueryEngine.ts — tool_result block appended to messages array",
    related: ["ReAct Loop", "Tool Use"],
  },
  { term: "System Prompt", category: "Agentic Core", short: "Persistent agent instructions",
    definition: "A special message sent to the LLM before the user's conversation that establishes the agent's persona, capabilities, constraints, memory, and behavioral rules for the entire session.",
    realWorld: "Claude Code's system prompt includes: your current directory, MEMORY.md contents, tool descriptions, coding style rules, permission mode, and instructions never to hallucinate file paths.",
    codeRef: "src/utils/systemPromptType.ts — dynamically composed per turn from AppState",
    related: ["Chain-of-Thought", "Memory Consolidation", "AppState"],
  },
  // ── LLM & Models ──
  { term: "Large Language Model (LLM)", category: "LLM & Models", short: "Transformer-based text predictor",
    definition: "A neural network trained on vast text corpora to predict the next token given context. Modern LLMs exhibit emergent capabilities: reasoning, code generation, instruction following, and tool use.",
    realWorld: "Claude 3.5 Sonnet has a 200K token context window, enabling it to analyze an entire codebase, write comprehensive refactors, and maintain coherent reasoning across thousands of lines.",
    codeRef: "src/services/api/ — Anthropic SDK wrapper with model config",
    related: ["Context Window", "Token", "Foundation Model"],
  },
  { term: "Context Window", category: "LLM & Models", short: "LLM's working memory limit",
    definition: "The maximum number of tokens (input + output combined) an LLM can process in a single call. Exceeding it requires truncation or compression strategies to preserve the most relevant information.",
    realWorld: "A 200K context window holds ~150,000 words — about the length of two novels. But token costs scale linearly, so Claude Code tracks usage and compacts history when approaching limits.",
    codeRef: "src/services/compact/ — history compaction; src/utils/model/ — context math",
    related: ["Token", "History Compaction", "RAG"],
  },
  { term: "Token / Tokenization", category: "LLM & Models", short: "LLM's unit of text processing",
    definition: "LLMs don't process characters or words — they process tokens, which are variable-length subword units (typically 3-4 chars for English). Cost, speed, and context limits are all measured in tokens.",
    realWorld: "'Hello, world!' = 4 tokens. A 1,000-line TypeScript file ≈ 15,000 tokens. At $3/MTok input, analyzing a 10K token file costs $0.03 — tracked automatically by cost-tracker.ts.",
    codeRef: "src/cost-tracker.ts — token counting + cost aggregation per session",
    related: ["Context Window", "Cost Tracking", "LLM"],
  },
  { term: "Temperature", category: "LLM & Models", short: "Randomness control parameter",
    definition: "A scalar (0.0–2.0) that controls the diversity of LLM outputs. Low temperature (0.0–0.3) produces deterministic, precise outputs ideal for code. High temperature enables more creative responses.",
    realWorld: "Code generation uses temperature 0.0–0.2 for deterministic correctness. Creative writing uses 0.8–1.2. Agentic tasks usually stay low (0.0–0.3) to reduce hallucination risk.",
    codeRef: "src/services/api/ — temperature passed in API request config",
    related: ["LLM", "Sampling Strategy"],
  },
  { term: "Streaming API", category: "LLM & Models", short: "Token-by-token response delivery",
    definition: "API mode where tokens are delivered progressively as they're generated, rather than waiting for the full response. Implemented via Server-Sent Events (SSE). Enables real-time UI updates.",
    realWorld: "When Claude types a long explanation, you see it appear word by word — that's streaming. Without it, you'd wait 10–30s for the full response then see it all at once.",
    codeRef: "src/QueryEngine.ts — messages.stream(), yielding content_block_delta events",
    related: ["Async Generator", "SSE", "QueryEngine"],
  },
  { term: "Stop Reason", category: "LLM & Models", short: "Why the LLM stopped generating",
    definition: "A field in the API response indicating why the model stopped: 'end_turn' (natural completion), 'tool_use' (wants to call a function), 'max_tokens' (hit limit), or 'stop_sequence' (hit a stop token).",
    realWorld: "stop_reason='tool_use' is the core signal that drives the ReAct loop. QueryEngine checks this after every API call to decide whether to execute tools or return the final answer.",
    codeRef: "src/QueryEngine.ts — `if (response.stop_reason !== 'tool_use') break;`",
    related: ["ReAct Loop", "Tool Use", "QueryEngine"],
  },
  { term: "Prompt Engineering", category: "LLM & Models", short: "Crafting inputs for optimal LLM output",
    definition: "The practice of designing system prompts, few-shot examples, and instruction formats to reliably elicit high-quality, consistent LLM outputs for specific tasks.",
    realWorld: "Adding 'Think step by step' improves GPT-4 math accuracy by ~40%. Claude Code's system prompt includes working directory, memory, tool schemas, and behavioral rules — ~2,000 tokens of engineering.",
    codeRef: "src/utils/systemPromptType.ts — system prompt composition engine",
    related: ["System Prompt", "Chain-of-Thought", "Few-Shot"],
  },
  // ── Protocols ──
  { term: "MCP (Model Context Protocol)", category: "Protocols", short: "Open standard for AI tool integration",
    definition: "An open protocol by Anthropic that standardizes how LLMs connect to external tools, data sources, and services. Defines capability declarations, authentication, and tool invocation contracts.",
    realWorld: "An MCP server exposes your company's internal database as a set of tools. Claude can then query it just like any built-in tool — with no custom integration code on Claude's side.",
    codeRef: "src/services/mcp/ — server lifecycle; src/tools/MCPTool.ts — protocol execution",
    related: ["Tool Use", "A2A Protocol", "Capability Declaration"],
  },
  { term: "A2A Protocol (Agent-to-Agent)", category: "Protocols", short: "Inter-agent communication standard",
    definition: "A protocol enabling different AI agents (potentially from different providers) to communicate, delegate tasks, and share results in a standardized format without coupling implementations.",
    realWorld: "A coordinator agent built on Claude delegates a sub-task to a specialized agent built on GPT-4 via A2A protocol — each agent exposes a standard task interface regardless of underlying model.",
    codeRef: "src/coordinator/ — team channels; src/bridge/ — remote agent protocols",
    related: ["Multi-Agent Orchestration", "MCP", "JSON-RPC"],
  },
  { term: "JSON Schema", category: "Protocols", short: "Declarative data contract format",
    definition: "A vocabulary for annotating and validating JSON documents. In agentic AI, used to define tool input parameters so the LLM knows exactly what data structure to provide when calling a tool.",
    realWorld: "BashTool's schema: {type:'object', properties:{command:{type:'string'}, timeout:{type:'number',default:120}}}. Claude reads this to know exactly how to call bash — no guessing.",
    codeRef: "src/Tool.ts — inputJSONSchema: JSONSchema7 field on every tool",
    related: ["Tool Use", "Zod", "Tool Schema"],
  },
  { term: "JSON-RPC 2.0", category: "Protocols", short: "Remote procedure call over JSON",
    definition: "A stateless, lightweight RPC protocol encoded in JSON. Messages have: id (correlation), method (function name), params (arguments), and result or error. Used in IDE bridge and MCP.",
    realWorld: "VS Code sends {id:42, method:'sendMessage', params:{text:'Fix the bug'}} over WebSocket. The CLI processes it and responds {id:42, result:'Done — test passes'}.",
    codeRef: "src/bridge/bridgeMessaging.ts — JSON-RPC envelope framing",
    related: ["WebSocket", "JWT", "IDE Bridge"],
  },
  { term: "WebSocket", category: "Protocols", short: "Full-duplex browser/server channel",
    definition: "A protocol providing persistent, full-duplex communication channels over a single TCP connection. Unlike HTTP, either party can send messages at any time without request/response cycles.",
    realWorld: "The IDE bridge uses WebSocket so the CLI can push streaming tokens to VS Code in real-time — impossible with HTTP polling which would add latency and require constant requests.",
    codeRef: "src/bridge/ — WebSocket server in CLI; VS Code extension on client side",
    related: ["JSON-RPC 2.0", "JWT", "Streaming API"],
  },
  { term: "JWT (JSON Web Token)", category: "Protocols", short: "Signed auth token for stateless auth",
    definition: "A compact, self-contained token with a cryptographic signature (HS256/RS256) encoding claims about identity and permissions. The receiver can verify authenticity without a database lookup.",
    realWorld: "Every IDE bridge message is signed with the session JWT. Even if another local process on port-scans and finds the bridge WebSocket, it can't inject commands without the session secret.",
    codeRef: "src/bridge/jwtUtils.ts — HMAC-HS256 signing/verification for bridge sessions",
    related: ["WebSocket", "OAuth 2.0", "IDE Bridge"],
  },
  // ── Memory & Storage ──
  { term: "RAG (Retrieval-Augmented Generation)", category: "Memory & Storage", short: "Grounding LLMs in external knowledge",
    definition: "An architecture where relevant documents are retrieved from a vector database and injected into the LLM's context window before generation — giving access to knowledge beyond training data.",
    realWorld: "A DoD compliance agent uses RAG to retrieve relevant FISMA controls from a vector store when asked about a specific system. Without RAG, it would rely on potentially outdated training data.",
    codeRef: "Not in base framework — add via services layer using pgvector or Pinecone",
    related: ["Vector Database", "Context Window", "Semantic Memory"],
  },
  { term: "Vector Database", category: "Memory & Storage", short: "Semantic similarity search store",
    definition: "A database that stores high-dimensional embedding vectors and supports approximate nearest neighbor search — enabling semantic similarity queries ('find documents similar to this query').",
    realWorld: "Store 10,000 audit documents as embeddings. Query 'find controls related to access management' returns the 20 most semantically relevant documents — even if they use different wording.",
    related: ["RAG", "Embeddings", "Semantic Memory"],
  },
  { term: "Memory Consolidation (autoDream)", category: "Memory & Storage", short: "Background long-term memory ETL",
    definition: "A background process that periodically reads recent conversation history, extracts key facts and decisions via an LLM pass, and persists them to a structured memory file for future sessions.",
    realWorld: "autoDream runs between sessions. It reads 'user prefers functional TypeScript, hates classes, project uses pnpm not npm' from conversations and writes it to MEMORY.md for future context.",
    codeRef: "src/services/autoDream/ — DreamTask (task type 'dream'), writes MEMORY.md",
    related: ["Context Window", "System Prompt", "Episodic Memory"],
  },
  { term: "History Compaction", category: "Memory & Storage", short: "Shrinking conversation context",
    definition: "A strategy for managing context window limits by summarizing old conversation turns into compressed summaries, discarding raw turns while preserving key facts and decisions.",
    realWorld: "After 100 turns of debugging, the conversation history is 80K tokens. Compaction summarizes the first 60 turns ('fixed auth bug, refactored UserService') — freeing 50K tokens for new work.",
    codeRef: "src/services/compact/ — triggered when context approaches model limit",
    related: ["Context Window", "Memory Consolidation"],
  },
  { term: "Scratchpad Memory", category: "Memory & Storage", short: "Per-task isolated working storage",
    definition: "Temporary, task-scoped file storage where an agent writes intermediate results, partial outputs, and working state. Isolated per task to prevent conflicts in multi-agent systems.",
    realWorld: "Worker agent A writes partial analysis to /tmp/tasks/a8f3k2p1/findings.txt. Worker B writes to /tmp/tasks/bb2n9x7r/findings.txt. Coordinator reads both without collision.",
    codeRef: "src/Task.ts — scratchpad directory per LocalAgentTask",
    related: ["Multi-Agent Orchestration", "Task Management"],
  },
  { term: "Episodic Memory", category: "Memory & Storage", short: "Memory of specific past events",
    definition: "AI memory of specific past interactions, decisions, and outcomes — analogous to human episodic memory. Stored as conversation history, session logs, or structured event records.",
    realWorld: "Remembering 'on March 5th I helped user refactor the auth module, they rejected approach A and preferred approach B' — this context improves future interactions.",
    related: ["Memory Consolidation", "History Compaction", "Semantic Memory"],
  },
  // ── Infrastructure ──
  { term: "Feature Flags (GrowthBook)", category: "Infrastructure", short: "Runtime feature toggling",
    definition: "A system that enables or disables code features for specific users/organizations at runtime without code deployment. Used for A/B testing, gradual rollouts, and capability gating.",
    realWorld: "COORDINATOR_MODE feature flag: enabled for 10% of users to test multi-agent mode. If bugs are found, disabled immediately without code rollback — zero-downtime feature control.",
    codeRef: "src/services/analytics/ — GrowthBook SDK integration; flags COORDINATOR_MODE, KAIROS",
    related: ["A/B Testing", "Service Layer", "Coordinator"],
  },
  { term: "Dependency Injection", category: "Infrastructure", short: "Externally wiring object dependencies",
    definition: "A pattern where an object receives its dependencies from the outside rather than creating them internally. Enables testing, swapping implementations, and breaking circular dependencies.",
    realWorld: "QueryEngine doesn't import BashTool — it receives Map<string,Tool> from main.tsx. To test QueryEngine with mock tools, just pass a map of mock Tool objects. Zero real I/O needed.",
    codeRef: "src/main.tsx — creates tools map; src/QueryEngine.ts — receives it via constructor",
    related: ["Tool Abstraction", "Service Layer", "Testing"],
  },
  { term: "Async Generator", category: "Infrastructure", short: "Lazy streaming data producer",
    definition: "A JavaScript function that can yield values asynchronously over time using async function* syntax. Enables memory-efficient streaming of LLM tokens without buffering the entire response.",
    realWorld: "QueryEngine.query() is an async generator. Each token from the Anthropic SSE stream is immediately yielded to the UI — the user sees text appear in real-time, not all at once after 10s.",
    codeRef: "src/QueryEngine.ts — async *query(): AsyncGenerator<QueryEvent>",
    related: ["Streaming API", "ReAct Loop"],
  },
  { term: "LRU Cache", category: "Infrastructure", short: "Least-recently-used eviction cache",
    definition: "A bounded in-memory cache that automatically evicts the least recently used entries when capacity is reached. Used for file contents, parsed ASTs, and tool results to avoid redundant I/O.",
    realWorld: "FileReadTool caches recently read files in an LRU cache. Reading the same config.json 20 times in one session only hits the filesystem once — subsequent reads are microsecond-fast.",
    codeRef: "src/services/ — LRU caches for file state, parsed schemas, MCP responses",
    related: ["Service Layer", "Performance"],
  },
  { term: "Rate Limiting", category: "Infrastructure", short: "Throttling API request frequency",
    definition: "A mechanism that caps the number of API calls per time window. Essential for agentic systems that can loop rapidly and burn through API quotas in seconds without control.",
    realWorld: "Without rate limiting, a runaway ReAct loop hitting a bug could make 100 API calls in 10 seconds — burning tokens and triggering HTTP 429 errors. Rate limiting prevents cascading failures.",
    codeRef: "src/services/api/ — exponential backoff + request queue",
    related: ["Cost Tracking", "Retry Logic"],
  },
  { term: "Cost Tracking", category: "Infrastructure", short: "Monitoring API spend per session",
    definition: "Per-session accumulation of input/output token counts converted to USD cost using model-specific pricing. Enables budget enforcement and cost attribution.",
    realWorld: "After a long coding session, cost-tracker.ts reports: 'This session: 45K input tokens ($0.135) + 12K output tokens ($0.18) = $0.315 total'. Helps teams budget AI agent usage.",
    codeRef: "src/cost-tracker.ts — aggregates per-model token counts; displayed in terminal status bar",
    related: ["Token", "Rate Limiting"],
  },
  { term: "Zod Schema Validation", category: "Infrastructure", short: "Runtime TypeScript type validation",
    definition: "A TypeScript-first schema declaration library that validates data at runtime, not just compile time. Used to validate tool inputs, API responses, and config files with detailed error messages.",
    realWorld: "When Claude calls BashTool with {command: 42} (number instead of string), Zod catches it at runtime: 'Expected string, received number at command'. Prevents confusing downstream errors.",
    related: ["JSON Schema", "TypeScript", "Tool Use"],
  },
  { term: "PRNG (Pseudo-Random Number Generator)", category: "Infrastructure", short: "Deterministic fake randomness",
    definition: "An algorithm producing a sequence of numbers that appears random but is fully deterministic given the same seed. Enables reproducibility — same seed always produces same sequence.",
    realWorld: "Companion buddy uses Mulberry32 PRNG seeded from userId hash. Your 'Charizard' companion always has the same stats across devices/reinstalls because it's math, not stored data.",
    codeRef: "src/buddy/companion.ts — mulberry32() seeded via FNV-1a hash of userId",
    related: ["Hash Functions", "Determinism", "Reproducibility"],
  },
  // ── Security & Compliance ──
  { term: "Permission Modes", category: "Security & Compliance", short: "4-level tool execution safety",
    definition: "A hierarchical permission system with 4 modes controlling tool execution: bypass (no checks), auto (allow all), default (ask for sensitive ops), plan (read-only only).",
    realWorld: "CI/CD pipeline uses auto mode (unattended). Human developers use default mode (asks before git push or rm). Security audits use plan mode (read-only, zero file modification risk).",
    codeRef: "src/utils/permissions/ — PermissionMode type + checkToolPermission() function",
    related: ["RBAC", "Defense in Depth", "HITL", "Plan Mode"],
  },
  { term: "Plan Mode", category: "Security & Compliance", short: "Read-only agent execution mode",
    definition: "A restricted permission mode that allows only read-only tools (FileRead, Glob, Grep, WebFetch, WebSearch). No file writes, no shell commands, no state mutations. Safe for exploration.",
    realWorld: "Before a production deployment, run in plan mode to generate a diff of all proposed changes. Review the plan. Then switch to auto mode to execute — two-phase 'dry run then execute' workflow.",
    codeRef: "src/utils/permissions/ — PLAN_MODE_SAFE_TOOLS Set of whitelisted tool names",
    related: ["Permission Modes", "HITL", "Defense in Depth"],
  },
  { term: "Defense in Depth", category: "Security & Compliance", short: "Layered security redundancy",
    definition: "Security architecture where multiple independent layers of controls each provide protection, so a failure in one layer doesn't compromise the entire system.",
    realWorld: "Permission system: bypass check → plan mode whitelist → hard deny list → allow list → mode default. Five independent gates before any tool executes. Bypassing one doesn't bypass all.",
    codeRef: "src/utils/permissions/ — 5-level check chain in checkToolPermission()",
    related: ["Permission Modes", "Zero Trust", "RBAC"],
  },
  { term: "FISMA", category: "Security & Compliance", short: "US federal security law",
    definition: "Federal Information Security Modernization Act. Mandates that US federal agencies implement information security programs and obtain Authorization to Operate (ATO) for all systems.",
    realWorld: "Any AI agent touching DoD systems must comply with FISMA. This means documented controls, continuous monitoring, incident response plans, and annual security assessments.",
    related: ["ATO", "NIST 800-53", "CUI", "FedRAMP"],
  },
  { term: "ATO (Authorization to Operate)", category: "Security & Compliance", short: "Federal system deployment approval",
    definition: "Official management decision granting authorization for an information system to operate, accepting residual risk. Required before deploying to federal production environments.",
    realWorld: "Before deploying an AI audit agent to DoD financial systems, it must receive ATO from the Authorizing Official. This typically takes 6-18 months and requires extensive documentation.",
    related: ["FISMA", "NIST 800-53", "Security Controls"],
  },
  { term: "CUI (Controlled Unclassified Information)", category: "Security & Compliance", short: "Sensitive but unclassified federal data",
    definition: "A category of US government information that requires safeguarding per law or policy, but is not classified. Includes financial data, PII, law enforcement data, and export-controlled info.",
    realWorld: "DoD financial audit data is typically CUI. AI agents processing CUI must encrypt at rest and in transit, log all access, and operate in environments with appropriate FISMA controls.",
    related: ["FISMA", "ATO", "Encryption", "Audit Logging"],
  },
  { term: "Zero Trust Architecture", category: "Security & Compliance", short: "Never trust, always verify security model",
    definition: "A security model that eliminates implicit trust. Every request — regardless of network location — must be authenticated, authorized, and continuously validated. No implicit trusted zones.",
    realWorld: "Even agents on the internal DoD network can't access financial systems without valid JWT + MFA + role claims. 'Internal network' trust is eliminated — every call must prove identity.",
    related: ["JWT", "RBAC", "Defense in Depth", "MFA"],
  },
  { term: "RBAC (Role-Based Access Control)", category: "Security & Compliance", short: "Permission by assigned role",
    definition: "Access control where permissions are assigned to roles (e.g., auditor, reviewer, admin), and users are assigned roles. Users get permissions through role membership, not direct assignment.",
    realWorld: "Audit agent role: read-only access to financial records, write access to audit findings. Reconciliation agent role: read/write access to reconciliation tables only. Admin role: full access.",
    codeRef: "src/utils/permissions/ — alwaysAllowRules/alwaysDenyRules per tool per context",
    related: ["Permission Modes", "Zero Trust", "ATO"],
  },
  { term: "Audit Logging", category: "Security & Compliance", short: "Immutable record of all AI actions",
    definition: "A tamper-evident log of every action taken by an AI agent: tool calls, files read/modified, API calls made, decisions taken, and cost incurred — with timestamps and actor identity.",
    realWorld: "For DoD financial audits, every AI action must be logged: 'Agent audit-001 read SFIS record 48823 at 14:32:07 UTC' — enabling compliance review and incident investigation.",
    codeRef: "src/cost-tracker.ts + src/history.ts — combined action + cost audit trail",
    related: ["FISMA", "CUI", "Compliance"],
  },
  { term: "Content Filtering", category: "Security & Compliance", short: "Blocking sensitive data in outputs",
    definition: "Post-processing step that scans LLM outputs for sensitive patterns (PII, classified terms, internal codenames, secrets) and redacts or blocks them before delivery to the user.",
    realWorld: "undercover.ts scans responses for internal Anthropic project codenames. In a DoD context, similar filtering would block SSNs, account numbers, or classification markers from appearing in reports.",
    codeRef: "src/utils/undercover.ts — pattern-based redaction before response display",
    related: ["CUI", "PII Protection", "Defense in Depth"],
  },
];

// ─── DOD EXAMPLE ─────────────────────────────────────────────────────────────
const DOD_AGENTS = [
  { name: "DataHarvester", color: "#4f8ef7", icon: "📥",
    role: "Collects raw financial data from SFIS, GFEBS, and PIEE systems via approved API endpoints. Normalizes formats, validates checksums, and writes to staging area.",
    tools: ["FetchSFISRecord", "FetchGFEBSLedger", "FetchPIEEObligation", "WriteToStaging", "ValidateChecksum"],
    restrictions: "Read-only on source systems. Write access to /staging only. Max 1000 records/min rate limit.",
  },
  { name: "ReconciliationEngine", color: "#34d399", icon: "⚖️",
    role: "Compares transactions across source systems. Identifies discrepancies (amount mismatches, missing entries, timing differences). Classifies by severity and type.",
    tools: ["CompareTransactions", "FlagDiscrepancy", "ClassifyVariance", "WriteAuditFinding", "QueryStaging"],
    restrictions: "Read from staging. Write to findings only. Cannot modify source system records.",
  },
  { name: "RegulatoryChecker", color: "#a78bfa", icon: "📋",
    role: "Validates financial entries against DoD FMR, NDAA requirements, and applicable OMB circulars. Flags potential violations with citation references.",
    tools: ["CheckFMRCompliance", "ValidateNDAALimit", "FetchRegulatoryText", "CitationLookup", "WriteViolationLog"],
    restrictions: "Read-only on regulatory databases. Plan mode for regulatory lookups (no writes).",
  },
  { name: "EvidenceCollector", color: "#fbbf24", icon: "🗂️",
    role: "Gathers supporting documentation for audit findings: contracts, orders, invoices, approval chains. Packages evidence packages per GAGAS standards.",
    tools: ["FetchContract", "FetchInvoice", "FetchApprovalChain", "PackageEvidence", "HashDocument"],
    restrictions: "Read-only on document repositories. Creates evidence packages in isolated output dir.",
  },
  { name: "ReportGenerator", color: "#fb923c", icon: "📊",
    role: "Synthesizes findings from all agents into structured audit reports. Generates executive summary, detailed findings table, and management recommendations. Formats per DoD reporting standards.",
    tools: ["ReadAllFindings", "GenerateSummary", "FormatAuditReport", "ExportToPDF", "SignReport"],
    restrictions: "Read-only on findings. Writes to /reports only. Cannot modify findings after signing.",
  },
];

const DOD_TOOLS_SPEC = [
  { name: "FetchSFISRecord", input: "{system_id: string, fiscal_year: number, fund_code: string}", output: "SFISRecord[]", security: "IL4", desc: "Retrieves Standard Finance System records. Requires valid PKI cert + authorized system role." },
  { name: "CompareTransactions", input: "{source_a: Transaction[], source_b: Transaction[], tolerance_usd: number}", output: "DiscrepancyReport", security: "IL2", desc: "Fuzzy-matches transactions by amount/date/fund code. Returns matched, unmatched, and tolerance-exceeded entries." },
  { name: "CheckFMRCompliance", input: "{transaction: Transaction, regulation_refs: string[]}", output: "ComplianceResult", security: "IL2", desc: "Validates transaction against DoD Financial Management Regulation chapters. Returns violation codes with citations." },
  { name: "WriteAuditFinding", input: "{severity: 'Critical'|'High'|'Medium', finding: string, evidence_ids: string[]}", output: "FindingId", security: "IL4", desc: "Appends a validated audit finding to the immutable findings ledger. Signed with agent identity + timestamp." },
  { name: "PackageEvidence", input: "{finding_id: string, document_ids: string[]}", output: "EvidencePackage", security: "IL4", desc: "Assembles GAGAS-compliant evidence package with SHA-256 hashes for tamper detection." },
];

const DOD_SECURITY = [
  { control: "Data Encryption", detail: "AES-256-GCM at rest (LUKS volumes), TLS 1.3 in transit. Key management via AWS KMS GovCloud or Azure Government Key Vault.", icon: "🔐" },
  { control: "Authentication", detail: "PKI certificates + CAC/PIV card requirement. No username/password. MFA enforced at session initiation. JWT signed with RS256 for agent-to-agent calls.", icon: "🪪" },
  { control: "Network Isolation", detail: "Deploy in isolated IL4 enclave. Agent-to-agent traffic on private subnet only. Outbound internet: blocked. Access via DISA-approved jump server.", icon: "🌐" },
  { control: "Audit Trail", detail: "Every tool call logged with: timestamp, agent ID, tool name, input hash, output hash, user principal. Logs shipped to SIEM within 60s. Immutable S3 Object Lock.", icon: "📋" },
  { control: "Permission Hardening", detail: "All agents run in 'auto' mode with explicit alwaysDenyRules. No bypass_permissions ever. plan_mode for all regulatory lookups.", icon: "🛡️" },
  { control: "Secret Management", detail: "No secrets in code or environment variables. All API keys retrieved from HashiCorp Vault or AWS Secrets Manager at runtime. Rotated every 90 days.", icon: "🔑" },
];

// ─── AI BLUEPRINT ─────────────────────────────────────────────────────────────
interface BpStep {
  n: number;
  action: string;
  title: string;
  file: string;
  folder: string;
  desc: string;
  code: string;
  note?: string;
}
interface BpSection {
  id: string; title: string; color: string; icon: string; tagline: string;
  overview: string; steps: BpStep[]; tips: string[];
  fileTree: { path: string; type: "file"|"dir"; desc: string }[];
}

const BLUEPRINT_SECTIONS: BpSection[] = [

  /* ── 1. MODEL SELECTION ─────────────────────────────────────────────── */
  {
    id: "models", title: "Model Selection", color: "#4f8ef7", icon: "🧠",
    tagline: "Tier-based LLM selection — right model for each task = 3× cheaper, equally accurate",
    overview:
      "Every agent task has a cost/quality sweet spot. A 3-tier model strategy routes tasks by complexity: " +
      "Haiku handles high-frequency lightweight tasks (tool parsing, formatting), Sonnet handles the main reasoning " +
      "and code generation loop, and Opus handles rare complex architecture decisions. This single file in src/config/ " +
      "drives the entire selection logic — every agent reads from it rather than hardcoding model names.",
    fileTree: [
      { path: "src/config/",            type: "dir",  desc: "All agent configuration" },
      { path: "src/config/models.ts",   type: "file", desc: "Model tier definitions + selector function" },
      { path: "src/config/agentConfig.ts", type: "file", desc: "Agent behaviour, permissions, budgets" },
      { path: "src/config/environment.ts", type: "file", desc: "Env-var loading with zod validation" },
      { path: ".env.local",             type: "file", desc: "ANTHROPIC_API_KEY, VAULT_ADDR, etc." },
    ],
    steps: [
      {
        n: 1, action: "Create", title: "Define model tiers",
        file: "models.ts", folder: "src/config/",
        desc: "Enumerate all supported models and assign each a tier (fast/balanced/powerful). Tier drives automatic selection throughout the codebase — change once here, propagates everywhere.",
        code:
`// src/config/models.ts
// ── 3-tier strategy: match model to task complexity ──────────────────────────

export type ModelTier = "fast" | "balanced" | "powerful";

export const MODEL_REGISTRY = {
  // Tier 1 — fast & cheap: tool call parsing, formatting, simple Q&A
  fast: {
    anthropic: "claude-haiku-4-5",        // $0.25/MTok in, $1.25/MTok out
    google:    "gemini-2.0-flash",
    openai:    "gpt-4o-mini",
  },
  // Tier 2 — balanced: main reasoning loop, code gen, analysis
  balanced: {
    anthropic: "claude-sonnet-4-5",       // $3/MTok in, $15/MTok out
    google:    "gemini-2.5-pro",
    openai:    "gpt-4o",
  },
  // Tier 3 — powerful: architecture decisions, complex planning
  powerful: {
    anthropic: "claude-opus-4-5",         // $15/MTok in, $75/MTok out
    google:    "gemini-2.5-ultra",
    openai:    "o3",
  },
} as const;

export type Provider = keyof (typeof MODEL_REGISTRY)["fast"];

/** Select the right model for a given task tier and provider */
export function selectModel(tier: ModelTier, provider: Provider = "anthropic"): string {
  return MODEL_REGISTRY[tier][provider];
}`,
        note: "Rule of thumb: 90% of agent work runs on 'balanced'. Use 'fast' only for pure formatting or classification tasks under 200 tokens. Reserve 'powerful' for once-per-session planning passes.",
      },
      {
        n: 2, action: "Create", title: "Build environment config with validation",
        file: "environment.ts", folder: "src/config/",
        desc: "Centralise all environment variable loading. Fail fast at startup if required vars are missing — never let the agent run with missing credentials and silently fail mid-task.",
        code:
`// src/config/environment.ts
import { z } from "zod";

const EnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "Anthropic key required"),
  VAULT_ADDR:        z.string().url().optional(),
  PINECONE_API_KEY:  z.string().optional(),
  NODE_ENV:          z.enum(["development", "production", "test"]).default("development"),
  AGENT_PERMISSION_MODE: z.enum(["bypass","auto","default","plan"]).default("default"),
  MAX_SESSION_COST_USD:  z.coerce.number().positive().default(5.0),
  LOG_LEVEL: z.enum(["debug","info","warn","error"]).default("info"),
});

export type Env = z.infer<typeof EnvSchema>;

let _env: Env;
export function getEnv(): Env {
  if (!_env) {
    const result = EnvSchema.safeParse(process.env);
    if (!result.success) {
      console.error("❌ Environment validation failed:");
      result.error.issues.forEach(i => console.error("  ", i.path.join("."), "→", i.message));
      process.exit(1);  // Hard fail — never run with broken config
    }
    _env = result.data;
  }
  return _env;
}`,
        note: "Never import process.env directly across the codebase. Always go through getEnv(). This makes testing trivial — just mock getEnv() once.",
      },
      {
        n: 3, action: "Create", title: "Wire model selection into the agent engine",
        file: "agentConfig.ts", folder: "src/config/",
        desc: "Define per-agent model assignments, permission rules, and budget caps. Each agent in your system references this single config — changing a model for all agents takes one line.",
        code:
`// src/config/agentConfig.ts
import { selectModel } from "./models.js";
import { getEnv }      from "./environment.js";

export interface AgentConfig {
  name:          string;
  model:         string;
  maxTokens:     number;
  permissionMode: "bypass" | "auto" | "default" | "plan";
  maxCostUSD:    number;
  systemPromptFile: string;  // path relative to src/prompts/
  allowedTools:  string[];
  denyTools:     string[];
}

const env = getEnv();

// ── Per-agent configs — change model here, not in each agent file ─────────────
export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  coordinator: {
    name: "Coordinator",
    model: selectModel("powerful"),          // Planning requires deep reasoning
    maxTokens: 8096,
    permissionMode: env.AGENT_PERMISSION_MODE,
    maxCostUSD: env.MAX_SESSION_COST_USD,
    systemPromptFile: "prompts/coordinator.md",
    allowedTools: ["AgentTool", "TeamCreateTool", "SendMessageTool", "FileReadTool"],
    denyTools:    ["BashTool", "FileEditTool", "FileWriteTool"],
  },
  worker: {
    name: "Worker",
    model: selectModel("balanced"),          // Main reasoning loop
    maxTokens: 8096,
    permissionMode: "auto",
    maxCostUSD: 1.0,
    systemPromptFile: "prompts/worker.md",
    allowedTools: ["FileReadTool", "GlobTool", "GrepTool", "BashTool", "WebFetchTool"],
    denyTools:    ["AgentTool"],             // Workers cannot spawn sub-agents
  },
  formatter: {
    name: "Formatter",
    model: selectModel("fast"),              // Pure formatting = Haiku
    maxTokens: 2048,
    permissionMode: "auto",
    maxCostUSD: 0.10,
    systemPromptFile: "prompts/formatter.md",
    allowedTools: ["FileReadTool"],
    denyTools:    [],
  },
};`,
        note: "The systemPromptFile field points to a Markdown file in src/prompts/. Keeping prompts in .md files (not inline strings) lets non-engineers edit agent behaviour without touching TypeScript.",
      },
    ],
    tips: [
      "Cache the model selection result — don't call selectModel() on every token. The config is static per-session.",
      "Add a --model-override CLI flag in main.ts to let power users swap the model at runtime for debugging.",
      "Log model name + tier at session start so cost anomalies are easy to diagnose in logs.",
      "Use 'fast' tier for all tool result summarisation steps — the observation text is already structured, it just needs a brief reformat.",
    ],
  },

  /* ── 2. KNOWLEDGE BASE ──────────────────────────────────────────────── */
  {
    id: "knowledge", title: "Knowledge Base", color: "#34d399", icon: "📚",
    tagline: "RAG pipeline: documents → embeddings → retrieval → context injection",
    overview:
      "A knowledge base turns your domain documents (regulations, policies, API docs, past findings) into a " +
      "searchable vector store the agent queries before each reasoning pass. The folder structure separates raw " +
      "source documents (knowledge-base/docs/) from processed indexes (knowledge-base/indexes/). " +
      "The code that builds and queries the KB lives in src/knowledge/. " +
      "Retrieval results are injected into the system prompt, giving the agent grounded facts rather than hallucinated ones.",
    fileTree: [
      { path: "knowledge-base/",                    type: "dir",  desc: "Root KB directory — outside src/" },
      { path: "knowledge-base/docs/",               type: "dir",  desc: "Raw source documents (Markdown, PDF text)" },
      { path: "knowledge-base/docs/domain/",        type: "dir",  desc: "Domain-specific knowledge (e.g. DoD FMR chapters)" },
      { path: "knowledge-base/docs/regulations/",   type: "dir",  desc: "Regulatory texts (FISMA, NDAA, OMB circulars)" },
      { path: "knowledge-base/docs/examples/",      type: "dir",  desc: "Few-shot examples for the agent" },
      { path: "knowledge-base/indexes/",            type: "dir",  desc: "Persisted vector indexes (gitignored — regenerated)" },
      { path: "knowledge-base/metadata/",           type: "dir",  desc: "Document metadata JSON (source, version, tags)" },
      { path: "src/knowledge/",                     type: "dir",  desc: "KB processing code" },
      { path: "src/knowledge/index.ts",             type: "file", desc: "Public KB API — exported functions only" },
      { path: "src/knowledge/loader.ts",            type: "file", desc: "Loads & chunks documents from knowledge-base/docs/" },
      { path: "src/knowledge/embedder.ts",          type: "file", desc: "Calls embedding API, caches results" },
      { path: "src/knowledge/retriever.ts",         type: "file", desc: "Similarity search → returns top-K chunks" },
      { path: "src/knowledge/indexer.ts",           type: "file", desc: "CLI script: build/rebuild the vector index" },
    ],
    steps: [
      {
        n: 1, action: "Populate", title: "Add domain documents",
        file: "*.md  (e.g. dod-fmr-vol4.md)", folder: "knowledge-base/docs/domain/",
        desc: "Convert source material to plain Markdown files. Name files descriptively — the filename becomes part of the retrieval citation. One file = one logical document (a regulation chapter, an API reference page, a standard procedure).",
        code:
`# knowledge-base/docs/domain/dod-fmr-vol4-ch03.md
---
title: "DoD FMR Volume 4 Chapter 3 — Accounting"
source: "https://comptroller.defense.gov/fmr/"
version: "2024-03"
tags: ["accounting", "obligations", "expenditures"]
classification: "UNCLASSIFIED"
---

## 030101. General
Obligations are recorded when legal commitments are made...

## 030102. Obligation Adjustments
Adjustments to prior-year obligations require...
# Each ## heading becomes a separate retrieval chunk
# The YAML frontmatter is stored as metadata for citation`,
        note: "Chunk at heading boundaries (## level), not arbitrary character counts. A chunk = one coherent concept. Too small = no context; too large = noisy retrieval. Target 300–600 tokens per chunk.",
      },
      {
        n: 2, action: "Create", title: "Build the document loader",
        file: "loader.ts", folder: "src/knowledge/",
        desc: "The loader reads files from knowledge-base/docs/, extracts frontmatter metadata, and splits content into chunks at heading boundaries. Output is an array of {text, metadata, id} objects ready for embedding.",
        code:
`// src/knowledge/loader.ts
import { readdir, readFile } from "fs/promises";
import { join, relative }    from "path";
import { createHash }        from "crypto";

export interface KbChunk {
  id:       string;        // SHA-256 of (filePath + chunkIndex) — stable across runs
  text:     string;        // The chunk content (300–600 tokens)
  metadata: {
    source:   string;      // Filename for citation: "dod-fmr-vol4-ch03.md"
    title:    string;      // From YAML frontmatter
    tags:     string[];    // For category filtering
    section:  string;      // Heading the chunk lives under
    chunkIdx: number;      // Position in document (for ordering results)
  };
}

const DOCS_ROOT = join(process.cwd(), "knowledge-base", "docs");

export async function loadAllChunks(): Promise<KbChunk[]> {
  const chunks: KbChunk[] = [];
  await walkDir(DOCS_ROOT, async (filePath: string) => {
    if (!filePath.endsWith(".md")) return;
    const raw      = await readFile(filePath, "utf-8");
    const rel      = relative(DOCS_ROOT, filePath);
    const fileChunks = splitIntoChunks(raw, rel);
    chunks.push(...fileChunks);
  });
  return chunks;
}

function splitIntoChunks(content: string, source: string): KbChunk[] {
  // Extract YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  const body    = fmMatch ? content.slice(fmMatch[0].length) : content;
  const meta    = parseFrontmatter(fmMatch?.[1] ?? "");

  // Split at ## headings — each section = one chunk
  const sections = body.split(/(?=^## )/m).filter(s => s.trim());
  return sections.map((text, i) => {
    const section = text.match(/^##\s+(.+)/m)?.[1] ?? "Introduction";
    const id = createHash("sha256").update(source + i).digest("hex").slice(0, 12);
    return { id, text: text.trim(), metadata: { source, title: meta.title ?? source, tags: meta.tags ?? [], section, chunkIdx: i } };
  });
}

async function walkDir(dir: string, fn: (path: string) => Promise<void>) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walkDir(full, fn);
    else await fn(full);
  }
}
function parseFrontmatter(fm: string): Record<string, any> {
  const obj: Record<string, any> = {};
  fm.split("\n").forEach(line => {
    const [k, ...v] = line.split(": ");
    if (k && v.length) obj[k.trim()] = v.join(": ").trim().replace(/^"(.*)"$/, "$1");
  });
  return obj;
}`,
        note: "The chunk ID is deterministic (SHA-256 of path+index). If you re-index, existing IDs stay stable — Pinecone won't re-embed unchanged chunks if you use upsert.",
      },
      {
        n: 3, action: "Create", title: "Build the embedder with caching",
        file: "embedder.ts", folder: "src/knowledge/",
        desc: "Converts chunks to embedding vectors. Caches results in knowledge-base/indexes/ so re-runs are instant. Only re-embeds chunks whose content has changed.",
        code:
`// src/knowledge/embedder.ts
import Anthropic  from "@anthropic-ai/sdk";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join }   from "path";
import type { KbChunk } from "./loader.js";

const CACHE_DIR = join(process.cwd(), "knowledge-base", "indexes");
const CACHE_FILE = join(CACHE_DIR, "embeddings.json");

export interface EmbeddedChunk extends KbChunk {
  vector: number[];   // 1536-dim float array
}

export async function embedChunks(chunks: KbChunk[]): Promise<EmbeddedChunk[]> {
  await mkdir(CACHE_DIR, { recursive: true });

  // Load cache: {chunkId → vector}
  let cache: Record<string, number[]> = {};
  try { cache = JSON.parse(await readFile(CACHE_FILE, "utf-8")); } catch {}

  const client   = new Anthropic();
  const toEmbed  = chunks.filter(c => !cache[c.id]);
  console.log(\`Embedding \${toEmbed.length} new chunks (\${chunks.length - toEmbed.length} cached)...\`);

  // Batch in groups of 100 to respect API rate limits
  for (let i = 0; i < toEmbed.length; i += 100) {
    const batch = toEmbed.slice(i, i + 100);
    // Note: use text-embedding-3-small via OpenAI or voyage-3 via Anthropic
    // Here we use a generic fetch pattern — swap for your provider SDK
    const res = await client.messages.create({
      model: "claude-haiku-4-5",         // Fast model for embedding proxy
      max_tokens: 10,
      messages: [{ role: "user", content: "embed:" + batch.map(c=>c.text).join("\n---\n") }],
    });
    // In production: use voyage-3 embeddings API directly
    // For now: store placeholder (replace with real embedding call)
    batch.forEach(c => { cache[c.id] = Array(1536).fill(0); });  // ← replace with real vectors
  }

  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  return chunks.map(c => ({ ...c, vector: cache[c.id] }));
}`,
        note: "In production use voyage-3 (Anthropic's embedding model) or text-embedding-3-small (OpenAI). Both produce 1536-dim vectors. voyage-3 is better for domain-specific retrieval. Cost: ~$0.06 per 1M tokens.",
      },
      {
        n: 4, action: "Create", title: "Build the retriever",
        file: "retriever.ts", folder: "src/knowledge/",
        desc: "Given a query string, returns the top-K most semantically relevant chunks. Runs cosine similarity against the in-memory vector index. Results are formatted as system prompt context.",
        code:
`// src/knowledge/retriever.ts
import type { EmbeddedChunk } from "./embedder.js";

let _index: EmbeddedChunk[] = [];

/** Load the pre-built index into memory (call once at startup) */
export function loadIndex(chunks: EmbeddedChunk[]) { _index = chunks; }

/** Cosine similarity between two vectors */
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]**2; nb += b[i]**2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export interface RetrievalResult {
  chunk: EmbeddedChunk;
  score: number;
}

/** Retrieve top-K chunks relevant to a query vector */
export function retrieveByVector(queryVec: number[], topK = 5): RetrievalResult[] {
  return _index
    .map(chunk => ({ chunk, score: cosine(queryVec, chunk.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter(r => r.score > 0.65);  // Minimum relevance threshold — discard noise
}

/** Format retrieved chunks as system-prompt context block */
export function formatContext(results: RetrievalResult[]): string {
  if (results.length === 0) return "";
  return [
    "## Relevant Knowledge Base Context",
    "(Retrieved from your knowledge base — cite [Source: filename] in responses)",
    "",
    ...results.map(r =>
      \`### [Source: \${r.chunk.metadata.source} § \${r.chunk.metadata.section}] (relevance: \${(r.score*100).toFixed(0)}%)\n\${r.chunk.text}\`
    ),
    "",
  ].join("\n");
}`,
        note: "The 0.65 cosine similarity threshold is critical. Below this, retrieved chunks are noise that degrades answers. Tune this threshold on 20–30 representative queries before deploying.",
      },
      {
        n: 5, action: "Create", title: "Create the KB public API + indexer script",
        file: "index.ts + indexer.ts", folder: "src/knowledge/",
        desc: "index.ts is the only file other modules import — a clean public API. indexer.ts is a CLI script run via 'bun run src/knowledge/indexer.ts' to rebuild the index after adding new documents.",
        code:
`// src/knowledge/index.ts — public API (only this file is imported by others)
export { loadAllChunks }   from "./loader.js";
export { embedChunks }     from "./embedder.js";
export { loadIndex, retrieveByVector, formatContext } from "./retriever.js";

/** Initialise KB at agent startup — call from main.ts */
export async function initKnowledgeBase(): Promise<void> {
  const { loadAllChunks } = await import("./loader.js");
  const { embedChunks }   = await import("./embedder.js");
  const { loadIndex }     = await import("./retriever.js");
  const chunks   = await loadAllChunks();
  const embedded = await embedChunks(chunks);
  loadIndex(embedded);
  console.log(\`✅ Knowledge base ready: \${embedded.length} chunks indexed\`);
}

// ─────────────────────────────────────────────────────────────────────────────
// src/knowledge/indexer.ts — run with: bun run src/knowledge/indexer.ts
// Rebuilds the vector index from scratch. Run after adding new documents.
import { loadAllChunks } from "./loader.js";
import { embedChunks }   from "./embedder.js";
import { writeFile }     from "fs/promises";
import { join }          from "path";

const chunks   = await loadAllChunks();
const embedded = await embedChunks(chunks);
const meta = embedded.map(e => ({ id: e.id, source: e.metadata.source, section: e.metadata.section }));
await writeFile(join(process.cwd(), "knowledge-base", "metadata", "index-manifest.json"), JSON.stringify(meta, null, 2));
console.log(\`✅ Indexed \${embedded.length} chunks → knowledge-base/indexes/embeddings.json\`);`,
        note: "Add 'bun run src/knowledge/indexer.ts' as a pre-deploy step in your CI pipeline. The index file is gitignored but regenerated on each deploy from source documents (which ARE committed).",
      },
    ],
    tips: [
      "Namespace your Pinecone index by environment: 'prod-dod-fmr', 'dev-dod-fmr'. Never share production indexes with dev agents.",
      "Add a metadata field 'effective_date' to regulatory documents. Retrieval can then filter to only return currently-effective controls.",
      "Store the query used to retrieve each context chunk in the audit log — this lets you trace exactly why the agent cited a particular regulation.",
      "Set a context budget: if formatContext() output > 4,000 tokens, only keep top 3 results. The KB context competes with conversation history in the context window.",
      "Re-index weekly for live regulatory knowledge bases. Set up a cron job: 'bun run src/knowledge/indexer.ts' in CI/CD.",
    ],
  },

  /* ── 3. SKILLS ──────────────────────────────────────────────────────── */
  {
    id: "skills", title: "Skills Architecture", color: "#a78bfa", icon: "⚡",
    tagline: "Skills = composable agent capabilities. Tools = atomic actions. Skills orchestrate tools.",
    overview:
      "A Skill is a higher-level capability composed of multiple tool calls, reasoning steps, and sub-agent delegations. " +
      "While a Tool is atomic (run bash command, read file), a Skill is a workflow (analyze code quality = read files + grep patterns + run linter + synthesize findings). " +
      "Skills live in src/skills/ organised by category. Each skill exports a single execute() function. " +
      "A SkillRegistry in src/skills/index.ts maps skill names to implementations, enabling the coordinator to invoke any skill by name.",
    fileTree: [
      { path: "src/skills/",                      type: "dir",  desc: "All skill implementations" },
      { path: "src/skills/index.ts",              type: "file", desc: "SkillRegistry + Skill interface" },
      { path: "src/skills/analyze/",              type: "dir",  desc: "Analysis skills category" },
      { path: "src/skills/analyze/analyzeCode.ts",type: "file", desc: "Skill: deep code quality analysis" },
      { path: "src/skills/analyze/detectAnomaly.ts",type:"file",desc: "Skill: statistical anomaly detection" },
      { path: "src/skills/analyze/index.ts",      type: "file", desc: "Barrel re-export for analyze skills" },
      { path: "src/skills/generate/",             type: "dir",  desc: "Generation skills category" },
      { path: "src/skills/generate/writeReport.ts",type:"file", desc: "Skill: structured report generation" },
      { path: "src/skills/generate/summarize.ts", type: "file", desc: "Skill: multi-document summarization" },
      { path: "src/skills/generate/index.ts",     type: "file", desc: "Barrel re-export" },
      { path: "src/skills/integrate/",            type: "dir",  desc: "External system integration skills" },
      { path: "src/skills/integrate/fetchRecords.ts",type:"file",desc:"Skill: fetch + normalise from source systems" },
      { path: "src/skills/integrate/index.ts",    type: "file", desc: "Barrel re-export" },
      { path: "src/skills/validate/",             type: "dir",  desc: "Validation skills category" },
      { path: "src/skills/validate/checkCompliance.ts",type:"file",desc:"Skill: multi-standard compliance check" },
      { path: "src/skills/validate/index.ts",     type: "file", desc: "Barrel re-export" },
    ],
    steps: [
      {
        n: 1, action: "Create", title: "Define the Skill interface",
        file: "index.ts", folder: "src/skills/",
        desc: "The Skill interface is the contract all skill files implement. It parallels the Tool interface but operates at a higher level — a Skill takes a natural-language goal and returns a structured result, not just a string.",
        code:
`// src/skills/index.ts
import type { AppState } from "../state/AppState.js";

// ── The Skill interface — higher-level than Tool ──────────────────────────────
export interface SkillInput {
  goal:    string;          // Natural-language description of what to achieve
  context: Record<string, unknown>;  // Domain-specific inputs (file paths, IDs, etc.)
  options?: {
    maxSteps?: number;      // Cap the internal ReAct loop iterations
    timeout?:  number;      // MS before the skill times out
    dryRun?:   boolean;     // Simulate without side effects
  };
}

export interface SkillResult {
  success:   boolean;
  output:    string;        // Human-readable result summary
  artifacts: string[];      // File paths created/modified by the skill
  findings?: unknown[];     // Structured findings (domain-specific)
  costUSD?:  number;        // Actual LLM cost incurred
}

export interface Skill {
  name:        string;      // "analyze.detectAnomaly" — dot-notation category.name
  description: string;      // What the LLM coordinator reads to decide when to invoke this skill
  inputSchema: Record<string, { type: string; description: string; required: boolean }>;
  execute(input: SkillInput, state: AppState): Promise<SkillResult>;
}

// ── Skill Registry — maps skill name → implementation ────────────────────────
class SkillRegistryClass {
  private skills = new Map<string, Skill>();
  register(skill: Skill) { this.skills.set(skill.name, skill); }
  get(name: string): Skill | undefined { return this.skills.get(name); }
  list(): string[] { return [...this.skills.keys()]; }
  describe(): string {
    return this.list().map(n => {
      const s = this.skills.get(n)!;
      return \`- \${s.name}: \${s.description}\`;
    }).join("\n");
  }
}
export const SkillRegistry = new SkillRegistryClass();

// Auto-register all skills at module load
import "./analyze/index.js";
import "./generate/index.js";
import "./integrate/index.js";
import "./validate/index.js";`,
        note: "The dot-notation naming (category.skillName) lets the coordinator say 'invoke skill analyze.detectAnomaly' unambiguously. Always use this format.",
      },
      {
        n: 2, action: "Implement", title: "Create a concrete skill",
        file: "detectAnomaly.ts", folder: "src/skills/analyze/",
        desc: "Each skill file exports one class implementing Skill. The skill's execute() method orchestrates multiple tool calls internally — it's a mini-agent with its own goal.",
        code:
`// src/skills/analyze/detectAnomaly.ts
import type { Skill, SkillInput, SkillResult } from "../index.js";
import type { AppState } from "../../state/AppState.js";

export class DetectAnomalySkill implements Skill {
  name        = "analyze.detectAnomaly";
  description =
    "Detect statistical anomalies in a dataset. Use when you have a set of " +
    "numeric records and need to identify outliers, unusual patterns, or " +
    "values that deviate significantly from the mean. Returns a list of " +
    "flagged records with anomaly scores and explanations.";

  inputSchema = {
    dataPath: { type: "string",  description: "Path to CSV/JSON data file", required: true },
    column:   { type: "string",  description: "Column/field name to analyse", required: true },
    threshold:{ type: "number",  description: "Z-score threshold (default 2.5)", required: false },
  };

  async execute(input: SkillInput, state: AppState): Promise<SkillResult> {
    const { dataPath, column, threshold = 2.5 } = input.context as {
      dataPath: string; column: string; threshold?: number;
    };

    // Step 1: Read the data file using the FileRead tool
    const rawData = await state.tools.get("FileReadTool")!.execute({ path: dataPath }, state);

    // Step 2: Use the agent's LLM to analyse the data
    // (In production, run actual statistics; here we delegate to the LLM for flexibility)
    const analysisPrompt = \`
Analyse this dataset for anomalies in the '\${column}' column.
Use z-score > \${threshold} as the threshold for flagging.
Data: \${rawData.slice(0, 3000)}  [truncated if large]

Return a JSON array of: {rowIndex, value, zScore, reason}
\`;
    // Delegate to a fast model for the statistical analysis
    const result = await state.llmCall(analysisPrompt, "fast");  // Uses Haiku tier

    let findings: unknown[] = [];
    try { findings = JSON.parse(result.match(/\[[\s\S]*\]/)?.[0] ?? "[]"); } catch {}

    const outputPath = \`\${state.scratchDir}/anomalies-\${Date.now()}.json\`;
    await state.tools.get("FileWriteTool")!.execute({ path: outputPath, content: JSON.stringify(findings, null, 2) }, state);

    return {
      success:  true,
      output:   \`Found \${findings.length} anomalies in \${column}. Results saved to \${outputPath}\`,
      artifacts:[outputPath],
      findings,
      costUSD:  result.costUSD,
    };
  }
}`,
        note: "Notice how the skill calls state.llmCall() with a tier hint ('fast'). The skill controls which model tier it uses for each internal sub-task — heavy reasoning uses 'balanced', formatting uses 'fast'.",
      },
      {
        n: 3, action: "Create", title: "Create the category barrel + register",
        file: "index.ts", folder: "src/skills/analyze/",
        desc: "Each category folder has an index.ts that imports all skills in the category and registers them. This is the only file that needs to be updated when adding a new skill to a category.",
        code:
`// src/skills/analyze/index.ts
// Register all analysis skills — add new skills here
import { SkillRegistry } from "../index.js";
import { DetectAnomalySkill } from "./detectAnomaly.js";
import { AnalyzeCodeSkill }   from "./analyzeCode.js";
// import { NewSkill } from "./newSkill.js";   ← just add this line for a new skill

SkillRegistry.register(new DetectAnomalySkill());
SkillRegistry.register(new AnalyzeCodeSkill());
// SkillRegistry.register(new NewSkill());

// ─────────────────────────────────────────────────────────────────────────────
// src/skills/generate/index.ts
import { SkillRegistry }    from "../index.js";
import { WriteReportSkill } from "./writeReport.js";
import { SummarizeSkill }   from "./summarize.js";

SkillRegistry.register(new WriteReportSkill());
SkillRegistry.register(new SummarizeSkill());`,
        note: "The coordinator invokes skills via SkillRegistry.get('analyze.detectAnomaly')?.execute(). The description field is injected into the coordinator's system prompt — write it like a tool description.",
      },
      {
        n: 4, action: "Connect", title: "Inject skill descriptions into coordinator prompt",
        file: "prompts/coordinator.md", folder: "src/",
        desc: "The coordinator's system prompt dynamically includes all registered skill descriptions. This is assembled at startup so the coordinator always knows about newly-added skills.",
        code:
`// In your system prompt composition (src/utils/systemPromptType.ts):
import { SkillRegistry } from "../skills/index.js";

export function composeCoordinatorPrompt(state: AppState): string {
  return \`
# Available Skills
You can invoke these skills to complete complex sub-tasks.
Invoke a skill by calling: invoke_skill({ name: "...", goal: "...", context: {...} })

\${SkillRegistry.describe()}

# Orchestration Rules
1. For analysis tasks → use analyze.* skills
2. For document generation → use generate.* skills
3. For data fetching → use integrate.* skills
4. For compliance checking → use validate.* skills
5. Skills can be run in parallel by spawning multiple agent workers
6. Chain skills: output of one skill's artifacts[] becomes input context for the next
\`;
}`,
        note: "SkillRegistry.describe() outputs all registered skill names + descriptions in a format Claude reads to decide which skill to invoke. The more precise your description, the more accurately the coordinator routes tasks.",
      },
    ],
    tips: [
      "Name skills as verb.noun (analyze.detectAnomaly, generate.writeReport) — the verb indicates action, the category noun groups related capabilities.",
      "Skills should be idempotent: running the same skill twice with the same input should produce the same output. This enables retry without side effects.",
      "Each skill must declare artifacts[] — paths to files it creates. Downstream skills can then chain by consuming these artifacts as input.",
      "Test skills in isolation before wiring into the coordinator: 'bun run -e \"const s=new DetectAnomalySkill(); console.log(await s.execute(testInput, mockState))\"'",
      "Keep skills under 200 lines. If a skill grows larger, decompose it into sub-skills that chain together.",
    ],
  },

  /* ── 4. ORCHESTRATION ───────────────────────────────────────────────── */
  {
    id: "orchestration", title: "Orchestration", color: "#fbbf24", icon: "🎯",
    tagline: "3 patterns: sequential pipeline, parallel workers, event-driven routing",
    overview:
      "Orchestration determines the order and parallelism of agent/skill execution. Three patterns cover 95% of use cases: " +
      "(1) Sequential Pipeline — each step's output feeds the next (data harvest → reconcile → validate → report). " +
      "(2) Parallel Workers — independent subtasks distributed across N agents simultaneously. " +
      "(3) Event-Driven — agents react to incoming messages/events from external systems. " +
      "All three patterns live in src/orchestration/. Workflows (the specific sequences for your domain) " +
      "live in src/orchestration/workflows/.",
    fileTree: [
      { path: "src/orchestration/",                       type: "dir",  desc: "All orchestration code" },
      { path: "src/orchestration/pipeline.ts",            type: "file", desc: "Sequential step executor" },
      { path: "src/orchestration/parallel.ts",            type: "file", desc: "Parallel worker pool" },
      { path: "src/orchestration/coordinator.ts",         type: "file", desc: "Multi-agent task coordinator" },
      { path: "src/orchestration/channel.ts",             type: "file", desc: "Inter-agent message channel" },
      { path: "src/orchestration/workflows/",             type: "dir",  desc: "Domain-specific workflow definitions" },
      { path: "src/orchestration/workflows/auditWorkflow.ts",type:"file",desc:"Audit reconciliation workflow definition" },
      { path: "src/orchestration/workflows/reportWorkflow.ts",type:"file",desc:"Report generation workflow" },
      { path: "src/prompts/",                             type: "dir",  desc: "Agent system prompts as Markdown files" },
      { path: "src/prompts/coordinator.md",               type: "file", desc: "Coordinator agent system prompt" },
      { path: "src/prompts/worker.md",                    type: "file", desc: "Worker agent system prompt" },
    ],
    steps: [
      {
        n: 1, action: "Create", title: "Define the sequential pipeline",
        file: "pipeline.ts", folder: "src/orchestration/",
        desc: "A pipeline is an ordered list of steps where each step receives the accumulated state from all previous steps. Perfect for workflows where order matters (fetch → validate → transform → save).",
        code:
`// src/orchestration/pipeline.ts
import type { AppState }  from "../state/AppState.js";
import type { SkillResult } from "../skills/index.js";

export interface PipelineStep {
  name:     string;        // Human-readable step name for logging
  skillName: string;       // "integrate.fetchRecords" — must be registered in SkillRegistry
  goal:     string;        // What this step achieves (injected into the skill call)
  // Context builder: receives accumulated results from prior steps
  buildContext: (priorResults: Record<string, SkillResult>) => Record<string, unknown>;
  // Optional: skip this step based on prior results
  skipIf?: (priorResults: Record<string, SkillResult>) => boolean;
}

export interface PipelineResult {
  success: boolean;
  stepResults: Record<string, SkillResult>;
  failedStep?: string;
  totalCostUSD: number;
}

export async function runPipeline(
  steps: PipelineStep[],
  state: AppState,
): Promise<PipelineResult> {
  const { SkillRegistry } = await import("../skills/index.js");
  const accumulated: Record<string, SkillResult> = {};
  let totalCost = 0;

  for (const step of steps) {
    if (step.skipIf?.(accumulated)) {
      console.log(\`⏭  Skipping \${step.name}\`);
      continue;
    }
    console.log(\`▶  Running \${step.name} → \${step.skillName}\`);
    const skill = SkillRegistry.get(step.skillName);
    if (!skill) throw new Error(\`Skill not found: \${step.skillName}\`);

    const result = await skill.execute(
      { goal: step.goal, context: step.buildContext(accumulated) },
      state,
    );
    accumulated[step.name] = result;
    totalCost += result.costUSD ?? 0;

    if (!result.success) {
      console.error(\`❌ Step \${step.name} failed: \${result.output}\`);
      return { success: false, stepResults: accumulated, failedStep: step.name, totalCostUSD: totalCost };
    }
    console.log(\`✅ \${step.name}: \${result.output}\`);
  }
  return { success: true, stepResults: accumulated, totalCostUSD: totalCost };
}`,
        note: "The buildContext() function is the key to chaining steps: it gets ALL prior step results and picks what the next step needs. This avoids hard coupling between steps.",
      },
      {
        n: 2, action: "Create", title: "Define parallel worker pool",
        file: "parallel.ts", folder: "src/orchestration/",
        desc: "Distributes independent subtasks across N concurrent agents. Each task gets its own isolated scratchpad and agent instance. Results are collected and merged after all tasks complete.",
        code:
`// src/orchestration/parallel.ts
import type { AppState }   from "../state/AppState.js";
import type { SkillResult } from "../skills/index.js";

export interface ParallelTask {
  id:       string;   // Unique task identifier ("harvest-sfis", "harvest-gfebs")
  skillName: string;
  goal:     string;
  context:  Record<string, unknown>;
  // Worker isolation: each task gets its own scratchpad dir
  scratchDir?: string;  // auto-generated if omitted
}

export interface ParallelResult {
  results:     Record<string, SkillResult>;  // taskId → result
  succeeded:   string[];
  failed:      string[];
  totalCostUSD: number;
  durationMs:  number;
}

export async function runParallel(
  tasks: ParallelTask[],
  state: AppState,
  maxConcurrency = 5,
): Promise<ParallelResult> {
  const { SkillRegistry } = await import("../skills/index.js");
  const start  = Date.now();
  const results: Record<string, SkillResult> = {};
  let totalCost = 0;

  // Chunk tasks by maxConcurrency (avoid spawning 100 agents at once)
  for (let i = 0; i < tasks.length; i += maxConcurrency) {
    const batch = tasks.slice(i, i + maxConcurrency);
    const settled = await Promise.allSettled(
      batch.map(async task => {
        const skill = SkillRegistry.get(task.skillName);
        if (!skill) throw new Error(\`Skill not found: \${task.skillName}\`);
        // Each task gets isolated state with its own scratchDir
        const taskState = { ...state, scratchDir: task.scratchDir ?? \`/tmp/task-\${task.id}\` };
        return { id: task.id, result: await skill.execute({ goal: task.goal, context: task.context }, taskState) };
      })
    );
    settled.forEach((s, j) => {
      if (s.status === "fulfilled") {
        results[s.value.id] = s.value.result;
        totalCost += s.value.result.costUSD ?? 0;
      } else {
        results[batch[j].id] = { success: false, output: s.reason?.message ?? "Unknown error", artifacts: [] };
      }
    });
  }
  return {
    results,
    succeeded:    Object.entries(results).filter(([,r]) => r.success).map(([id]) => id),
    failed:       Object.entries(results).filter(([,r]) => !r.success).map(([id]) => id),
    totalCostUSD: totalCost,
    durationMs:   Date.now() - start,
  };
}`,
        note: "maxConcurrency=5 is a safe default. Your Anthropic API tier has per-minute RPM limits — too many parallel agents burn through them. Monitor rate limit errors and reduce concurrency if you see 429s.",
      },
      {
        n: 3, action: "Create", title: "Define a complete domain workflow",
        file: "auditWorkflow.ts", folder: "src/orchestration/workflows/",
        desc: "A workflow combines pipeline and parallel patterns for a specific domain task. This is the top-level definition of 'how we do a financial audit'. It's declarative — all the intelligence is in the skills.",
        code:
`// src/orchestration/workflows/auditWorkflow.ts
import { runParallel }  from "../parallel.js";
import { runPipeline }  from "../pipeline.js";
import type { AppState } from "../../state/AppState.js";

export interface AuditWorkflowInput {
  fiscalYear: number;
  fundCode:   string;
  systemIds:  string[];   // ["SFIS-001", "GFEBS-HQ", "PIEE-CONTRACT"]
}

export async function runAuditWorkflow(input: AuditWorkflowInput, state: AppState) {
  console.log(\`🚀 Starting audit workflow: FY\${input.fiscalYear} fund \${input.fundCode}\`);

  // ── PHASE 1: Parallel data collection from all source systems ─────────────
  // Each system is harvested simultaneously — 3× faster than sequential
  const harvestResult = await runParallel(
    input.systemIds.map(systemId => ({
      id:        \`harvest-\${systemId}\`,
      skillName: "integrate.fetchRecords",
      goal:      \`Fetch all transactions for FY\${input.fiscalYear} fund \${input.fundCode} from \${systemId}\`,
      context:   { systemId, fiscalYear: input.fiscalYear, fundCode: input.fundCode },
    })),
    state,
    5,   // Up to 5 parallel harvests
  );

  if (harvestResult.failed.length > 0)
    console.warn(\`⚠️  Failed harvests: \${harvestResult.failed.join(", ")}\`);

  // Collect all artifact paths from all harvests
  const stagedFiles = Object.values(harvestResult.results)
    .flatMap(r => r.artifacts);

  // ── PHASE 2: Sequential reconciliation pipeline ───────────────────────────
  const pipelineResult = await runPipeline([
    {
      name:      "reconcile",
      skillName: "analyze.reconcileTransactions",
      goal:      "Compare transactions across all staged data sources, identify discrepancies",
      buildContext: () => ({ stagedFiles, threshold: 0.01 }),  // $0.01 tolerance
    },
    {
      name:      "validate",
      skillName: "validate.checkCompliance",
      goal:      "Validate all discrepancies against DoD FMR regulations, flag violations",
      buildContext: (prior) => ({
        discrepancyFile: prior.reconcile.artifacts[0],
        regulations:     ["DoD FMR Vol 4 Ch 3", "NDAA FY2024 Section 1004"],
      }),
      skipIf: (prior) => prior.reconcile.findings?.length === 0,  // Skip if no discrepancies
    },
    {
      name:      "report",
      skillName: "generate.writeReport",
      goal:      "Generate GAGAS-compliant audit report from all findings",
      buildContext: (prior) => ({
        reconcileArtifacts: prior.reconcile.artifacts,
        validateArtifacts:  prior.validate?.artifacts ?? [],
        fiscalYear:         input.fiscalYear,
        fundCode:           input.fundCode,
      }),
    },
  ], state);

  console.log(\`✅ Audit complete. Total cost: \$\${(harvestResult.totalCostUSD + pipelineResult.totalCostUSD).toFixed(2)}\`);
  return { harvestResult, pipelineResult };
}`,
        note: "The workflow is the ONLY place that knows about execution order and parallelism. Skills don't know they're being called in parallel — they just execute their task. This separation means you can reorder/parallelize without changing any skill code.",
      },
    ],
    tips: [
      "Workflows belong in src/orchestration/workflows/, NOT in main.ts. Main.ts should just call: runAuditWorkflow(input, state).",
      "Add a workflow dry-run mode: set options.dryRun=true on all skill calls. Skills check this flag and simulate without side effects.",
      "Log phase boundaries explicitly (PHASE 1, PHASE 2) — audit trails need to show which phase a finding originated from.",
      "If a pipeline step fails, save accumulated results to disk before re-throwing. This enables resuming a failed workflow from the last successful step.",
    ],
  },

  /* ── 5. MCP INTEGRATION ─────────────────────────────────────────────── */
  {
    id: "mcp", title: "MCP Integration", color: "#38bdf8", icon: "🔌",
    tagline: "Expose your tools to any compatible agent via the Model Context Protocol",
    overview:
      "MCP (Model Context Protocol) is an open standard that lets any compatible agent (Claude, GPT-4, Gemini, custom) " +
      "call your internal tools without custom integration. You run an MCP server that declares capabilities via a manifest; " +
      "agents discover and invoke them via the protocol. This means: build your tools once, " +
      "use them from any agent framework. The MCP code lives entirely in src/mcp/.",
    fileTree: [
      { path: "src/mcp/",                  type: "dir",  desc: "All MCP server code" },
      { path: "src/mcp/server.ts",         type: "file", desc: "MCP server entry — starts HTTP/stdio listener" },
      { path: "src/mcp/manifest.json",     type: "file", desc: "Capability declaration (tools, resources, prompts)" },
      { path: "src/mcp/router.ts",         type: "file", desc: "Routes incoming MCP requests to tool handlers" },
      { path: "src/mcp/tools/",            type: "dir",  desc: "Tool implementation files (one per tool)" },
      { path: "src/mcp/tools/queryData.ts",type: "file", desc: "MCP tool: query staging data" },
      { path: "src/mcp/tools/writeFinding.ts",type:"file",desc:"MCP tool: write audit finding" },
      { path: "src/mcp/tools/index.ts",    type: "file", desc: "Tool registry — import all tools here" },
      { path: ".claude/mcp.json",          type: "file", desc: "Claude Code MCP config — connects to your server" },
    ],
    steps: [
      {
        n: 1, action: "Create", title: "Write the MCP manifest",
        file: "manifest.json", folder: "src/mcp/",
        desc: "The manifest declares everything your MCP server offers: tools (callable functions), resources (readable data), and prompts (reusable templates). Agents read this manifest to discover capabilities.",
        code:
`// src/mcp/manifest.json
{
  "name": "my-domain-mcp",
  "version": "1.0.0",
  "description": "Domain tools for financial audit reconciliation",
  "protocol": "mcp/1.0",
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": false
  },
  "tools": [
    {
      "name": "query_staging_data",
      "description": "Query staged financial records from the data lake. Use this to retrieve transaction data that has been previously harvested from source systems.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "system_id":   { "type": "string",  "description": "Source system identifier (SFIS, GFEBS, PIEE)" },
          "fiscal_year": { "type": "integer", "description": "4-digit fiscal year" },
          "fund_code":   { "type": "string",  "description": "4-char DoD fund code" },
          "limit":       { "type": "integer", "description": "Max records to return (default 500)" }
        },
        "required": ["system_id", "fiscal_year", "fund_code"]
      }
    },
    {
      "name": "write_audit_finding",
      "description": "Record an audit finding to the immutable findings ledger. Use after identifying a compliance violation or discrepancy that requires management action.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "severity":     { "type": "string", "enum": ["Critical","High","Medium","Low"] },
          "finding_text": { "type": "string", "description": "Full finding description with regulation citation" },
          "evidence_ids": { "type": "array",  "items": { "type": "string" } }
        },
        "required": ["severity", "finding_text"]
      }
    }
  ],
  "resources": [
    {
      "uri": "knowledge://dod-fmr",
      "name": "DoD Financial Management Regulation",
      "description": "Full text of DoD FMR — searchable by chapter and section",
      "mimeType": "text/plain"
    }
  ]
}`,
        note: "The manifest is the most important file in your MCP server. Write tool descriptions as if you're writing them for an LLM that has never seen your codebase. Specific, unambiguous, with examples of when to use them.",
      },
      {
        n: 2, action: "Create", title: "Implement the MCP server",
        file: "server.ts", folder: "src/mcp/",
        desc: "The server handles the MCP wire protocol — manifest serving, tool invocation, and resource access. It listens on stdio (for Claude Code integration) or HTTP (for remote agents).",
        code:
`// src/mcp/server.ts — MCP server using @modelcontextprotocol/sdk
import { McpServer }   from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z }          from "zod";
import { queryDataHandler }    from "./tools/queryData.js";
import { writeFindingHandler } from "./tools/writeFinding.js";
import manifest from "./manifest.json" assert { type: "json" };

const server = new McpServer({
  name:    manifest.name,
  version: manifest.version,
});

// ── Register tools from manifest ─────────────────────────────────────────────
server.tool(
  "query_staging_data",
  "Query staged financial records from the data lake",
  {
    system_id:   z.string().describe("Source system identifier"),
    fiscal_year: z.number().int().describe("4-digit fiscal year"),
    fund_code:   z.string().describe("4-char DoD fund code"),
    limit:       z.number().int().default(500),
  },
  async (args) => {
    const result = await queryDataHandler(args);
    return { content: [{ type: "text", text: result }] };
  }
);

server.tool(
  "write_audit_finding",
  "Record an audit finding to the immutable findings ledger",
  {
    severity:    z.enum(["Critical", "High", "Medium", "Low"]),
    finding_text: z.string().min(20),
    evidence_ids: z.array(z.string()).default([]),
  },
  async (args) => {
    const result = await writeFindingHandler(args);
    return { content: [{ type: "text", text: result }] };
  }
);

// ── Start server on stdio (compatible with Claude Code's MCP client) ──────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(\`MCP server '\${manifest.name}' running on stdio\`);`,
        note: "Run via stdio for Claude Code integration: add to .claude/mcp.json. Run via HTTP for remote agent integration: swap StdioServerTransport for HttpServerTransport and listen on a port.",
      },
      {
        n: 3, action: "Configure", title: "Register your MCP server with Claude Code",
        file: "mcp.json", folder: ".claude/",
        desc: "Tell Claude Code how to launch and connect to your MCP server. After adding this, restart Claude Code — it will auto-discover all tools declared in your manifest.",
        code:
`// .claude/mcp.json
{
  "mcpServers": {
    "my-domain-mcp": {
      "command": "bun",
      "args": ["run", "src/mcp/server.ts"],
      "env": {
        "NODE_ENV": "development"
      },
      "description": "Domain tools for financial audit — query staging data, write findings"
    }
  }
}

// After adding this file:
// 1. Restart Claude Code (claude --reload-mcp)
// 2. Verify connection: /mcp list
// 3. Test a tool: /mcp call my-domain-mcp query_staging_data '{"system_id":"SFIS","fiscal_year":2024,"fund_code":"A123"}'`,
        note: "Claude Code starts your MCP server as a child process on demand and communicates via stdio. Zero networking config required for local dev. For production, use the HTTP transport and a load balancer.",
      },
    ],
    tips: [
      "Keep MCP tool implementations thin — they should delegate to your existing skill/tool layer. The MCP layer is just the wire protocol adapter.",
      "Add a health check tool to every MCP server: 'ping' that returns server status and version. Useful for monitoring and debugging.",
      "Version your manifest. When you add breaking changes to a tool schema, bump the manifest version so agents using the old schema get clear errors.",
      "MCP resources (the 'knowledge://dod-fmr' example) let agents stream large documents without fitting them in a single tool response. Use for knowledge base access.",
    ],
  },

  /* ── 6. A2A PROTOCOL ────────────────────────────────────────────────── */
  {
    id: "a2a", title: "A2A Protocol", color: "#fb923c", icon: "🔗",
    tagline: "Agent-to-Agent communication — cross-framework task delegation with typed messages",
    overview:
      "A2A (Agent-to-Agent) protocol enables different agents — potentially built on different frameworks (Claude Code, " +
      "LangChain, AutoGen, custom) — to communicate, delegate tasks, and share results in a standardised format. " +
      "Unlike MCP (which is tool invocation), A2A is peer-to-peer task delegation: Agent A sends a task to Agent B, " +
      "Agent B executes autonomously and responds with results. The protocol files live in src/a2a/.",
    fileTree: [
      { path: "src/a2a/",                    type: "dir",  desc: "Agent-to-Agent protocol implementation" },
      { path: "src/a2a/protocol.ts",         type: "file", desc: "Message type definitions (Task, Result, Error)" },
      { path: "src/a2a/router.ts",           type: "file", desc: "Routes incoming A2A tasks to local agents" },
      { path: "src/a2a/channel.ts",          type: "file", desc: "Transport layer (HTTP or WebSocket)" },
      { path: "src/a2a/client.ts",           type: "file", desc: "A2A client — send tasks to remote agents" },
      { path: "src/a2a/server.ts",           type: "file", desc: "A2A server — receive tasks from remote agents" },
      { path: "src/a2a/handlers/",           type: "dir",  desc: "Task handler implementations" },
      { path: "src/a2a/handlers/auditTask.ts",type:"file", desc: "Handles incoming audit delegation requests" },
      { path: "src/a2a/agentCard.json",      type: "file", desc: "This agent's capability advertisement (A2A discovery)" },
    ],
    steps: [
      {
        n: 1, action: "Create", title: "Define A2A message types",
        file: "protocol.ts", folder: "src/a2a/",
        desc: "The protocol types define the contract between all A2A participants. Every message has an envelope with: task ID, sender/receiver identity, task payload, and reply routing. These types are the ONLY shared contract between agents.",
        code:
`// src/a2a/protocol.ts
// A2A protocol message types — compatible with Google A2A spec

export interface A2ATask {
  id:          string;      // UUID — for correlation and idempotency
  sessionId?:  string;      // Multi-turn conversation session
  sender: {
    agentId:  string;       // "coordinator-v1.my-org.mil"
    endpoint: string;       // URL for reply routing
    publicKey?: string;     // For authenticated replies
  };
  receiver: {
    agentId:  string;       // "audit-worker-v1.my-org.mil"
    skill?:   string;       // Optional: hint which skill to invoke
  };
  message: {
    role:     "user";
    parts:    A2APart[];
  };
  configuration?: {
    maxSteps?:    number;
    timeout?:     number;
    outputModes?: ("text" | "data" | "artifacts")[];
  };
}

export type A2APart =
  | { type: "text";     text: string }
  | { type: "data";     data: Record<string, unknown>; mimeType?: string }
  | { type: "fileRef";  uri: string; name?: string };

export interface A2AResult {
  taskId:   string;
  agentId:  string;
  status:   "completed" | "failed" | "working" | "cancelled";
  message: {
    role:   "agent";
    parts:  A2APart[];
  };
  artifacts?: { name: string; uri: string; mimeType: string }[];
  metadata?:  { costUSD?: number; durationMs?: number; modelUsed?: string };
  error?: { code: string; message: string };
}

export interface A2AAgentCard {
  agentId:     string;
  name:        string;
  description: string;
  version:     string;
  url:         string;      // This agent's A2A endpoint
  skills:      { name: string; description: string; inputModes: string[] }[];
  auth:        { scheme: "jwt" | "apikey" | "none" };
}`,
        note: "The A2ATask.sender.endpoint enables push-style replies — the receiving agent calls BACK to the sender with results rather than holding an open connection. This makes A2A more reliable for long-running tasks.",
      },
      {
        n: 2, action: "Create", title: "Build the A2A client (send tasks out)",
        file: "client.ts", folder: "src/a2a/",
        desc: "The client sends A2A tasks to remote agents. It handles serialization, auth, and result polling/webhook reception. Other agents in your system call this to delegate work.",
        code:
`// src/a2a/client.ts
import { createHash, randomUUID }  from "crypto";
import type { A2ATask, A2AResult } from "./protocol.js";
import { getEnv } from "../config/environment.js";

export class A2AClient {
  constructor(
    private localAgentId: string,
    private localEndpoint: string,
  ) {}

  /** Delegate a task to a remote agent and await the result */
  async sendTask(
    targetEndpoint: string,
    skill:          string,
    parts:          A2ATask["message"]["parts"],
    options:        A2ATask["configuration"] = {},
  ): Promise<A2AResult> {
    const task: A2ATask = {
      id:       randomUUID(),
      sender:   { agentId: this.localAgentId, endpoint: this.localEndpoint },
      receiver: { agentId: targetEndpoint,    skill },
      message:  { role: "user", parts },
      configuration: { maxSteps: 10, timeout: 300_000, ...options },
    };

    const env = getEnv();
    const response = await fetch(\`\${targetEndpoint}/tasks\`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": \`Bearer \${env.ANTHROPIC_API_KEY}\`,  // Replace with A2A JWT
        "X-Agent-Id":    this.localAgentId,
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) throw new Error(\`A2A task failed: \${response.status} \${await response.text()}\`);
    const result: A2AResult = await response.json();

    // Poll if task is still working (async pattern)
    if (result.status === "working") return this.pollResult(targetEndpoint, task.id);
    return result;
  }

  private async pollResult(endpoint: string, taskId: string, maxWaitMs = 300_000): Promise<A2AResult> {
    const deadline = Date.now() + maxWaitMs;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 2000));
      const res = await fetch(\`\${endpoint}/tasks/\${taskId}\`);
      const result: A2AResult = await res.json();
      if (result.status !== "working") return result;
    }
    throw new Error(\`A2A task \${taskId} timed out after \${maxWaitMs}ms\`);
  }
}`,
        note: "In a multi-org setup, replace the Bearer token with a proper A2A JWT signed with your agent's private key. The receiving agent validates the JWT to confirm the task genuinely comes from your agent.",
      },
      {
        n: 3, action: "Create", title: "Build the A2A server (receive tasks in)",
        file: "server.ts", folder: "src/a2a/",
        desc: "The server accepts incoming A2A tasks from other agents and routes them to your local skills. Register your agent's capabilities in agentCard.json so other agents can discover what you offer.",
        code:
`// src/a2a/server.ts — HTTP server accepting incoming A2A tasks
import { createServer }  from "http";
import type { A2ATask, A2AResult, A2AAgentCard } from "./protocol.js";
import { SkillRegistry } from "../skills/index.js";
import agentCard         from "./agentCard.json" assert { type: "json" };
import type { AppState } from "../state/AppState.js";

export function startA2AServer(state: AppState, port = 8080) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, \`http://localhost:\${port}\`);

    // GET /.well-known/agent.json — agent discovery (A2A spec requirement)
    if (req.method === "GET" && url.pathname === "/.well-known/agent.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(agentCard));
      return;
    }

    // POST /tasks — receive incoming task
    if (req.method === "POST" && url.pathname === "/tasks") {
      const body = await readBody(req);
      const task: A2ATask = JSON.parse(body);
      // Respond 202 immediately (async task pattern)
      res.writeHead(202, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ taskId: task.id, status: "working" }));
      // Process asynchronously
      processTask(task, state).then(result => {
        // Push result back to sender's endpoint
        fetch(task.sender.endpoint + "/results", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(result),
        }).catch(e => console.error("Failed to push A2A result:", e));
      });
      return;
    }
    res.writeHead(404); res.end("Not Found");
  });

  server.listen(port, () => console.log(\`A2A server listening on port \${port}\`));
}

async function processTask(task: A2ATask, state: AppState): Promise<A2AResult> {
  const skillName = task.receiver.skill ?? "analyze.detectAnomaly";
  const skill     = SkillRegistry.get(skillName);
  if (!skill) return { taskId: task.id, agentId: agentCard.agentId, status: "failed",
    message: { role: "agent", parts: [] }, error: { code: "SKILL_NOT_FOUND", message: \`Skill '\${skillName}' not registered\` } };

  const textPart = task.message.parts.find(p => p.type === "text") as { type:"text"; text:string }|undefined;
  const dataPart = task.message.parts.find(p => p.type === "data") as { type:"data"; data:Record<string,unknown> }|undefined;

  const result = await skill.execute({ goal: textPart?.text ?? "Complete the task", context: dataPart?.data ?? {} }, state);
  return {
    taskId: task.id, agentId: agentCard.agentId, status: result.success ? "completed" : "failed",
    message: { role: "agent", parts: [{ type: "text", text: result.output }] },
    artifacts: result.artifacts.map(a => ({ name: a.split("/").pop()!, uri: \`file://\${a}\`, mimeType: "application/json" })),
    metadata:  { costUSD: result.costUSD },
  };
}
function readBody(req: any): Promise<string> {
  return new Promise((res, rej) => { let d=""; req.on("data",(c:any)=>d+=c); req.on("end",()=>res(d)); req.on("error",rej); });
}`,
        note: "The /.well-known/agent.json endpoint is required by the A2A spec for agent discovery. Agents query this endpoint to learn what skills you offer before sending tasks.",
      },
      {
        n: 4, action: "Create", title: "Define your agent card",
        file: "agentCard.json", folder: "src/a2a/",
        desc: "The agent card is your public identity on the A2A network. It tells other agents who you are, what skills you offer, how to reach you, and how to authenticate with you.",
        code:
`// src/a2a/agentCard.json
{
  "agentId":     "audit-agent-v1.myorg.mil",
  "name":        "DoD Financial Audit Agent",
  "description": "Specialised agent for DoD financial management audit reconciliation. Offers skills for transaction analysis, compliance validation, and GAGAS-compliant report generation.",
  "version":     "1.0.0",
  "url":         "https://audit-agent.myorg.mil",
  "defaultInputModes":  ["text", "data"],
  "defaultOutputModes": ["text", "data", "artifacts"],
  "skills": [
    {
      "name":        "analyze.reconcileTransactions",
      "description": "Reconcile financial transactions across SFIS, GFEBS, and PIEE. Input: staged data file paths. Output: discrepancy report with severity ratings.",
      "inputModes":  ["data"],
      "outputModes": ["data", "artifacts"]
    },
    {
      "name":        "validate.checkCompliance",
      "description": "Validate financial entries against DoD FMR and NDAA. Input: transaction list + regulation references. Output: compliance violations with FMR citations.",
      "inputModes":  ["data"],
      "outputModes": ["data"]
    },
    {
      "name":        "generate.writeReport",
      "description": "Generate a GAGAS-compliant audit report. Input: findings data. Output: PDF + structured JSON report.",
      "inputModes":  ["data"],
      "outputModes": ["artifacts"]
    }
  ],
  "auth": {
    "scheme":    "jwt",
    "algorithms":["RS256"],
    "jwksUri":   "https://audit-agent.myorg.mil/.well-known/jwks.json"
  },
  "supportsAuthenticatedExtendedCard": true
}`,
        note: "Publish your agentCard.json at /.well-known/agent.json and register with any A2A discovery service your organisation uses. Other agents query this URL before sending tasks.",
      },
    ],
    tips: [
      "Use UUIDs for task IDs and store them in a task ledger (SQLite or DynamoDB). This enables status queries, retry logic, and audit trails for all A2A interactions.",
      "A2A tasks should be idempotent by task ID — if the same taskId arrives twice (network retry), return the cached result without re-executing.",
      "For DoD use cases: all A2A traffic must use mTLS (mutual TLS) between known agent endpoints. No unauthenticated A2A in production.",
      "Agent discovery: maintain an internal registry (a simple JSON file or small service) mapping agentId → endpoint URL. Update it as agents are deployed.",
      "Rate limit incoming A2A tasks per sender agent. A misconfigured coordinator can flood your agent with thousands of tasks per minute.",
    ],
  },
];

// ─── PRODUCTION SHELL STEPS ───────────────────────────────────────────────────
const SHELL_STEPS = [
  {
    n: 1, title: "Clone & Rename the Framework",
    desc: "Start from the claude_code_Template repo. Rename to your domain. The scaffold provides the full ReAct loop, tool system, permission system, and service layer — don't rebuild these.",
    code: `# Clone the framework scaffold
git clone https://github.com/your-org/claude_code_Template.git my-audit-agent
cd my-audit-agent

# Rename core identifiers for your domain
find src -type f -name "*.ts" | xargs sed -i 's/claude-code/my-audit-agent/g'

# Install dependencies
bun install   # or: pnpm install

# Verify build
bun run build && echo "✅ Base framework compiles"`,
    tags: ["Setup", "Foundation"],
  },
  {
    n: 2, title: "Define Domain Entities with Zod",
    desc: "Create typed schemas for your domain objects. These schemas drive both runtime validation and TypeScript types throughout the codebase.",
    code: `// src/domain/schemas.ts
import { z } from "zod";

export const TransactionSchema = z.object({
  id:          z.string().uuid(),
  amount:      z.number().multipleOf(0.01),  // cents precision
  fundCode:    z.string().regex(/^[A-Z0-9]{4}$/),
  fiscalYear:  z.number().int().min(2000).max(2099),
  postDate:    z.string().datetime(),
  system:      z.enum(["SFIS", "GFEBS", "PIEE"]),
  classification: z.enum(["UNCLASSIFIED", "CUI"]),
});

export const DiscrepancySchema = z.object({
  id:         z.string().uuid(),
  severity:   z.enum(["Critical", "High", "Medium", "Low"]),
  txA:        TransactionSchema,
  txB:        TransactionSchema.optional(),
  deltaUSD:   z.number(),
  category:   z.enum(["AmountMismatch", "MissingEntry", "TimingDiff", "FundCodeError"]),
  findingText: z.string().min(20).max(2000),
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type Discrepancy = z.infer<typeof DiscrepancySchema>;`,
    tags: ["Domain", "Types", "Validation"],
  },
  {
    n: 3, title: "Implement Custom Tools",
    desc: "Each capability becomes a Tool implementing the Tool interface. Keep tools focused (single responsibility). The LLM reads descriptions to decide which tool to call.",
    code: `// src/tools/FetchSFISRecord.ts
import type { Tool }     from "../Tool.js";
import type { AppState } from "../state/AppState.js";
import { TransactionSchema } from "../domain/schemas.js";
import { z } from "zod";

const InputSchema = z.object({
  system_id:   z.string(),
  fiscal_year: z.number().int(),
  fund_code:   z.string(),
});

export class FetchSFISRecordTool implements Tool {
  name = "fetch_sfis_record";
  description =
    "Retrieve financial transaction records from SFIS for a given " +
    "system, fiscal year, and fund code. Use for initial data collection " +
    "phase. Returns up to 500 transactions.";
  inputJSONSchema = {
    type: "object" as const,
    properties: {
      system_id:   { type: "string",  description: "SFIS system identifier" },
      fiscal_year: { type: "number",  description: "4-digit fiscal year (e.g. 2024)" },
      fund_code:   { type: "string",  description: "4-char DoD fund code" },
    },
    required: ["system_id", "fiscal_year", "fund_code"],
  };
  allowInPlanMode = false;  // This makes real API calls — not safe in plan mode
  isDangerous     = false;  // Read-only, no side effects

  async execute(input: unknown, state: AppState): Promise<string> {
    const { system_id, fiscal_year, fund_code } = InputSchema.parse(input);

    // Retrieve API credentials from Vault (never from env vars or code)
    const token = await state.vaultClient.getSecret("sfis/api-token");

    const res = await fetch(
      \`https://sfis.mil/api/v2/transactions?\` +
      \`system=\${system_id}&fy=\${fiscal_year}&fund=\${fund_code}\`,
      { headers: { Authorization: \`Bearer \${token}\`, "X-Classification": "CUI" } }
    );
    if (!res.ok) throw new Error(\`SFIS API error: \${res.status} \${res.statusText}\`);

    const records = await res.json();
    const validated = records.map((r: unknown) => TransactionSchema.parse(r));

    // Write to staging for downstream agents
    await state.stagingStore.write(\`sfis-\${system_id}-fy\${fiscal_year}\`, validated);
    return \`✅ Retrieved \${validated.length} SFIS records for FY\${fiscal_year} fund \${fund_code}\`;
  }
}`,
    tags: ["Tools", "Domain", "API Integration"],
  },
  {
    n: 4, title: "Register Tools & Configure the Engine",
    desc: "Register all custom tools in the loadAllTools() factory. Configure model, permissions, and system prompt for your domain.",
    code: `// src/tools.ts — tool registry
import { FetchSFISRecordTool }    from "./tools/FetchSFISRecord.js";
import { CompareTransactionsTool } from "./tools/CompareTransactions.js";
import { CheckFMRComplianceTool }  from "./tools/CheckFMRCompliance.js";
import { WriteAuditFindingTool }   from "./tools/WriteAuditFinding.js";
import { PackageEvidenceTool }     from "./tools/PackageEvidence.js";
import type { AppState } from "./state/AppState.js";
import type { Tool }     from "./Tool.js";

export function loadAllTools(state: AppState): Map<string, Tool> {
  const tools: Tool[] = [
    // ── Core framework tools (keep these) ──
    new FileReadTool(), new GlobTool(), new GrepTool(),
    // ── Domain-specific tools ──
    new FetchSFISRecordTool(),
    new CompareTransactionsTool(),
    new CheckFMRComplianceTool(),
    new WriteAuditFindingTool(),
    new PackageEvidenceTool(),
    // ── Add more domain tools here ──
  ];
  return new Map(tools.map(t => [t.name, t]));
}

// src/config/agentConfig.ts — agent behavior
export const AGENT_CONFIG = {
  model:          "claude-opus-4-5",      // Most capable for financial reasoning
  maxTokens:      8096,
  permissionMode: "auto" as const,        // Unattended pipeline — auto-approve safe tools
  alwaysDenyRules: [                      // Hard blocks — never allow these
    { tool: "BashTool",     reason: "No shell access in production" },
    { tool: "FileEditTool", reason: "Audit agents are read-only on source systems" },
  ],
  systemPromptExtras: \`
    You are a DoD financial management audit agent. You have access to
    SFIS, GFEBS, and PIEE financial systems. Your outputs will be used
    in official audit reports. Be precise, cite specific regulation
    sections (DoD FMR Vol X, Chapter Y, paragraph Z), and flag any
    uncertainty clearly. Never modify source financial records.
  \`,
};`,
    tags: ["Configuration", "Registry", "Permissions"],
  },
  {
    n: 5, title: "Write Your System Prompt",
    desc: "The system prompt is the agent's constitution. Include: role, constraints, domain knowledge, output format, and compliance requirements. This is your most important engineering surface.",
    code: `// src/utils/systemPromptType.ts — customize for your domain
export function composeSystemPrompt(state: AppState): string {
  return \`
# Role
You are an autonomous DoD financial audit reconciliation agent. You analyze
transactions across SFIS, GFEBS, and PIEE to identify discrepancies and
produce GAGAS-compliant audit findings.

# Current Context
- Fiscal Year: \${state.fiscalYear}
- Audit Scope: \${state.auditScope}
- Classification Level: CUI
- Working Directory: \${state.cwd}

# Memory
\${state.memory ?? "No previous session memory."}

# Behavioral Rules
1. NEVER modify source financial records — you are read-only on source systems
2. ALWAYS cite specific DoD FMR sections when flagging violations
3. ALWAYS write audit findings with specific evidence IDs — never vague findings
4. If uncertain about a regulation, use CheckFMRCompliance tool — don't guess
5. All findings must follow this format:
   FINDING-[SEVERITY]: [Short title]
   Evidence: [evidence_id_1, evidence_id_2]
   Regulation: [DoD FMR Vol X, Ch Y, Para Z]
   Impact: [Quantified dollar impact or risk description]
   Recommendation: [Specific corrective action]

# Output Format
Structure responses as:
1. Brief status (what you did)
2. Key findings (if any)
3. Next action (what you'll do next)

Today's date: \${new Date().toISOString().split("T")[0]}
\`;
}`,
    tags: ["System Prompt", "Configuration", "Compliance"],
  },
  {
    n: 6, title: "Configure Multi-Agent Coordination",
    desc: "For large audits, enable coordinator mode to run parallel agent workers. Define agent roles, tool subsets, and communication channels.",
    code: `// src/coordinator/auditCoordinatorConfig.ts
import type { CoordinatorConfig } from "../coordinator/coordinatorMode.js";

export const AUDIT_COORDINATOR_CONFIG: CoordinatorConfig = {
  enabled: true,
  maxWorkers: 5,             // Run up to 5 parallel audit agents
  workerTimeoutMs: 300_000,  // 5 min max per worker

  workers: [
    {
      name: "DataHarvester",
      systemPrompt: "You collect raw financial data from source systems. Fetch all records for the given scope and write to staging. Do not analyze — just collect and validate checksums.",
      allowedTools: ["fetch_sfis_record", "fetch_gfebs_ledger", "fetch_piee_obligation",
                     "FileReadTool", "GlobTool"],
      permissionMode: "auto",
    },
    {
      name: "ReconciliationEngine",
      systemPrompt: "You compare transactions across source systems in staging. Identify discrepancies by type and severity. Write validated findings.",
      allowedTools: ["compare_transactions", "flag_discrepancy", "write_audit_finding",
                     "FileReadTool", "GlobTool"],
      permissionMode: "auto",
    },
    {
      name: "RegulatoryChecker",
      systemPrompt: "You validate findings against DoD FMR and NDAA. Cite specific regulations. Add violation codes to findings.",
      allowedTools: ["check_fmr_compliance", "validate_ndaa_limit", "citation_lookup",
                     "FileReadTool"],
      permissionMode: "plan",  // Read-only mode — regulatory checks only
    },
  ],

  // Workers write findings; coordinator synthesizes the final report
  synthesisPrompt: \`
    You are the audit coordinator. Workers have completed parallel analysis.
    Synthesize their findings into a single GAGAS-compliant audit report.
    Deduplicate findings, resolve conflicts, and order by severity.
    Generate executive summary and management recommendations.
  \`,
};`,
    tags: ["Multi-Agent", "Coordinator", "Parallelism"],
  },
  {
    n: 7, title: "Add RAG Memory Pipeline",
    desc: "Connect a vector database so agents can retrieve relevant regulatory text, past audit findings, and domain knowledge — grounding responses in authoritative sources.",
    code: `// src/services/rag/auditRAG.ts
import { Pinecone }      from "@pinecone-database/pinecone";
import Anthropic         from "@anthropic-ai/sdk";
import type { AppState } from "../../state/AppState.js";

const pc     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const client = new Anthropic();

/** Embed query + retrieve top-K relevant documents */
export async function retrieveRelevantContext(
  query: string,
  namespace: "dod-fmr" | "past-findings" | "ndaa" | "gagas",
  topK = 5,
): Promise<string> {
  // 1. Embed the query
  const embedRes = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  const queryVec = embedRes.data[0].embedding;

  // 2. Search vector store
  const index   = pc.index("dod-audit-knowledge").namespace(namespace);
  const results = await index.query({ vector: queryVec, topK, includeMetadata: true });

  // 3. Format as context for injection into system prompt
  return results.matches
    .map(m => \`[Source: \${m.metadata?.source}]\\n\${m.metadata?.text}\`)
    .join("\\n\\n---\\n\\n");
}

// Usage in system prompt composition:
// const fmrContext = await retrieveRelevantContext(auditTopic, "dod-fmr");
// Add fmrContext to systemPrompt extras`,
    tags: ["RAG", "Memory", "Vector DB"],
  },
  {
    n: 8, title: "Implement Audit Logging Middleware",
    desc: "Every tool call must be logged with full provenance for FISMA compliance. Wrap the tool dispatch layer to capture all actions immutably.",
    code: `// src/utils/auditLogger.ts — FISMA-compliant audit trail
import { createHash }  from "crypto";
import type { AppState } from "../state/AppState.js";

export interface AuditLogEntry {
  timestamp:   string;
  sessionId:   string;
  agentId:     string;
  toolName:    string;
  inputHash:   string;   // SHA-256 of serialized input (not input itself — may contain CUI)
  outputHash:  string;   // SHA-256 of output
  durationMs:  number;
  success:     boolean;
  errorCode?:  string;
}

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Wrap any Tool.execute() call with audit logging */
export async function auditedExecute(
  toolName: string,
  input:    unknown,
  state:    AppState,
  execute:  (input: unknown, state: AppState) => Promise<string>,
): Promise<string> {
  const start = Date.now();
  const entry: Partial<AuditLogEntry> = {
    timestamp:  new Date().toISOString(),
    sessionId:  state.sessionId,
    agentId:    state.agentId,
    toolName,
    inputHash:  sha256(JSON.stringify(input)),
  };

  try {
    const result  = await execute(input, state);
    entry.outputHash = sha256(result);
    entry.success    = true;
    entry.durationMs = Date.now() - start;
    await state.auditLog.append(entry as AuditLogEntry);
    return result;
  } catch (err) {
    entry.success    = false;
    entry.errorCode  = (err as Error).message.slice(0, 100);
    entry.durationMs = Date.now() - start;
    await state.auditLog.append(entry as AuditLogEntry);
    throw err;
  }
}`,
    tags: ["Compliance", "Logging", "FISMA"],
  },
  {
    n: 9, title: "Add Cost & Rate Limit Controls",
    desc: "Production agents need budget enforcement to prevent runaway spending. Set hard token limits and per-tool rate limits before deploying.",
    code: `// src/config/budgetConfig.ts
export const BUDGET_CONFIG = {
  maxSessionTokens:    500_000,   // Hard stop at 500K tokens/session (~$1.50)
  maxSessionCostUSD:   5.00,      // Hard stop at $5 regardless of tokens
  warnAtCostUSD:       2.50,      // Emit warning when 50% budget consumed
  maxToolCallsPerMin:  30,        // Rate limit across all tools
  maxParallelAgents:   5,         // Cap concurrent worker agents

  // Per-tool rate limits (calls per minute)
  toolRateLimits: {
    fetch_sfis_record:   10,   // External API — respect their rate limit
    compare_transactions: 60,  // CPU-bound local — faster
    write_audit_finding:  20,  // DB writes — moderate
  },
};

// src/services/api/budgetGuard.ts — enforce in API service wrapper
export function createBudgetGuard(config: typeof BUDGET_CONFIG) {
  let sessionTokens = 0;
  let sessionCostUSD = 0;

  return {
    checkBudget(inputTokens: number, estimatedOutputTokens: number) {
      const estimatedCost = (inputTokens / 1_000_000) * 15 +
                            (estimatedOutputTokens / 1_000_000) * 75;
      if (sessionCostUSD + estimatedCost > config.maxSessionCostUSD) {
        throw new Error(
          \`Budget limit reached: \$\${sessionCostUSD.toFixed(2)} / \$\${config.maxSessionCostUSD}\`
        );
      }
    },
    recordUsage(inputTokens: number, outputTokens: number, costUSD: number) {
      sessionTokens  += inputTokens + outputTokens;
      sessionCostUSD += costUSD;
      if (sessionCostUSD >= config.warnAtCostUSD) {
        console.warn(\`⚠️  Budget warning: \$\${sessionCostUSD.toFixed(2)} of \$\${config.maxSessionCostUSD}\`);
      }
    },
  };
}`,
    tags: ["Budget", "Rate Limiting", "Production Safety"],
  },
  {
    n: 10, title: "Deploy with Security Hardening",
    desc: "Production deployment checklist: containerize, harden permissions, rotate secrets, set up monitoring, and run a pre-deployment security scan.",
    code: `# Dockerfile — minimal production image
FROM oven/bun:1.1-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production
COPY src/ ./src/
RUN bun run build

FROM oven/bun:1.1-alpine AS runner
# Run as non-root (critical for IL4 compliance)
RUN addgroup -S agent && adduser -S agent -G agent
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER agent
# No secrets in image — injected at runtime via Vault sidecar
ENTRYPOINT ["bun", "run", "dist/main.js"]

---

# docker-compose.yml — with Vault sidecar for secret injection
services:
  audit-agent:
    build: .
    read_only: true                        # Immutable filesystem
    security_opt: ["no-new-privileges:true"]
    cap_drop: ["ALL"]                      # Drop all Linux capabilities
    tmpfs: ["/tmp", "/app/staging"]        # Ephemeral writable mounts only
    environment:
      - VAULT_ADDR=http://vault:8200
      - VAULT_ROLE=audit-agent
    networks: [audit-internal]
    depends_on: [vault-sidecar]

  vault-sidecar:
    image: hashicorp/vault-k8s:latest
    # Injects SFIS_TOKEN, PINECONE_API_KEY etc. at container start
    networks: [audit-internal]

networks:
  audit-internal:
    driver: bridge
    internal: true    # No outbound internet — traffic via approved proxies only`,
    tags: ["Docker", "Security", "Deployment", "IL4"],
  },
];

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function CodeAnalysisPage() {
  const [pageTab, setPageTab]             = useState<PageTab>("codeintel");
  const [learnLesson, setLearnLesson]     = useState(0);
  const [learnQuiz, setLearnQuiz]         = useState<Record<number,boolean>>({});
  const [learnPath, setLearnPath]         = useState<string | null>(null);
  const [dictSearch, setDictSearch]       = useState("");
  const [dictCategory, setDictCategory]   = useState("All");
  const [shellHighlight, setShellHighlight] = useState<number | null>(null);
  const filteredTerms = useMemo(() =>
    DICTIONARY
      .filter(t => dictCategory === "All" || t.category === dictCategory)
      .filter(t => !dictSearch || t.term.toLowerCase().includes(dictSearch.toLowerCase()) || t.definition.toLowerCase().includes(dictSearch.toLowerCase())),
    [dictSearch, dictCategory]
  );
  const [selectedFile, setSelectedFile]   = useState("src/main.tsx");
  const [expanded, setExpanded]           = useState<Set<string>>(
    new Set(["src","src/tools","src/services","src/bridge","src/buddy"])
  );
  const [viewMode, setViewMode]           = useState<"code"|"map">("code");
  const [chatInput, setChatInput]         = useState("");
  const [chatMessages, setChatMessages]   = useState<{role:"user"|"assistant";content:string}[]>([
    { role: "assistant", content: "👋 I've indexed **182,039 lines** across **1,884 TypeScript files** from the claude_code_Template codebase.\n\nClick any file in the explorer → the **File Explainer** (panel 3) will break it down for you in plain English. Then ask me anything here!" },
  ]);
  const [isStreaming, setIsStreaming]     = useState(false);
  const [copied, setCopied]               = useState(false);
  const [hintCopied, setHintCopied]       = useState<string|null>(null);
  const [mermaidReady, setMermaidReady]   = useState(false);
  const [exportStatus, setExportStatus]   = useState<"idle"|"exporting">("idle");
  const [activeSection, setActiveSection] = useState<number|null>(null); // for mobile accordion
  const chatEndRef  = useRef<HTMLDivElement>(null);
  const mermaidRef  = useRef<HTMLDivElement>(null);

  // Load Mermaid CDN
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("mermaid-cdn")) { setMermaidReady(true); return; }
    const s = document.createElement("script");
    s.id  = "mermaid-cdn";
    s.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
    s.onload = () => {
      (window as any).mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
      setMermaidReady(true);
    };
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    if (!mermaidReady || viewMode !== "map" || !mermaidRef.current) return;
    const el = mermaidRef.current;
    el.innerHTML = `<pre class="mermaid">${MERMAID_CODE}</pre>`;
    (window as any).mermaid.run({ nodes: el.querySelectorAll(".mermaid") }).catch(() => {});
  }, [mermaidReady, viewMode]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const toggleDir = useCallback((p: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
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
        for (const line of dec.decode(value).split("\n")) {
          if (line.startsWith("0:")) {
            try { acc += JSON.parse(line.slice(2)); } catch {}
            setChatMessages(prev => {
              const c = [...prev]; c[c.length-1] = { role:"assistant", content: acc+"▋" }; return c;
            });
          }
        }
      }
      setChatMessages(prev => {
        const c = [...prev]; c[c.length-1] = { role:"assistant", content: acc }; return c;
      });
    } catch {
      setChatMessages(prev => {
        const c = [...prev]; c[c.length-1] = { role:"assistant", content: "⚠️ Request failed. Please try again." }; return c;
      });
    } finally { setIsStreaming(false); }
  }, [isStreaming, selectedFile]);

  const handleQuickAction = useCallback((id: QuickActionId, label: string) => {
    sendMessage(`${label}: ${selectedFile}`, id);
  }, [selectedFile, sendMessage]);

  const copyHint = useCallback((hint: string) => {
    navigator.clipboard.writeText(hint);
    setHintCopied(hint);
    setChatInput(hint);
    setTimeout(() => setHintCopied(null), 2000);
  }, []);

  // Static HTML export
  const handleExport = useCallback(() => {
    setExportStatus("exporting");
    const treeHtml = (nodes: TreeNode[], d=0): string => nodes.map(n =>
      n.type === "dir"
        ? `<details><summary>${"&nbsp;".repeat(d*3)}📁 <b>${n.name}</b>${n.desc ? ` — <i>${n.desc}</i>` : ""}</summary>${treeHtml(n.children??[],d+1)}</details>`
        : `<div style="padding:2px 0 2px ${d*14}px;color:#9aa3c0;font-size:12px">📄 ${n.name}${n.lines?` (${n.lines}L)`:""} — ${n.desc??""}</div>`
    ).join("");
    const chatHtml = chatMessages.map(m =>
      `<div style="margin:8px 0;padding:10px 14px;border-radius:8px;background:${m.role==="user"?"#1c1f30":"#12141f"};border-left:3px solid ${m.role==="user"?"#4f8ef7":"#34d399"}"><div style="font-size:10px;font-weight:700;color:${m.role==="user"?"#4f8ef7":"#34d399"};margin-bottom:4px">${m.role.toUpperCase()}</div><div style="font-size:13px;color:#c9d1f0;white-space:pre-wrap">${m.content.replace(/</g,"&lt;")}</div></div>`
    ).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Claude Code Analysis</title>
<script src="https://cdn.tailwindcss.com"></script><script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>body{font-family:monospace;background:#12141f;color:#eaedf8;padding:2rem}h1{color:#4f8ef7;font-size:1.8rem}h2{color:#818cf8;border-bottom:1px solid #252840;padding-bottom:.3rem;margin:2rem 0 1rem}pre{background:#0d0f1a;padding:1rem;border-radius:6px;overflow-x:auto;color:#c9d1f0;font-size:.8rem}details{margin:.3rem 0;background:#1c1f30;border-radius:6px;padding:.4rem .8rem}summary{cursor:pointer;color:#9aa3c0}</style>
</head><body>
<h1>🔬 Claude Code — Analysis Report</h1>
<p style="color:#9aa3c0">Generated by AXIOM Code Intelligence · ${new Date().toLocaleString()}</p>
<div style="display:flex;gap:1rem;flex-wrap:wrap;margin:1rem 0">
${[["182K","Lines of Code"],["1,884","TypeScript Files"],["40+","Built-in Tools"],["70+","CLI Commands"]].map(([n,l])=>`<div style="background:#1c1f30;border-radius:8px;padding:.8rem 1.2rem;text-align:center"><div style="font-size:1.3rem;font-weight:700;color:#4f8ef7">${n}</div><div style="font-size:.75rem;color:#9aa3c0">${l}</div></div>`).join("")}
</div>
<h2>🗺️ Architecture Diagram</h2>
<div class="mermaid" style="background:#1c1f30;border-radius:8px;padding:1rem">${MERMAID_CODE}</div>
<h2>📁 File Tree</h2>${treeHtml(FILE_TREE)}
<h2>🤖 AI Analysis Session</h2>${chatHtml}
<script>mermaid.initialize({startOnLoad:true,theme:"dark"});</script>
</body></html>`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type:"text/html" }));
    a.download = `claude-code-analysis-${Date.now()}.html`;
    a.click();
    setExportStatus("idle");
  }, [chatMessages]);

  // ── RENDER TREE ──────────────────────────────────────────────────────────────
  function renderTree(nodes: TreeNode[], path="", depth=0): ReactNode {
    return nodes.map(node => {
      const fp = path ? `${path}/${node.name}` : node.name;
      const isOpen = expanded.has(fp);
      const isSel  = selectedFile === fp;
      if (node.type === "dir") return (
        <div key={fp}>
          <div onClick={() => toggleDir(fp)} style={{
            display:"flex",alignItems:"center",gap:4,cursor:"pointer",
            padding:`4px 8px 4px ${10+depth*13}px`,borderRadius:5,fontSize:12.5,
            color:"#9aa3c0",transition:"background 0.1s",
          }} onMouseEnter={e=>(e.currentTarget.style.background="#252840")}
             onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
            {isOpen?<ChevronDown size={11}/>:<ChevronRight size={11}/>}
            {isOpen?<FolderOpen size={12} color="#fbbf24"/>:<Folder size={12} color="#fbbf24"/>}
            <span style={{fontWeight:600,flex:1}}>{node.name}</span>
          </div>
          {isOpen && node.children && <div>{renderTree(node.children,fp,depth+1)}</div>}
        </div>
      );
      return (
        <div key={fp} onClick={() => setSelectedFile(fp)} style={{
          display:"flex",alignItems:"center",gap:4,cursor:"pointer",
          padding:`3px 8px 3px ${20+depth*13}px`,borderRadius:5,fontSize:12,
          color: isSel?"#eaedf8":"#7d88a8",
          background: isSel?"rgba(79,142,247,0.15)":"transparent",
          borderLeft: isSel?"2px solid #4f8ef7":"2px solid transparent",
          transition:"all 0.1s",
        }} onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background="#1c1f30"}}
           onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent"}}>
          <FileText size={10} color={isSel?"#4f8ef7":"#5c6480"}/>
          <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{node.name}</span>
          {node.lines && <span style={{fontSize:9,color:"#3d4460",flexShrink:0}}>{node.lines}L</span>}
        </div>
      );
    });
  }

  // ── FILE EXPLAINER PANEL ─────────────────────────────────────────────────────
  const expl = getExplanation(selectedFile);
  const fileShortName = selectedFile.split("/").pop() ?? selectedFile;
  const codeContent = FILE_CONTENTS[selectedFile] ?? `// ${selectedFile}\n// Content not pre-loaded.\n// Use the hints below ↓ or ask the AI assistant for details.`;

  function FileExplainerPanel() {
    if (!expl) return (
      <div style={{padding:16,color:"#6b7499",textAlign:"center",fontSize:13,paddingTop:40}}>
        <HelpCircle size={28} style={{color:"#3d4460",margin:"0 auto 8px",display:"block"}}/>
        <div style={{color:"#7d88a8",marginBottom:6}}>No detailed explanation for</div>
        <code style={{color:"#818cf8",fontSize:12}}>{selectedFile}</code>
        <div style={{marginTop:12,fontSize:12,color:"#5c6480"}}>Click a key file above or ask the AI assistant for help</div>
      </div>
    );
    return (
      <div style={{display:"flex",flexDirection:"column",gap:0,height:"100%",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"10px 14px",borderBottom:"1px solid var(--bd)",flexShrink:0,background:"#0d0f1a"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
            <GraduationCap size={14} color="#818cf8"/>
            <span style={{fontSize:12,fontWeight:800,color:"#818cf8",letterSpacing:"0.08em"}}>FILE EXPLAINER</span>
            <span style={{
              marginLeft:"auto",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,
              background:`${DIFF_COLOR[expl.difficulty]}20`,color:DIFF_COLOR[expl.difficulty],
              border:`1px solid ${DIFF_COLOR[expl.difficulty]}40`,
            }}>{expl.difficulty}</span>
          </div>
          <div style={{fontSize:13,fontWeight:700,color:"#eaedf8"}}>{fileShortName}</div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:14}}>

          {/* Role */}
          <div style={{padding:"10px 13px",borderRadius:8,background:"rgba(129,140,248,0.08)",border:"1px solid rgba(129,140,248,0.25)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#818cf8",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:5}}>What this file does</div>
            <p style={{fontSize:13,color:"#c9d1f0",lineHeight:1.65,margin:0}}>{expl.role}</p>
          </div>

          {/* Analogy */}
          <div style={{padding:"10px 13px",borderRadius:8,background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:6}}>
              <Lightbulb size={12} color="#fbbf24"/>
              <span style={{fontSize:10,fontWeight:700,color:"#fbbf24",textTransform:"uppercase",letterSpacing:"0.1em"}}>Plain-English Analogy</span>
            </div>
            <p style={{fontSize:13,color:"#d4b04a",lineHeight:1.65,margin:0}}>{expl.analogy}</p>
          </div>

          {/* How it works */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
              <Layers size={12} color="#38bdf8"/>
              <span style={{fontSize:10,fontWeight:700,color:"#38bdf8",textTransform:"uppercase",letterSpacing:"0.1em"}}>How It Works — Step by Step</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {expl.howItWorks.map((item, i) => (
                <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                  <div style={{
                    width:20,height:20,borderRadius:"50%",flexShrink:0,
                    background:"rgba(56,189,248,0.15)",border:"1px solid rgba(56,189,248,0.35)",
                    color:"#38bdf8",fontSize:10,fontWeight:800,
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>{i+1}</div>
                  <div>
                    <div style={{fontSize:12.5,fontWeight:700,color:"#eaedf8",marginBottom:2}}>{item.step}</div>
                    <div style={{fontSize:12,color:"#9aa3c0",lineHeight:1.6}}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connections */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
              <Network size={12} color="#34d399"/>
              <span style={{fontSize:10,fontWeight:700,color:"#34d399",textTransform:"uppercase",letterSpacing:"0.1em"}}>Connections to Other Files</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {expl.connections.imports.length > 0 && (
                <div>
                  <div style={{fontSize:11,color:"#6b7499",marginBottom:5,fontWeight:600}}>⬇ This file imports from:</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {expl.connections.imports.map((imp,i) => (
                      <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 9px",borderRadius:6,background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.15)"}}>
                        <GitBranch size={10} color="#34d399" style={{flexShrink:0,marginTop:2}}/>
                        <div>
                          <code style={{fontSize:11,color:"#34d399",fontWeight:700}}>{imp.name}</code>
                          <span style={{fontSize:11,color:"#7d88a8",marginLeft:6}}>— {imp.why}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div style={{fontSize:11,color:"#6b7499",marginBottom:5,fontWeight:600}}>⬆ Used by:</div>
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  {expl.connections.usedBy.map((u,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 9px",borderRadius:6,background:"rgba(79,142,247,0.06)",border:"1px solid rgba(79,142,247,0.15)"}}>
                      <ArrowRight size={10} color="#4f8ef7"/>
                      <code style={{fontSize:11,color:"#9aa3c0"}}>{u}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Concepts */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
              <Star size={12} color="#a78bfa"/>
              <span style={{fontSize:10,fontWeight:700,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"0.1em"}}>Key Concepts to Study</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
              {expl.concepts.map((c,i) => (
                <span key={i} style={{
                  fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,
                  background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.3)",color:"#a78bfa",
                }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Learning Hints */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:8}}>
              <MessageSquare size={12} color="#fb923c"/>
              <span style={{fontSize:10,fontWeight:700,color:"#fb923c",textTransform:"uppercase",letterSpacing:"0.1em"}}>Ask the AI — Smart Questions</span>
            </div>
            <div style={{fontSize:11,color:"#6b7499",marginBottom:7}}>Click any question to paste it into the chat ↓</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {expl.hints.map((hint,i) => (
                <button key={i} onClick={() => copyHint(hint)} style={{
                  display:"flex",alignItems:"flex-start",gap:7,padding:"8px 10px",
                  borderRadius:7,cursor:"pointer",textAlign:"left",width:"100%",
                  background: hintCopied===hint ? "rgba(251,146,60,0.15)" : "rgba(251,146,60,0.06)",
                  border: hintCopied===hint ? "1px solid rgba(251,146,60,0.5)" : "1px solid rgba(251,146,60,0.2)",
                  transition:"all 0.15s",
                }}>
                  {hintCopied===hint
                    ? <Check size={11} color="#fb923c" style={{flexShrink:0,marginTop:1}}/>
                    : <HelpCircle size={11} color="#fb923c" style={{flexShrink:0,marginTop:1}}/>}
                  <span style={{fontSize:12,color:"#d4874a",lineHeight:1.55}}>{hint}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ── SECTION HEADER (mobile) ──────────────────────────────────────────────────
  function MobileHeader({ idx, icon, label, color }: { idx:number; icon:ReactNode; label:string; color:string }) {
    const open = activeSection === null || activeSection === idx;
    return (
      <div onClick={() => setActiveSection(open && activeSection===idx ? null : idx)} style={{
        display:"none",
        padding:"9px 14px",background:"#0d0f1a",borderBottom:"1px solid var(--bd)",
        cursor:"pointer",flexShrink:0,
      }} className="mobile-section-header">
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{color}}>{icon}</span>
          <span style={{fontSize:13,fontWeight:700,color:"#eaedf8"}}>{label}</span>
          <ChevronDown size={13} style={{marginLeft:"auto",color:"#6b7499",transform: open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}/>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      {/* ── PAGE TAB BAR ────────────────────────────────────────────────────── */}
      <div style={{
        display:"flex", alignItems:"center", gap:3, padding:"6px 14px",
        background:"#0a0c15", borderBottom:"1px solid var(--bd)",
        overflowX:"auto", flexShrink:0,
      }}>
        <span style={{fontSize:10,fontWeight:800,color:"#2a2e46",letterSpacing:"0.1em",marginRight:6,flexShrink:0}}>VIEW</span>
        {PAGE_TABS.map(tab => (
          <button key={tab.id} onClick={() => setPageTab(tab.id)} style={{
            display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
            borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer", flexShrink:0,
            background: pageTab===tab.id ? `${tab.color}20` : "transparent",
            border: pageTab===tab.id ? `1px solid ${tab.color}50` : "1px solid transparent",
            color: pageTab===tab.id ? tab.color : "#5c6480",
            transition:"all 0.15s",
          }}>
            {tab.icon}<span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── CODE INTEL TAB (existing 4-pane) ────────────────────────────────── */}
      {pageTab === "codeintel" && (
      <div className="ca-grid" style={{
        display:"grid",
        gridTemplateColumns:"220px 1fr 1fr 360px",
        height:"calc(100dvh - 96px)",
        background:"var(--bg)",
        overflow:"hidden",
      }}>

        {/* ── PANE 1: FILE EXPLORER ──────────────────────────────────────── */}
        <div className="ca-pane" style={{display:"flex",flexDirection:"column",borderRight:"1px solid var(--bd)",background:"#0d0f1a",overflow:"hidden"}}>
          <div style={{padding:"10px 12px 8px",borderBottom:"1px solid var(--bd)",flexShrink:0,display:"flex",alignItems:"center",gap:6}}>
            <LayoutPanelLeft size={13} color="#4f8ef7"/>
            <span style={{fontSize:11,fontWeight:800,color:"#eaedf8",letterSpacing:"0.08em"}}>EXPLORER</span>
            <span style={{marginLeft:"auto",fontSize:10,color:"#3d4460"}}>1,884 files</span>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"6px 4px"}}>
            {renderTree(FILE_TREE)}
          </div>
          <div style={{padding:"8px 12px",borderTop:"1px solid var(--bd)",flexShrink:0}}>
            <div style={{fontSize:10,color:"#3d4460",marginBottom:3}}>SELECTED</div>
            <code style={{fontSize:10,color:"#818cf8",wordBreak:"break-all"}}>{selectedFile}</code>
          </div>
        </div>

        {/* ── PANE 2: CODE VIEWER ────────────────────────────────────────── */}
        <div className="ca-pane" style={{display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"1px solid var(--bd)"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"8px 10px",borderBottom:"1px solid var(--bd)",background:"#12141f",flexShrink:0}}>
            <FileCode2 size={12} color="#4f8ef7"/>
            <span style={{fontSize:11,color:"#9aa3c0",fontFamily:"monospace",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selectedFile}</span>
            {(["code","map"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding:"3px 9px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",
                background: viewMode===m ? "rgba(79,142,247,0.2)" : "transparent",
                border: viewMode===m ? "1px solid rgba(79,142,247,0.4)" : "1px solid transparent",
                color: viewMode===m ? "#4f8ef7" : "#6b7499",
              }}>{m==="code"?"Code":"Map"}</button>
            ))}
            <button onClick={() => { navigator.clipboard.writeText(codeContent); setCopied(true); setTimeout(()=>setCopied(false),1500); }} style={{
              padding:"3px 7px",borderRadius:5,fontSize:10,background: copied?"rgba(52,211,153,0.15)":"var(--bg2)",border:"1px solid var(--bd)",color: copied?"#34d399":"#6b7499",cursor:"pointer",display:"flex",alignItems:"center",gap:3,
            }}>
              {copied?<Check size={10}/>:<Copy size={10}/>}
            </button>
            <button onClick={handleExport} style={{padding:"3px 8px",borderRadius:5,fontSize:10,background:"rgba(129,140,248,0.15)",border:"1px solid rgba(129,140,248,0.35)",color:"#818cf8",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
              <Download size={10}/>{exportStatus==="exporting"?"…":"HTML"}
            </button>
          </div>
          <div style={{flex:1,overflow:"auto"}}>
            {viewMode==="code" ? (
              <pre style={{margin:0,padding:14,fontSize:12,lineHeight:1.65,fontFamily:"'JetBrains Mono','Fira Code',Consolas,monospace",background:"#0d0f1a",color:"#c9d1f0",minHeight:"100%"}}>
                {codeContent.split("\n").map((line,i) => (
                  <div key={i} style={{display:"flex"}}>
                    <span style={{width:30,flexShrink:0,color:"#2a2e46",userSelect:"none",textAlign:"right",paddingRight:10,fontSize:10}}>{i+1}</span>
                    <span dangerouslySetInnerHTML={{__html: highlight(line)||"&nbsp;"}}/>
                  </div>
                ))}
              </pre>
            ) : (
              <div style={{padding:14,minHeight:"100%"}}>
                <div style={{marginBottom:10,fontSize:12,color:"#6b7499"}}>Architecture — live Mermaid.js diagram</div>
                <div ref={mermaidRef} style={{background:"#1c1f30",borderRadius:8,padding:14,minHeight:380,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {!mermaidReady && <div style={{color:"#6b7499",fontSize:12}}><RefreshCw size={14} style={{display:"inline",marginRight:5,animation:"spin 1s linear infinite"}}/>Loading Mermaid…</div>}
                </div>
              </div>
            )}
          </div>
          <div style={{padding:"5px 10px",borderTop:"1px solid var(--bd)",background:"#0d0f1a",flexShrink:0,display:"flex",gap:10}}>
            {[["File",fileShortName],["Lines",codeContent.split("\n").length],["Lang","TypeScript"]].map(([k,v])=>(
              <span key={k as string} style={{fontSize:10,color:"#3d4460"}}>{k}: <span style={{color:"#6b7499"}}>{v}</span></span>
            ))}
          </div>
        </div>

        {/* ── PANE 3: FILE EXPLAINER ─────────────────────────────────────── */}
        <div className="ca-pane" style={{display:"flex",flexDirection:"column",overflow:"hidden",borderRight:"1px solid var(--bd)",background:"#0a0c15"}}>
          <FileExplainerPanel />
        </div>

        {/* ── PANE 4: AI CHAT ────────────────────────────────────────────── */}
        <div className="ca-pane" style={{display:"flex",flexDirection:"column",overflow:"hidden",background:"#0d0f1a"}}>
          <div style={{padding:"9px 12px",borderBottom:"1px solid var(--bd)",background:"#12141f",flexShrink:0,display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#4f8ef7,#818cf8)",display:"flex",alignItems:"center",justifyContent:"center"}}><Cpu size={13} color="#fff"/></div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#eaedf8"}}>Code Intelligence</div>
              <div style={{fontSize:10,color:"#4f8ef7"}}>● gemini-2.5-flash</div>
            </div>
            <div style={{marginLeft:"auto",fontSize:9,color:"#3d4460"}}>182K LOC ctx</div>
          </div>
          <div style={{padding:"5px 9px",borderBottom:"1px solid var(--bd)",display:"flex",flexWrap:"wrap",gap:3,flexShrink:0}}>
            {QUICK_ACTIONS.map(({id,label,icon:Icon,color}) => (
              <button key={id} onClick={() => handleQuickAction(id,label)} disabled={isStreaming} style={{
                display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:5,fontSize:10,fontWeight:700,
                background:`${color}18`,border:`1px solid ${color}30`,color,
                cursor:isStreaming?"not-allowed":"pointer",opacity:isStreaming?0.5:1,
              }}>
                <Icon size={10}/>{label}
              </button>
            ))}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"10px 11px",display:"flex",flexDirection:"column",gap:8}}>
            {chatMessages.map((m,i) => (
              <div key={i} style={{borderRadius:8,padding:"9px 11px",background:m.role==="user"?"#1c1f30":"#12141f",borderLeft:`3px solid ${m.role==="user"?"#4f8ef7":"#34d399"}`}}>
                <div style={{fontSize:9,fontWeight:800,color:m.role==="user"?"#4f8ef7":"#34d399",marginBottom:4,letterSpacing:"0.08em"}}>{m.role==="user"?"YOU":"AI ANALYST"}</div>
                <div style={{fontSize:12.5,color:"#c9d1f0",lineHeight:1.65,whiteSpace:"pre-wrap"}}>{m.content.replace(/\*\*([^*]+)\*\*/g,"$1")}</div>
              </div>
            ))}
            {isStreaming && <div style={{display:"flex",alignItems:"center",gap:5,color:"#6b7499",fontSize:11,padding:"2px 0"}}><Zap size={11} color="#4f8ef7" style={{animation:"pulse 1s ease infinite"}}/>Analysing…</div>}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:"8px 10px",borderTop:"1px solid var(--bd)",flexShrink:0}}>
            <div style={{display:"flex",gap:5}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(chatInput)}}}
                placeholder={`Ask about ${fileShortName}…`} disabled={isStreaming}
                style={{flex:1,padding:"8px 10px",borderRadius:7,fontSize:12.5,background:"#1c1f30",border:"1px solid var(--bd)",color:"#eaedf8",outline:"none"}}
              />
              <button onClick={() => sendMessage(chatInput)} disabled={isStreaming||!chatInput.trim()} style={{
                width:34,height:34,borderRadius:7,background:"rgba(79,142,247,0.2)",border:"1px solid rgba(79,142,247,0.4)",
                color:"#4f8ef7",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                opacity:isStreaming||!chatInput.trim()?0.4:1,flexShrink:0,
              }}><Send size={13}/></button>
            </div>
            <div style={{marginTop:4,fontSize:9,color:"#2a2e46",textAlign:"center"}}>Gemini 2.5 Flash · 182,039 LOC indexed</div>
          </div>
        </div>

      </div>
      )} {/* end codeintel tab */}

      {/* ── ARCHITECTURE TAB ────────────────────────────────────────────────── */}
      {pageTab === "architecture" && (
        <div style={{overflowY:"auto",height:"calc(100dvh - 96px)",background:"#0d0f1a",padding:"24px 28px"}}>
          {/* Header */}
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <Layers size={20} color="#34d399"/>
              <h1 style={{fontSize:22,fontWeight:800,color:"#eaedf8",margin:0}}>Framework Architecture</h1>
              <span style={{fontSize:11,padding:"3px 9px",borderRadius:12,background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",fontWeight:700}}>8 LAYERS</span>
            </div>
            <p style={{fontSize:14,color:"#7d88a8",margin:0,lineHeight:1.65}}>
              Deep dive into every architectural layer of the claude_code_Template agentic framework —
              from CLI entry point to security enforcement. Click any layer to expand details.
            </p>
          </div>
          {/* Stats row */}
          <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:28}}>
            {[["182K","Lines of Code","#4f8ef7"],["40+","Built-in Tools","#34d399"],["21","Service Modules","#a78bfa"],["70+","CLI Commands","#fbbf24"],["6","Task Types","#fb923c"],["4","Permission Modes","#f472b6"]].map(([n,l,c])=>(
              <div key={l} style={{padding:"10px 16px",borderRadius:8,background:"#1c1f30",border:"1px solid #252840",textAlign:"center",minWidth:90}}>
                <div style={{fontSize:18,fontWeight:800,color:c as string}}>{n}</div>
                <div style={{fontSize:10,color:"#6b7499",marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          {/* Layers */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {ARCH_LAYERS.map((layer, li) => (
              <div key={layer.id} style={{borderRadius:10,background:"#12141f",border:`1px solid ${layer.color}30`,overflow:"hidden"}}>
                {/* Layer header */}
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:`${layer.color}0a`}}>
                  <div style={{width:32,height:32,borderRadius:8,background:`${layer.color}20`,border:`1px solid ${layer.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{layer.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,fontWeight:800,color:layer.color,letterSpacing:"0.05em"}}>LAYER {layer.id}</span>
                      <span style={{fontSize:15,fontWeight:800,color:"#eaedf8"}}>{layer.label}</span>
                    </div>
                    <p style={{fontSize:13,color:"#9aa3c0",margin:"3px 0 0",lineHeight:1.55}}>{layer.desc}</p>
                  </div>
                </div>
                {/* Body */}
                <div style={{padding:"14px 18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  {/* Files */}
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:"#5c6480",letterSpacing:"0.08em",marginBottom:7}}>KEY FILES</div>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {layer.files.map(f=>(
                        <div key={f} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",borderRadius:5,background:"rgba(255,255,255,0.03)"}}>
                          <FileText size={10} color={layer.color}/>
                          <code style={{fontSize:11,color:"#9aa3c0"}}>{f}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Tech */}
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:"#5c6480",letterSpacing:"0.08em",marginBottom:7}}>TECHNOLOGIES</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {layer.tech.map(t=>(
                        <span key={t} style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:12,background:`${layer.color}15`,border:`1px solid ${layer.color}30`,color:layer.color}}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Detail bullets */}
                <div style={{padding:"0 18px 14px",display:"flex",flexDirection:"column",gap:5}}>
                  {layer.details.map((d,i)=>(
                    <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:layer.color,flexShrink:0,marginTop:7}}/>
                      <span style={{fontSize:12.5,color:"#9aa3c0",lineHeight:1.65}}>{d}</span>
                    </div>
                  ))}
                </div>
                {/* Flow arrow */}
                {li < ARCH_LAYERS.length - 1 && (
                  <div style={{textAlign:"center",padding:"4px 0 8px",color:"#2a2e46",fontSize:11}}>↓ calls into</div>
                )}
              </div>
            ))}
          </div>
          {/* Data flow summary */}
          <div style={{marginTop:28,padding:"18px 22px",borderRadius:10,background:"#0a0c15",border:"1px solid #252840"}}>
            <div style={{fontSize:12,fontWeight:800,color:"#eaedf8",marginBottom:10,display:"flex",alignItems:"center",gap:6}}><GitBranch size={13} color="#4f8ef7"/>Complete Data Flow</div>
            <div style={{fontSize:13,color:"#7d88a8",lineHeight:1.8,fontFamily:"monospace"}}>
              User input → <span style={{color:"#4f8ef7"}}>main.tsx</span> → <span style={{color:"#34d399"}}>QueryEngine</span> → Anthropic API (stream) → detect tool_use → <span style={{color:"#a78bfa"}}>Tool.execute()</span> → <span style={{color:"#fbbf24"}}>Task (async)</span> → observation result → append to messages → loop back to API → stop_reason=end_turn → <span style={{color:"#f472b6"}}>render response</span>
            </div>
          </div>
        </div>
      )}

      {/* ── DICTIONARY TAB ──────────────────────────────────────────────────── */}
      {pageTab === "dictionary" && (
        <div style={{overflowY:"auto",height:"calc(100dvh - 96px)",background:"#0d0f1a",padding:"24px 28px"}}>
          {/* Header */}
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <BookOpen size={20} color="#a78bfa"/>
              <h1 style={{fontSize:22,fontWeight:800,color:"#eaedf8",margin:0}}>AI Engineering Dictionary</h1>
              <span style={{fontSize:11,padding:"3px 9px",borderRadius:12,background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.3)",color:"#a78bfa",fontWeight:700}}>{DICTIONARY.length} TERMS</span>
            </div>
            <p style={{fontSize:14,color:"#7d88a8",margin:0}}>Comprehensive reference covering agentic AI, LLMs, protocols, memory, infrastructure, and compliance.</p>
          </div>
          {/* Search + Filter */}
          <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:200,padding:"8px 12px",borderRadius:8,background:"#12141f",border:"1px solid #252840"}}>
              <Search size={13} color="#6b7499"/>
              <input value={dictSearch} onChange={e=>setDictSearch(e.target.value)} placeholder="Search terms…"
                aria-label="Search dictionary terms"
                style={{flex:1,background:"transparent",border:"none",outline:"none",fontSize:13,color:"#eaedf8"}}/>
            </div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {DICT_CATEGORIES.map(cat=>(
                <button key={cat} onClick={()=>setDictCategory(cat)} aria-pressed={dictCategory===cat} style={{
                  padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",
                  background: dictCategory===cat ? "rgba(167,139,250,0.2)" : "#12141f",
                  border: dictCategory===cat ? "1px solid rgba(167,139,250,0.5)" : "1px solid #252840",
                  color: dictCategory===cat ? "#a78bfa" : "#6b7499",
                }}>{cat}</button>
              ))}
            </div>
          </div>
          {/* Terms grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(480px,1fr))",gap:14}}>
            {filteredTerms.map(term=>{
                const c = DICT_CAT_COLOR[term.category] ?? "#818cf8";
                return (
                  <div key={term.term} style={{borderRadius:10,background:"#12141f",border:"1px solid #252840",overflow:"hidden",transition:"border 0.15s"}}
                    onMouseEnter={e=>(e.currentTarget.style.border=`1px solid ${c}50`)}
                    onMouseLeave={e=>(e.currentTarget.style.border="1px solid #252840")}>
                    <div style={{padding:"12px 16px 10px",borderBottom:"1px solid #1a1d2e"}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:4}}>
                        <span style={{fontSize:15,fontWeight:800,color:"#eaedf8",flex:1,lineHeight:1.3}}>{term.term}</span>
                        <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:10,background:`${c}15`,border:`1px solid ${c}30`,color:c,flexShrink:0}}>{term.category}</span>
                      </div>
                      <p style={{fontSize:12,color:`${c}cc`,margin:0,fontStyle:"italic"}}>{term.short}</p>
                    </div>
                    <div style={{padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:"#5c6480",letterSpacing:"0.08em",marginBottom:4}}>DEFINITION</div>
                        <p style={{fontSize:13,color:"#c9d1f0",lineHeight:1.7,margin:0}}>{term.definition}</p>
                      </div>
                      <div style={{padding:"9px 12px",borderRadius:7,background:"rgba(255,255,255,0.03)",borderLeft:`3px solid ${c}60`}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#5c6480",letterSpacing:"0.08em",marginBottom:4}}>REAL-WORLD USE</div>
                        <p style={{fontSize:12.5,color:"#9aa3c0",lineHeight:1.65,margin:0}}>{term.realWorld}</p>
                      </div>
                      {term.codeRef && (
                        <div style={{display:"flex",alignItems:"flex-start",gap:6,padding:"7px 10px",borderRadius:6,background:"rgba(79,142,247,0.05)",border:"1px solid rgba(79,142,247,0.15)"}}>
                          <FileCode2 size={10} color="#4f8ef7" style={{flexShrink:0,marginTop:2}}/>
                          <code style={{fontSize:11,color:"#4f8ef780"}}>{term.codeRef}</code>
                        </div>
                      )}
                      {term.related && (
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          {term.related.map(r=>(
                            <button key={r} onClick={()=>setDictSearch(r)} style={{
                              fontSize:10,padding:"2px 7px",borderRadius:10,cursor:"pointer",
                              background:"rgba(255,255,255,0.04)",border:"1px solid #252840",color:"#6b7499",
                            }}>{r}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
      )}

      {/* ── DOD EXAMPLE TAB ─────────────────────────────────────────────────── */}
      {pageTab === "dod" && (
        <div style={{overflowY:"auto",height:"calc(100dvh - 96px)",background:"#0d0f1a",padding:"24px 28px"}}>
          {/* Hero */}
          <div style={{marginBottom:28,padding:"22px 24px",borderRadius:12,background:"linear-gradient(135deg,rgba(79,142,247,0.08),rgba(251,146,60,0.06))",border:"1px solid rgba(79,142,247,0.2)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <Building2 size={22} color="#fb923c"/>
              <div>
                <h1 style={{fontSize:20,fontWeight:800,color:"#eaedf8",margin:0}}>DoD Financial Management Audit Reconciliation</h1>
                <p style={{fontSize:13,color:"#fb923c",margin:"3px 0 0",fontWeight:600}}>Production-Ready Agentic AI Solution Blueprint</p>
              </div>
            </div>
            <p style={{fontSize:14,color:"#9aa3c0",margin:"8px 0 0",lineHeight:1.7}}>
              A 5-agent parallel system that autonomously reconciles transactions across SFIS, GFEBS, and PIEE financial systems,
              validates against DoD FMR regulations, packages GAGAS-compliant evidence, and generates audit-ready reports —
              designed for IL4 / CUI environments with full FISMA compliance.
            </p>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:12}}>
              {["FISMA Compliant","IL4 Certified","CUI Data","GAGAS Standard","Zero Trust","ATO Ready"].map(b=>(
                <span key={b} style={{fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:12,background:"rgba(251,146,60,0.12)",border:"1px solid rgba(251,146,60,0.3)",color:"#fb923c"}}>{b}</span>
              ))}
            </div>
          </div>

          {/* Problem + Architecture */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
            <div style={{padding:"18px 20px",borderRadius:10,background:"#12141f",border:"1px solid #252840"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#4f8ef7",letterSpacing:"0.08em",marginBottom:10}}>PROBLEM STATEMENT</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[
                  ["$247B","improper payments DoD FY2023 per OIG"],
                  ["6–18 mo","traditional manual audit cycle time"],
                  ["3 systems","SFIS, GFEBS, PIEE with no automatic reconciliation"],
                  ["Billions","in transactions require cross-system validation annually"],
                ].map(([n,d])=>(
                  <div key={n} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <span style={{fontSize:13,fontWeight:800,color:"#fb923c",minWidth:70,flexShrink:0}}>{n}</span>
                    <span style={{fontSize:12.5,color:"#9aa3c0",lineHeight:1.55}}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:"18px 20px",borderRadius:10,background:"#12141f",border:"1px solid #252840"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#34d399",letterSpacing:"0.08em",marginBottom:10}}>AI SOLUTION VALUE</div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {[
                  ["⚡","Reduce audit cycle from 6–18 months to days"],
                  ["🎯","Real-time reconciliation with FMR citation accuracy"],
                  ["🔒","GAGAS-compliant evidence packages auto-generated"],
                  ["📊","Parallel agents analyze millions of transactions simultaneously"],
                  ["🤖","Consistent, repeatable methodology — no human fatigue errors"],
                ].map(([ic,txt])=>(
                  <div key={txt} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                    <span style={{fontSize:13,flexShrink:0}}>{ic}</span>
                    <span style={{fontSize:12.5,color:"#9aa3c0",lineHeight:1.55}}>{txt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5 Agents */}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:14,fontWeight:800,color:"#eaedf8",marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
              <Cpu size={15} color="#4f8ef7"/>Agent Architecture — 5 Parallel Specialists
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {DOD_AGENTS.map(agent=>(
                <div key={agent.name} style={{borderRadius:10,background:"#12141f",border:`1px solid ${agent.color}25`,overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:`${agent.color}08`}}>
                    <span style={{fontSize:18}}>{agent.icon}</span>
                    <span style={{fontSize:14,fontWeight:800,color:agent.color}}>{agent.name}</span>
                    <div style={{marginLeft:"auto",display:"flex",flexWrap:"wrap",gap:4,justifyContent:"flex-end"}}>
                      {agent.tools.map(t=>(
                        <code key={t} style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:`${agent.color}15`,color:`${agent.color}cc`,border:`1px solid ${agent.color}25`}}>{t}</code>
                      ))}
                    </div>
                  </div>
                  <div style={{padding:"10px 16px 12px"}}>
                    <p style={{fontSize:13,color:"#9aa3c0",lineHeight:1.65,margin:"0 0 6px"}}>{agent.role}</p>
                    <div style={{fontSize:11,color:"#5c6480",fontStyle:"italic"}}>🔒 {agent.restrictions}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tool Specs */}
          <div style={{marginBottom:24}}>
            <div style={{fontSize:14,fontWeight:800,color:"#eaedf8",marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
              <Wrench size={15} color="#a78bfa"/>Key Tool Specifications
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {DOD_TOOLS_SPEC.map(tool=>(
                <div key={tool.name} style={{padding:"12px 16px",borderRadius:8,background:"#12141f",border:"1px solid #252840"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <code style={{fontSize:12,fontWeight:700,color:"#a78bfa"}}>{tool.name}</code>
                    <span style={{fontSize:10,padding:"1px 7px",borderRadius:10,background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.3)",color:"#fbbf24",fontWeight:700}}>{tool.security}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"3px 12px",fontSize:11.5,marginBottom:6}}>
                    <span style={{color:"#5c6480"}}>Input:</span><code style={{color:"#38bdf8"}}>{tool.input}</code>
                    <span style={{color:"#5c6480"}}>Output:</span><code style={{color:"#34d399"}}>{tool.output}</code>
                  </div>
                  <p style={{fontSize:12.5,color:"#9aa3c0",margin:0,lineHeight:1.6}}>{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Security Controls */}
          <div>
            <div style={{fontSize:14,fontWeight:800,color:"#eaedf8",marginBottom:14,display:"flex",alignItems:"center",gap:7}}>
              <Shield size={15} color="#f87171"/>Security & Compliance Controls
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:12}}>
              {DOD_SECURITY.map(s=>(
                <div key={s.control} style={{padding:"14px 16px",borderRadius:8,background:"#12141f",border:"1px solid rgba(248,113,113,0.2)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                    <span style={{fontSize:16}}>{s.icon}</span>
                    <span style={{fontSize:13,fontWeight:700,color:"#f87171"}}>{s.control}</span>
                  </div>
                  <p style={{fontSize:12.5,color:"#9aa3c0",margin:0,lineHeight:1.65}}>{s.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTION SHELL TAB ────────────────────────────────────────────── */}
      {pageTab === "shell" && (
        <div style={{overflowY:"auto",height:"calc(100dvh - 96px)",background:"#0d0f1a",padding:"24px 28px"}}>
          {/* Header */}
          <div style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
              <Terminal size={20} color="#f472b6"/>
              <h1 style={{fontSize:22,fontWeight:800,color:"#eaedf8",margin:0}}>Production Shell Guide</h1>
              <span style={{fontSize:11,padding:"3px 9px",borderRadius:12,background:"rgba(244,114,182,0.12)",border:"1px solid rgba(244,114,182,0.3)",color:"#f472b6",fontWeight:700}}>10 STEPS</span>
            </div>
            <p style={{fontSize:14,color:"#7d88a8",margin:0,lineHeight:1.65}}>
              Step-by-step guide to transform the claude_code_Template framework into a production-ready agentic AI solution.
              Each step includes copy-paste code with minor customization notes.
            </p>
          </div>
          {/* Prerequisites */}
          <div style={{marginBottom:24,padding:"16px 20px",borderRadius:10,background:"#12141f",border:"1px solid rgba(251,191,36,0.2)"}}>
            <div style={{fontSize:12,fontWeight:800,color:"#fbbf24",marginBottom:10,display:"flex",alignItems:"center",gap:6}}><AlertCircle size={13}/>Prerequisites</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:6}}>
              {["Bun ≥ 1.1 or Node ≥ 20","TypeScript ≥ 5.4","Anthropic API key","git","pnpm or bun (NOT npm)","Docker (for production)","Vault access (for secrets)","IL4 environment (for DoD)"].map(p=>(
                <div key={p} style={{display:"flex",alignItems:"center",gap:6}}>
                  <CheckCircle size={11} color="#34d399"/>
                  <span style={{fontSize:12.5,color:"#9aa3c0"}}>{p}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Steps */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {SHELL_STEPS.map(step=>(
              <div key={step.n} style={{borderRadius:10,background:"#12141f",border:`1px solid ${shellHighlight===step.n?"#f472b6":"#252840"}`,overflow:"hidden",transition:"border 0.15s"}}
                onMouseEnter={()=>setShellHighlight(step.n)} onMouseLeave={()=>setShellHighlight(null)}
                onFocus={()=>setShellHighlight(step.n)} onBlur={()=>setShellHighlight(null)}
                tabIndex={0} role="region" aria-label={`Step ${step.n}: ${step.title}`}>
                {/* Step header */}
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",background:"#0d0f1a"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:"rgba(244,114,182,0.15)",border:"1px solid rgba(244,114,182,0.35)",color:"#f472b6",fontSize:13,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{step.n}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:800,color:"#eaedf8"}}>{step.title}</div>
                    <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                      {step.tags.map(t=>(
                        <span key={t} style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:10,background:"rgba(244,114,182,0.1)",border:"1px solid rgba(244,114,182,0.25)",color:"#f472b6cc"}}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Description */}
                <div style={{padding:"12px 18px 0"}}>
                  <p style={{fontSize:13.5,color:"#9aa3c0",lineHeight:1.7,margin:0}}>{step.desc}</p>
                </div>
                {/* Code block */}
                <div style={{margin:"12px 18px 16px",borderRadius:8,background:"#0a0c15",border:"1px solid #1a1d2e",overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",background:"#0d0f1a",borderBottom:"1px solid #1a1d2e"}}>
                    <span style={{fontSize:10,color:"#3d4460",fontFamily:"monospace"}}>Step {step.n}</span>
                    <button onClick={()=>navigator.clipboard.writeText(step.code)} aria-label={`Copy code for step ${step.n}`} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:4,fontSize:10,background:"rgba(79,142,247,0.1)",border:"1px solid rgba(79,142,247,0.25)",color:"#4f8ef7",cursor:"pointer"}}>
                      <Copy size={9}/>Copy
                    </button>
                  </div>
                  <pre style={{margin:0,padding:"14px 16px",fontSize:12,lineHeight:1.7,fontFamily:"'JetBrains Mono','Fira Code',Consolas,monospace",color:"#c9d1f0",overflowX:"auto",whiteSpace:"pre"}}>
                    {step.code.split("\n").map((line,i)=>(
                      <div key={i} style={{display:"flex"}}>
                        <span style={{width:28,flexShrink:0,color:"#2a2e46",userSelect:"none",textAlign:"right",paddingRight:10,fontSize:10}}>{i+1}</span>
                        <span dangerouslySetInnerHTML={{__html: highlight(line)||"&nbsp;"}}/>
                      </div>
                    ))}
                  </pre>
                </div>
              </div>
            ))}
          </div>
          {/* Final checklist */}
          <div style={{marginTop:24,padding:"18px 22px",borderRadius:10,background:"#0a0c15",border:"1px solid rgba(52,211,153,0.2)"}}>
            <div style={{fontSize:12,fontWeight:800,color:"#34d399",marginBottom:12,display:"flex",alignItems:"center",gap:6}}><CheckCircle size={13}/>Pre-Launch Checklist</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:6}}>
              {[
                "[ ] All secrets in Vault — zero in code/env",
                "[ ] Budget limits configured (maxSessionCostUSD)",
                "[ ] Audit logging writes to SIEM within 60s",
                "[ ] Permission modes reviewed — no bypass_permissions",
                "[ ] Rate limits set for all external API tools",
                "[ ] Plan mode tested — no unintended writes",
                "[ ] Docker image runs as non-root user",
                "[ ] All alwaysDenyRules added for destructive tools",
                "[ ] System prompt reviewed by domain expert",
                "[ ] Load tested with realistic transaction volumes",
                "[ ] Coordinator worker timeout set (default 5 min)",
                "[ ] RAG vector store pre-populated with domain docs",
              ].map(item=>(
                <div key={item} style={{fontSize:12,color:"#7d88a8",fontFamily:"monospace",padding:"2px 0"}}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── AI BLUEPRINT TAB ────────────────────────────────────────────────── */}
      {pageTab === "blueprint" && (
        <div style={{overflowY:"auto",height:"calc(100dvh - 96px)",background:"#0d0f1a",padding:"24px 28px"}}>

          {/* ── HERO ── */}
          <div style={{marginBottom:28,padding:"22px 26px",borderRadius:12,background:"linear-gradient(135deg,rgba(232,121,249,0.08),rgba(79,142,247,0.06))",border:"1px solid rgba(232,121,249,0.22)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <span style={{fontSize:26}}>🏗️</span>
              <div>
                <h1 style={{fontSize:22,fontWeight:800,color:"#eaedf8",margin:0}}>AI Agent Blueprint</h1>
                <p style={{fontSize:13,color:"#e879f9",margin:"3px 0 0",fontWeight:600}}>Step-by-step architecture for production agentic systems</p>
              </div>
            </div>
            <p style={{fontSize:14,color:"#9aa3c0",margin:"8px 0 0",lineHeight:1.7}}>
              Six essential pillars — Model Selection, Knowledge Base, Skills, Orchestration, MCP, and A2A —
              with concrete folder structures, exact file names, and numbered steps. Each step shows
              <em style={{color:"#c084fc"}}> what to write, where to put it, and why it matters</em>.
            </p>
            {/* Section nav pills */}
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:14}}>
              {BLUEPRINT_SECTIONS.map(s=>(
                <a key={s.id} href={`#bp-${s.id}`} style={{
                  fontSize:11,fontWeight:700,padding:"4px 12px",borderRadius:20,textDecoration:"none",
                  background:`${s.color}15`,border:`1px solid ${s.color}40`,color:s.color,
                  transition:"all 0.15s",
                }}>{s.icon} {s.title}</a>
              ))}
            </div>
          </div>

          {/* ── SECTIONS ── */}
          <div style={{display:"flex",flexDirection:"column",gap:36}}>
            {BLUEPRINT_SECTIONS.map((sec)=>(
              <div key={sec.id} id={`bp-${sec.id}`} style={{borderRadius:12,background:"#12141f",border:`1px solid ${sec.color}25`,overflow:"hidden"}}>

                {/* Section header */}
                <div style={{padding:"18px 22px",background:`${sec.color}08`,borderBottom:`1px solid ${sec.color}18`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                    <span style={{fontSize:22}}>{sec.icon}</span>
                    <h2 style={{fontSize:19,fontWeight:800,color:"#eaedf8",margin:0}}>{sec.title}</h2>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:12,background:`${sec.color}18`,border:`1px solid ${sec.color}35`,color:sec.color,marginLeft:"auto",flexShrink:0}}>{sec.steps.length} STEPS</span>
                  </div>
                  <p style={{fontSize:12.5,fontWeight:600,color:sec.color,margin:"0 0 6px",fontStyle:"italic"}}>{sec.tagline}</p>
                  <p style={{fontSize:13.5,color:"#9aa3c0",margin:0,lineHeight:1.7}}>{sec.overview}</p>
                </div>

                <div style={{padding:"18px 22px",display:"flex",flexDirection:"column",gap:18}}>

                  {/* File tree */}
                  <div>
                    <div style={{fontSize:10,fontWeight:800,color:"#5c6480",letterSpacing:"0.1em",marginBottom:9}}>📁 FILE STRUCTURE</div>
                    <div style={{borderRadius:8,background:"#0a0c15",border:"1px solid #1a1d2e",padding:"12px 16px",fontFamily:"'JetBrains Mono','Fira Code',Consolas,monospace"}}>
                      {sec.fileTree.map((ft,fi)=>{
                        const depth = (ft.path.match(/\//g)||[]).length - 1;
                        const isDir = ft.type === "dir";
                        const isLast = fi === sec.fileTree.length - 1 || sec.fileTree[fi+1].path.split("/").length < ft.path.split("/").length;
                        const indent = depth > 0 ? depth * 16 : 0;
                        return (
                          <div key={ft.path} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:5,paddingLeft:indent}}>
                            <span style={{flexShrink:0,color:"#3d4460",fontSize:11,marginTop:1}}>{isDir ? "📂" : "📄"}</span>
                            <div style={{flex:1,minWidth:0}}>
                              <code style={{fontSize:11.5,color: isDir ? "#fbbf24" : sec.color,fontWeight: isDir ? 700 : 500}}>{ft.path.split("/").pop()}{isDir ? "/" : ""}</code>
                              <span style={{fontSize:11,color:"#5c6480",marginLeft:10}}>{ft.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Numbered steps */}
                  <div>
                    <div style={{fontSize:10,fontWeight:800,color:"#5c6480",letterSpacing:"0.1em",marginBottom:12}}>⚡ IMPLEMENTATION STEPS</div>
                    <div style={{display:"flex",flexDirection:"column",gap:20}}>
                      {sec.steps.map((step, si)=>(
                        <div key={step.n} style={{borderRadius:10,background:"#0d0f1a",border:`1px solid ${sec.color}20`,overflow:"hidden"}}>

                          {/* Step header row */}
                          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:`${sec.color}06`,borderBottom:`1px solid ${sec.color}15`,flexWrap:"wrap"}}>
                            {/* Step number badge */}
                            <div style={{
                              width:28,height:28,borderRadius:7,flexShrink:0,
                              background:`${sec.color}20`,border:`1px solid ${sec.color}45`,
                              color:sec.color,fontSize:12,fontWeight:800,
                              display:"flex",alignItems:"center",justifyContent:"center",
                            }}>{step.n}</div>
                            {/* Action badge */}
                            <span style={{
                              fontSize:9,fontWeight:800,padding:"2px 8px",borderRadius:10,flexShrink:0,
                              background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.3)",color:"#fbbf24",
                              textTransform:"uppercase",letterSpacing:"0.07em",
                            }}>{step.action}</span>
                            {/* Title */}
                            <span style={{fontSize:14,fontWeight:700,color:"#eaedf8",flex:1}}>{step.title}</span>
                            {/* File pill */}
                            <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:"rgba(255,255,255,0.04)",border:"1px solid #252840",flexShrink:0}}>
                              <span style={{fontSize:9,color:"#6b7499"}}>📄</span>
                              <code style={{fontSize:10,color:sec.color,fontWeight:600}}>{step.file}</code>
                            </div>
                            {/* Folder pill */}
                            <div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:"rgba(255,255,255,0.04)",border:"1px solid #252840",flexShrink:0}}>
                              <span style={{fontSize:9,color:"#6b7499"}}>📁</span>
                              <code style={{fontSize:10,color:"#fbbf24",fontWeight:600}}>{step.folder}</code>
                            </div>
                          </div>

                          {/* Description */}
                          <div style={{padding:"12px 16px 0"}}>
                            <p style={{fontSize:13,color:"#9aa3c0",lineHeight:1.72,margin:0}}>{step.desc}</p>
                          </div>

                          {/* Code block */}
                          <div style={{margin:"12px 16px",borderRadius:8,background:"#0a0c15",border:"1px solid #1a1d2e",overflow:"hidden"}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",background:"#0d0f1a",borderBottom:"1px solid #1a1d2e"}}>
                              <span style={{fontSize:10,color:sec.color,fontFamily:"monospace",fontWeight:600}}>{step.file}</span>
                              <button
                                onClick={()=>navigator.clipboard.writeText(step.code)}
                                aria-label={`Copy code for step ${step.n}`}
                                style={{display:"flex",alignItems:"center",gap:4,padding:"2px 7px",borderRadius:4,fontSize:10,background:`${sec.color}15`,border:`1px solid ${sec.color}35`,color:sec.color,cursor:"pointer"}}
                              ><Copy size={9}/>Copy</button>
                            </div>
                            <pre style={{margin:0,padding:"14px 16px",fontSize:11.5,lineHeight:1.75,fontFamily:"'JetBrains Mono','Fira Code',Consolas,monospace",color:"#c9d1f0",overflowX:"auto",whiteSpace:"pre"}}>
                              {step.code.split("\n").map((line,i)=>(
                                <div key={i} style={{display:"flex"}}>
                                  <span style={{width:28,flexShrink:0,color:"#2a2e46",userSelect:"none",textAlign:"right",paddingRight:10,fontSize:10}}>{i+1}</span>
                                  <span dangerouslySetInnerHTML={{__html: highlight(line)||"&nbsp;"}}/>
                                </div>
                              ))}
                            </pre>
                          </div>

                          {/* Note callout */}
                          {step.note && (
                            <div style={{margin:"0 16px 14px",display:"flex",gap:8,alignItems:"flex-start",padding:"9px 12px",borderRadius:7,background:"rgba(232,121,249,0.06)",border:"1px solid rgba(232,121,249,0.2)"}}>
                              <span style={{fontSize:12,flexShrink:0,marginTop:1}}>💡</span>
                              <span style={{fontSize:12,color:"#c084fc",lineHeight:1.65}}>{step.note}</span>
                            </div>
                          )}

                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pro tips */}
                  {sec.tips && sec.tips.length > 0 && (
                    <div style={{padding:"14px 18px",borderRadius:9,background:"rgba(255,255,255,0.02)",border:`1px solid ${sec.color}20`}}>
                      <div style={{fontSize:10,fontWeight:800,color:sec.color,letterSpacing:"0.1em",marginBottom:9}}>🚀 PRO TIPS — {sec.title.toUpperCase()}</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:7}}>
                        {sec.tips.map((tip,ti)=>(
                          <div key={ti} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                            <div style={{width:16,height:16,borderRadius:"50%",flexShrink:0,background:`${sec.color}18`,border:`1px solid ${sec.color}35`,color:sec.color,fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>{ti+1}</div>
                            <span style={{fontSize:12,color:"#9aa3c0",lineHeight:1.65}}>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>

          {/* ── BOTTOM SUMMARY: putting it all together ── */}
          <div style={{marginTop:32,padding:"22px 26px",borderRadius:12,background:"#0a0c15",border:"1px solid rgba(232,121,249,0.2)"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#e879f9",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span>🎯</span> How the 6 Pillars Wire Together
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {[
                {from:"Model Selection",to:"Orchestration",desc:"agentConfig.ts feeds model names into pipeline.ts so each phase uses the right tier.",color:"#4f8ef7"},
                {from:"Knowledge Base",to:"Skills",desc:"retriever.ts is imported by skills — detectAnomaly calls retrieve() to ground its analysis.",color:"#34d399"},
                {from:"Skills",to:"Orchestration",desc:"SkillRegistry.get() is called inside auditWorkflow.ts to run named skills per phase.",color:"#a78bfa"},
                {from:"MCP",to:"Skills",desc:"MCP server exposes skills as tools; Claude calls them via function-calling without code changes.",color:"#38bdf8"},
                {from:"A2A",to:"Orchestration",desc:"A2AClient.sendTask() is used in parallel.ts to delegate sub-tasks to remote agent instances.",color:"#fb923c"},
                {from:"Orchestration",to:"All",desc:"pipeline.ts is the glue — it chains models, skills, knowledge, MCP tools, and A2A agents.",color:"#e879f9"},
              ].map(w=>(
                <div key={w.from} style={{padding:"12px 14px",borderRadius:8,background:"#12141f",border:`1px solid ${w.color}20`}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <code style={{fontSize:11,color:w.color,fontWeight:700}}>{w.from}</code>
                    <span style={{fontSize:10,color:"#3d4460"}}>→</span>
                    <code style={{fontSize:11,color:"#eaedf8",fontWeight:600}}>{w.to}</code>
                  </div>
                  <p style={{fontSize:12,color:"#7d88a8",lineHeight:1.6,margin:0}}>{w.desc}</p>
                </div>
              ))}
            </div>
            <div style={{marginTop:18,padding:"14px 16px",borderRadius:8,background:"rgba(232,121,249,0.06)",border:"1px solid rgba(232,121,249,0.18)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#e879f9",marginBottom:6}}>🧩 Recommended Build Order</div>
              <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:4,fontSize:12,color:"#9aa3c0",fontFamily:"monospace"}}>
                {["1. environment.ts","→","2. models.ts","→","3. knowledge loader","→","4. embedder + retriever","→","5. skills","→","6. pipeline","→","7. MCP server","→","8. A2A server","→","9. auditWorkflow","→","10. deploy"].map((item,i)=>(
                  <span key={i} style={{color: item.startsWith("→") ? "#3d4460" : item.startsWith("10") ? "#e879f9" : "#9aa3c0"}}>{item}</span>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── BEGINNER GUIDE TAB ─────────────────────────────────────────────── */}
      {pageTab === "learn" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"calc(100dvh - 96px)",background:"#0d0f1a",overflowY:"auto",padding:24}}>
          <div style={{maxWidth:860,width:"100%",padding:"36px 40px",borderRadius:16,background:"linear-gradient(135deg,rgba(245,158,11,0.08),rgba(232,121,249,0.06),rgba(79,142,247,0.06))",border:"1px solid rgba(245,158,11,0.25)",textAlign:"center",marginBottom:32}}>
            <div style={{fontSize:48,marginBottom:16}}>🧩</div>
            <h1 style={{fontSize:28,fontWeight:900,color:"#eaedf8",margin:"0 0 10px",letterSpacing:"-0.5px"}}>Zero → Enterprise AI Agent Platform</h1>
            <p style={{fontSize:15,color:"#9aa3c0",lineHeight:1.8,margin:"0 0 24px",maxWidth:640,marginLeft:"auto",marginRight:"auto"}}>
              An immersive, hands-on learning environment. <strong style={{color:"#f59e0b"}}>Drag real LEGO blocks</strong> to design your agent architecture,
              follow <strong style={{color:"#e879f9"}}>12 comprehensive modules</strong> from LLM basics to fine-tuning,
              and use the <strong style={{color:"#34d399"}}>35-step guided builder</strong> to ship a production agent by the end of the session.
            </p>
            <button
              onClick={() => window.open("/learn", "_blank")}
              style={{display:"inline-flex",alignItems:"center",gap:10,padding:"14px 32px",borderRadius:10,fontSize:15,fontWeight:800,cursor:"pointer",background:"linear-gradient(135deg,#f59e0b,#e879f9)",border:"none",color:"#0d0f1a",boxShadow:"0 4px 24px rgba(245,158,11,0.3)"}}
            >🚀 Launch Full Experience →</button>
            <div style={{fontSize:11,color:"#4a5270",marginTop:12}}>Opens in a new tab — full-screen, drag-and-drop enabled</div>
          </div>
          <div style={{maxWidth:860,width:"100%",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
            {[
              {icon:"🧩",color:"#f59e0b",title:"LEGO Canvas",desc:"Drag 40+ AI blocks onto a live canvas and wire them up. Get fully generated TypeScript code, Dockerfile, and CI/CD tailored to your exact stack."},
              {icon:"📚",color:"#a78bfa",title:"12 Deep Modules",desc:"LLM Foundations → RAG → Orchestration → MCP → A2A → Evaluation → Fine-tuning → Monitoring. Each module has code, analogies, stack tables, and quizzes."},
              {icon:"🔨",color:"#34d399",title:"35-Step Builder",desc:"Build a Research Intelligence Agent from zero. Every step has exact terminal commands and full copy-paste file content. Deploy to Vercel by step 35."},
              {icon:"⚡",color:"#38bdf8",title:"Live Code Generation",desc:"Canvas generates package.json, TypeScript sources, .env.example, Dockerfile, and GitHub Actions YAML — tailored to your block selection."},
              {icon:"📊",color:"#fb923c",title:"Evaluation & Fine-tuning",desc:"LLM-as-judge, RAGAS metrics, dataset curation, LoRA/QLoRA fine-tuning, and measuring improvement before and after."},
              {icon:"🏢",color:"#e879f9",title:"Enterprise to Local Stacks",desc:"6 deployment paths: Vercel+Neon, Google Cloud, OpenAI Classic, Full OSS, Local Ollama, Enterprise K8s. Every layer is swappable."},
            ].map((f,i)=>(
              <div key={i} style={{padding:"18px 20px",borderRadius:10,background:"#12141f",border:"1px solid " + f.color + "22"}}>
                <div style={{fontSize:22,marginBottom:8}}>{f.icon}</div>
                <div style={{fontSize:13,fontWeight:800,color:f.color,marginBottom:6}}>{f.title}</div>
                <div style={{fontSize:12,color:"#7d88a8",lineHeight:1.65}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* ── MOBILE: stack 4 panes vertically ── */
        @media (max-width: 900px) {
          .ca-grid {
            display: flex !important;
            flex-direction: column !important;
            height: auto !important;
            overflow: visible !important;
          }
          .ca-pane {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            border-right: none !important;
            border-bottom: 1px solid var(--bd) !important;
          }
          /* File Explorer: compact fixed height */
          .ca-pane:nth-child(1) {
            max-height: 280px;
            overflow-y: auto !important;
          }
          /* Code Viewer */
          .ca-pane:nth-child(2) {
            min-height: 320px;
            max-height: 55vh;
          }
          .ca-pane:nth-child(2) > div:nth-child(2) {
            overflow-y: auto;
            max-height: calc(55vh - 60px);
          }
          /* File Explainer */
          .ca-pane:nth-child(3) {
            min-height: 400px;
          }
          /* Chat */
          .ca-pane:nth-child(4) {
            min-height: 420px;
            max-height: 60vh;
          }
        }

        @media (max-width: 600px) {
          .ca-pane:nth-child(4) { max-height: 70vh; }
        }
      `}</style>
    </>
  );
}
