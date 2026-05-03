"use client";

import React, { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import {
  Code2, FolderOpen, Folder, FileText, ChevronRight, ChevronDown,
  Send, Download, Map, LayoutPanelLeft, Cpu, Sparkles, Bug, BookOpen,
  Copy, Check, Zap, RefreshCw, FileCode2, AlignLeft,
  ArrowRight, Lightbulb, Link2, Layers, MessageSquare, HelpCircle,
  GraduationCap, Network, GitBranch, Shield, Star,
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

// ─── SYNTAX HIGHLIGHT ─────────────────────────────────────────────────────────
function highlight(line: string): string {
  return line
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
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

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function CodeAnalysisPage() {
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
      <div className="ca-grid" style={{
        display:"grid",
        gridTemplateColumns:"220px 1fr 1fr 360px",
        height:"calc(100dvh - 58px)",
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
