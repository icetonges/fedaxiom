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
    { name: "tools", type: "dir", desc: "42 tool directories + shared/utils — each tool is a self-contained module with prompt, schema, execute, and tests", children: [
      { name: "AgentTool",          type: "dir", desc: "15 files — spawn sub-agents, load agent dirs, built-in Explore/Plan agents, fork, swarm" },
      { name: "BashTool",           type: "dir", desc: "18 files — bash execution, timeout, sandbox, shell detection, Windows/macOS/Linux paths" },
      { name: "PowerShellTool",     type: "dir", desc: "14 files — PowerShell execution (Windows), script escaping, output formatting" },
      { name: "FileEditTool",       type: "dir", desc: "6 files  — precise old→new string replacement with uniqueness enforcement" },
      { name: "FileReadTool",       type: "dir", desc: "5 files  — read files with optional offset/limit, line numbers, PDF/notebook support" },
      { name: "FileWriteTool",      type: "dir", desc: "3 files  — write/overwrite full file contents, parent dir creation" },
      { name: "GlobTool",           type: "dir", desc: "3 files  — fast glob pattern matching, mod-time sorted results" },
      { name: "GrepTool",           type: "dir", desc: "3 files  — ripgrep-powered content search with context lines, file type filter" },
      { name: "WebFetchTool",       type: "dir", desc: "5 files  — HTTP fetch with Markdown conversion, robots.txt compliance" },
      { name: "WebSearchTool",      type: "dir", desc: "3 files  — web search via Brave/Google API, result ranking" },
      { name: "TodoWriteTool",      type: "dir", desc: "3 files  — structured task list management, status transitions" },
      { name: "TaskCreateTool",     type: "dir", desc: "3 files  — create background tasks (LocalAgentTask)" },
      { name: "TaskOutputTool",     type: "dir", desc: "2 files  — poll task output file for new bytes" },
      { name: "TaskGetTool",        type: "dir", desc: "3 files  — retrieve a specific task by ID" },
      { name: "TaskListTool",       type: "dir", desc: "3 files  — list all active tasks in the session" },
      { name: "TaskStopTool",       type: "dir", desc: "3 files  — stop/kill a running task by ID" },
      { name: "TaskUpdateTool",     type: "dir", desc: "3 files  — update task metadata or status" },
      { name: "SendMessageTool",    type: "dir", desc: "4 files  — send messages between agents in a team channel" },
      { name: "TeamCreateTool",     type: "dir", desc: "4 files  — create shared team communication channel for multi-agent sessions" },
      { name: "TeamDeleteTool",     type: "dir", desc: "4 files  — delete a team channel and clean up subscribers" },
      { name: "MCPTool",            type: "dir", desc: "4 files  — dynamic MCP protocol tool execution, capability dispatch" },
      { name: "ListMcpResourcesTool", type: "dir", desc: "3 files — list available resources on a connected MCP server" },
      { name: "ReadMcpResourceTool",  type: "dir", desc: "3 files — read the contents of a specific MCP resource" },
      { name: "McpAuthTool",        type: "dir", desc: "1 file   — initiate OAuth auth flow for a MCP server" },
      { name: "SkillTool",          type: "dir", desc: "4 files  — load and execute user-defined skills from .claude/skills/" },
      { name: "ScheduleCronTool",   type: "dir", desc: "5 files  — create/delete/list cron-style recurring tasks" },
      { name: "RemoteTriggerTool",  type: "dir", desc: "3 files  — trigger remote agent sessions programmatically" },
      { name: "EnterWorktreeTool",  type: "dir", desc: "4 files  — switch the session CWD into a git worktree" },
      { name: "ExitWorktreeTool",   type: "dir", desc: "4 files  — exit worktree and restore previous CWD" },
      { name: "EnterPlanModeTool",  type: "dir", desc: "4 files  — enable read-only plan mode (no writes/edits allowed)" },
      { name: "ExitPlanModeTool",   type: "dir", desc: "4 files  — exit plan mode and restore normal permissions" },
      { name: "REPLTool",           type: "dir", desc: "2 files  — interactive REPL mode tool (JS/Python persistent sessions)" },
      { name: "LSPTool",            type: "dir", desc: "6 files  — LSP hover/definition/diagnostics queries for code navigation" },
      { name: "NotebookEditTool",   type: "dir", desc: "4 files  — edit Jupyter notebook cells and metadata" },
      { name: "AskUserQuestionTool",type: "dir", desc: "2 files  — prompt user for clarification before acting" },
      { name: "BriefTool",          type: "dir", desc: "5 files  — generate a concise brief/summary of work done" },
      { name: "ConfigTool",         type: "dir", desc: "5 files  — read/write Claude Code config (~/.claude.json)" },
      { name: "SleepTool",          type: "dir", desc: "1 file   — wait N seconds (used in multi-agent sequencing)" },
      { name: "SyntheticOutputTool",type: "dir", desc: "1 file   — inject synthetic tool output for testing/replay" },
      { name: "ToolSearchTool",     type: "dir", desc: "3 files  — search available tools by keyword for dynamic tool discovery" },
      { name: "shared",             type: "dir", desc: "Shared tool utilities: permission checking, diff formatting, error types" },
      { name: "utils.ts",           type: "file", lines: 120, desc: "Cross-tool helper functions: input sanitization, timeout wrappers" },
    ]},
    { name: "services", type: "dir", desc: "8 service directories — the integration layer between Claude Code and external systems", children: [
      { name: "api", type: "dir", desc: "20 files — Anthropic Claude SDK wrapper: streaming, retry, cost tracking, prompt cache, session ingress", children: [
        { name: "claude.ts",                  type: "file", lines: 3419, desc: "Core streaming API client — handles SSE, token counting, cost attribution, retry logic" },
        { name: "withRetry.ts",               type: "file", lines: 822,  desc: "Retry wrapper with exponential backoff, jitter, and 429/529 rate-limit handling" },
        { name: "logging.ts",                 type: "file", lines: 788,  desc: "API call logging to .claude/logs/ — records full request/response for debugging" },
        { name: "filesApi.ts",                type: "file", lines: 748,  desc: "Files API client — upload/download files for vision and document tool calls" },
        { name: "promptCacheBreakDetection.ts", type: "file", lines: 727, desc: "Detects when prompt cache is broken mid-session and warns the user" },
        { name: "errors.ts",                  type: "file", lines: 1207, desc: "API error hierarchy: RateLimitError, AuthError, NetworkError with recovery guidance" },
        { name: "sessionIngress.ts",          type: "file", lines: 514,  desc: "Session ingress API — bridge session assignment and credential exchange" },
        { name: "client.ts",                  type: "file", lines: 389,  desc: "Thin Anthropic SDK client wrapper: auth header injection, base URL config, TLS" },
        { name: "grove.ts",                   type: "file", lines: 357,  desc: "Grove (Anthropic internal cloud) API client for team billing and session management" },
        { name: "errorUtils.ts",              type: "file", lines: 260,  desc: "Error classification helpers: isRateLimit(), isAuthError(), isNetworkError()" },
        { name: "dumpPrompts.ts",             type: "file", lines: 226,  desc: "Debug utility to dump full prompts to disk when CLAUDE_DEBUG_DUMP_PROMPTS=1" },
        { name: "bootstrap.ts",               type: "file", lines: 141,  desc: "API service bootstrap: validate credentials, test connection, set base URL" },
        { name: "adminRequests.ts",           type: "file", lines: 119,  desc: "Internal admin API requests for Anthropic team features" },
        { name: "overageCreditGrant.ts",      type: "file", lines: 137,  desc: "Handles auto-grant of overage credits when usage limit is reached" },
        { name: "referral.ts",                type: "file", lines: 281,  desc: "Referral code redemption and affiliate tracking API client" },
        { name: "metricsOptOut.ts",           type: "file", lines: 159,  desc: "Checks user's telemetry opt-out preference before sending any metrics" },
        { name: "usage.ts",                   type: "file", lines: 63,   desc: "Fetches usage stats (tokens, cost) from the billing API" },
        { name: "ultrareviewQuota.ts",        type: "file", lines: 38,   desc: "Checks remaining ultrareview quota before running a code review" },
        { name: "firstTokenDate.ts",          type: "file", lines: 60,   desc: "Records the date of the user's first API token consumption" },
        { name: "emptyUsage.ts",              type: "file", lines: 22,   desc: "Empty ModelUsage constant for tool calls that don't consume tokens" },
      ]},
      { name: "mcp", type: "dir", desc: "22 files — full MCP client: OAuth, dynamic tool registration, multi-server management, SSE transport", children: [
        { name: "client.ts",               type: "file", lines: 3348, desc: "MCP protocol client — connects, authenticates, discovers tools, executes them" },
        { name: "auth.ts",                 type: "file", lines: 2465, desc: "MCP OAuth 2.0 flow — browser-based auth with PKCE, token storage, refresh" },
        { name: "config.ts",               type: "file", lines: 1578, desc: "MCP server configuration management — discovery, persistence, validation" },
        { name: "useManageMCPConnections.ts", type: "file", lines: 1141, desc: "React hook managing the full MCP connection lifecycle in the UI" },
        { name: "xaa.ts",                  type: "file", lines: 511,  desc: "XAA (Anthropic's official MCP registry) integration — search, install, uninstall" },
        { name: "xaaIdpLogin.ts",          type: "file", lines: 487,  desc: "XAA identity provider login — authenticates with the MCP registry" },
        { name: "utils.ts",                type: "file", lines: 575,  desc: "MCP utility functions: tool name normalisation, result formatting, error mapping" },
        { name: "elicitationHandler.ts",   type: "file", lines: 313,  desc: "Handles MCP elicitation (follow-up question) requests from MCP servers" },
        { name: "channelNotification.ts",  type: "file", lines: 316,  desc: "MCP server notification routing — broadcasts server events to subscribers" },
        { name: "channelPermissions.ts",   type: "file", lines: 240,  desc: "Per-channel permission rules for MCP tool calls" },
        { name: "types.ts",                type: "file", lines: 258,  desc: "MCP type definitions: MCPServerConnection, ConnectedMCPServer, MCPTool" },
        { name: "SdkControlTransport.ts",  type: "file", lines: 136,  desc: "In-process transport for SDK-mode MCP servers (no network)" },
        { name: "claudeai.ts",             type: "file", lines: 164,  desc: "Claude.ai workspace MCP server integration" },
        { name: "headersHelper.ts",        type: "file", lines: 138,  desc: "MCP request header construction: auth, content-type, trace IDs" },
        { name: "MCPConnectionManager.tsx", type: "file", lines: 72,   desc: "React component managing MCP connection status display" },
      ]},
      { name: "analytics", type: "dir", desc: "9 files — GrowthBook feature flags, first-party event logging, Datadog telemetry, opt-out", children: [
        { name: "growthbook.ts",                    type: "file", lines: 1155, desc: "GrowthBook SDK wrapper — feature flags, A/B experiments, live config updates" },
        { name: "metadata.ts",                      type: "file", lines: 973,  desc: "Session and user metadata attached to all telemetry events" },
        { name: "firstPartyEventLoggingExporter.ts", type: "file", lines: 806, desc: "OpenTelemetry exporter that sends first-party events to Anthropic's analytics pipeline" },
        { name: "firstPartyEventLogger.ts",         type: "file", lines: 449,  desc: "Typed event logger: logs tool calls, session starts, errors with structured fields" },
        { name: "datadog.ts",                       type: "file", lines: 307,  desc: "Datadog metrics integration for performance monitoring (Ant-internal)" },
        { name: "index.ts",                         type: "file", lines: 173,  desc: "Analytics service init — bootstraps GrowthBook, sets up exporters, checks opt-out" },
        { name: "sink.ts",                          type: "file", lines: 114,  desc: "Analytics event sink — buffers events and flushes them periodically" },
        { name: "config.ts",                        type: "file", lines: 38,   desc: "Analytics configuration: endpoint URLs, flush intervals, sampling rates" },
        { name: "sinkKillswitch.ts",                type: "file", lines: 25,   desc: "Emergency killswitch to disable all analytics sinks at runtime" },
      ]},
      { name: "compact", type: "dir", desc: "11 files — conversation compaction: auto-compact, micro-compact, session memory consolidation", children: [
        { name: "compact.ts",            type: "file", lines: 1705, desc: "Full compaction: summarises conversation history to free context window space" },
        { name: "sessionMemoryCompact.ts", type: "file", lines: 630, desc: "Session memory compaction — distils long sessions into persistent memory entries" },
        { name: "microCompact.ts",       type: "file", lines: 530,  desc: "Micro-compaction: lightweight per-turn message collapsing without LLM call" },
        { name: "autoCompact.ts",        type: "file", lines: 351,  desc: "Auto-compact trigger: monitors context usage and fires compaction at threshold" },
        { name: "prompt.ts",             type: "file", lines: 374,  desc: "Compaction prompt templates — instructs the LLM how to summarise history" },
        { name: "apiMicrocompact.ts",    type: "file", lines: 153,  desc: "API-side micro-compaction for remote sessions" },
        { name: "grouping.ts",           type: "file", lines: 63,   desc: "Groups related messages (tool call + result pairs) before compaction" },
        { name: "postCompactCleanup.ts", type: "file", lines: 77,   desc: "Cleans up AppState after compaction: resets scroll, updates cost display" },
        { name: "timeBasedMCConfig.ts",  type: "file", lines: 43,   desc: "Time-based micro-compact configuration (compact after N minutes idle)" },
      ]},
      { name: "lsp", type: "dir", desc: "7 files — Language Server Protocol client: hover, diagnostics, definition, auto-start", children: [
        { name: "LSPServerInstance.ts",     type: "file", lines: 511, desc: "Manages a single LSP server process: start, restart, send requests, handle responses" },
        { name: "LSPServerManager.ts",      type: "file", lines: 420, desc: "Multi-language LSP manager — discovers and starts the right LSP for each file type" },
        { name: "LSPClient.ts",             type: "file", lines: 447, desc: "LSP JSON-RPC client — sends hover/definition/diagnostic requests to language servers" },
        { name: "LSPDiagnosticRegistry.ts", type: "file", lines: 386, desc: "Caches and queries LSP diagnostics (errors, warnings) for files in the session" },
        { name: "passiveFeedback.ts",       type: "file", lines: 328, desc: "Passively collects LSP feedback (errors before/after edits) for quality metrics" },
        { name: "manager.ts",               type: "file", lines: 289, desc: "Top-level LSP service: initialise, route requests, aggregate results" },
        { name: "config.ts",                type: "file", lines: 79,  desc: "LSP server configuration per language: command, args, file extensions" },
      ]},
      { name: "oauth", type: "dir", desc: "5 files — OAuth 2.0 with PKCE for Console login and API key auth", children: [
        { name: "client.ts",             type: "file", lines: 566, desc: "OAuth 2.0 client with PKCE: auth code exchange, token refresh, revocation" },
        { name: "auth-code-listener.ts", type: "file", lines: 211, desc: "Local HTTP server that listens for the OAuth redirect callback on localhost" },
        { name: "index.ts",              type: "file", lines: 198, desc: "OAuth service entry point: initiates flow, stores tokens, exports getAccessToken()" },
        { name: "getOauthProfile.ts",    type: "file", lines: 53,  desc: "Fetches user profile (email, name) from the OAuth userinfo endpoint" },
        { name: "crypto.ts",             type: "file", lines: 23,  desc: "PKCE code verifier/challenge generation using Web Crypto API" },
      ]},
      { name: "plugins", type: "dir", desc: "3 files — plugin lifecycle: install, validate, sandbox, execute built-in and third-party plugins", children: [
        { name: "pluginOperations.ts",    type: "file", lines: 1088, desc: "Full plugin lifecycle: discover, download, verify signature, install, activate, uninstall" },
        { name: "pluginCliCommands.ts",   type: "file", lines: 344,  desc: "CLI commands for plugin management: /plugin install, list, remove, update" },
        { name: "PluginInstallationManager.ts", type: "file", lines: 184, desc: "UI component managing plugin installation progress with status updates" },
      ]},
      { name: "autoDream", type: "dir", desc: "4 files — background memory consolidation: DreamTask that distils session facts into MEMORY.md", children: [
        { name: "autoDream.ts",          type: "file", lines: 324, desc: "DreamTask: runs after each session, extracts key facts via LLM, appends to MEMORY.md" },
        { name: "consolidationLock.ts",  type: "file", lines: 140, desc: "File-level lock preventing concurrent dream consolidations from corrupting MEMORY.md" },
        { name: "consolidationPrompt.ts",type: "file", lines: 65,  desc: "Prompt template instructing Claude to extract memorable facts from session history" },
        { name: "config.ts",             type: "file", lines: 21,  desc: "autoDream configuration: min session length, max facts per run, schedule" },
      ]},
    ]},
    { name: "bridge", type: "dir", desc: "Remote Control bridge — 31 files, SSE+HTTP+JWT, session tunneling & transport", children: [
      { name: "bridgeMain.ts",              type: "file", lines: 2809, desc: "Main bridge core orchestrator — poll loops, session lifecycle, transport management" },
      { name: "replBridge.ts",              type: "file", lines: 2267, desc: "REPL bridge implementation — session lifecycle, transport mgmt, message handling" },
      { name: "remoteBridgeCore.ts",        type: "file", lines: 958,  desc: "Env-less Remote Control bridge, connects directly to session-ingress (no Environments API)" },
      { name: "initReplBridge.ts",          type: "file", lines: 545,  desc: "REPL-specific wrapper around initBridgeCore — reads bootstrap state and delegates" },
      { name: "sessionRunner.ts",           type: "file", lines: 512,  desc: "Spawns child processes for session execution with activity tracking & error logging" },
      { name: "bridgeApi.ts",               type: "file", lines: 482,  desc: "HTTP client for bridge API — error handling, token refresh, CCR communication" },
      { name: "bridgeUI.ts",                type: "file", lines: 467,  desc: "Terminal UI for bridge status — QR codes, footer text, connect/session URLs" },
      { name: "bridgeMessaging.ts",         type: "file", lines: 423,  desc: "Transport-layer helpers — bridge message handling, ingress parsing, control requests" },
      { name: "ContextVisualization.tsx",   type: "file", lines: 486,  desc: "Visualization of context items with filtering, expansion, and token counting (shared)" },
      { name: "createSession.ts",           type: "file", lines: 348,  desc: "Session creation with git source resolution and outcome handling" },
      { name: "replBridgeTransport.ts",     type: "file", lines: 360,  desc: "Transport abstraction — v1 (HybridTransport) and v2 (SSE+CCRClient) protocols" },
      { name: "trustedDevice.ts",           type: "file", lines: 197,  desc: "Trusted device token source for elevated-security bridge sessions via secure storage" },
      { name: "bridgeEnabled.ts",           type: "file", lines: 193,  desc: "Runtime check for bridge mode entitlement based on subscription + feature flags" },
      { name: "envLessBridgeConfig.ts",     type: "file", lines: 159,  desc: "Configuration schema for env-less bridge — retry, timeout, and dedup settings" },
      { name: "inboundAttachments.ts",      type: "file", lines: 159,  desc: "Resolves file_uuid attachments on inbound bridge messages via OAuth-authed file API" },
      { name: "codeSessionApi.ts",          type: "file", lines: 158,  desc: "Thin HTTP wrappers for CCR v2 code-session API (createSession, fetchCredentials)" },
      { name: "bridgeDebug.ts",             type: "file", lines: 124,  desc: "Ant-only fault injection for manually testing bridge recovery paths & failure modes" },
      { name: "workSecret.ts",              type: "file", lines: 122,  desc: "Work secret decoding and validation for base64url-encoded session credentials" },
      { name: "pollConfig.ts",              type: "file", lines: 108,  desc: "Zod schema for bridge poll interval configuration with GrowthBook live tuning" },
      { name: "bridgeStatusUtil.ts",        type: "file", lines: 144,  desc: "Status state machine & UI formatting utilities for bridge connection status display" },
      { name: "debugUtils.ts",              type: "file", lines: 130,  desc: "Debug logging utilities with secret field redaction & structured message truncation" },
      { name: "jwtUtils.ts",                type: "file", lines: 231,  desc: "JWT payload decoding & duration formatting utilities for bridge auth tokens" },
      { name: "types.ts",                   type: "file", lines: 242,  desc: "TypeScript interface defs for bridge protocols, work data, session handles, config" },
      { name: "inboundMessages.ts",         type: "file", lines: 74,   desc: "Processes inbound user messages — extracts content & normalises image blocks" },
      { name: "bridgePointer.ts",           type: "file", lines: 192,  desc: "Disk-persisted pointer utility for tracking worktree state across runs" },
      { name: "sessionIdCompat.ts",         type: "file", lines: 53,   desc: "Session ID tag translation helpers for CCR v2 compat layer with CSE shim gating" },
      { name: "capacityWake.ts",            type: "file", lines: 50,   desc: "Capacity-wake primitive for bridge poll loops — signal merging & early wakeup" },
      { name: "bridgePermissionCallbacks.ts", type: "file", lines: 39, desc: "Type defs & callback handlers for bridge permission request/response flow" },
      { name: "replBridgeHandle.ts",        type: "file", lines: 31,   desc: "Global pointer to active REPL bridge handle for tools/commands to invoke bridge" },
      { name: "bridgeConfig.ts",            type: "file", lines: 43,   desc: "Shared bridge auth/URL resolution with Ant-only dev overrides for OAuth tokens" },
      { name: "flushGate.ts",               type: "file", lines: 64,   desc: "State machine gating message writes during initial flush to prevent interleaved arrival" },
      { name: "pollConfigDefaults.ts",      type: "file", lines: 77,   desc: "Bridge poll interval constants for seek-work and at-capacity states" },
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
    { name: "components", type: "dir", desc: "141 React/Ink terminal UI components + 32 subdirectories (354 more files)", children: [
      { name: "agents",          type: "dir", desc: "26 files — agent spawning UI, progress lines, swarm status, coordinator view" },
      { name: "messages",        type: "dir", desc: "41 files — all message content block renderers: text, tool use, images, diffs" },
      { name: "permissions",     type: "dir", desc: "51 files — permission request dialogs, allow/deny UI, rule editors" },
      { name: "PromptInput",     type: "dir", desc: "21 files — multi-line input, typeahead popup, ghost text, mode indicators" },
      { name: "Spinner",         type: "dir", desc: "12 files — animated spinner variants for different operation types" },
      { name: "tasks",           type: "dir", desc: "12 files — TodoWrite task list display, completion tracking, reordering" },
      { name: "mcp",             type: "dir", desc: "13 files — MCP server connection dialogs, tool approval, capability display" },
      { name: "design-system",   type: "dir", desc: "16 files — base design tokens, colour palette, typography, box primitives" },
      { name: "FeedbackSurvey",  type: "dir", desc: "9 files — in-app feedback surveys, NPS, thumbs up/down widgets" },
      { name: "LogoV2",          type: "dir", desc: "15 files — Claude brand logo in ASCII/Unicode, animated variants" },
      { name: "CustomSelect",    type: "dir", desc: "10 files — keyboard-navigable select dropdown components" },
      { name: "sandbox",         type: "dir", desc: "5 files — sandbox violation display, constraint warning banners" },
      { name: "wizard",          type: "dir", desc: "5 files — multi-step setup wizard flow components" },
      { name: "diff",            type: "dir", desc: "3 files — side-by-side and unified diff view renderers" },
      { name: "teams",           type: "dir", desc: "2 files — multi-agent teammate list and team status header" },
      { name: "memory",          type: "dir", desc: "2 files — memory usage indicator, MEMORY.md preview widget" },
      { name: "TrustDialog",     type: "dir", desc: "2 files — first-run user trust/consent dialog components" },
      { name: "StructuredDiff",  type: "dir", desc: "2 files — structured diff rendering for JSON/YAML changes" },
      { name: "hooks",           type: "dir", desc: "6 files — component-level hooks: useFocus, useScrollPosition, etc." },
      { name: "Settings",        type: "dir", desc: "4 files — settings screen UI, keybinding editor, theme selector" },
      { name: "shell",           type: "dir", desc: "4 files — shell command output rendering, stderr/stdout display" },
      { name: "HelpV2",          type: "dir", desc: "3 files — help screen with command reference and keyboard shortcuts" },
      { name: "ui",              type: "dir", desc: "3 files — shared low-level UI primitives (Box, Text wrappers)" },
      { name: "skills",          type: "dir", desc: "1 file  — skill execution result display component" },
      { name: "grove",           type: "dir", desc: "1 file  — Grove (Anthropic internal cloud) integration widget" },
      { name: "Passes",          type: "dir", desc: "1 file  — subscription plan badge display" },
      { name: "DesktopUpsell",   type: "dir", desc: "1 file  — desktop app upsell prompt for web users" },
      { name: "HighlightedCode", type: "dir", desc: "1 file  — async syntax highlighting worker bridge" },
      { name: "ClaudeCodeHint",  type: "dir", desc: "1 file  — inline hint component for Claude Code feature callouts" },
      { name: "LspRecommendation",type:"dir", desc: "1 file  — LSP install recommendation banner" },
      { name: "ManagedSettingsSecurityDialog", type: "dir", desc: "2 files — MDM-managed settings security alert dialog" },
      // ── Top-level component files ──────────────────────────────────────────
      { name: "Messages.tsx",               type: "file", lines: 807,  desc: "Main messages container — message list, scrolling, interactions" },
      { name: "VirtualMessageList.tsx",     type: "file", lines: 1058, desc: "Virtual scrolling list for efficient large transcript rendering" },
      { name: "Stats.tsx",                  type: "file", lines: 1183, desc: "Comprehensive statistics view — charts, token usage, performance metrics" },
      { name: "ScrollKeybindingHandler.tsx",type: "file", lines: 984,  desc: "Keyboard handler for scroll — selection, copy-on-select, focus mgmt" },
      { name: "LogSelector.tsx",            type: "file", lines: 1565, desc: "Complex dialog for browsing session logs with search & filter" },
      { name: "Message.tsx",                type: "file", lines: 626,  desc: "Core message renderer — all message types and content blocks" },
      { name: "FullscreenLayout.tsx",       type: "file", lines: 626,  desc: "Main fullscreen layout — modal pane, scroll chrome, transcript" },
      { name: "ConsoleOAuthFlow.tsx",       type: "file", lines: 623,  desc: "Full OAuth authentication flow UI for terminal-based login" },
      { name: "Spinner.tsx",                type: "file", lines: 541,  desc: "Animated spinner component with various styles and states" },
      { name: "Feedback.tsx",               type: "file", lines: 560,  desc: "Comprehensive feedback dialog with survey and transcript sharing" },
      { name: "MessageSelector.tsx",        type: "file", lines: 814,  desc: "Component for selecting and filtering messages with keyboard nav" },
      { name: "ModelPicker.tsx",            type: "file", lines: 448,  desc: "Model selection dialog with effort level and fast mode controls" },
      { name: "messageActions.tsx",         type: "file", lines: 443,  desc: "Message action handlers — copy, share, retry with state management" },
      { name: "BridgeDialog.tsx",           type: "file", lines: 401,  desc: "Remote Control bridge setup dialog with session info and URL display" },
      { name: "MessageRow.tsx",             type: "file", lines: 370,  desc: "Single row/message display with selection and action menu" },
      { name: "ThemePicker.tsx",            type: "file", lines: 333,  desc: "Dialog for selecting colour theme with live preview" },
      { name: "GlobalSearchDialog.tsx",     type: "file", lines: 341,  desc: "Global search dialog for finding messages across transcript" },
      { name: "RemoteEnvironmentDialog.tsx",type: "file", lines: 340,  desc: "Dialog for managing remote environment configuration" },
      { name: "ResumeTask.tsx",             type: "file", lines: 253,  desc: "Component for resuming paused/interrupted tasks" },
      { name: "CoordinatorAgentStatus.tsx", type: "file", lines: 269,  desc: "Status display for coordinator agent runs and progress" },
      { name: "Onboarding.tsx",             type: "file", lines: 242,  desc: "Initial onboarding flow for new users" },
      { name: "QuickOpenDialog.tsx",        type: "file", lines: 243,  desc: "Quick file open dialog with search and recent items" },
      { name: "WorktreeExitDialog.tsx",     type: "file", lines: 228,  desc: "Dialog for confirming worktree exit with state preservation" },
      { name: "MarkdownTable.tsx",          type: "file", lines: 291,  desc: "Table renderer for Markdown with column formatting" },
      { name: "TaskListV2.tsx",             type: "file", lines: 371,  desc: "Task list display with completion state and management" },
      { name: "EffortCallout.tsx",          type: "file", lines: 260,  desc: "Callout explaining effort/thinking modes with examples" },
      { name: "HighlightedCode.tsx",        type: "file", lines: 190,  desc: "Code block with syntax highlighting via CLI highlight service" },
      { name: "StructuredDiff.tsx",         type: "file", lines: 186,  desc: "Diff display for structured/formatted content" },
      { name: "DesktopHandoff.tsx",         type: "file", lines: 193,  desc: "Component handling handoff from web to desktop Claude Code" },
      { name: "NativeAutoUpdater.tsx",      type: "file", lines: 186,  desc: "Native app auto-update handler for desktop platforms" },
      { name: "FileEditToolDiff.tsx",       type: "file", lines: 180,  desc: "Diff display for file edit tool operations" },
      { name: "AutoUpdater.tsx",            type: "file", lines: 189,  desc: "Auto-update manager — periodic package update checks & install" },
      { name: "Markdown.tsx",               type: "file", lines: 226,  desc: "Markdown renderer with token caching and lazy syntax highlighting" },
      { name: "StatusLine.tsx",             type: "file", lines: 310,  desc: "Status bar displaying connection, tokens, model, and indicators" },
      { name: "AgentProgressLine.tsx",      type: "file", lines: 136,  desc: "Agent execution progress — type, description, tool count, tokens" },
      { name: "FileEditToolUpdatedMessage.tsx", type: "file", lines: 124, desc: "Message displayed when files are updated via edit tool" },
      { name: "FileEditToolUseRejectedMessage.tsx", type: "file", lines: 170, desc: "Message for rejected file edit with fallback options" },
      { name: "TokenWarning.tsx",           type: "file", lines: 178,  desc: "Warning component for token limit/usage alerts" },
      { name: "FallbackToolUseErrorMessage.tsx", type: "file", lines: 116, desc: "Error message display for tool use failures" },
      { name: "ApproveApiKey.tsx",          type: "file", lines: 123,  desc: "Dialog for user approval of API key usage" },
      { name: "AutoModeOptInDialog.tsx",    type: "file", lines: 141,  desc: "Dialog for opting into automatic mode with consent confirmation" },
      { name: "MCPServerApprovalDialog.tsx",type: "file", lines: 115,  desc: "Dialog for approving MCP server connections" },
      { name: "MCPServerDesktopImportDialog.tsx", type: "file", lines: 203, desc: "Dialog for importing MCP servers from desktop config" },
      { name: "MCPServerMultiselectDialog.tsx", type: "file", lines: 133, desc: "Multiselect dialog for choosing MCP servers" },
      { name: "IdeAutoConnectDialog.tsx",   type: "file", lines: 154,  desc: "Dialog prompting IDE auto-connect configuration" },
      { name: "IdeOnboardingDialog.tsx",    type: "file", lines: 167,  desc: "Onboarding flow for IDE integration setup" },
      { name: "ClaudeInChromeOnboarding.tsx", type: "file", lines: 121, desc: "Onboarding for Claude in Chrome extension setup & connection" },
      { name: "ClaudeMdExternalIncludesDialog.tsx", type: "file", lines: 137, desc: "Dialog for CLAUDE.md external file includes with path resolution" },
      { name: "ContextVisualization.tsx",   type: "file", lines: 486,  desc: "Visualization of context items with filtering, expansion, token count" },
      { name: "SessionPreview.tsx",         type: "file", lines: 194,  desc: "Preview of session information and metadata" },
      { name: "BaseTextInput.tsx",          type: "file", lines: 135,  desc: "Base text input component with shared input handling" },
      { name: "TextInput.tsx",              type: "file", lines: 117,  desc: "Text input component with validation and styling" },
      { name: "VimTextInput.tsx",           type: "file", lines: 140,  desc: "Text input with Vim keybinding support" },
      { name: "CompactSummary.tsx",         type: "file", lines: 118,  desc: "Compact message summary for condensed transcript view" },
      { name: "HistorySearchDialog.tsx",    type: "file", lines: 118,  desc: "Dialog for searching and navigating transcript history" },
      { name: "IdleReturnDialog.tsx",       type: "file", lines: 118,  desc: "Dialog confirming return from idle state" },
      { name: "InvalidConfigDialog.tsx",    type: "file", lines: 154,  desc: "Error dialog for invalid configuration files" },
      { name: "InvalidSettingsDialog.tsx",  type: "file", lines: 88,   desc: "Error dialog for invalid settings" },
      { name: "DiagnosticsDisplay.tsx",     type: "file", lines: 95,   desc: "Display diagnostics and system health information" },
      { name: "ValidationErrorsList.tsx",   type: "file", lines: 143,  desc: "List display of validation errors with context" },
      { name: "SkillImprovementSurvey.tsx", type: "file", lines: 151,  desc: "Survey component for skill improvement feedback" },
      { name: "ThinkingToggle.tsx",         type: "file", lines: 153,  desc: "Toggle control for thinking/effort mode" },
      { name: "App.tsx",                    type: "file", lines: 55,   desc: "Top-level wrapper providing FPS metrics, stats context, AppState" },
      { name: "OutputStylePicker.tsx",      type: "file", lines: 112,  desc: "Dialog for selecting output display style" },
      { name: "ExportDialog.tsx",           type: "file", lines: 124,  desc: "Dialog for exporting transcript with format options" },
      { name: "ShowInIDEPrompt.tsx",        type: "file", lines: 170,  desc: "Prompt to open file/location in IDE from current message" },
      { name: "WorkflowMultiselectDialog.tsx", type: "file", lines: 128, desc: "Multiselect dialog for choosing workflows" },
      { name: "TagTabs.tsx",                type: "file", lines: 127,  desc: "Tab component with filtering and selection" },
      { name: "TeleportProgress.tsx",       type: "file", lines: 139,  desc: "Progress indicator for teleport operations" },
      { name: "TeleportResumeWrapper.tsx",  type: "file", lines: 166,  desc: "Wrapper component for resuming teleport operations" },
      { name: "TeleportError.tsx",          type: "file", lines: 187,  desc: "Error display component for teleport operations" },
      { name: "TeleportRepoMismatchDialog.tsx", type: "file", lines: 104, desc: "Dialog alerting to repository mismatch during teleport" },
      { name: "TeleportStash.tsx",          type: "file", lines: 112,  desc: "Component displaying teleport stash information" },
      { name: "RemoteCallout.tsx",          type: "file", lines: 74,   desc: "Callout component for Remote Control information" },
      { name: "SearchBox.tsx",              type: "file", lines: 72,   desc: "Search input component with focus handling" },
      { name: "PrBadge.tsx",                type: "file", lines: 97,   desc: "Badge component displaying PR information" },
      { name: "LanguagePicker.tsx",         type: "file", lines: 86,   desc: "Component for selecting preferred language" },
      { name: "BypassPermissionsModeDialog.tsx", type: "file", lines: 87, desc: "Dialog requesting user confirmation to bypass permission checks" },
      { name: "ChannelDowngradeDialog.tsx", type: "file", lines: 101,  desc: "Notification dialog for channel downgrade with migration guidance" },
      { name: "DevChannelsDialog.tsx",      type: "file", lines: 105,  desc: "Dialog for selecting development channels (canary, beta, stable)" },
      { name: "KeybindingWarnings.tsx",     type: "file", lines: 54,   desc: "Warnings display for keybinding conflicts or issues" },
      { name: "CostThresholdDialog.tsx",    type: "file", lines: 50,   desc: "Dialog for cost threshold warnings and limits" },
      { name: "ContextSuggestions.tsx",     type: "file", lines: 47,   desc: "Component displaying suggested context files or resources" },
      { name: "ConfigurableShortcutHint.tsx", type: "file", lines: 56, desc: "Keyboard shortcut hint displaying bound keybinding or fallback" },
      { name: "DevBar.tsx",                 type: "file", lines: 48,   desc: "Development bar for internal debugging and feature testing" },
      { name: "EffortIndicator.ts",         type: "file", lines: 40,   desc: "Effort level indicator symbols and styling definitions" },
      { name: "FastIcon.tsx",               type: "file", lines: 46,   desc: "Icon component for fast mode indicator" },
      { name: "FilePathLink.tsx",           type: "file", lines: 42,   desc: "Clickable file path component that opens files in IDE" },
      { name: "OffscreenFreeze.tsx",        type: "file", lines: 42,   desc: "Component preventing offscreen rendering / memory leaks" },
      { name: "CtrlOToExpand.tsx",          type: "file", lines: 50,   desc: "Hint text directing user to press Ctrl+O to expand content" },
      { name: "ToolUseLoader.tsx",          type: "file", lines: 42,   desc: "Loading indicator for tool use execution" },
      { name: "MessageTimestamp.tsx",       type: "file", lines: 63,   desc: "Formatted message timestamp display" },
      { name: "MessageModel.tsx",           type: "file", lines: 43,   desc: "Model name display component for messages" },
      { name: "MessageResponse.tsx",        type: "file", lines: 77,   desc: "Response message wrapper component" },
      { name: "TeammateViewHeader.tsx",     type: "file", lines: 81,   desc: "Header for teammate view display in multi-agent sessions" },
      { name: "IdeStatusIndicator.tsx",     type: "file", lines: 58,   desc: "Status indicator for IDE connection state" },
      { name: "StatusNotices.tsx",          type: "file", lines: 54,   desc: "Component for displaying status notices and alerts" },
      { name: "BashModeProgress.tsx",       type: "file", lines: 56,   desc: "Progress indicator for bash mode execution" },
      { name: "MemoryUsageIndicator.tsx",   type: "file", lines: 35,   desc: "Display of memory usage metrics" },
      { name: "StructuredDiffList.tsx",     type: "file", lines: 29,   desc: "List container for multiple structured diffs" },
      { name: "AutoUpdaterWrapper.tsx",     type: "file", lines: 91,   desc: "Wrapper that conditionally renders AutoUpdater based on platform" },
      { name: "AwsAuthStatusBox.tsx",       type: "file", lines: 82,   desc: "Status box displaying AWS authentication state" },
      { name: "ClickableImageRef.tsx",      type: "file", lines: 72,   desc: "Image reference component with click-to-open functionality" },
      { name: "SessionBackgroundHint.tsx",  type: "file", lines: 107,  desc: "Hint about background session operations" },
      { name: "SandboxViolationExpandedView.tsx", type: "file", lines: 98, desc: "Expanded view of sandbox constraint violations" },
      { name: "PackageManagerAutoUpdater.tsx", type: "file", lines: 104, desc: "Auto-update handler for npm/package-manager installs" },
      { name: "NotebookEditToolUseRejectedMessage.tsx", type: "file", lines: 92, desc: "Message for rejected notebook edit tool use" },
      { name: "FallbackToolUseRejectedMessage.tsx", type: "file", lines: 16, desc: "Simple message for rejected tool use operations" },
      { name: "ExitFlow.tsx",               type: "file", lines: 48,   desc: "Exit confirmation flow with cleanup messaging" },
      { name: "InterruptedByUser.tsx",      type: "file", lines: 15,   desc: "Simple message for user-interrupted operations" },
      { name: "PressEnterToContinue.tsx",   type: "file", lines: 15,   desc: "Simple prompt to press Enter to continue" },
      { name: "SentryErrorBoundary.ts",     type: "file", lines: 22,   desc: "Error boundary wrapper for Sentry error reporting" },
    ]},
    { name: "utils", type: "dir", desc: "200+ utility modules across 20 domains — the shared library powering every subsystem", children: [
      { name: "permissions", type: "dir", desc: "24 files — permission rules, filesystem sandbox, path validation, yolo/auto classifiers, permission setup", children: [
        { name: "permissions.ts",              type: "file", lines: 1486, desc: "Core permission evaluation engine — checks tool calls against all rules and modes" },
        { name: "permissionSetup.ts",          type: "file", lines: 1532, desc: "Permission configuration UI and initial setup wizard logic" },
        { name: "filesystem.ts",               type: "file", lines: 1777, desc: "Filesystem sandbox — allowed path resolution, scratchpad, worktree path management" },
        { name: "yoloClassifier.ts",           type: "file", lines: 1495, desc: "Auto-mode classifier — decides if a command is safe enough to run without asking" },
        { name: "pathValidation.ts",           type: "file", lines: 485,  desc: "Validates file paths against sandbox rules, detects traversal attacks" },
        { name: "PermissionUpdate.ts",         type: "file", lines: 389,  desc: "Permission update events — tracks how rules change during a session" },
        { name: "permissionsLoader.ts",        type: "file", lines: 296,  desc: "Loads permission rules from settings, MDM, and env vars into a unified rule set" },
        { name: "permissionExplainer.ts",      type: "file", lines: 250,  desc: "Generates human-readable explanations of why a permission was granted or denied" },
        { name: "shadowedRuleDetection.ts",    type: "file", lines: 228,  desc: "Detects when a broad allow rule shadows a narrower deny rule (potential security issue)" },
        { name: "shellRuleMatching.ts",        type: "file", lines: 228,  desc: "Matches bash commands against shell permission rules using AST analysis" },
        { name: "permissionRuleParser.ts",     type: "file", lines: 198,  desc: "Parses permission rule strings (e.g. 'Bash(git *)', 'FileEdit(src/**)')" },
        { name: "bypassPermissionsKillswitch.ts", type: "file", lines: 155, desc: "Emergency killswitch for bypass-permissions mode — reverts to safe defaults" },
        { name: "PermissionMode.ts",           type: "file", lines: 141,  desc: "PermissionMode type + transitions: default → auto → bypass_permissions → plan_mode" },
        { name: "PermissionPromptToolResultSchema.ts", type: "file", lines: 127, desc: "Zod schema for the permission-prompt tool result that the agent returns after approval" },
        { name: "classifierDecision.ts",       type: "file", lines: 98,   desc: "Classifier decision record: tool name, decision, reasoning, confidence" },
        { name: "bashClassifier.ts",           type: "file", lines: 61,   desc: "Classifies bash commands as safe/unsafe using pattern matching + AST" },
        { name: "dangerousPatterns.ts",        type: "file", lines: 80,   desc: "Regex patterns for inherently dangerous shell commands (rm -rf, curl|sh, etc.)" },
        { name: "PermissionUpdateSchema.ts",   type: "file", lines: 78,   desc: "Zod schema for PermissionUpdate events" },
        { name: "getNextPermissionMode.ts",    type: "file", lines: 101,  desc: "State machine for permission mode transitions on user input" },
        { name: "autoModeState.ts",            type: "file", lines: 39,   desc: "Tracks current auto-mode approval state across the session" },
        { name: "PermissionResult.ts",         type: "file", lines: 35,   desc: "PermissionResult: allow | deny | ask with optional reason string" },
        { name: "PermissionRule.ts",           type: "file", lines: 40,   desc: "PermissionRule type: tool glob, path glob, always-allow flag" },
        { name: "classifierShared.ts",         type: "file", lines: 39,   desc: "Shared types and constants for auto-mode and yolo classifiers" },
        { name: "denialTracking.ts",           type: "file", lines: 45,   desc: "Tracks denial events for analytics and auto-mode learning" },
      ]},
      { name: "messages", type: "dir", desc: "2 files — SDK↔internal message type normalisation and mappers", children: [
        { name: "mappers.ts",   type: "file", lines: 290, desc: "Maps between Anthropic SDK message types and Claude Code's internal Message types" },
        { name: "systemInit.ts",type: "file", lines: 96,  desc: "Builds the initial system message array for a new conversation" },
      ]},
      { name: "git", type: "dir", desc: "3 files — git filesystem operations, config parsing, gitignore checking", children: [
        { name: "gitFilesystem.ts",   type: "file", lines: 699, desc: "Git repo operations: diff, log, status, branch, worktree creation/deletion" },
        { name: "gitConfigParser.ts", type: "file", lines: 277, desc: "Parses .git/config and ~/.gitconfig for user name, email, remote URLs" },
        { name: "gitignore.ts",       type: "file", lines: 99,  desc: "Checks if a path is gitignored — used to skip files in code indexing" },
      ]},
      { name: "shell", type: "dir", desc: "10 files — shell detection, bash/PowerShell providers, read-only command validation", children: [
        { name: "readOnlyCommandValidation.ts", type: "file", lines: 1893, desc: "Validates that a bash command is truly read-only (no writes, no network, no side effects)" },
        { name: "bashProvider.ts",              type: "file", lines: 255,  desc: "Bash shell provider — resolves bash path, sets safe env, runs commands" },
        { name: "prefix.ts",                    type: "file", lines: 367,  desc: "Shell prefix injection — prepends safety wrappers to dangerous commands" },
        { name: "specPrefix.ts",                type: "file", lines: 241,  desc: "Spec-mode prefix injection for sandboxed execution" },
        { name: "powershellProvider.ts",        type: "file", lines: 123,  desc: "PowerShell provider — resolves pwsh/powershell path, runs PS commands" },
        { name: "powershellDetection.ts",       type: "file", lines: 107,  desc: "Detects PowerShell version and availability on the current system" },
        { name: "shellProvider.ts",             type: "file", lines: 33,   desc: "Shell provider interface — abstraction for bash vs PowerShell" },
        { name: "shellToolUtils.ts",            type: "file", lines: 22,   desc: "Shared utilities for shell tool implementations" },
        { name: "resolveDefaultShell.ts",       type: "file", lines: 14,   desc: "Resolves the default shell for the current platform" },
        { name: "outputLimits.ts",              type: "file", lines: 14,   desc: "Output size limits for shell commands (max bytes before truncation)" },
      ]},
      { name: "model", type: "dir", desc: "16 files — model string parsing, context windows, cost, aliases, Bedrock/vertex support", children: [
        { name: "model.ts",               type: "file", lines: 618, desc: "Canonical model ID parsing, getMarketingName(), getContextWindow(), getDefaultModel()" },
        { name: "modelOptions.ts",        type: "file", lines: 540, desc: "All model options: temperature, top_p, max_tokens, thinking budget per model" },
        { name: "bedrock.ts",             type: "file", lines: 265, desc: "AWS Bedrock model ID mapping and endpoint configuration" },
        { name: "modelAllowlist.ts",      type: "file", lines: 170, desc: "Enterprise-configurable model allowlist — restricts which models users can choose" },
        { name: "modelStrings.ts",        type: "file", lines: 166, desc: "All canonical model ID string constants (claude-opus-4-7, claude-sonnet-4-6, etc.)" },
        { name: "agent.ts",               type: "file", lines: 157, desc: "Agent-specific model selection logic — sub-agents use a different default than main" },
        { name: "validateModel.ts",       type: "file", lines: 159, desc: "Validates model IDs: checks against allowlist, deprecation list, and availability" },
        { name: "modelCapabilities.ts",   type: "file", lines: 118, desc: "Per-model capability flags: supportsThinking, supportsFastMode, supportsVision" },
        { name: "configs.ts",             type: "file", lines: 118, desc: "Model configuration objects: API params, prompt caching, interleaved thinking config" },
        { name: "deprecation.ts",         type: "file", lines: 101, desc: "Deprecated model ID list with sunset dates and migration guidance" },
        { name: "aliases.ts",             type: "file", lines: 25,  desc: "User-friendly model aliases: 'opus' → 'claude-opus-4-7', 'sonnet' → latest Sonnet" },
        { name: "antModels.ts",           type: "file", lines: 64,  desc: "Anthropic-internal model IDs (codenames, pre-release) gated behind dev channels" },
        { name: "check1mAccess.ts",       type: "file", lines: 72,  desc: "Checks subscription tier access to 1M-context models" },
        { name: "contextWindowUpgradeCheck.ts", type: "file", lines: 47, desc: "Detects when a user could upgrade to a larger context window model" },
        { name: "modelSupportOverrides.ts", type: "file", lines: 50, desc: "Per-account model support overrides from billing API" },
        { name: "providers.ts",           type: "file", lines: 40,  desc: "Model provider enum: anthropic, bedrock, vertex" },
      ]},
      { name: "settings", type: "dir", desc: "15 entries — config loading, MDM, validation, type definitions, change detection", children: [
        { name: "settings.ts",           type: "file", lines: 1015, desc: "Main settings loader — reads .claude/settings.json, ~/.claude.json, MDM, env vars with priority merge" },
        { name: "types.ts",              type: "file", lines: 1148, desc: "All settings type definitions: UserSettings, ProjectSettings, GlobalSettings, MDMSettings" },
        { name: "changeDetector.ts",     type: "file", lines: 488,  desc: "File watcher that detects settings changes mid-session and triggers live reload" },
        { name: "permissionValidation.ts", type: "file", lines: 262, desc: "Validates permission rules in settings for syntax errors and semantic conflicts" },
        { name: "validation.ts",         type: "file", lines: 265,  desc: "Full settings object validation with detailed error messages per field" },
        { name: "validationTips.ts",     type: "file", lines: 164,  desc: "Human-readable tips for common settings validation errors" },
        { name: "constants.ts",          type: "file", lines: 202,  desc: "Settings-related string constants: file paths, env var names, default values" },
        { name: "applySettingsChange.ts",type: "file", lines: 92,   desc: "Applies incremental settings changes to the running session without restart" },
        { name: "settingsCache.ts",      type: "file", lines: 80,   desc: "Memoization cache for settings reads — invalidated by setState() in bootstrap" },
        { name: "toolValidationConfig.ts", type: "file", lines: 103, desc: "Per-tool validation configuration for settings-based tool restrictions" },
        { name: "mdm",                   type: "dir",               desc: "MDM (Mobile Device Management) policy loader for enterprise-managed settings" },
        { name: "pluginOnlyPolicy.ts",   type: "file", lines: 60,   desc: "Enterprise policy restricting Claude Code to plugin-provided tools only" },
        { name: "allErrors.ts",          type: "file", lines: 32,   desc: "Aggregates all validation errors across settings files" },
        { name: "internalWrites.ts",     type: "file", lines: 37,   desc: "Internal settings write helpers (used by Claude Code itself, not user code)" },
        { name: "managedPath.ts",        type: "file", lines: 34,   desc: "Resolves managed settings file paths for MDM-controlled configurations" },
      ]},
      { name: "bash", type: "dir", desc: "11 entries — full bash AST parser, command analysis, shell completion, heredoc handling", children: [
        { name: "bashParser.ts",       type: "file", lines: 4436, desc: "Complete bash parser producing an AST — used for safe command analysis and injection detection" },
        { name: "ast.ts",              type: "file", lines: 2679, desc: "Bash AST node types and visitor pattern for static analysis" },
        { name: "commands.ts",         type: "file", lines: 1339, desc: "Command-level analysis: extracts subcommands, flags, arguments from parsed AST" },
        { name: "heredoc.ts",          type: "file", lines: 733,  desc: "Heredoc parsing and expansion — handles <<EOF, <<'EOF', <<-EOF syntax" },
        { name: "ShellSnapshot.ts",    type: "file", lines: 582,  desc: "Captures shell environment state before/after command for diff analysis" },
        { name: "shellCompletion.ts",  type: "file", lines: 259,  desc: "Shell tab-completion for partially typed commands in the typeahead" },
        { name: "shellQuote.ts",       type: "file", lines: 304,  desc: "Safe shell quoting — escapes arguments to prevent injection" },
        { name: "ParsedCommand.ts",    type: "file", lines: 318,  desc: "Parsed command representation with type guards for different command forms" },
        { name: "bashPipeCommand.ts",  type: "file", lines: 294,  desc: "Pipeline-specific analysis — extracts commands in pipe chains" },
        { name: "treeSitterAnalysis.ts", type: "file", lines: 506, desc: "Tree-sitter backed deep analysis for complex bash constructs" },
        { name: "specs",               type: "dir",               desc: "Test fixtures and specification files for bash parser edge cases" },
      ]},
      { name: "suggestions", type: "dir", desc: "5 files — typeahead suggestion backends: commands, directories, shell history, Slack, skill tracking", children: [
        { name: "commandSuggestions.ts",    type: "file", lines: 567, desc: "Slash-command suggestions: fuzzy match, argument hints, description display" },
        { name: "directoryCompletion.ts",   type: "file", lines: 263, desc: "Directory and file path completion for @file syntax in the prompt" },
        { name: "slackChannelSuggestions.ts", type: "file", lines: 209, desc: "Suggests Slack channel names from connected MCP server on #channel typing" },
        { name: "shellHistoryCompletion.ts",type: "file", lines: 119, desc: "Recalls shell history entries matching current prefix" },
        { name: "skillUsageTracking.ts",    type: "file", lines: 55,  desc: "Tracks which skills are used to surface frequently-used skills in typeahead" },
      ]},
      { name: "sandbox", type: "dir", desc: "2 files — sandbox adapter for restricted execution environments", children: [
        { name: "sandbox-adapter.ts",    type: "file", lines: 985, desc: "Adapts tool calls to run inside a sandbox (Docker/sysbox) with restricted filesystem and network" },
        { name: "sandbox-ui-utils.ts",   type: "file", lines: 12,  desc: "UI utilities for displaying sandbox status and violation messages" },
      ]},
      { name: "mcp", type: "dir", desc: "2 files — MCP date/time parsing and elicitation (follow-up question) validation", children: [
        { name: "elicitationValidation.ts", type: "file", lines: 336, desc: "Validates MCP elicitation (structured follow-up question) payloads against JSON Schema" },
        { name: "dateTimeParser.ts",        type: "file", lines: 121, desc: "Parses ISO 8601 and natural-language date/time strings from MCP tool parameters" },
      ]},
      // ── Top-level utils files (selection of most important) ────────────────
      { name: "sideQuery.ts",      type: "file", lines: 90,  desc: "Runs a quick LLM call outside the main conversation (for memory selection, classification)" },
      { name: "sessionStorage.ts", type: "file", lines: 180, desc: "Reads and writes session NDJSON log files — the persistence layer for all conversations" },
      { name: "format.ts",         type: "file", lines: 160, desc: "Message formatting utilities: truncate, wrap, align, strip ANSI" },
      { name: "diff.ts",           type: "file", lines: 145, desc: "Text diff utilities: Myers diff, chunk extraction, unified format" },
      { name: "errors.ts",         type: "file", lines: 95,  desc: "Error type hierarchy: ToolError, PermissionError, NetworkError with rich context" },
      { name: "signal.ts",         type: "file", lines: 88,  desc: "AbortSignal utilities: combineSignals(), createSignal(), withTimeout()" },
      { name: "env.ts",            type: "file", lines: 75,  desc: "Typed environment variable accessors with defaults and validation" },
      { name: "undercover.ts",     type: "file", lines: 85,  desc: "Blocks internal Anthropic codenames from appearing in model lists" },
      { name: "cwd.ts",            type: "file", lines: 55,  desc: "getCwd() — reads the current working directory from AppState (not process.cwd())" },
      { name: "crypto.ts",         type: "file", lines: 30,  desc: "randomUUID() wrapper that works in both Node and browser-sdk environments" },
      { name: "debug.ts",          type: "file", lines: 65,  desc: "logForDebugging() — writes to .claude/logs/ when DEBUG=1, no-op otherwise" },
      { name: "sleep.ts",          type: "file", lines: 12,  desc: "sleep(ms): Promise<void> — promisified setTimeout" },
      { name: "xml.ts",            type: "file", lines: 45,  desc: "XML tag helpers for wrapping/unwrapping tool results in structured XML" },
      { name: "hash.ts",           type: "file", lines: 40,  desc: "FNV-1a and SHA-256 hash utilities for cache keys and fingerprinting" },
    ]},
    { name: "commands", type: "dir", desc: "100+ CLI subcommands & slash-commands — every /command and CLI verb is a directory or file here", children: [
      // ── Session management ───────────────────────────────────────────────
      { name: "session",   type: "dir", desc: "2 files — /session list/switch/info command UI and routing" },
      { name: "resume",    type: "dir", desc: "Resume a previous session by ID or fuzzy title search" },
      { name: "rewind",    type: "dir", desc: "Rewind the current session to a previous turn" },
      { name: "teleport",  type: "dir", desc: "Teleport: clone current session state to a new worktree" },
      // ── Code review & PR ────────────────────────────────────────────────
      { name: "review",    type: "dir", desc: "4 files — /ultrareview PR review + remote review runner" },
      { name: "diff",      type: "dir", desc: "Show git diff as context for the current conversation" },
      { name: "export",    type: "dir", desc: "Export conversation transcript to Markdown or JSON" },
      { name: "pr_comments", type: "dir", desc: "Fetch and display GitHub PR comments as context" },
      { name: "autofix-pr",  type: "dir", desc: "Auto-fix CI failures on a pull request" },
      // ── Model & effort ───────────────────────────────────────────────────
      { name: "model",     type: "dir", desc: "3 files — /model switch (picker UI) and model info display" },
      { name: "effort",    type: "dir", desc: "Set the thinking effort level (low/medium/high/max)" },
      { name: "fast",      type: "dir", desc: "Toggle fast mode (reduced thinking for quick responses)" },
      // ── MCP server management ────────────────────────────────────────────
      { name: "mcp",       type: "dir", desc: "4 files — /mcp list/add/remove/auth MCP server commands" },
      // ── Agent management ─────────────────────────────────────────────────
      { name: "agents",    type: "dir", desc: "2 files — /agents list command to show active sub-agents" },
      { name: "tasks",     type: "dir", desc: "List and manage background tasks (/tasks, /task stop <id>)" },
      // ── Environment & health ─────────────────────────────────────────────
      { name: "doctor",    type: "dir", desc: "2 files — /doctor health check, routes to screens/Doctor.tsx" },
      { name: "env",       type: "dir", desc: "Show/set environment variables for the current session" },
      { name: "debug-tool-call", type: "dir", desc: "Debug a specific tool call by replaying it with logging" },
      // ── Configuration ────────────────────────────────────────────────────
      { name: "config",    type: "dir", desc: "Read/write .claude/settings.json and ~/.claude.json" },
      { name: "keybindings", type: "dir", desc: "List and test keyboard shortcut bindings" },
      { name: "output-style", type: "dir", desc: "Switch output style (detailed, concise, auto)" },
      { name: "theme",     type: "dir", desc: "Switch colour theme with live preview" },
      { name: "hooks",     type: "dir", desc: "Manage PreToolUse/PostToolUse/Stop hooks" },
      { name: "permissions", type: "dir", desc: "Manage alwaysAllow/alwaysDeny permission rules" },
      // ── Plugins & skills ─────────────────────────────────────────────────
      { name: "plugin",    type: "dir", desc: "Install, list, and remove plugins from .claude/plugins/" },
      { name: "skills",    type: "dir", desc: "List available skills and their argument hints" },
      // ── Memory management ────────────────────────────────────────────────
      { name: "memory",    type: "dir", desc: "View, edit, and clear MEMORY.md and per-project memory files" },
      // ── UI & display ─────────────────────────────────────────────────────
      { name: "compact",   type: "dir", desc: "Compact conversation history to save context window space" },
      { name: "clear",     type: "dir", desc: "Clear the terminal and start a fresh conversation" },
      { name: "copy",      type: "dir", desc: "Copy the last assistant response to clipboard" },
      { name: "stats",     type: "dir", desc: "Show session statistics: tokens, cost, tool calls" },
      { name: "cost",      type: "dir", desc: "Show running cost breakdown for the current session" },
      { name: "release-notes", type: "dir", desc: "Show changelog for the current Claude Code version" },
      // ── IDE & integrations ───────────────────────────────────────────────
      { name: "ide",       type: "dir", desc: "Connect/disconnect IDE extensions (VS Code, JetBrains)" },
      { name: "chrome",    type: "dir", desc: "Claude in Chrome extension status and setup" },
      { name: "desktop",   type: "dir", desc: "Claude Desktop integration commands" },
      { name: "bridge",    type: "dir", desc: "Remote Control bridge status and QR code display" },
      { name: "remote-setup", type: "dir", desc: "Set up Remote Control session with pairing QR code" },
      // ── Auth & account ───────────────────────────────────────────────────
      { name: "login",     type: "dir", desc: "Authenticate via OAuth (Console or API key)" },
      { name: "logout",    type: "dir", desc: "Clear stored credentials and sign out" },
      { name: "passes",    type: "dir", desc: "Show subscription plan and usage limits" },
      { name: "usage",     type: "dir", desc: "Show token and API usage stats for the billing period" },
      // ── Git & GitHub ─────────────────────────────────────────────────────
      { name: "install-github-app", type: "dir", desc: "Install Claude Code GitHub App for PR review access" },
      { name: "install-slack-app",  type: "dir", desc: "Install Claude Code Slack integration" },
      // ── Key top-level command files ──────────────────────────────────────
      { name: "insights.ts",      type: "file", lines: 3200, desc: "3,200-line insights command — usage analytics, cost trends, session analysis" },
      { name: "ultraplan.tsx",    type: "file", lines: 470,  desc: "Ultraplan mode: deep task decomposition and planning before execution" },
      { name: "init.ts",          type: "file", lines: 256,  desc: "Project init: create .claude directory, CLAUDE.md, initial settings" },
      { name: "commit-push-pr.ts",type: "file", lines: 158,  desc: "Composite command: git commit + push + create GitHub PR in one step" },
      { name: "security-review.ts",type:"file", lines: 243,  desc: "Run security review on changed files with CVE and OWASP checklist" },
      { name: "init-verifiers.ts",type: "file", lines: 262,  desc: "Verification step runner for /init — checks project setup is complete" },
      { name: "install.tsx",      type: "file", lines: 299,  desc: "Claude Code installation and upgrade wizard" },
      { name: "advisor.ts",       type: "file", lines: 109,  desc: "AI-powered advisor command for architectural guidance" },
      { name: "brief.ts",         type: "file", lines: 130,  desc: "Generate a brief summary of a task or codebase" },
      { name: "commit.ts",        type: "file", lines: 92,   desc: "Commit staged changes with AI-generated commit message" },
      { name: "bridge-kick.ts",   type: "file", lines: 200,  desc: "Kick a stuck bridge session and force reconnect" },
      { name: "version.ts",       type: "file", lines: 22,   desc: "Print current Claude Code version and build info" },
      { name: "statusline.tsx",   type: "file", lines: 23,   desc: "Configure the IDE status line display format" },
    ]},
    { name: "vim",       type: "dir", desc: "Full modal Vim editing — motions, operators, text objects" },
    { name: "ink",       type: "dir", desc: "Custom React/Ink terminal renderer with Yoga layout" },
    { name: "native-ts", type: "dir", desc: "TypeScript bindings: file-index, color-diff, yoga-layout" },

    { name: "hooks", type: "dir", desc: "40+ React hooks — autocomplete, voice, polling, REPL bridge, history search", children: [
      { name: "useTypeahead.tsx",         type: "file", lines: 1384, desc: "Smart autocomplete with keyboard nav, caching & fuzzy match" },
      { name: "useInboxPoller.ts",        type: "file", lines: 969,  desc: "Polls inbox for new tasks/messages with exponential backoff" },
      { name: "fileSuggestions.ts",       type: "file", lines: 811,  desc: "File path suggestions via lazy-loaded index + ripgrep" },
      { name: "useVoiceIntegration.tsx",  type: "file", lines: 676,  desc: "Voice recording, transcription & audio level visualisation" },
      { name: "useReplBridge.tsx",        type: "file", lines: 722,  desc: "REPL bridge for interactive code execution contexts" },
      { name: "useDiffInIDE.ts",          type: "file", lines: 379,  desc: "IDE diff view integration for file change display" },
      { name: "useHistorySearch.ts",      type: "file", lines: 303,  desc: "Conversation history search with filtering & pagination" },
      { name: "useCancelRequest.ts",      type: "file", lines: 276,  desc: "API request cancellation & timeout management" },
      { name: "useAssistantHistory.ts",   type: "file", lines: 250,  desc: "Assistant history navigation with pagination" },
      { name: "unifiedSuggestions.ts",    type: "file", lines: 202,  desc: "Merges file/MCP/agent suggestions via Fuse.js fuzzy match" },
      { name: "useTeleportResume.tsx",    type: "file", lines: 84,   desc: "Session resume for teleported sessions" },
      { name: "renderPlaceholder.ts",     type: "file", lines: 51,   desc: "Cursor-styled placeholder text for text inputs" },
    ]},

    { name: "constants", type: "dir", desc: "21 config files — system prompts, API limits, beta flags, output styles", children: [
      { name: "prompts.ts",        type: "file", lines: 914, desc: "All Claude API system prompt templates & context builders" },
      { name: "oauth.ts",          type: "file", lines: 234, desc: "OAuth configuration & endpoints (GitHub / Google)" },
      { name: "outputStyles.ts",   type: "file", lines: 216, desc: "Terminal output styling — colours, bold, dim definitions" },
      { name: "spinnerVerbs.ts",   type: "file", lines: 204, desc: "Loading spinner text messages (verbs shown during work)" },
      { name: "github-app.ts",     type: "file", lines: 144, desc: "GitHub App configuration, scopes & API endpoints" },
      { name: "files.ts",          type: "file", lines: 156, desc: "Gitignore patterns, config filenames, path constants" },
      { name: "tools.ts",          type: "file", lines: 112, desc: "Tool name identifier string constants" },
      { name: "apiLimits.ts",      type: "file", lines: 94,  desc: "API limits: image max size, token caps, message limits" },
      { name: "system.ts",         type: "file", lines: 95,  desc: "System-level prompt section strings" },
      { name: "product.ts",        type: "file", lines: 76,  desc: "Product branding, version & marketing constants" },
      { name: "betas.ts",          type: "file", lines: 52,  desc: "Beta API headers: INTERLEAVED_THINKING, FAST_MODE_BETA" },
      { name: "common.ts",         type: "file", lines: 33,  desc: "getLocalISODate(), getSessionStartDate() shared helpers" },
    ]},

    { name: "context", type: "dir", desc: "9 React Context providers — notifications, stats, overlays, voice, modals", children: [
      { name: "notifications.tsx",        type: "file", lines: 239, desc: "Notification queue: priority, timeouts & folding logic" },
      { name: "stats.tsx",                type: "file", lines: 219, desc: "Session statistics & metrics via React Context" },
      { name: "overlayContext.tsx",       type: "file", lines: 150, desc: "Overlay / modal UI state management" },
      { name: "promptOverlayContext.tsx", type: "file", lines: 124, desc: "Prompt-specific overlay state & interactions" },
      { name: "voice.tsx",                type: "file", lines: 87,  desc: "Voice input/output state context" },
      { name: "QueuedMessageContext.tsx", type: "file", lines: 62,  desc: "Deferred UI update message queue" },
      { name: "modalContext.tsx",         type: "file", lines: 57,  desc: "Modal dialog state & open/close control" },
      { name: "mailbox.tsx",              type: "file", lines: 37,  desc: "Inter-component Mailbox for message passing" },
      { name: "fpsMetrics.tsx",           type: "file", lines: 29,  desc: "FPS performance metrics context for dev profiling" },
    ]},

    { name: "state", type: "dir", desc: "6 files — AppState store, memoized selectors, change listeners, multi-agent helpers", children: [
      { name: "AppStateStore.ts",       type: "file", lines: 569, desc: "Core AppState type & all state field definitions" },
      { name: "AppState.tsx",           type: "file", lines: 199, desc: "React provider + useAppStateStore() hook" },
      { name: "onChangeAppState.ts",    type: "file", lines: 171, desc: "State change subscriptions & side-effect triggers" },
      { name: "selectors.ts",           type: "file", lines: 76,  desc: "Memoized state selectors for efficient queries" },
      { name: "store.ts",               type: "file", lines: 34,  desc: "Generic createStore() — listeners, snapshots, updates" },
      { name: "teammateViewHelpers.ts", type: "file", lines: 141, desc: "Multi-agent teammate UI state utilities" },
    ]},

    { name: "types", type: "dir", desc: "7 TypeScript definition files — permissions, plugins, hooks, branded IDs", children: [
      { name: "permissions.ts",    type: "file", lines: 441, desc: "Permission rule types, evaluation & access control defs" },
      { name: "textInputTypes.ts", type: "file", lines: 387, desc: "Text input handler & voice input type definitions" },
      { name: "plugin.ts",         type: "file", lines: 363, desc: "PluginManifest, BuiltinPluginDefinition & config types" },
      { name: "logs.ts",           type: "file", lines: 330, desc: "Logging event & analytics type definitions" },
      { name: "hooks.ts",          type: "file", lines: 290, desc: "Hook events, permission updates & Zod validation schemas" },
      { name: "command.ts",        type: "file", lines: 216, desc: "PromptCommand, LocalCommandResult & skill exec types" },
      { name: "ids.ts",            type: "file", lines: 44,  desc: "Branded types: SessionId & AgentId — prevent ID mix-ups" },
    ]},

    { name: "memdir", type: "dir", desc: "Memory system — CLAUDE.md loading, LLM relevance scoring, team memory paths", children: [
      { name: "memdir.ts",              type: "file", lines: 507, desc: "Core memory directory ops: load files, metadata, CLAUDE.md" },
      { name: "findRelevantMemories.ts",type: "file", lines: 141, desc: "Sonnet-powered relevance scoring for memory retrieval" },
      { name: "teamMemPaths.ts",        type: "file", lines: 292, desc: "Team memory path handling for multi-agent sessions" },
      { name: "paths.ts",               type: "file", lines: 278, desc: "Memory directory path resolution with feature flags" },
      { name: "memoryTypes.ts",         type: "file", lines: 271, desc: "Memory taxonomy: user / feedback / project / reference" },
      { name: "teamMemPrompts.ts",      type: "file", lines: 100, desc: "System prompts for injecting team memory into context" },
      { name: "memoryScan.ts",          type: "file", lines: 94,  desc: "Scans memory files for headers & builds memory manifest" },
      { name: "memoryAge.ts",           type: "file", lines: 53,  desc: "memoryAge() / memoryAgeDays() — staleness assessment" },
    ]},

    { name: "assistant", type: "dir", desc: "Claude API session history — paginated event fetching", children: [
      { name: "sessionHistory.ts", type: "file", lines: 88, desc: "fetchLatestEvents() + fetchOlderEvents() with pagination" },
    ]},

    { name: "bootstrap", type: "dir", desc: "Global session state — CWD, costs, tokens, permissions, plan mode, slow ops", children: [
      { name: "state.ts", type: "file", lines: 1758, desc: "Single source of truth for all non-reactive session globals" },
    ]},

    { name: "schemas", type: "dir", desc: "Zod validation schemas for hooks config & permission rule syntax", children: [
      { name: "hooks.ts", type: "file", lines: 40, desc: "Zod schemas for hook event types and permission rules" },
    ]},

    { name: "migrations", type: "dir", desc: "11 migration files — model renames, settings moves, feature flag resets, permission schema upgrades", children: [
      { name: "migrateSonnet45ToSonnet46.ts",               type: "file", lines: 67,  desc: "Migrate claude-sonnet-4-5 references to claude-sonnet-4-6 across all settings" },
      { name: "migrateEnableAllProjectMcpServersToSettings.ts", type: "file", lines: 118, desc: "Move enableAllProjectMcpServers flag from per-project to global settings" },
      { name: "migrateAutoUpdatesToSettings.ts",             type: "file", lines: 61,  desc: "Migrate auto-update preferences from legacy location to unified settings" },
      { name: "resetProToOpusDefault.ts",                    type: "file", lines: 51,  desc: "Reset Pro-tier users back to Opus as the default model" },
      { name: "resetAutoModeOptInForDefaultOffer.ts",        type: "file", lines: 51,  desc: "Reset auto-mode opt-in flags for new default offer rollout" },
      { name: "migrateSonnet1mToSonnet45.ts",                type: "file", lines: 48,  desc: "Rename claude-sonnet-1m model ID to claude-sonnet-4-5" },
      { name: "migrateLegacyOpusToCurrent.ts",               type: "file", lines: 57,  desc: "Rename legacy opus model IDs to current canonical claude-opus-* IDs" },
      { name: "migrateFennecToOpus.ts",                      type: "file", lines: 45,  desc: "Rename internal codename 'fennec' to 'claude-opus-4-7'" },
      { name: "migrateOpusToOpus1m.ts",                      type: "file", lines: 43,  desc: "Rename claude-opus to claude-opus-1m" },
      { name: "migrateBypassPermissionsAcceptedToSettings.ts", type: "file", lines: 40, desc: "Move bypass-permissions acceptance flag into main settings schema" },
      { name: "migrateReplBridgeEnabledToRemoteControlAtStartup.ts", type: "file", lines: 22, desc: "Rename replBridgeEnabled → remoteControlAtStartup setting key" },
    ]},
    { name: "keybindings", type: "dir", desc: "14 files — keyboard shortcut registry: user bindings, Vim maps, platform overrides, validation", children: [
      { name: "loadUserBindings.ts",     type: "file", lines: 472, desc: "Loads and merges user keybinding overrides from .claude/settings.json" },
      { name: "validate.ts",             type: "file", lines: 498, desc: "Validates keybinding configs: detects conflicts, invalid key names, reserved shortcuts" },
      { name: "defaultBindings.ts",      type: "file", lines: 340, desc: "Default keyboard shortcut map for all Claude Code actions (submit, cancel, scroll, etc.)" },
      { name: "KeybindingProviderSetup.tsx", type: "file", lines: 307, desc: "React provider that wires keybinding context into the component tree at startup" },
      { name: "resolver.ts",             type: "file", lines: 244, desc: "Resolves platform-specific key strings (Ctrl→Cmd on macOS, etc.)" },
      { name: "KeybindingContext.tsx",   type: "file", lines: 242, desc: "React context holding the active keybinding map + registration/unregister API" },
      { name: "schema.ts",               type: "file", lines: 236, desc: "Zod schema for validating user-provided keybinding objects" },
      { name: "parser.ts",               type: "file", lines: 203, desc: "Parses keybinding string notation (e.g. 'ctrl+shift+enter') into key descriptor objects" },
      { name: "useKeybinding.ts",        type: "file", lines: 196, desc: "Hook that subscribes to a named keybinding and fires a callback when pressed" },
      { name: "reservedShortcuts.ts",    type: "file", lines: 127, desc: "List of reserved shortcuts that users cannot override (e.g. Ctrl+C, Ctrl+Z)" },
      { name: "match.ts",                type: "file", lines: 120, desc: "Event-to-binding matcher: checks if a KeyboardEvent matches a binding descriptor" },
      { name: "shortcutFormat.ts",       type: "file", lines: 63,  desc: "Formats key descriptors into human-readable strings ('⌘⇧↵')" },
      { name: "useShortcutDisplay.ts",   type: "file", lines: 59,  desc: "Hook that returns the display string for a named keybinding" },
      { name: "template.ts",             type: "file", lines: 52,  desc: "Template literals for generating keybinding documentation strings" },
    ]},
    { name: "skills",  type: "dir", desc: "4 entries — skill discovery, manifest loading, bundled skills, MCP skill builder", children: [
      { name: "loadSkillsDir.ts",  type: "file", lines: 1086, desc: "Discovers, validates, and loads all .claude/skills/*.md skill definitions into memory" },
      { name: "bundledSkills.ts",  type: "file", lines: 220,  desc: "Registers built-in bundled skills (e.g. /ultrareview) shipped with Claude Code" },
      { name: "mcpSkillBuilders.ts", type: "file", lines: 44,  desc: "Builds MCP-compatible tool definitions from loaded skill manifests" },
      { name: "bundled",           type: "dir",               desc: "Built-in skill .md files shipped with Claude Code (ultrareview, etc.)" },
    ]},
    { name: "screens", type: "dir", desc: "3 top-level screen components — REPL chat, Doctor diagnostics, ResumeConversation", children: [
      { name: "REPL.tsx",                type: "file", lines: 5005, desc: "The main interactive REPL screen — 5,000-line component managing the full chat session loop" },
      { name: "Doctor.tsx",              type: "file", lines: 574,  desc: "Health-check screen: API key, network, git, node version, config validity checks" },
      { name: "ResumeConversation.tsx",  type: "file", lines: 398,  desc: "Session resume screen — lists previous sessions, lets user pick one to continue" },
    ]},
    { name: "server",  type: "dir", desc: "3 files — direct-connect session server for SDK mode (no CLI polling required)", children: [
      { name: "directConnectManager.ts",     type: "file", lines: 213, desc: "Manages direct-connect sessions: accepts connections, routes to session runners" },
      { name: "createDirectConnectSession.ts", type: "file", lines: 88,  desc: "Creates a new direct-connect session with auth validation and runner spawn" },
      { name: "types.ts",                    type: "file", lines: 57,  desc: "TypeScript types for direct-connect session protocol" },
    ]},
    { name: "remote",  type: "dir", desc: "4 files — remote session management, WebSocket sessions, permission bridge, SDK adapter", children: [
      { name: "SessionsWebSocket.ts",       type: "file", lines: 404, desc: "WebSocket server managing remote Claude Code sessions for web/API clients" },
      { name: "RemoteSessionManager.ts",    type: "file", lines: 343, desc: "Orchestrates remote session lifecycle: create, route, teardown, reconnect" },
      { name: "sdkMessageAdapter.ts",       type: "file", lines: 302, desc: "Adapts between internal message format and the Claude Agent SDK wire format" },
      { name: "remotePermissionBridge.ts",  type: "file", lines: 78,  desc: "Bridges permission requests from remote sessions back to the local terminal for approval" },
    ]},
    { name: "outputStyles", type: "dir", desc: "1 file — output formatting strategy (compact vs verbose mode)" },
    { name: "plugins",      type: "dir", desc: "1 file — plugin runtime: load → validate → sandbox → execute" },
    { name: "entrypoints", type: "dir", desc: "5 files + sdk/ — binary entry points: CLI, MCP server, SDK, init, sandbox types", children: [
      { name: "cli.tsx",           type: "file", lines: 302, desc: "CLI entry point — bootstraps the terminal REPL and routes to Commander subcommands" },
      { name: "agentSdkTypes.ts",  type: "file", lines: 443, desc: "Public types exported by the Claude Agent SDK: HookEvent, ModelUsage, AgentOptions" },
      { name: "init.ts",           type: "file", lines: 340, desc: "One-time init entry point — runs setup wizard, creates .claude directory, API key prompt" },
      { name: "mcp.ts",            type: "file", lines: 196, desc: "MCP server entry point — exposes Claude Code as an MCP-compatible tool provider" },
      { name: "sandboxTypes.ts",   type: "file", lines: 156, desc: "Sandbox constraint types for the headless/CI execution mode" },
      { name: "sdk",               type: "dir",              desc: "SDK entry point implementation files for the Claude Agent SDK npm package" },
    ]},
    { name: "query",   type: "dir", desc: "4 files — query preprocessing, token budget management, stop hooks, dependency injection", children: [
      { name: "stopHooks.ts",   type: "file", lines: 473, desc: "PostToolUse and Stop hook execution engine — runs user-configured shell hooks after tool calls" },
      { name: "tokenBudget.ts", type: "file", lines: 93,  desc: "Computes per-turn token budget: max_tokens, thinking budget, betas based on model" },
      { name: "config.ts",      type: "file", lines: 46,  desc: "QueryEngine configuration defaults and API call parameter builders" },
      { name: "deps.ts",        type: "file", lines: 40,  desc: "Dependency injection container types for QueryEngine construction" },
    ]},
    { name: "cli",     type: "dir", desc: "8 entries — CLI output formatting, structured I/O, remote I/O, update logic, transports", children: [
      { name: "print.ts",               type: "file", lines: 5594, desc: "5,500-line CLI output engine — renders all message types to terminal ANSI" },
      { name: "structuredIO.ts",        type: "file", lines: 859,  desc: "Structured JSON output mode for CI/scripting: serialises messages as NDJSON" },
      { name: "update.ts",              type: "file", lines: 422,  desc: "CLI update logic: checks npm registry, compares semver, prompts user to upgrade" },
      { name: "remoteIO.ts",            type: "file", lines: 255,  desc: "Remote I/O adapter for forwarding CLI output over a network connection" },
      { name: "transports",             type: "dir",               desc: "Transport implementations: stdio, SSE, WebSocket for CLI output delivery" },
      { name: "handlers",               type: "dir",               desc: "Route handlers for CLI subcommand logic (review, session, model, etc.)" },
      { name: "exit.ts",                type: "file", lines: 31,   desc: "Graceful exit handler — flushes output, closes connections, saves session" },
      { name: "ndjsonSafeStringify.ts", type: "file", lines: 32,   desc: "JSON.stringify wrapper that handles circular references for NDJSON output" },
    ]},
    { name: "tasks",   type: "dir", desc: "9 entries — all task types: dream, teammate, agent, shell, session, remote + utilities", children: [
      { name: "LocalMainSessionTask.ts", type: "file", lines: 479, desc: "Main session task — wraps the full REPL session lifecycle as a Task" },
      { name: "LocalAgentTask",          type: "dir",               desc: "Background sub-agent task: spawn, run ReAct loop, write output file" },
      { name: "LocalShellTask",          type: "dir",               desc: "Shell command task: spawn process, stream output, enforce timeout" },
      { name: "DreamTask",               type: "dir",               desc: "Background memory consolidation task (autoDream): extract facts → MEMORY.md" },
      { name: "InProcessTeammateTask",   type: "dir",               desc: "In-process teammate for multi-agent coordination (shared-memory, no IPC)" },
      { name: "RemoteAgentTask",         type: "dir",               desc: "Remote agent task: manages a sub-agent running on a remote machine" },
      { name: "stopTask.ts",             type: "file", lines: 100,  desc: "Sends SIGTERM/SIGKILL to stop a running task with configurable grace period" },
      { name: "pillLabel.ts",            type: "file", lines: 82,   desc: "Generates coloured pill labels for task status display (running, done, error)" },
      { name: "types.ts",                type: "file", lines: 46,   desc: "Task interface and TaskResult types used by all task implementations" },
    ]},
    { name: "voice",       type: "dir", desc: "1 file — voice mode entitlement check", children: [
      { name: "voiceModeEnabled.ts", type: "file", lines: 54, desc: "Checks subscription + feature flag to determine if voice input mode is available" },
    ]},
    { name: "moreright",   type: "dir", desc: "1 file — right-panel UI hook: diff preview, file explorer, context manager" },
    { name: "upstreamproxy",type:"dir", desc: "2 files — HTTP proxy for routing API calls in enterprise environments", children: [
      { name: "upstreamproxy.ts", type: "file", lines: 180, desc: "HTTP proxy server: intercepts API calls and routes to enterprise proxy endpoints" },
      { name: "relay.ts",         type: "file", lines: 95,  desc: "TCP relay for upstream proxy tunnel connections" },
    ]},
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

  // ── Phase-2 Key Files ─────────────────────────────────────────────────────

  "src/bridge/bridgeMain.ts": {
    role: "The main orchestrator for the Remote Control bridge — manages poll loops, session lifecycle, transport negotiation, and reconnection logic across 2,809 lines.",
    difficulty: "Advanced",
    analogy: "🧑‍✈️ An air traffic controller managing dozens of planes simultaneously. bridgeMain.ts knows which sessions are landing, which are in holding patterns, which transports are active, and coordinates all handoffs without any two operations stepping on each other.",
    howItWorks: [
      { step: "Poll loop for incoming work", detail: "Polls the Environments API for new code-session assignments. Uses capacityWake.ts to merge 'capacity available' signals and abort signals into a unified wakeup mechanism." },
      { step: "Session lifecycle management", detail: "Creates, tracks, and tears down bridge sessions. Each session gets its own transport (SSE or HybridTransport), message queue, and lifecycle callbacks." },
      { step: "Transport negotiation", detail: "Checks feature flags and subscription entitlement to choose between v1 (HybridTransport) and v2 (SSE+CCRClient) transports. v2 is faster but requires a newer entitlement." },
      { step: "Reconnection and retry", detail: "On transport failure, applies exponential backoff from pollConfigDefaults.ts. Distinguishes 'at-capacity' (pause polling) from 'error' (retry with backoff)." },
    ],
    connections: {
      imports: [
        { name: "bridgeMessaging.ts",  why: "Message framing and dispatch" },
        { name: "replBridgeTransport.ts", why: "Transport abstraction for v1/v2" },
        { name: "capacityWake.ts",     why: "Poll loop wakeup primitive" },
        { name: "pollConfig.ts",       why: "GrowthBook-tuned poll intervals" },
      ],
      usedBy: ["main.tsx (when --remote flag is active)"],
    },
    concepts: ["Long-poll loop", "Transport negotiation", "Exponential backoff", "Session lifecycle", "Signal composition"],
    hints: [
      "How does the poll loop avoid busy-waiting while still responding quickly to new work?",
      "What's the difference between the v1 HybridTransport and the v2 SSE+CCRClient transport?",
      "How does bridgeMain.ts handle two sessions arriving simultaneously?",
      "What triggers the 'at-capacity' state and how does it resume?",
    ],
  },

  "src/bridge/replBridge.ts": {
    role: "The REPL-mode bridge implementation — 2,267 lines managing session creation, inbound message processing, tool execution routing, and bidirectional state sync with the connected IDE.",
    difficulty: "Advanced",
    analogy: "🏢 The concierge desk of a hotel (your CLI REPL) that's wired into the room-service system (IDE). Every guest request (IDE message) is authenticated, parsed, routed to the kitchen (QueryEngine), and the result is delivered back — all while keeping the lobby running normally.",
    howItWorks: [
      { step: "Session handshake", detail: "On first connection, replBridge exchanges capability declarations with the IDE. Both sides announce which protocol versions and features they support." },
      { step: "Inbound message processing", detail: "inboundMessages.ts deserialises messages, resolves file attachments via inboundAttachments.ts, and injects them into the REPL's active conversation." },
      { step: "Tool call routing", detail: "IDE-triggered tool calls (openFile, showDiff) are intercepted before QueryEngine and handled directly by the bridge without an LLM round-trip." },
      { step: "State sync", detail: "bridgeUI.ts pushes UI state (status indicator, cost, token count) back to the IDE on every significant state change so the status bar stays current." },
    ],
    connections: {
      imports: [
        { name: "inboundMessages.ts",    why: "Deserialises and validates inbound messages" },
        { name: "inboundAttachments.ts", why: "Resolves file UUID attachments" },
        { name: "bridgeUI.ts",           why: "Updates IDE status bar" },
        { name: "replBridgeHandle.ts",   why: "Exposes the active handle globally for tools" },
      ],
      usedBy: ["initReplBridge.ts", "bridgeMain.ts"],
    },
    concepts: ["Bidirectional state sync", "Capability negotiation", "Message deserialisation", "Tool call interception"],
    hints: [
      "Why are some tool calls intercepted at the bridge layer rather than reaching QueryEngine?",
      "How does replBridge recover if the IDE disconnects mid-conversation?",
      "What's replBridgeHandle.ts for — why does it need to be global?",
      "How does inboundAttachments.ts resolve file UUID attachments — what API does it call?",
    ],
  },

  "src/components": {
    role: "141 top-level React/Ink components + 32 subdirectories (354 more files) — the entire visual layer of the Claude Code terminal UI. Everything you see when you run `claude` is composed from components here.",
    difficulty: "Intermediate",
    analogy: "🎭 A theatre with 500 props, costumes, and stage pieces. The main stage is main.tsx, but every chair, curtain, spotlight, and actor's costume comes from this directory. The design-system/ provides the materials, messages/ renders the dialogue, permissions/ stages the approval scenes.",
    howItWorks: [
      { step: "React + Ink terminal rendering", detail: "Ink wraps React to render into terminal ANSI output instead of a DOM. Components use <Box> (flexbox), <Text> (styled text), and useInput() (keyboard events). There's no HTML or CSS." },
      { step: "FullscreenLayout.tsx — the root shell", detail: "Provides the outer chrome: scroll pane, modal overlay layer, status line at bottom, and the transcript area. All other components render inside it." },
      { step: "Messages.tsx + VirtualMessageList.tsx", detail: "Messages manages the logical list (filtering, selection, scroll anchoring). VirtualMessageList handles windowed rendering so 10,000-message transcripts stay fast." },
      { step: "PromptInput/ subdirectory", detail: "21 files for the input box: multi-line text, typeahead popup, ghost text, mode icons (plan/auto), and the input footer showing completion hints." },
      { step: "permissions/ subdirectory — 51 files", detail: "Every tool approval dialog, allow/deny rule editor, and permission mode switch lives here. It's the most safety-critical UI in the codebase." },
    ],
    connections: {
      imports: [
        { name: "src/state/",    why: "Reads AppState via hooks for session data, messages, mode" },
        { name: "src/context/",  why: "Reads notification, overlay, voice contexts" },
        { name: "src/hooks/",    why: "useTypeahead, useInboxPoller, useHistorySearch" },
        { name: "src/ink.js",    why: "Ink primitives: Box, Text, useInput, useApp" },
      ],
      usedBy: ["main.tsx (imports App.tsx as root component)"],
    },
    concepts: ["Ink/React terminal rendering", "Virtual scrolling", "Component composition", "Permission UX", "Overlay stack management"],
    hints: [
      "Why use React/Ink for terminal UI instead of writing ANSI codes directly?",
      "How does VirtualMessageList.tsx keep rendering fast with thousands of messages?",
      "What's the difference between the permissions/ subdirectory and the src/permissions/ utilities directory?",
      "Why are there 51 files in permissions/ — what accounts for that much code?",
    ],
  },

  "src/tools": {
    role: "42 tool subdirectories (plus shared/ and utils.ts) — each tool is a self-contained module implementing the Tool interface: prompt documentation, Zod input schema, execute() function, and tests. Together they give Claude its hands.",
    difficulty: "Intermediate",
    analogy: "🧰 A professional toolbox where every tool has its own labeled compartment. You never rummage through a pile — you look up 'BashTool' and get its handle, safety instructions, and manual in one place. Adding a new tool means adding a new compartment without touching any existing ones.",
    howItWorks: [
      { step: "Tool interface contract", detail: "Every tool exports a class or object implementing Tool: {name, description, inputSchema (Zod), execute(input, ctx) → ToolResult}. The LLM uses 'description' to decide when to call the tool." },
      { step: "QueryEngine.ts loads all tools", detail: "loadAllTools() in main.tsx maps every tool into a Map<string, Tool>. QueryEngine receives this map and passes tools to the Anthropic API as the 'tools' parameter." },
      { step: "Input schema → LLM tool call", detail: "The Zod schema is serialised to JSON Schema and sent to the API. The LLM produces a tool_use block whose 'input' field is validated against this schema before execute() is called." },
      { step: "Permission check in execute()", detail: "Before doing any work, execute() calls checkToolPermission(). If the user hasn't allowed this tool+input combo, it returns a permission-request result instead of executing." },
      { step: "AgentTool/ — the meta-tool", detail: "15 files because it's a tool factory: it spawns sub-agents, loads user-defined agent dirs, provides built-in Explore/Plan agents, and manages the swarm orchestration protocol." },
    ],
    connections: {
      imports: [
        { name: "src/Tool.ts",         why: "The Tool interface and ToolResult type that every tool implements" },
        { name: "src/bootstrap/state.ts", why: "Permission mode, session info" },
        { name: "src/constants/",      why: "TOOL_NAME constants imported by QueryEngine" },
        { name: "shared/",             why: "Shared permission checking, diff formatting, output truncation" },
      ],
      usedBy: ["QueryEngine.ts", "coordinator/coordinatorMode.ts", "permissions/ (for approval dialogs)"],
    },
    concepts: ["Tool interface pattern", "JSON Schema for LLM tools", "Zod validation", "Permission-gated execution", "Recursive agent delegation"],
    hints: [
      "Why is each tool a separate directory rather than a single file per tool?",
      "How does the LLM know which tool to call — what makes a good tool description?",
      "What happens if a tool's Zod schema validation fails at runtime?",
      "Why does AgentTool/ need 15 files when most tools need only 2-3?",
    ],
  },

  // ── Phase-3 Key Files ────────────────────────────────────────────────────

  "src/screens/REPL.tsx": {
    role: "The 5,005-line main interactive REPL screen — the heart of the Claude Code terminal experience. Renders the full chat loop: history, message stream, prompt, tool approvals, and all keyboard interactions.",
    difficulty: "Advanced",
    analogy: "🎙️ The live control room for a radio broadcast. It simultaneously runs the microphone (prompt input), the playback deck (message stream), the call screener (permission dialogs), the news ticker (status line), and the broadcast archive (session history) — all in perfect sync.",
    howItWorks: [
      { step: "Mounts inside FullscreenLayout.tsx", detail: "REPL.tsx is the main content inside the screen frame. It sets up all providers, loads session history, and renders the VirtualMessageList + PromptInput in a flex column." },
      { step: "Session history initialisation", detail: "On mount, reads the session log file from disk, parses NDJSON events into internal Message objects, and seeds the VirtualMessageList. Handles resuming interrupted sessions." },
      { step: "Message stream subscription", detail: "Subscribes to the QueryEngine's message stream via AppState. As streaming tokens arrive, they're appended to the last assistant message in real time without a full re-render." },
      { step: "Tool approval intercept", detail: "When QueryEngine needs permission for a tool call, it writes a pending-permission event to AppState. REPL.tsx renders the appropriate approval dialog (BashTool, FileEdit, etc.) and waits for user response before resuming." },
      { step: "Keyboard shortcuts", detail: "Registers dozens of keybindings: Ctrl+C to interrupt, Ctrl+R for history search, Ctrl+K for compact, Ctrl+T for model picker, Ctrl+L to clear. All go through the keybindings/ system, not raw key listeners." },
    ],
    connections: {
      imports: [
        { name: "src/state/AppState.tsx",        why: "All session state: messages, mode, cost, history" },
        { name: "src/components/Messages.tsx",    why: "Renders the message list" },
        { name: "src/components/PromptInput/",    why: "Renders the input box at bottom" },
        { name: "src/keybindings/",              why: "Registers all REPL-level keyboard shortcuts" },
        { name: "QueryEngine.ts",                why: "Sends user input and receives streaming responses" },
      ],
      usedBy: ["main.tsx (renders REPL screen when in interactive mode)"],
    },
    concepts: ["Streaming UI updates", "Session persistence", "Permission dialog intercept", "Keyboard shortcut registry", "Virtual list scrolling"],
    hints: [
      "How does the REPL update the UI in real time as tokens stream in without re-rendering the whole list?",
      "Why is REPL.tsx 5,000 lines — what accounts for all that code?",
      "How does it handle the case where a tool approval dialog appears mid-stream?",
      "What happens to the session state when the user presses Ctrl+C mid-response?",
    ],
  },

  "src/screens/Doctor.tsx": {
    role: "The `claude doctor` health-check screen — runs a suite of environment diagnostics and displays pass/fail results with actionable fix instructions for each failing check.",
    difficulty: "Intermediate",
    analogy: "🏥 A doctor's check-up form with a list of vital signs. API key? ✅. Node version? ✅. Git installed? ⚠️ outdated. Network? ❌ unreachable. Each failing vital has a prescription for how to fix it.",
    howItWorks: [
      { step: "CheckList declaration", detail: "An array of {label, check: () => Promise<CheckResult>} objects. Each check is async and returns {pass: boolean, detail: string}." },
      { step: "Parallel execution", detail: "All checks run concurrently with Promise.allSettled(). A failing check doesn't block others. Results stream in as each check completes." },
      { step: "Colour-coded display", detail: "✅ green for pass, ⚠️ yellow for warning, ❌ red for fail. Failing checks show an indented fix instruction below them." },
      { step: "Exit code", detail: "If any check fails, the process exits with code 1 so CI scripts can detect a broken environment." },
    ],
    connections: {
      imports: [
        { name: "src/utils/",  why: "checkApiKey(), checkNodeVersion(), checkGitInstalled() helpers" },
        { name: "src/ink.js",  why: "Box, Text for terminal layout" },
      ],
      usedBy: ["main.tsx (routed by 'claude doctor' subcommand)"],
    },
    concepts: ["Promise.allSettled", "Parallel async checks", "Exit codes", "CI-friendly diagnostics"],
    hints: [
      "Why use Promise.allSettled instead of Promise.all for the health checks?",
      "How would you add a new health check — what's the minimum code needed?",
      "Why does a failing check set process exit code 1?",
      "What checks would you add to diagnose MCP server connection issues?",
    ],
  },

  "src/query/stopHooks.ts": {
    role: "The PostToolUse and Stop hook execution engine — runs user-configured shell commands after each tool call and at session end. 473 lines managing subprocess spawning, timeout enforcement, and hook output injection.",
    difficulty: "Advanced",
    analogy: "🔔 A hotel bell that rings after every room-service delivery (tool call). The hotel (Claude Code) promises: 'After every delivery, we'll run your custom script.' The script can do anything — log to a file, send a Slack message, auto-format code, run tests. The hotel enforces a 30-second timeout so one slow script doesn't block the next delivery.",
    howItWorks: [
      { step: "Hook configuration loading", detail: "Reads PostToolUse and Stop hook matchers from bootstrap/state.ts (loaded from .claude/settings.json). Each matcher specifies: which tools trigger it (glob pattern), which command to run, and a timeout." },
      { step: "Matcher evaluation", detail: "After each tool call, iterates all PostToolUse matchers. For each matching hook, spawns a child process with the tool name and result as environment variables." },
      { step: "Output capture and injection", detail: "If the hook process writes to stdout, that output is captured and injected as a synthetic tool result into the conversation context. This lets hooks add information to the agent's view." },
      { step: "Timeout enforcement", detail: "Each hook subprocess has a configurable timeout (default 60s). SIGTERM on timeout, SIGKILL after grace period. A timed-out hook logs a warning but doesn't halt the agent." },
      { step: "Stop hooks at session end", detail: "When the user ends the session (Ctrl+D, /exit), Stop hooks run with the full session summary as environment. Used for end-of-session tasks like committing changes, posting summaries, notifying teams." },
    ],
    connections: {
      imports: [
        { name: "src/bootstrap/state.ts",  why: "Reads registered hook matchers" },
        { name: "src/types/hooks.ts",      why: "HookMatcher and HookResult types" },
        { name: "Node child_process",      why: "Spawns hook subprocesses" },
      ],
      usedBy: ["QueryEngine.ts (calls after each tool result)", "main.tsx (calls Stop hooks on exit)"],
    },
    concepts: ["Hook pattern", "Shell subprocess spawning", "Output injection", "Timeout with SIGTERM/SIGKILL", "Event-driven automation"],
    hints: [
      "What's the difference between a PostToolUse hook and a Stop hook?",
      "How does hook stdout get injected into the agent's conversation — what does it look like to Claude?",
      "Why would a hook that runs 'npm test' after every file edit be dangerous?",
      "How do you write a hook that only fires after BashTool calls, not FileEdit calls?",
    ],
  },

  "src/skills/loadSkillsDir.ts": {
    role: "The 1,086-line skill discovery and loading engine — scans .claude/skills/ for Markdown skill definitions, validates them, builds Tool objects from them, and registers them as callable slash-commands.",
    difficulty: "Advanced",
    analogy: "📚 A librarian who finds all loose recipe cards (Markdown files), checks each one has a valid title and ingredient list (frontmatter validation), creates an index card per recipe (Tool object), and puts them on the available-recipes shelf (slash-command registry). Users then type '/recipe bake-bread' to run one.",
    howItWorks: [
      { step: "Directory scan", detail: "Recursively scans .claude/skills/ for .md files. Also checks bundled skills shipped with Claude Code." },
      { step: "Frontmatter parsing", detail: "Reads the YAML frontmatter of each .md file: name, description, allowed-tools, argument-hint. Validates with Zod. Missing required fields → skip with warning." },
      { step: "Tool object construction", detail: "Each valid skill becomes a SkillTool instance: name = '/<skill-name>', inputSchema = {argument: z.string()}, execute() runs the skill's prompt template with the argument substituted." },
      { step: "MCP skill builder", detail: "mcpSkillBuilders.ts additionally converts skills into MCP-compatible tool definitions so they can be called from MCP clients (like Claude Desktop)." },
      { step: "Bundled skills registration", detail: "bundledSkills.ts registers built-in skills (e.g. /ultrareview) from the bundled/ directory. These are always available even without a .claude/skills/ directory." },
    ],
    connections: {
      imports: [
        { name: "zod",                      why: "Validates skill frontmatter schema" },
        { name: "gray-matter",              why: "Parses YAML frontmatter from Markdown files" },
        { name: "src/tools/SkillTool/",     why: "Wraps each skill as a SkillTool" },
      ],
      usedBy: ["main.tsx (calls loadSkillsDir on startup)", "QueryEngine.ts (receives skill tools in tool map)"],
    },
    concepts: ["YAML frontmatter", "Dynamic tool registration", "Template substitution", "Zod validation", "Plugin/extension pattern"],
    hints: [
      "What's the minimum frontmatter a valid skill Markdown file must have?",
      "How does argument substitution work — what's the template syntax in a skill prompt?",
      "How would you write a skill that runs ESLint on the current file?",
      "What's the difference between a skill and a custom MCP tool?",
    ],
  },

  "src/cli/print.ts": {
    role: "The 5,594-line CLI output rendering engine — converts all internal message types (text, tool use, tool result, thinking, error) into formatted ANSI terminal output. Every character you see in the Claude Code terminal passes through here.",
    difficulty: "Advanced",
    analogy: "📺 A TV broadcast studio's playback switcher. Raw footage arrives (internal messages), and print.ts decides the codec, colour grading, subtitle format, and frame rate for each clip. The same underlying message looks different in interactive mode, structured JSON mode, and CI mode — this file handles all three.",
    howItWorks: [
      { step: "Message type dispatch", detail: "A large switch on message.type routes each message to its renderer: renderTextMessage(), renderToolUse(), renderToolResult(), renderThinking(), renderError(), etc." },
      { step: "ANSI colour formatting", detail: "Uses chalk-style escape codes (or raw ANSI) to colour tool names cyan, errors red, thinking dim, code blocks with syntax highlighting. All colours are gated on the NO_COLOR env var." },
      { step: "Structured output mode", detail: "When --output-format=json is set, bypasses ANSI rendering and writes NDJSON lines instead. structuredIO.ts handles the JSON serialisation." },
      { step: "Compact mode truncation", detail: "Long tool outputs are truncated with a '[…N lines hidden, use /expand to see all]' hint. The full content is kept in AppState; only the display is shortened." },
      { step: "Cost and token footers", detail: "After each assistant response, prints a dim footer with token counts (input/output/cache) and incremental cost. Reads from AppState." },
    ],
    connections: {
      imports: [
        { name: "src/components/HighlightedCode.tsx", why: "Syntax-highlights code blocks before printing" },
        { name: "src/state/AppState.tsx",             why: "Reads messages, cost, session mode" },
        { name: "src/cli/structuredIO.ts",            why: "Delegates to structured output when --output-format=json" },
      ],
      usedBy: ["main.tsx (calls on each new message event)", "cli/handlers/ (uses renderX helpers directly)"],
    },
    concepts: ["ANSI escape codes", "Message type dispatch", "Structured output", "Compact mode", "Cost accounting display"],
    hints: [
      "Why is print.ts 5,500 lines — what's the breakdown between message types?",
      "How does the NO_COLOR env var affect output — where is it checked?",
      "How would you add a new output format (e.g. HTML) to this renderer?",
      "Why is the full tool output kept in AppState even when the display is truncated?",
    ],
  },

  "src/tasks/LocalMainSessionTask.ts": {
    role: "Wraps the full interactive REPL session lifecycle as a Task object — enabling it to be managed, monitored, and stopped using the same task primitives used for sub-agents and shell commands.",
    difficulty: "Advanced",
    analogy: "🎬 A film production company (task manager) that can launch a movie shoot (REPL session) the same way it launches a TV commercial (shell task) or a documentary (agent task). All productions use the same scheduling, monitoring, and cancellation infrastructure.",
    howItWorks: [
      { step: "Implements Task interface", detail: "Exposes start(), stop(), getStatus(), onOutput() — the same interface as LocalAgentTask and LocalShellTask. This lets the coordinator treat a main session like any other task." },
      { step: "Session initialisation", detail: "start() bootstraps AppState, loads tool registry, initialises services (MCP, analytics, memory), then enters the REPL loop." },
      { step: "Activity tracking", detail: "Records lastActivityAt timestamp on every message and tool call. The bridge uses this to detect idle sessions eligible for recycling." },
      { step: "Graceful shutdown", detail: "stop() triggers the session exit sequence: flush pending output, run Stop hooks, write session summary to disk, then resolve the task promise." },
    ],
    connections: {
      imports: [
        { name: "src/tasks/types.ts",  why: "Task interface" },
        { name: "src/screens/REPL.tsx", why: "Renders the REPL screen inside this task" },
        { name: "src/bootstrap/state.ts", why: "Initialises global session state" },
      ],
      usedBy: ["main.tsx (creates this task for interactive mode)", "bridgeMain.ts (manages via Task interface)"],
    },
    concepts: ["Task pattern", "Lifecycle management", "Activity tracking", "Graceful shutdown", "Uniform task abstraction"],
    hints: [
      "Why wrap the REPL as a Task instead of just calling it directly from main.tsx?",
      "How does the bridge use the Task interface to manage REPL sessions?",
      "What happens if stop() is called while a tool is mid-execution?",
      "How does lastActivityAt enable session recycling in high-concurrency bridge scenarios?",
    ],
  },

  "src/keybindings/loadUserBindings.ts": {
    role: "Loads, validates, and merges user-defined keyboard shortcut overrides from .claude/settings.json and ~/.claude.json into the default binding map.",
    difficulty: "Intermediate",
    analogy: "🎹 A piano tuner who takes the factory-tuned piano (defaultBindings.ts) and applies the customer's custom tuning sheet (.claude/settings.json). The tuner checks each adjustment is valid (validate.ts), rejects conflicting notes (reservedShortcuts.ts), and produces the final tuned instrument the player uses.",
    howItWorks: [
      { step: "Load settings files", detail: "Reads keybindings from project settings (.claude/settings.json) and user settings (~/.claude.json). Project settings take precedence over user settings." },
      { step: "Schema validation", detail: "Each keybinding object is validated with the Zod schema from schema.ts. Invalid entries are rejected with an actionable error message naming the bad field." },
      { step: "Conflict detection", detail: "validate.ts checks for duplicate key assignments within the user's bindings and against reservedShortcuts.ts. Conflicts are surfaced as KeybindingWarnings in the UI." },
      { step: "Merge with defaults", detail: "User bindings are merged over the defaultBindings map. User can override any non-reserved binding. The merged result is stored in KeybindingContext." },
    ],
    connections: {
      imports: [
        { name: "src/keybindings/defaultBindings.ts",  why: "Base binding map to merge user overrides into" },
        { name: "src/keybindings/validate.ts",         why: "Validates and reports conflicts" },
        { name: "src/keybindings/schema.ts",           why: "Zod schema for each keybinding entry" },
        { name: "src/utils/settings/",                 why: "Reads settings files from disk" },
      ],
      usedBy: ["src/keybindings/KeybindingProviderSetup.tsx (called at startup)"],
    },
    concepts: ["Settings layering (project > user > default)", "Zod schema validation", "Conflict detection", "Merge pattern"],
    hints: [
      "Why do project-level settings take precedence over user settings?",
      "How would you debug a keybinding that silently isn't working?",
      "What's a reserved shortcut and why can't users override it?",
      "How does validate.ts detect two bindings assigned to the same key?",
    ],
  },

  "src/entrypoints/agentSdkTypes.ts": {
    role: "The public type contract for the Claude Agent SDK npm package — defines HookEvent, ModelUsage, AgentOptions, and all other types that SDK consumers import. Changes here are breaking changes to the public API.",
    difficulty: "Intermediate",
    analogy: "📋 A formal contract between Claude Code (the supplier) and SDK users (the clients). Every type in this file is a legally binding specification. Adding a field is safe. Removing or renaming one breaks every client that depends on it.",
    howItWorks: [
      { step: "HookEvent types", detail: "Defines the shape of events passed to PreToolUse, PostToolUse, and Stop hooks when used via the SDK (not .claude/settings.json shell commands). SDK hooks are TypeScript callbacks instead of shell scripts." },
      { step: "ModelUsage type", detail: "Token counts (input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens) returned after each API call. Used for cost accounting and billing." },
      { step: "AgentOptions", detail: "Configuration passed to the SDK's runAgent() entry point: model, maxTurns, tools, systemPrompt, hooks. The knobs an SDK consumer turns to customise behaviour." },
      { step: "Re-exports from internal modules", detail: "Many types are imported from internal modules (bootstrap/state.ts, types/) and re-exported here as the public surface. This insulates SDK users from internal refactors." },
    ],
    connections: {
      imports: [
        { name: "src/bootstrap/state.ts",  why: "HookCallbackMatcher, AgentColorName used in HookEvent" },
        { name: "src/types/",              why: "Imports internal types to re-export as public SDK types" },
      ],
      usedBy: ["src/entrypoints/sdk/ (implements these contracts)", "External SDK consumers (import from '@anthropic-ai/claude-code')"],
    },
    concepts: ["Public API surface", "Breaking vs non-breaking changes", "Type re-export pattern", "SDK contract design"],
    hints: [
      "Why are SDK types kept in a separate file rather than spread across modules?",
      "What's the difference between a PreToolUse SDK hook and a PostToolUse shell hook?",
      "How do you add a new field to AgentOptions without breaking existing users?",
      "Why does ModelUsage include cache_read_input_tokens separately from input_tokens?",
    ],
  },

  "src/remote/SessionsWebSocket.ts": {
    role: "WebSocket server managing remote Claude Code sessions — accepts connections from web clients, authenticates them, and routes their messages to the appropriate session runner.",
    difficulty: "Advanced",
    analogy: "🏨 A hotel front desk with a walkie-talkie network. Guests (web clients) check in via WebSocket, get assigned a room (session), and communicate through the walkie-talkie system. The front desk authenticates each guest, routes their requests to the right room, and coordinates check-out.",
    howItWorks: [
      { step: "WebSocket server setup", detail: "Creates a ws.Server listening on a configured port. TLS is handled at the reverse-proxy layer; the server itself accepts plain WebSocket connections from localhost." },
      { step: "Authentication on connect", detail: "On each new connection, validates the session token from the query string against the RemoteSessionManager's active token registry. Rejects invalid tokens with a 401 close code." },
      { step: "Message routing", detail: "Incoming WebSocket messages are parsed as JSON, matched to a session by session ID, and dispatched to the session's RemoteSessionManager. Responses flow back over the same WebSocket." },
      { step: "Reconnection handling", detail: "If a client disconnects and reconnects with the same session token, the WebSocket is reattached to the existing session. Buffered messages from while disconnected are replayed." },
    ],
    connections: {
      imports: [
        { name: "ws",                              why: "WebSocket server implementation" },
        { name: "src/remote/RemoteSessionManager.ts", why: "Routes messages to the correct session" },
        { name: "src/bootstrap/state.ts",          why: "Reads port configuration and auth settings" },
      ],
      usedBy: ["main.tsx (started when --remote-server flag is active)"],
    },
    concepts: ["WebSocket server", "Token authentication", "Message routing", "Reconnection buffering", "Session multiplexing"],
    hints: [
      "How does the server distinguish messages for different sessions on the same WebSocket connection?",
      "What happens to messages buffered while a client was disconnected?",
      "Why is TLS terminated at the reverse proxy rather than in this server?",
      "How would you add rate limiting to protect against message flooding?",
    ],
  },

  // ── Phase-1 Directories ──────────────────────────────────────────────

  "src/hooks": {
    role: "React hooks layer — all stateful UI logic is encapsulated here, keeping components thin and testable. Typeahead, inbox polling, file suggestions, shell history, and keybinding context all live in this folder.",
    difficulty: "Intermediate",
    analogy: "🎛️ The control panel of a recording studio. The microphone (component) just captures sound, but all the mixing knobs — reverb, EQ, compression — are the hooks. You swap out a knob without rewiring the microphone.",
    howItWorks: [
      { step: "useTypeahead.tsx — 600+ line suggestion engine", detail: "Manages the inline typeahead popup: slash-commands, @file paths, shell history completions, Slack channel names (#channel), agent names, and shell completions. Uses debounce, unicode-aware regex, and background cache refresh." },
      { step: "useInboxPoller.ts — background polling", detail: "Polls the notification inbox endpoint on a fixed interval. Surfaces new notification badges in the UI. Uses AbortSignal for teardown and avoids re-triggering while already polling." },
      { step: "fileSuggestions.ts — file-index backed completions", detail: "Builds an in-memory file index on startup, then provides O(1) prefix search for @file completions. Refreshes the cache in the background after each file write." },
      { step: "useKeybinding.ts — keyboard shortcut registry", detail: "Registers named keybindings from settings. Components call useKeybindings(['editor.submit']) to get platform-aware key strings without hardcoding Ctrl/Cmd logic." },
    ],
    connections: {
      imports: [
        { name: "src/context/",     why: "Reads overlay, notification, and app contexts" },
        { name: "src/state/",       why: "Reads AppState via useAppStateStore" },
        { name: "src/keybindings/", why: "Consumes keybinding registry" },
      ],
      usedBy: ["components/PromptInput/", "components/Inbox/", "main.tsx"],
    },
    concepts: ["Custom React hooks", "Debounce pattern", "Background cache refresh", "Keyboard shortcut registry", "Typeahead UX"],
    hints: [
      "Why are file completions cached in memory rather than queried on every keystroke?",
      "How does useTypeahead handle unicode paths (CJK filenames, accented chars)?",
      "What's the difference between useKeybinding and directly listening for keyboard events?",
      "How does the inbox poller avoid spamming the server if the user has Claude open all day?",
    ],
  },

  "src/hooks/useTypeahead.tsx": {
    role: "The core typeahead / autocomplete engine for the prompt input box. Handles slash-commands, @file paths, shell completions, Slack channel names, shell history, and agent names — all in one unified suggestion list.",
    difficulty: "Advanced",
    analogy: "🔭 A smart search bar like VS Code's Command Palette. As you type, it simultaneously queries multiple sources (commands, file system, history, external APIs), merges them into a ranked list, and lets you navigate with arrow keys — all without blocking the UI thread.",
    howItWorks: [
      { step: "Input classification", detail: "Regex patterns (AT_TOKEN_HEAD_RE, HASH_CHANNEL_RE, etc.) classify each keystroke: is it an @file path, a #slack-channel, a /slash-command, or plain text? Each type triggers a different completion backend." },
      { step: "Unified suggestion merge", detail: "generateUnifiedSuggestions() collects results from all active backends and deduplicates by ID. The list is scored and trimmed to a max display count." },
      { step: "Keyboard navigation with overlay context", detail: "useRegisterOverlay() integrates with the overlay system so arrow keys and Enter are captured by the suggestion list and don't bubble to the REPL. Dismissed via Escape." },
      { step: "Selection preservation on update", detail: "getPreservedSelection() tries to keep the same suggestion highlighted after the list refreshes (by matching suggestion IDs), preventing the cursor jumping to position 0 on every keystroke." },
      { step: "Ghost text inline hint", detail: "The top suggestion can render as inline ghost text directly in the input. When the user presses Tab, the ghost text is applied. This is distinct from the popup list." },
    ],
    connections: {
      imports: [
        { name: "src/context/notifications.js",    why: "Surfaces typeahead errors as toast notifications" },
        { name: "src/keybindings/",                why: "Tab/Enter/Escape are keybinding-driven, not hardcoded" },
        { name: "src/utils/suggestions/",          why: "commandSuggestions, directoryCompletion, shellHistoryCompletion, slackChannelSuggestions" },
        { name: "src/hooks/fileSuggestions.js",    why: "File index for @path completions" },
        { name: "src/hooks/unifiedSuggestions.js", why: "Merges all suggestion sources into one ranked list" },
      ],
      usedBy: ["components/PromptInput/PromptInput.tsx"],
    },
    concepts: ["Typeahead / autocomplete", "Unicode-aware regex", "Overlay context pattern", "Ghost text", "Debounce", "Multi-source suggestion merge"],
    hints: [
      "Why use unicode property escapes (\\p{L}, \\p{N}) rather than simple \\w in path regexes?",
      "How does the ghost-text hint differ from the popup suggestion list — when is each shown?",
      "What happens if two suggestion backends return conflicting entries with the same ID?",
      "How does the overlay system prevent arrow keys from scrolling the terminal while the popup is open?",
    ],
  },

  "src/constants": {
    role: "Compile-time constants and runtime-computed configuration — system prompt text, tool names, XML tag strings, output style definitions, and session metadata. Everything that's 'always true' about the system lives here.",
    difficulty: "Beginner",
    analogy: "📜 The legal contract template of the system. The actual negotiation (runtime) fills in names and dates, but the clauses (system prompt wording, tool names, XML tags) are fixed upfront. You change a clause once and every contract using it updates automatically.",
    howItWorks: [
      { step: "prompts.ts — system prompt assembly", detail: "Exports a getSystemPrompt() function that reads runtime state (OS, CWD, git, model, settings) and interpolates it into the static prompt template. This is sent as the 'system' message on every API call." },
      { step: "common.ts — session-level constants", detail: "getSessionStartDate(), model IDs, and other values that are constant for the lifetime of a session but vary between sessions." },
      { step: "outputStyles.ts — rendering styles", detail: "Defines color/format styles for different output categories: code blocks, errors, hints, tool results. Components import style names from here rather than hardcoding colors." },
      { step: "xml.ts — XML tag strings", detail: "Tool results and structured data are wrapped in XML tags like <function_calls>. All tag names are exported as constants so they stay in sync between producer (tool output) and consumer (prompt assembly)." },
    ],
    connections: {
      imports: [
        { name: "src/utils/",     why: "Reads env, git, cwd, model, settings, worktree state at prompt assembly time" },
        { name: "src/tools/*/",   why: "Imports TOOL_NAME constants from each tool to keep tool references consistent" },
        { name: "src/memdir/",    why: "loadMemoryPrompt() injected into system prompt each turn" },
      ],
      usedBy: ["QueryEngine.ts (passes system prompt to API)", "all tools (import their own name constants)"],
    },
    concepts: ["System prompt engineering", "Compile-time vs runtime constants", "XML tagging for LLM output", "Output style tokens"],
    hints: [
      "Why are tool names declared as constants rather than just using string literals?",
      "What information in the system prompt changes on every single API call vs stays the same?",
      "How does memory injection (loadMemoryPrompt) work — when is it called?",
      "Why wrap tool results in XML tags instead of just returning plain text?",
    ],
  },

  "src/constants/prompts.ts": {
    role: "Assembles the Claude Code system prompt dynamically at runtime — the most important single file in the repo. It reads OS info, working directory, git status, model, settings, memory files, and feature flags, then stitches them into the instruction set sent to the LLM on every conversation turn.",
    difficulty: "Advanced",
    analogy: "🎬 A film director's shot list that gets customised for every shoot. The script (static prompt template) stays the same, but the cast (tool names), location (CWD), and props (memory files, feature flags) are different every session. Get this file wrong and the entire agent misbehaves.",
    howItWorks: [
      { step: "Massive import section", detail: "Imports tool name constants from every tool directory (BashTool, AgentTool, FileWriteTool, TodoWriteTool…), utils, and services. This file is intentionally import-heavy to keep a single source of truth for what the LLM is told about each tool." },
      { step: "getSystemPrompt(tools, commands, mcpServers) → string", detail: "The main export. Calls resolveSystemPromptSections() which assembles cacheable (stable) and uncacheable (volatile) sections separately for API prompt caching efficiency." },
      { step: "systemPromptSection() for cacheable text", detail: "Stable sections (tool docs, core instructions, safety rules) are wrapped in systemPromptSection(). These hit the Anthropic prompt cache on every turn — crucial for cost." },
      { step: "DANGEROUS_uncachedSystemPromptSection() for volatile text", detail: "Current date, CWD, git branch, and memory file content change frequently. These are placed in uncached sections to avoid cache misses invalidating the stable sections." },
      { step: "loadMemoryPrompt() injection", detail: "Reads MEMORY.md and any relevant per-query memories and appends them to the system prompt. Called fresh on every turn so the agent always has up-to-date notes." },
    ],
    connections: {
      imports: [
        { name: "src/memdir/memdir.js",      why: "Injects MEMORY.md + relevant memories into the prompt" },
        { name: "src/bootstrap/state.js",    why: "Reads isNonInteractiveSession, sessionId flags" },
        { name: "src/services/analytics/",   why: "Reads GrowthBook feature flag values for conditional prompt sections" },
        { name: "src/tools/*/prompt.js",     why: "Each tool exports its own documentation string — imported and stitched in here" },
      ],
      usedBy: ["QueryEngine.ts (passes result to Anthropic API as system param)"],
    },
    concepts: ["Prompt caching", "Dynamic system prompt assembly", "Prompt engineering at scale", "Feature-flag gated instructions", "Memory injection"],
    hints: [
      "What's the difference between a cached and uncached system prompt section — why does it matter for cost?",
      "How does the prompt change when a new MCP server is connected mid-session?",
      "Why is memory injected fresh on every turn rather than once at session start?",
      "How do feature flags change what instructions the LLM receives?",
    ],
  },

  "src/context": {
    role: "React Context providers that share cross-cutting state between deeply nested components — notification toasts, overlay stack, keyboard focus, and app-level flags. Avoids prop drilling for UI state that many components need simultaneously.",
    difficulty: "Intermediate",
    analogy: "📡 A building's public address system. Instead of running wires from the DJ booth (parent component) to every room (child component), the PA broadcasts to everyone who tunes in. Any component can subscribe to toasts or overlay state without props passing through every intermediate layer.",
    howItWorks: [
      { step: "notifications.tsx — toast notification bus", detail: "Provides useNotifications() hook. Components call addNotification({type:'error', message:'…'}) from anywhere in the tree. The NotificationProvider renders them as floating toasts. No prop-drilling needed." },
      { step: "overlayContext.tsx — modal/popup stack", detail: "Tracks which overlays are currently active (typeahead popup, confirmation dialog, etc.). useRegisterOverlay() mounts an overlay; useIsModalOverlayActive() checks if anything is blocking keyboard focus." },
      { step: "keyboardContext.tsx — focus arbitration", detail: "When multiple components want keyboard events (REPL input + typeahead + confirmation dialog), this context decides who has priority. Prevents keystrokes going to both the input and a popup simultaneously." },
    ],
    connections: {
      imports: [
        { name: "React",         why: "createContext, useContext, useState, useCallback" },
        { name: "src/hooks/",    why: "Hooks consume context values" },
      ],
      usedBy: ["main.tsx (wraps all providers)", "components/PromptInput/", "components/Inbox/"],
    },
    concepts: ["React Context API", "Provider pattern", "Prop drilling avoidance", "Overlay stack management", "Cross-cutting concerns"],
    hints: [
      "When should you use React Context vs Zustand store vs local useState?",
      "How does the overlay context prevent keyboard events from leaking to background components?",
      "What happens if a component calls useNotifications() outside a NotificationProvider?",
      "How would you test a component that depends on context values?",
    ],
  },

  "src/state": {
    role: "Framework-agnostic state management layer. createStore() builds observable stores used by AppState, settings caches, and tool state. Chosen over Zustand/Redux because Claude Code runs in both React (Ink) and non-React (headless SDK) contexts.",
    difficulty: "Intermediate",
    analogy: "🏦 A bank's ledger system. Any department (component, hook, background task) can deposit or withdraw, and the ledger fires a notification to all interested parties whenever the balance changes. No department owns the ledger — it's shared infrastructure.",
    howItWorks: [
      { step: "createStore<T>(initialState, onChange?)", detail: "Creates a typed observable store. Callers pass an updater function: setState(prev => ({...prev, count: prev.count+1})). The store calls onChange and all listeners only when the new state differs (Object.is check)." },
      { step: "getState() / setState() / subscribe()", detail: "The three-method Store<T> interface. subscribe() returns an unsubscribe function — React components call it in useEffect cleanup to avoid memory leaks." },
      { step: "AppState.ts — the main application store", detail: "The largest store instance. Holds CWD, session ID, permission mode, tool output history, pending operations, and more. Exposed via useAppStateStore() and useAppState() hooks." },
      { step: "AppStateStore.ts — selector hooks", detail: "Provides fine-grained selector hooks (useCurrentDir(), usePermissionMode()) so components re-render only when their specific slice of state changes." },
    ],
    connections: {
      imports: [
        { name: "store.ts",    why: "createStore() is the only dependency — zero external packages" },
      ],
      usedBy: ["src/hooks/ (consumes via selectors)", "src/services/ (reads permission mode)", "QueryEngine.ts (reads session, CWD)", "main.tsx (initialises AppState)"],
    },
    concepts: ["Observable store pattern", "Selector hooks", "Object.is equality", "Subscription cleanup", "Framework-agnostic state"],
    hints: [
      "Why use Object.is(next, prev) instead of === to skip unchanged state?",
      "Why build a custom store instead of using Zustand or Jotai?",
      "What's the difference between AppState (store instance) and AppStateStore (selector hooks file)?",
      "How does the unsubscribe pattern prevent memory leaks in React components?",
    ],
  },

  "src/state/store.ts": {
    role: "35-line zero-dependency observable store factory. The foundation of all state management in Claude Code — creates typed reactive stores with subscribe/setState/getState without importing React, Zustand, or any external package.",
    difficulty: "Beginner",
    analogy: "⚡ A tiny power strip with a surge protector. Any appliance (component) can plug in (subscribe). When a new value arrives, every appliance is notified. The surge protector (Object.is check) ensures no unnecessary notifications fire.",
    howItWorks: [
      { step: "createStore<T>(initialState, onChange?)", detail: "Returns a Store<T> object. The state variable is captured in a closure — not exported directly — so the only mutations go through setState." },
      { step: "setState with updater function", detail: "Takes a (prev: T) => T updater. This immutable pattern ensures consumers always get a new object reference when state changes, which React's rendering can detect." },
      { step: "Object.is guard", detail: "if (Object.is(next, prev)) return — skips notifications when state hasn't actually changed. Prevents infinite render loops when complex objects are rebuilt but are structurally identical." },
      { step: "Set<Listener> for subscriptions", detail: "Using a Set (not array) means subscribe/unsubscribe are O(1) and duplicate subscriptions are silently ignored." },
    ],
    connections: {
      imports: [],
      usedBy: ["src/state/AppState.ts", "src/state/AppStateStore.ts", "src/utils/settings/settingsCache.ts"],
    },
    concepts: ["Observable pattern", "Closure-based encapsulation", "Immutable state updates", "Set vs Array for subscriptions"],
    hints: [
      "Why does setState accept a function (prev => next) rather than a value directly?",
      "What's the advantage of storing listeners in a Set vs an Array?",
      "How would you add middleware (like logging) to this store?",
      "Why is the state variable kept in a closure rather than exposed as a property?",
    ],
  },

  "src/types": {
    role: "Shared TypeScript type declarations used across the entire codebase — branded ID types, hook schemas, command types, and text input mode types. Centralising types here prevents circular imports and keeps the type system coherent.",
    difficulty: "Beginner",
    analogy: "📋 The shared vocabulary dictionary of a team. If engineers, designers, and managers all use the word 'session' to mean different things, bugs happen. types/ defines exactly what a SessionId, AgentId, or Command IS, and TypeScript enforces everyone speaks the same language.",
    howItWorks: [
      { step: "ids.ts — branded ID types", detail: "SessionId and AgentId are string & {__brand: 'SessionId'} — phantom types that prevent mixing up IDs at compile time. toAgentId() validates the format before branding." },
      { step: "hooks.ts — hook schema types", detail: "Defines the Zod-validated shape of hook configurations: PreToolUse, PostToolUse, Stop hook matchers. Type-safe hook config parsing." },
      { step: "textInputTypes.ts — prompt input types", detail: "PromptInputMode, InlineGhostText, and SuggestionType union types used by the typeahead and prompt input components." },
      { step: "command.ts — command registry types", detail: "The Command interface: name, aliases, description, handler. Used by the slash-command system." },
    ],
    connections: {
      imports: [
        { name: "zod",          why: "hooks.ts uses Zod schemas for hook config validation" },
      ],
      usedBy: ["src/hooks/ (textInputTypes)", "src/bootstrap/state.ts (SessionId)", "src/keybindings/ (hooks types)", "src/commands.ts (Command interface)"],
    },
    concepts: ["Branded / phantom types", "TypeScript type-only imports", "Zod schema types", "Preventing type confusion bugs"],
    hints: [
      "What bug does the SessionId brand prevent that plain string wouldn't catch?",
      "Why is the __brand property marked readonly — what happens if you remove that?",
      "How does toAgentId() differ from asAgentId() — when should you use each?",
      "When should a type live in types/ vs be co-located with the module that uses it?",
    ],
  },

  "src/types/ids.ts": {
    role: "Branded string types for SessionId and AgentId — a compile-time safety net that makes it impossible to accidentally pass a session ID where an agent ID is expected, or vice versa.",
    difficulty: "Beginner",
    analogy: "🎫 Two types of stadium passes — a VIP wristband (SessionId) and a press badge (AgentId). They're both made of plastic (string), but the scanner (TypeScript) refuses to let you swap them. You can't sneak into the VIP lounge with a press badge even though they look identical.",
    howItWorks: [
      { step: "Branded type declaration", detail: "type SessionId = string & { readonly __brand: 'SessionId' }. The __brand property only exists in the type system — it has zero runtime cost. TypeScript treats SessionId and AgentId as incompatible even though both are strings at runtime." },
      { step: "asSessionId / asAgentId — trust casts", detail: "Used at the system boundary (e.g., when reading a raw string from config). These are type assertions — no validation. Use sparingly." },
      { step: "toAgentId — validated cast", detail: "Checks the format with AGENT_ID_PATTERN (/^a(?:.+-)?[0-9a-f]{16}$/) before branding. Returns null if invalid. Use this when parsing IDs from external sources." },
    ],
    connections: {
      imports: [],
      usedBy: ["src/bootstrap/state.ts", "src/tools/AgentTool/", "src/utils/sessionStorage.ts", "src/hooks/useTypeahead.tsx"],
    },
    concepts: ["Phantom / branded types", "Compile-time type safety", "Type assertion vs type guard", "Zero-cost abstractions"],
    hints: [
      "Why doesn't the __brand property appear in the compiled JavaScript output?",
      "When would you choose asAgentId (trust cast) vs toAgentId (validated cast)?",
      "How does the AGENT_ID_PATTERN regex encode the expected format — what does it match?",
      "Could you implement branded types with a class instead of intersection types?",
    ],
  },

  "src/memdir": {
    role: "The memory subsystem — reads, indexes, and injects per-project memory files (MEMORY.md and domain-specific .md files) into the LLM's context. Also uses a side-LLM call to find the most relevant memories for each query without burning main-context tokens.",
    difficulty: "Advanced",
    analogy: "🗄️ A research librarian who knows what's in every folder without having read every page. When you ask a question, the librarian quickly scans filing labels (memory headers), picks the 3–5 most relevant folders, and puts them on your desk — rather than emptying the entire archive.",
    howItWorks: [
      { step: "memdir.ts — loadMemoryPrompt()", detail: "Called by constants/prompts.ts every turn. Reads MEMORY.md (always included) and calls findRelevantMemories() for additional relevant files." },
      { step: "memoryScan.ts — header extraction", detail: "Scans all .md files in the memory directory. Reads only the first few lines (the 'header') of each file to build a MemoryHeader index — fast even with hundreds of files." },
      { step: "findRelevantMemories.ts — Sonnet selection", detail: "Takes the user's current query + MemoryHeader list, sends them to a side Sonnet call with a selection system prompt. Sonnet returns the filenames of up to 5 most relevant memories." },
      { step: "alreadySurfaced deduplication", detail: "Tracks which memory files were injected in previous turns so the selector doesn't re-pick them. The 5-slot budget is always spent on fresh, novel memories." },
    ],
    connections: {
      imports: [
        { name: "src/utils/sideQuery.js", why: "Runs the Sonnet selection call without affecting the main conversation context" },
        { name: "src/utils/model/model.js", why: "getDefaultSonnetModel() — uses a fast model for selection, not the expensive main model" },
      ],
      usedBy: ["src/constants/prompts.ts (calls loadMemoryPrompt on every turn)"],
    },
    concepts: ["Memory-augmented LLM", "Side-channel LLM query", "File header scanning", "Context budget management", "Per-project memory"],
    hints: [
      "Why use a separate Sonnet call for memory selection rather than including all memories in the main context?",
      "How does 'alreadySurfaced' prevent the agent from repeating itself?",
      "What's in a MemoryHeader — how does it enable selection without reading full files?",
      "How would you extend this system to support memory expiration (time-based decay)?",
    ],
  },

  "src/memdir/findRelevantMemories.ts": {
    role: "Uses a fast side-LLM call (Sonnet) to select up to 5 relevant memory files from the project memory directory for each user query — without injecting all memories into the main context window.",
    difficulty: "Advanced",
    analogy: "🧠 A semantic search engine that asks a second AI 'which of these filing labels are relevant to this question?' instead of reading every file. The second AI is fast and cheap — it only sees labels, not content. This is AI using AI as a tool.",
    howItWorks: [
      { step: "scanMemoryFiles(memoryDir, signal)", detail: "Reads the memory directory and returns MemoryHeader objects — filename + first-few-lines description — for each .md file. Fast because it doesn't read full file content." },
      { step: "Filter alreadySurfaced", detail: "Removes memory files that were already injected in prior turns. This ensures the 5-slot budget is always spent on new information." },
      { step: "selectRelevantMemories() via sideQuery", detail: "Sends the query + memory header list to Sonnet with SELECT_MEMORIES_SYSTEM_PROMPT. The prompt instructs Sonnet to be selective and return only filenames of clearly useful memories." },
      { step: "Result assembly with mtime", detail: "Maps selected filenames back to full paths and mtimes (for freshness display). Returns RelevantMemory[] — path + mtimeMs — to the caller." },
    ],
    connections: {
      imports: [
        { name: "src/utils/sideQuery.js",     why: "Runs the selection LLM call as a side channel" },
        { name: "src/memdir/memoryScan.js",   why: "Provides MemoryHeader[] to select from" },
        { name: "src/utils/model/model.js",   why: "Gets the default Sonnet model for selection" },
      ],
      usedBy: ["src/memdir/memdir.ts (called by loadMemoryPrompt)"],
    },
    concepts: ["LLM-as-selector", "Side-channel AI query", "Context budget management", "AbortSignal for cooperative cancellation"],
    hints: [
      "Why does the selection system prompt say 'be selective and discerning' — what happens if you're not?",
      "What does sideQuery do differently from a regular QueryEngine call?",
      "How does AbortSignal allow the selection to be cancelled if the user types a new message?",
      "What's the mtime used for in the returned RelevantMemory objects?",
    ],
  },

  "src/bootstrap": {
    role: "Process-level singleton state initialised once at startup and never reset. Holds OpenTelemetry providers, total cost/duration accumulators, session ID, project root, hook matchers, and the non-interactive session flag. The single source of truth for cross-session global state.",
    difficulty: "Advanced",
    analogy: "🏛️ The foundation slab of a building — poured once before construction begins, never modified. Every room (module) can read what's in the foundation (query session ID, cost accumulator), but nobody is allowed to tear it up and repour it mid-project.",
    howItWorks: [
      { step: "State type with 50+ fields", detail: "Covers telemetry providers (MeterProvider, TracerProvider, LoggerProvider), cost accumulators (totalCostUSD, totalAPIDuration), session metadata (sessionId, projectRoot), and safety flags (isNonInteractiveSession, permissionMode)." },
      { step: "Module-level let state variable", detail: "A single module-level variable holds the current state. getState() and setState() are the only access points. This is NOT a React store — it's a plain module singleton." },
      { step: "resetSettingsCache on setState", detail: "When state is set, it calls resetSettingsCache() to invalidate cached settings reads. Ensures settings always reflect the current state after any update." },
      { step: "getIsNonInteractiveSession()", detail: "Exported helper checked by constants/prompts.ts to adjust prompt wording for headless/SDK mode vs interactive terminal mode." },
    ],
    connections: {
      imports: [
        { name: "@opentelemetry/api",          why: "Meter, Attributes, MetricOptions for telemetry" },
        { name: "@anthropic-ai/sdk",           why: "BetaMessageStreamParams type" },
        { name: "src/utils/crypto.js",         why: "randomUUID() for session ID generation" },
        { name: "src/utils/settings/",         why: "resetSettingsCache() called on every state update" },
      ],
      usedBy: ["src/constants/prompts.ts", "src/services/api/", "QueryEngine.ts", "main.tsx"],
    },
    concepts: ["Module singleton pattern", "OpenTelemetry integration", "Process-level state", "Non-React state management", "Bootstrap isolation rule"],
    hints: [
      "Why is this state NOT stored in AppState (the React store) — what's the difference in their lifetimes?",
      "What does the 'bootstrap-isolation' eslint rule enforce — why does it exist?",
      "How does totalCostUSD get accumulated — who increments it and when?",
      "Why must getIsNonInteractiveSession() exist — when would prompts.ts behave differently in SDK mode?",
    ],
  },

  "src/bootstrap/state.ts": {
    role: "Defines the 1,758-line bootstrap State type, the module-level singleton, and all exported getter/setter helpers. The authoritative source for process-wide configuration accessed by every major subsystem.",
    difficulty: "Advanced",
    analogy: "🖥️ A BIOS chip on a motherboard — loads before the operating system, sets CPU speed, RAM configuration, and boot order, then hands off. Every device driver (subsystem) reads BIOS settings but nothing can rewrite the BIOS mid-boot.",
    howItWorks: [
      { step: "State type declaration (50+ fields)", detail: "Covers originalCwd, projectRoot, totalCostUSD, totalAPIDuration, turnHookDurationMs, sessionId, permissionMode, hookMatchers, OpenTelemetry providers, model overrides, and more. A living ledger of runtime configuration." },
      { step: "let state: State = defaultState()", detail: "Module-level singleton. Initialised once when the module first imports. No React, no Zustand — just a plain JavaScript module variable with controlled access." },
      { step: "Exported getters and setters", detail: "getOriginalCwd(), getProjectRoot(), getTotalCostUSD(), addCost(amount), getIsNonInteractiveSession() etc. — each is a narrow accessor that prevents callers from accidentally mutating unrelated fields." },
      { step: "resetSettingsCache side-effect", detail: "Every setState() call triggers resetSettingsCache() to invalidate the settings memoization layer, ensuring settings are always re-read after a state change." },
    ],
    connections: {
      imports: [
        { name: "@opentelemetry/*",         why: "Types for MeterProvider, TracerProvider, LoggerProvider" },
        { name: "src/types/ids.ts",         why: "SessionId branded type" },
        { name: "src/utils/settings/",      why: "resetSettingsCache() called in setState" },
        { name: "src/utils/crypto.js",      why: "randomUUID() for new session IDs" },
      ],
      usedBy: ["src/constants/prompts.ts", "src/services/api/", "src/services/analytics/", "QueryEngine.ts", "main.tsx (initialises on startup)"],
    },
    concepts: ["Module singleton", "Narrow accessor pattern", "OpenTelemetry bootstrap", "Cost accounting", "Session identity"],
    hints: [
      "Why are there separate totalCostUSD and per-turn accumulators — what's each used for?",
      "How does the bootstrap-isolation eslint rule prevent circular dependencies from this file?",
      "What would break if two modules each imported state.ts and got different singleton instances?",
      "How do OpenTelemetry providers get injected — is it at module load or at runtime init?",
    ],
  },

  "src/schemas": {
    role: "Zod schemas for validating external inputs — hook configuration files, plugin manifests, and user settings. Schemas live separately from the types they validate so they can be shared without pulling in heavy runtime dependencies.",
    difficulty: "Beginner",
    analogy: "🛡️ A passport control checkpoint. Every piece of external data (config file, hook definition, plugin manifest) must pass through schema validation before entering the application. The schema rejects malformed input early, before it can cause obscure failures deep in the system.",
    howItWorks: [
      { step: "hooks.ts — hook config schemas", detail: "Zod schema for PreToolUse, PostToolUse, and Stop hook matchers. Validates that hook configs have the required fields (matcher, command, timeout) and correct types. Called when loading .claude/settings.json." },
      { step: "Runtime parse() calls", detail: "z.parse() throws with a detailed error message if the input doesn't match. This surfaces config errors with actionable messages ('expected string, got number at hooks[0].command') rather than cryptic downstream failures." },
    ],
    connections: {
      imports: [
        { name: "zod", why: "All schemas use the Zod library for declarative validation" },
      ],
      usedBy: ["src/utils/settings/settings.ts (validates hook configs on load)", "src/types/hooks.ts (infers TypeScript types from schemas)"],
    },
    concepts: ["Zod schema validation", "Runtime type safety", "Configuration validation", "Fail-fast principle"],
    hints: [
      "Why are schemas in a separate directory from types/ — could they be co-located?",
      "What's the difference between z.parse() and z.safeParse()?",
      "How do you infer a TypeScript type from a Zod schema?",
      "What happens if a user has an invalid hook config — how does this schema surface the error?",
    ],
  },

  // ── Phase-6 services/ Key Files ──────────────────────────────────────────

  "src/services/api/claude.ts": {
    role: "The 3,419-line core streaming API client — the single file responsible for every call to the Anthropic API. Handles SSE streaming, token counting, cost attribution, prompt caching, retry logic, and streaming normalisation.",
    difficulty: "Advanced",
    analogy: "🛰️ Mission Control for API communication. Every message Claude sends or receives passes through this satellite link. It handles signal loss (retry), bandwidth limits (rate limiting), telemetry (cost/token tracking), and frequency management (prompt cache). Nothing reaches the Anthropic servers except through here.",
    howItWorks: [
      { step: "createApiStream() — builds the API request", detail: "Assembles the full messages array, system prompt, tools list, model, and API parameters. Applies prompt caching headers to stable sections." },
      { step: "SSE streaming with event parsing", detail: "Uses the Anthropic SDK's streamMessage(). Processes server-sent events: message_start, content_block_start, content_block_delta, message_delta, message_stop." },
      { step: "Token counting and cost tracking", detail: "On message_stop, reads input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens. Calls addCost() on bootstrap state with the calculated USD cost." },
      { step: "Streaming normalisation", detail: "Combines incremental delta events into complete content blocks before dispatching. Handles thinking blocks (extended thinking), tool_use blocks, and text blocks separately." },
      { step: "withRetry wrapper", detail: "All calls go through withRetry.ts. 429 → exponential backoff. 529 (overloaded) → longer backoff. Auth errors → immediate fail. Network errors → configurable retry count." },
    ],
    connections: {
      imports: [
        { name: "@anthropic-ai/sdk",            why: "The official Anthropic TypeScript SDK" },
        { name: "src/services/api/withRetry.ts", why: "Wraps every API call with retry logic" },
        { name: "src/bootstrap/state.ts",        why: "addCost(), getSessionId(), model config" },
        { name: "src/services/api/logging.ts",   why: "Logs every request/response for debugging" },
      ],
      usedBy: ["QueryEngine.ts (all LLM calls)", "src/utils/sideQuery.ts (side-channel queries)"],
    },
    concepts: ["Server-sent events (SSE)", "Prompt caching", "Token cost accounting", "Streaming normalisation", "Exponential backoff retry"],
    hints: [
      "Why does the file need to track cache_read_input_tokens separately from input_tokens?",
      "How does streaming normalisation combine delta events into complete blocks?",
      "What happens if the API returns a 529 'overloaded' error mid-stream?",
      "How does prompt caching work — what makes a section 'cacheable'?",
    ],
  },

  "src/services/mcp/client.ts": {
    role: "The 3,348-line MCP protocol client — connects to MCP servers via stdio or SSE, authenticates, discovers their tool/resource capabilities, and dispatches tool calls on behalf of the agent.",
    difficulty: "Advanced",
    analogy: "🔌 A universal adapter that lets Claude plug into any MCP-compatible tool server. Just like a universal power adapter has the same interface on both ends regardless of what's plugged in, MCPClient presents the same Tool interface to Claude regardless of whether the MCP server is a local Python script, a remote SaaS API, or a database.",
    howItWorks: [
      { step: "Server connection", detail: "Connects via stdio (local process) or SSE (remote URL). Sends the MCP 'initialize' handshake with protocol version and client capabilities." },
      { step: "Capability discovery", detail: "Calls tools/list and resources/list to discover what the server provides. Converts MCP tool schemas to Zod schemas for validation." },
      { step: "Dynamic Tool registration", detail: "For each discovered MCP tool, creates a MCPToolProxy implementing the Tool interface. These proxies appear in QueryEngine's tool map alongside native tools." },
      { step: "Tool execution dispatch", detail: "When Claude calls an MCP tool, the proxy calls tools/call on the MCP server with the validated input. Handles streaming results and content type normalisation." },
      { step: "Connection lifecycle", detail: "Manages reconnection on transport failure, tracks server health, and cleans up tool registrations when a server disconnects." },
    ],
    connections: {
      imports: [
        { name: "@modelcontextprotocol/sdk", why: "MCP SDK for protocol implementation" },
        { name: "src/services/mcp/auth.ts",  why: "OAuth authentication for authenticated MCP servers" },
        { name: "src/services/mcp/config.ts",why: "MCP server configuration and persistence" },
      ],
      usedBy: ["main.tsx (connects all configured MCP servers on startup)", "QueryEngine.ts (uses discovered tools)"],
    },
    concepts: ["Model Context Protocol", "Dynamic tool registration", "stdio/SSE transports", "Capability negotiation", "Proxy pattern"],
    hints: [
      "How does an MCP tool proxy implement the same Tool interface as a native tool?",
      "What's the difference between a tool and a resource in MCP?",
      "How does the client handle a MCP server that stops responding mid-session?",
      "Why does MCP use JSON-RPC 2.0 instead of REST for its protocol?",
    ],
  },

  "src/services/compact/compact.ts": {
    role: "Full conversation compaction — summarises the conversation history using an LLM call to free context window space while preserving the key facts and decisions the agent needs to continue working.",
    difficulty: "Advanced",
    analogy: "🗜️ A ZIP compressor for conversations. Instead of throwing away messages when the context fills up, compact.ts intelligently summarises them — like a ZIP file that can be decompressed back into its key facts. The agent can continue working from the summary without losing critical context.",
    howItWorks: [
      { step: "Trigger detection", detail: "autoCompact.ts monitors context usage. When it exceeds a configurable threshold (default 85%), it calls compact() synchronously before the next turn." },
      { step: "History splitting", detail: "Splits messages into 'safe to summarise' (older assistant turns, completed tool calls) and 'must keep' (the most recent N messages, any in-progress tool calls)." },
      { step: "Summarisation LLM call", detail: "Sends the 'safe' messages to Claude with the compaction prompt template. The prompt instructs: preserve decisions, file names, key facts. Return a concise summary." },
      { step: "History replacement", detail: "Replaces the summarised messages with a single assistant message containing the summary. The 'must keep' messages are appended after." },
      { step: "Memory persistence", detail: "sessionMemoryCompact.ts additionally distils session key facts into MEMORY.md so they survive future compactions. Important decisions persist across the entire project lifetime." },
    ],
    connections: {
      imports: [
        { name: "src/services/api/claude.ts",   why: "Makes the summarisation LLM call" },
        { name: "src/services/compact/prompt.ts", why: "Compaction prompt template" },
        { name: "src/state/AppState.tsx",        why: "Reads and writes the message list" },
      ],
      usedBy: ["src/services/compact/autoCompact.ts (triggers at threshold)", "src/commands/compact/ (manual /compact command)"],
    },
    concepts: ["Context window management", "Conversation summarisation", "Memory persistence", "History splitting strategy"],
    hints: [
      "What's the minimum number of messages that must always be kept (never summarised)?",
      "How does the compaction decide which facts are 'key' enough to preserve?",
      "What happens if the summary itself is longer than the messages it replaced?",
      "How does sessionMemoryCompact.ts work in conjunction with regular compaction?",
    ],
  },

  "src/services/analytics/growthbook.ts": {
    role: "The 1,155-line GrowthBook SDK wrapper — manages feature flags, A/B experiments, and live configuration updates. Every experimental feature in Claude Code is gated behind a GrowthBook feature flag checked here.",
    difficulty: "Intermediate",
    analogy: "🎛️ A software dimmer switch panel. Each feature is a switch that can be on, off, or graduated (10% of users, 50%, 100%). GrowthBook manages the switch states remotely — Anthropic engineers can flip switches without shipping a new version. Some switches have values (not just on/off): e.g. 'max_context_window: 100000'.",
    howItWorks: [
      { step: "SDK initialisation", detail: "Connects to GrowthBook's API endpoint with the user's attributed ID (hashed email or random UUID for anonymous users). Downloads the feature manifest on startup." },
      { step: "Feature evaluation", detail: "isFeatureEnabled(featureKey) checks the manifest and any active experiments. Returns boolean. getFeatureValue(featureKey, defaultValue) returns typed values." },
      { step: "Experiment assignment", detail: "A/B experiments use a stable hash of the user ID to assign them to a bucket. The same user always gets the same bucket — no flickering between test/control." },
      { step: "Live updates", detail: "A background SSE connection receives push updates when feature flags change. getFeatureValue_CACHED_MAY_BE_STALE() reads the cached value — fast but potentially 1-2 seconds stale." },
      { step: "Attributes for targeting", detail: "User attributes (subscription tier, OS, Claude version) are sent to GrowthBook for segment-based targeting: e.g. 'enable X only for Pro tier users on macOS'." },
    ],
    connections: {
      imports: [
        { name: "@growthbook/growthbook",        why: "The GrowthBook SDK" },
        { name: "src/bootstrap/state.ts",         why: "Reads user ID, subscription tier for targeting" },
        { name: "src/services/analytics/index.ts", why: "Initialises GrowthBook as part of analytics setup" },
      ],
      usedBy: ["src/constants/prompts.ts (feature-gated prompt sections)", "All features using isFeatureEnabled()", "bridge/bridgeEnabled.ts"],
    },
    concepts: ["Feature flags", "A/B experiments", "Stable bucket assignment", "Server-sent events push updates", "Segment-based targeting"],
    hints: [
      "Why use a hash of the user ID for experiment assignment instead of random?",
      "What's the difference between isFeatureEnabled() and getFeatureValue_CACHED_MAY_BE_STALE()?",
      "How do feature flags enable safe rollout of risky features like bypass_permissions?",
      "What happens if the GrowthBook endpoint is unreachable at startup?",
    ],
  },

  "src/services/autoDream/autoDream.ts": {
    role: "The DreamTask — a background LLM task that runs after each session to extract key facts, decisions, and project-specific knowledge from the conversation and append them to MEMORY.md for future sessions.",
    difficulty: "Advanced",
    analogy: "💭 The brain's sleep consolidation process. During the day (session), the brain (agent) collects experiences. During sleep (autoDream), the brain processes those experiences, keeps the important ones, discards the mundane, and stores them in long-term memory (MEMORY.md). Next day, the agent wakes up knowing what it learned.",
    howItWorks: [
      { step: "Trigger condition", detail: "Runs after each session if: the session had >= MIN_SESSION_LENGTH exchanges AND autoDream is enabled (feature flag). Runs asynchronously — doesn't delay the user's next session start." },
      { step: "Consolidation lock", detail: "consolidationLock.ts acquires a file lock before writing to MEMORY.md. Prevents concurrent dream tasks from two overlapping sessions corrupting the file." },
      { step: "Fact extraction LLM call", detail: "Sends the full session history to Claude (using a cheap model) with consolidationPrompt.ts. Extracts: decisions made, patterns established, project-specific facts, common mistakes to avoid." },
      { step: "MEMORY.md append", detail: "Appends extracted facts to MEMORY.md with a datestamp. Existing entries are never deleted — the file grows over time as knowledge accumulates." },
      { step: "Deduplication (future)", detail: "The findRelevantMemories system handles 'too many memories' at read time by scoring and limiting to 5 relevant files per turn. Full deduplication via /consolidate-memory skill." },
    ],
    connections: {
      imports: [
        { name: "src/services/api/claude.ts",          why: "Runs the fact extraction LLM call" },
        { name: "src/services/autoDream/consolidationLock.ts", why: "Prevents concurrent writes" },
        { name: "src/memdir/",                          why: "Reads and writes the memory directory" },
      ],
      usedBy: ["main.tsx (schedules as background task after session end)"],
    },
    concepts: ["Background task processing", "File locking", "Memory consolidation", "Async session post-processing", "Knowledge accumulation"],
    hints: [
      "Why run autoDream AFTER the session ends rather than during it?",
      "How does the consolidation lock handle the case where the computer crashes during writing?",
      "What determines whether a session is 'long enough' to be worth dreaming about?",
      "How does the agent's memory grow over months — what does MEMORY.md look like after 100 sessions?",
    ],
  },

  // ── Phase-5 utils/ Key Files ─────────────────────────────────────────────

  "src/utils/permissions/permissions.ts": {
    role: "The 1,486-line core permission evaluation engine — the single function every tool call passes through before executing. Reads permission mode, allow/deny rules, and classifier decisions to return allow | deny | ask.",
    difficulty: "Advanced",
    analogy: "🔐 A multi-level security gate at a government building. Level 1: is the badge authorised at all? Level 2: does the visitor's clearance cover this wing? Level 3: is this specific room on the approved list? Level 4: does the auto-classifier approve this specific action? Only after all levels pass does the door open.",
    howItWorks: [
      { step: "Mode shortcircuits", detail: "bypass_permissions → immediate allow. plan_mode → only PLAN_MODE_SAFE_TOOLS allowed. These are checked first so everything else is gated on the mode." },
      { step: "Hard deny rules", detail: "Enterprise MDM-configured alwaysDenyRules are checked next. These cannot be overridden by users — used for corporate policy enforcement." },
      { step: "Hard allow rules", detail: "User-configured alwaysAllowRules from .claude/settings.json. Rules like 'Bash(git *)' allow matching commands without prompting." },
      { step: "Auto-mode classifier", detail: "In auto mode, yoloClassifier.ts analyzes the specific command/path and returns a confidence score. High confidence → allow. Low confidence or dangerous pattern → ask." },
      { step: "Default: ask", detail: "If nothing matched, returns 'ask' — show the approval dialog. This is the safe default for any new tool or command the agent hasn't seen before." },
    ],
    connections: {
      imports: [
        { name: "permissionsLoader.ts",  why: "Loads the current rule set" },
        { name: "yoloClassifier.ts",     why: "Auto-mode safety classifier" },
        { name: "dangerousPatterns.ts",  why: "Pre-compiled regex for obviously-dangerous commands" },
      ],
      usedBy: ["Every tool's execute() function", "QueryEngine.ts (pre-call check)"],
    },
    concepts: ["Multi-level security gate", "Policy evaluation order", "Fail-safe default", "Auto-mode classification", "Enterprise policy enforcement"],
    hints: [
      "Why does bypass_permissions mode check first instead of last?",
      "How do you write an alwaysAllowRule that permits only 'git status' but not 'git push'?",
      "What makes yoloClassifier different from a simple regex allowlist?",
      "How does the system handle a command that matches both an allow AND a deny rule?",
    ],
  },

  "src/utils/bash/bashParser.ts": {
    role: "A 4,436-line complete bash parser that produces an Abstract Syntax Tree (AST) from shell command strings. Powers the permission classifier, read-only command validation, and shell completion — without executing any code.",
    difficulty: "Advanced",
    analogy: "🔬 A molecular analyser for bash commands. Instead of running `rm -rf /` (dangerous!), the parser dissects its DNA: 'this is a command node, rm is the executable, -r and -f are flags, / is the argument'. Once you have the AST, you can reason about what the command WOULD do without ever running it.",
    howItWorks: [
      { step: "Lexer: string → token stream", detail: "Tokenises the input into WORD, OPERATOR, REDIRECT, HEREDOC_START etc. tokens. Handles quoting rules (single, double, backtick), escape sequences, and unicode." },
      { step: "Parser: tokens → AST", detail: "Recursive descent parser builds AST nodes: Command, Pipeline, List, Subshell, If, While, For, Case, Function. Follows bash grammar specification." },
      { step: "Visitor pattern for analysis", detail: "ast.ts defines the visitor interface. Callers implement visit(node) for each node type they care about. readOnlyCommandValidation.ts uses this to check for writes." },
      { step: "Heredoc handling", detail: "heredoc.ts handles the complex here-document syntax where delimiter, body, and end-marker span multiple lines. Edge cases: <<-, <<'EOF', <<\\EOF." },
    ],
    connections: {
      imports: [
        { name: "ast.ts",      why: "AST node type definitions" },
        { name: "heredoc.ts",  why: "Heredoc parsing specialisation" },
      ],
      usedBy: ["utils/shell/readOnlyCommandValidation.ts", "utils/permissions/bashClassifier.ts", "utils/suggestions/shellHistoryCompletion.ts"],
    },
    concepts: ["Lexer/parser pipeline", "Abstract Syntax Tree", "Recursive descent parsing", "Visitor pattern", "Static analysis without execution"],
    hints: [
      "Why build a full AST instead of using regex to analyse bash commands?",
      "How does the parser handle `$(command substitution)` — what AST node does it produce?",
      "What's the visitor pattern — how does readOnlyCommandValidation use it?",
      "How would the parser handle a command like: echo $(cat /etc/passwd | grep root)?",
    ],
  },

  "src/utils/settings/settings.ts": {
    role: "The 1,015-line unified settings loader — reads .claude/settings.json, ~/.claude.json, MDM configuration, and environment variables, then merges them in priority order into a single validated settings object.",
    difficulty: "Intermediate",
    analogy: "🗂️ A payroll department that collects salary information from four sources: the employment contract (project settings), HR database (user settings), government rules (MDM policy), and emergency overrides (env vars). Each source has a rank, and higher-ranked sources win conflicts.",
    howItWorks: [
      { step: "Layer 1 — environment variables", detail: "CLAUDE_MODEL, CLAUDE_PERMISSION_MODE, NO_COLOR, etc. take highest precedence. Can't be overridden by any config file." },
      { step: "Layer 2 — project settings (.claude/settings.json)", detail: "Project-specific config: tools to allow/deny, custom hooks, model overrides for this codebase. Read relative to CWD." },
      { step: "Layer 3 — user settings (~/.claude.json)", detail: "Personal preferences: theme, preferred model, keybindings, API key. Applies across all projects." },
      { step: "Layer 4 — MDM policy (enterprise)", detail: "Enterprise-managed settings from an MDM server. Can lock specific settings so users can't override them." },
      { step: "Validation and defaults", detail: "The merged settings object is validated with validation.ts Zod schemas. Missing required fields get defaults. Invalid values surface as error messages." },
    ],
    connections: {
      imports: [
        { name: "settings/validation.ts",    why: "Zod validation after merge" },
        { name: "settings/changeDetector.ts", why: "File watcher for live reload" },
        { name: "settings/types.ts",         why: "TypeScript types for all settings" },
      ],
      usedBy: ["bootstrap/state.ts (called on startup)", "query/stopHooks.ts (reads hook config)", "keybindings/loadUserBindings.ts (reads keybinding config)"],
    },
    concepts: ["Configuration layering", "Priority merge", "MDM enterprise management", "Live settings reload", "Fail-safe defaults"],
    hints: [
      "What happens if both project and user settings define different permission modes — which wins?",
      "How does the MDM policy 'lock' a setting so users can't override it?",
      "When is settings.ts called — once on startup or on every operation?",
      "What's the CLAUDE_PERMISSION_MODE env var for — when would you use it?",
    ],
  },

  "src/utils/sideQuery.ts": {
    role: "Runs a quick one-shot LLM call completely outside the main conversation context — no history, no tools, no streaming. Used for memory selection, prompt classification, and other background intelligence tasks.",
    difficulty: "Intermediate",
    analogy: "📞 A private call on a separate phone line. The main conversation is happening on line 1. Line 2 is sideQuery — a completely independent call where you can ask a quick question without interrupting or polluting the main conversation.",
    howItWorks: [
      { step: "Fresh API call with no context", detail: "Creates a new Anthropic API call with only the provided system prompt and single user message. No conversation history, no tools passed. The response is returned as a plain string." },
      { step: "Uses a cost-effective model", detail: "Callers pass getDefaultSonnetModel() — a fast, cheap model appropriate for classification tasks. The main conversation might be using Opus; side queries always use Sonnet." },
      { step: "AbortSignal threading", detail: "The signal parameter threads through to the API call. If the user types a new message mid-side-query, the query is cancelled immediately." },
      { step: "Error handling", detail: "Errors are caught and logged (not thrown). Callers handle null returns gracefully — a failed side query degrades to a default rather than crashing the session." },
    ],
    connections: {
      imports: [
        { name: "src/services/api/",      why: "Makes the actual Anthropic API call" },
        { name: "src/bootstrap/state.ts", why: "Reads session context for API auth" },
      ],
      usedBy: ["src/memdir/findRelevantMemories.ts", "src/utils/contextAnalysis.ts", "src/utils/promptCategory.ts"],
    },
    concepts: ["Side-channel LLM query", "Context isolation", "AbortSignal cooperative cancellation", "Graceful degradation"],
    hints: [
      "Why must side queries NOT include the main conversation history?",
      "What would happen if a side query used the same model as the main conversation?",
      "How does the AbortSignal prevent side queries from running after the user has moved on?",
      "Can a side query call tools — why or why not?",
    ],
  },

  "src/utils/sessionStorage.ts": {
    role: "Reads and writes session NDJSON log files — the persistence layer for all Claude Code conversations. Every message, tool call, and metadata event is appended to a .jsonl file that can be replayed, searched, and resumed.",
    difficulty: "Intermediate",
    analogy: "📼 A VHS recorder for conversations. Every event is recorded to tape in real time (NDJSON append). To resume a session, you rewind and replay the tape. To search history, you scan the tape index. The tape format is durable — you can read tapes from months ago.",
    howItWorks: [
      { step: "NDJSON append-only writes", detail: "Each message/event is JSON.stringify'd and appended as a new line to the session file. Append-only means no corruption risk — a crash mid-write at worst loses the last event." },
      { step: "Session file naming", detail: "Files are stored at ~/.claude/projects/<hash>/sessions/<sessionId>.jsonl. The project hash is deterministic from the project root path." },
      { step: "Resume reads", detail: "On session resume, readSessionLog() reads all lines, JSON.parses them, and reconstructs the message array. Invalid lines are skipped with a warning." },
      { step: "Search index", detail: "getSessionIdFromLog() and searchSessionsByCustomTitle() scan session files to find sessions by title or content. Used by LogSelector and history search." },
    ],
    connections: {
      imports: [
        { name: "src/utils/json.ts",   why: "JSON serialisation with cycle detection" },
        { name: "src/utils/path.ts",   why: "Session file path resolution" },
      ],
      usedBy: ["screens/REPL.tsx (loads history on mount)", "screens/ResumeConversation.tsx (lists sessions)", "hooks/useHistorySearch.ts"],
    },
    concepts: ["NDJSON / JSONL format", "Append-only log", "Session replay", "Deterministic path hashing"],
    hints: [
      "Why NDJSON instead of a single large JSON file for session storage?",
      "How does the project hash ensure different project roots get different session directories?",
      "What happens if a session file is corrupted — does it prevent all sessions from loading?",
      "How would you implement a session export feature using sessionStorage.ts?",
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

  "src/state/store.ts": `// store.ts — 35-line zero-dependency observable store factory
type Listener = () => void
type OnChange<T> = (args: { newState: T; oldState: T }) => void

export type Store<T> = {
  getState:  () => T
  setState:  (updater: (prev: T) => T) => void
  subscribe: (listener: Listener) => () => void  // returns unsubscribe fn
}

export function createStore<T>(
  initialState: T,
  onChange?: OnChange<T>,
): Store<T> {
  let state = initialState
  const listeners = new Set<Listener>()   // Set = O(1) add/delete, no dupes

  return {
    getState: () => state,

    setState: (updater) => {
      const prev = state
      const next = updater(prev)
      if (Object.is(next, prev)) return   // skip if unchanged (prevents loops)
      state = next
      onChange?.({ newState: next, oldState: prev })
      for (const listener of listeners) listener()
    },

    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)  // call returned fn to unsubscribe
    },
  }
}

// Usage in a React component:
// const unsub = store.subscribe(() => setLocalState(store.getState()))
// useEffect(() => unsub, [])   ← cleanup on unmount`,

  "src/types/ids.ts": `// ids.ts — Branded types for SessionId and AgentId
// These are phantom types: __brand only exists in the type system, zero runtime cost.

export type SessionId = string & { readonly __brand: 'SessionId' }
export type AgentId   = string & { readonly __brand: 'AgentId'   }

// ── Trust casts (no validation — use at system boundaries only) ──────────────
export function asSessionId(id: string): SessionId { return id as SessionId }
export function asAgentId(id: string):   AgentId   { return id as AgentId   }

// ── Validated cast — parses real AgentId format before branding ──────────────
// Format: "a" + optional "<label>-" + 16 hex chars
// e.g.  "a3f9c2b1a8e0d4f2"   or   "a-explorer-3f9c2b1a8e0d4f2"
const AGENT_ID_PATTERN = /^a(?:.+-)?[0-9a-f]{16}$/

export function toAgentId(s: string): AgentId | null {
  return AGENT_ID_PATTERN.test(s) ? (s as AgentId) : null
}

// ── Why branded types? ───────────────────────────────────────────────────────
// Without brands, TypeScript treats SessionId and AgentId as identical strings.
// This function would compile with no error even though args are swapped:
//   sendMessage(agentId, sessionId)  ← silent bug!
// With brands:
//   sendMessage(sessionId: SessionId, agentId: AgentId)
//   sendMessage(agentId, sessionId)  ← TS ERROR: Argument of type 'AgentId'
//                                      is not assignable to parameter of type 'SessionId'`,

  "src/memdir/findRelevantMemories.ts": `// findRelevantMemories.ts — LLM-powered memory selection
import { sideQuery }         from '../utils/sideQuery.js'
import { getDefaultSonnetModel } from '../utils/model/model.js'
import { scanMemoryFiles, type MemoryHeader } from './memoryScan.js'

export type RelevantMemory = { path: string; mtimeMs: number }

// System prompt for the Sonnet selector — instructs it to be selective
const SELECT_MEMORIES_SYSTEM_PROMPT = \`You are selecting memories useful to Claude Code.
Return filenames (up to 5) for memories clearly relevant to the query.
Be selective — if unsure, omit. Return [] if nothing clearly applies.
Do NOT re-select memories for tools the user is already actively using.\`

export async function findRelevantMemories(
  query:           string,
  memoryDir:       string,
  signal:          AbortSignal,
  recentTools:     readonly string[]   = [],
  alreadySurfaced: ReadonlySet<string> = new Set(),
): Promise<RelevantMemory[]> {

  // 1. Scan memory dir — reads only file headers, not full content (fast)
  const memories = (await scanMemoryFiles(memoryDir, signal))
    .filter(m => !alreadySurfaced.has(m.filePath))   // skip already-surfaced

  if (memories.length === 0) return []

  // 2. Ask Sonnet to select the most relevant filenames
  const selectedFilenames = await selectRelevantMemories(
    query, memories, signal, recentTools
  )

  // 3. Map filenames → full paths + mtime
  const byFilename = new Map(memories.map(m => [m.filename, m]))
  return selectedFilenames
    .map(name => byFilename.get(name))
    .filter(Boolean)
    .map(m => ({ path: m!.filePath, mtimeMs: m!.mtimeMs }))
}

async function selectRelevantMemories(
  query:      string,
  memories:   MemoryHeader[],
  signal:     AbortSignal,
  recentTools: readonly string[],
): Promise<string[]> {
  const manifest = formatMemoryManifest(memories)   // "filename: description\\n..."
  const response = await sideQuery({
    model:  getDefaultSonnetModel(),
    system: SELECT_MEMORIES_SYSTEM_PROMPT,
    prompt: \`Query: \${query}\\n\\nRecent tools: \${recentTools.join(', ')}\\n\\n\${manifest}\`,
    signal,
  })
  return jsonParse(response) ?? []   // Sonnet returns a JSON string[] of filenames
}`,

  "src/bootstrap/state.ts": `// bootstrap/state.ts — process-level singleton (1,758 lines total)
// DO NOT ADD MORE STATE HERE — BE JUDICIOUS WITH GLOBAL STATE

import type { SessionId } from 'src/types/ids.js'
import { randomUUID }     from 'src/utils/crypto.js'
import { resetSettingsCache } from 'src/utils/settings/settingsCache.js'

// ── The State shape (excerpt — 50+ fields total) ─────────────────────────────
type State = {
  originalCwd:                    string
  projectRoot:                    string        // stable — set once at startup
  totalCostUSD:                   number        // cumulative session cost
  totalAPIDuration:               number        // ms waiting for API
  totalAPIDurationWithoutRetries: number
  totalToolDuration:              number        // ms spent in tools
  sessionId:                      SessionId
  isNonInteractiveSession:        boolean       // SDK / headless mode
  permissionMode:                 PermissionMode
  // ... OpenTelemetry providers, hook matchers, model overrides, etc.
}

// ── Module-level singleton ────────────────────────────────────────────────────
let state: State = createDefaultState()

function createDefaultState(): State {
  return {
    originalCwd:  process.cwd(),
    projectRoot:  process.cwd(),
    totalCostUSD: 0,
    sessionId:    randomUUID() as SessionId,
    isNonInteractiveSession: false,
    // ...other defaults
  } as State
}

// ── Narrow accessors — callers never touch state directly ─────────────────────
export function getState():                    State        { return state }
export function setState(s: State):            void         { state = s; resetSettingsCache() }
export function getOriginalCwd():              string       { return state.originalCwd }
export function getTotalCostUSD():             number       { return state.totalCostUSD }
export function addCost(amount: number):       void         { state = { ...state, totalCostUSD: state.totalCostUSD + amount } }
export function getSessionId():                SessionId    { return state.sessionId }
export function getIsNonInteractiveSession():  boolean      { return state.isNonInteractiveSession }

// Why narrow accessors instead of exporting state directly?
// 1. Prevents callers from mutating fields they shouldn't touch
// 2. resetSettingsCache() always fires when state changes
// 3. Makes grep-based usage analysis possible (search for "addCost(" not "state.")`,

  "src/constants/prompts.ts": `// constants/prompts.ts — dynamic system prompt assembly (large file)
// This file is read on EVERY API call. Changes here affect all Claude behaviour.

import { loadMemoryPrompt }         from '../memdir/memdir.js'
import { getIsNonInteractiveSession } from '../bootstrap/state.js'
import { systemPromptSection, DANGEROUS_uncachedSystemPromptSection,
         resolveSystemPromptSections } from './systemPromptSections.js'
// ... 50+ more imports of tool name constants and utils

export async function getSystemPrompt(
  tools:      Tools,
  commands:   Command[],
  mcpServers: ConnectedMCPServer[],
): Promise<string> {

  // ── Cacheable sections (hit Anthropic prompt cache — reduces cost ──────────
  const cached = [
    systemPromptSection(\`
      You are Claude Code, Anthropic's official CLI for Claude.
      You help users with software engineering tasks...
    \`),
    systemPromptSection(getToolDocumentation(tools)),      // tool descriptions
    systemPromptSection(getCommandDocumentation(commands)), // slash-command docs
    systemPromptSection(getMcpServerDocs(mcpServers)),      // MCP tool docs
  ]

  // ── Uncached sections (volatile — change every turn) ─────────────────────
  const volatile = [
    DANGEROUS_uncachedSystemPromptSection(\`
      Current date: \${new Date().toISOString()}
      Working directory: \${getCwd()}
      Git branch: \${await getGitBranch()}
      Session ID: \${getSessionId()}
      Model: \${getCanonicalName(currentModel)}
      OS: \${osType()} \${osVersion()}
    \`),
    // Memory injected fresh every turn so the agent sees latest notes:
    DANGEROUS_uncachedSystemPromptSection(await loadMemoryPrompt()),
  ]

  return resolveSystemPromptSections([...cached, ...volatile])
}`,

  "src/bridge/bridgeMain.ts": `// bridgeMain.ts — Remote Control bridge orchestrator (2,809 lines)
// Manages poll loops, session lifecycle, transport negotiation, and reconnect.

import { capacityWake }      from './capacityWake.js'
import { bridgeEnabled }     from './bridgeEnabled.js'
import { replBridgeTransport } from './replBridgeTransport.js'
import { pollConfig }        from './pollConfig.js'
import { pollConfigDefaults } from './pollConfigDefaults.js'

export async function runBridgeMain(signal: AbortSignal): Promise<void> {
  if (!await bridgeEnabled()) {
    console.error('Bridge not enabled for this subscription tier')
    return
  }

  const config = await pollConfig.getLatest()   // GrowthBook-tuned intervals

  // ── Poll loop for incoming work ───────────────────────────────────────────
  while (!signal.aborted) {
    let session: BridgeSession | null = null

    try {
      // seekWork() long-polls the Environments API.
      // Returns when a code session is assigned to us, or on timeout.
      session = await seekWork(signal, config.seekWorkIntervalMs)
    } catch (err) {
      if (isAtCapacityError(err)) {
        // We're full — wait before seeking more work
        await capacityWake(signal, config.atCapacityIntervalMs)
        continue
      }
      // Real error — exponential backoff
      await backoff(signal, config.errorBackoffMs)
      continue
    }

    if (session) {
      // Negotiate transport (v1 HybridTransport or v2 SSE+CCRClient)
      const transport = await replBridgeTransport.create(session)
      // Run the session in the background — keep polling for more
      runSession(session, transport, signal).catch(logError)
    }
  }
}

// Each session runs its own full REPL lifecycle
async function runSession(
  session:   BridgeSession,
  transport: BridgeTransport,
  signal:    AbortSignal,
): Promise<void> {
  const bridge = await initReplBridge(session, transport, signal)
  await bridge.waitForCompletion()
  await bridge.cleanup()
}`,

  "src/query/stopHooks.ts": `// query/stopHooks.ts — PostToolUse and Stop hook execution engine (473 lines)

import { getState } from '../bootstrap/state.js'
import type { HookMatcher } from '../types/hooks.js'
import { spawn } from 'child_process'

// Called after every tool call with the tool name + result
export async function runPostToolUseHooks(
  toolName:   string,
  toolResult: string,
  signal:     AbortSignal,
): Promise<string | null> {   // returns injected output, or null

  const matchers: HookMatcher[] = getState().postToolUseHooks ?? []

  for (const matcher of matchers) {
    // Glob match: e.g. matcher.tools = ["BashTool", "File*"]
    if (!toolNameMatchesPattern(toolName, matcher.tools)) continue

    const output = await runHookCommand(matcher.command, {
      CLAUDE_TOOL_NAME:   toolName,
      CLAUDE_TOOL_RESULT: toolResult,
    }, matcher.timeoutMs ?? 60_000, signal)

    if (output) return output   // first match wins; inject its stdout
  }
  return null
}

// Run a single hook command as a child process
async function runHookCommand(
  command:   string,
  env:       Record<string, string>,
  timeoutMs: number,
  signal:    AbortSignal,
): Promise<string | null> {

  return new Promise((resolve) => {
    const proc = spawn('sh', ['-c', command], {
      env:   { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stdout = ''
    proc.stdout.on('data', (chunk: Buffer) => stdout += chunk.toString())

    // Enforce timeout
    const timer = setTimeout(() => {
      proc.kill('SIGTERM')
      setTimeout(() => proc.kill('SIGKILL'), 5_000)
      console.warn(\`Hook timed out after \${timeoutMs}ms: \${command}\`)
      resolve(null)
    }, timeoutMs)

    proc.on('close', () => { clearTimeout(timer); resolve(stdout.trim() || null) })
    signal.addEventListener('abort', () => proc.kill('SIGTERM'), { once: true })
  })
}`,

  "src/skills/loadSkillsDir.ts": `// skills/loadSkillsDir.ts — skill discovery and loading engine (1,086 lines)

import matter from 'gray-matter'   // parses YAML frontmatter from .md files
import { z }   from 'zod'

// Every skill Markdown file must have this frontmatter
const SkillFrontmatterSchema = z.object({
  name:          z.string().min(1),               // slash-command name: /my-skill
  description:   z.string().min(1),               // shown in /help and typeahead
  argumentHint:  z.string().optional(),            // e.g. "<filename>"
  allowedTools:  z.array(z.string()).optional(),   // restrict to these tools
})

export interface LoadedSkill {
  name:          string   // without leading /
  description:   string
  promptTemplate:string   // the full Markdown body (after frontmatter)
  allowedTools:  string[] | undefined
  filePath:      string
}

export async function loadSkillsDir(
  skillsDir: string,
): Promise<LoadedSkill[]> {
  const mdFiles = await glob(\`\${skillsDir}/**/*.md\`)
  const skills: LoadedSkill[] = []

  for (const filePath of mdFiles) {
    const raw = await readFile(filePath, 'utf8')
    const { data: frontmatter, content: body } = matter(raw)

    const result = SkillFrontmatterSchema.safeParse(frontmatter)
    if (!result.success) {
      console.warn(\`Skipping invalid skill \${filePath}: \${result.error.message}\`)
      continue
    }

    skills.push({
      name:          result.data.name,
      description:   result.data.description,
      promptTemplate:body.trim(),   // argument placeholder: {{argument}}
      allowedTools:  result.data.allowedTools,
      filePath,
    })
  }

  return skills
}

// Usage example — calling a skill from the REPL:
// User types: /translate "Hello World"
// Skill template: "Translate the following text to French:\\n\\n{{argument}}"
// → expanded prompt: "Translate the following text to French:\\n\\nHello World"`,

  "src/keybindings/defaultBindings.ts": `// keybindings/defaultBindings.ts — factory-default keyboard shortcut map

export type ActionId =
  | 'editor.submit'          // send prompt (Enter or Ctrl+Enter)
  | 'editor.newline'         // insert literal newline (Shift+Enter)
  | 'editor.interrupt'       // Ctrl+C — cancel current operation
  | 'editor.clear'           // Ctrl+L — clear transcript
  | 'editor.compact'         // Ctrl+K — compact conversation
  | 'editor.historyPrev'     // up arrow — recall previous input
  | 'editor.historyNext'     // down arrow — recall next input
  | 'editor.historySearch'   // Ctrl+R — fuzzy search history
  | 'nav.modelPicker'        // Ctrl+T — open model picker
  | 'nav.outputStyle'        // Ctrl+O — open output style picker
  | 'nav.scrollUp'           // Page Up — scroll message list up
  | 'nav.scrollDown'         // Page Down — scroll message list down
  // ... 30+ more action IDs

// Platform-aware key syntax:
//   "mod+s"        → Ctrl+S on Windows/Linux, ⌘S on macOS
//   "ctrl+s"       → always Ctrl+S (ignores platform)
//   "shift+enter"  → Shift+Enter on all platforms

export const DEFAULT_BINDINGS: Record<ActionId, string[]> = {
  'editor.submit':       ['enter'],
  'editor.newline':      ['shift+enter'],
  'editor.interrupt':    ['ctrl+c'],
  'editor.clear':        ['ctrl+l'],
  'editor.compact':      ['ctrl+k'],
  'editor.historyPrev':  ['up'],
  'editor.historyNext':  ['down'],
  'editor.historySearch':['ctrl+r'],
  'nav.modelPicker':     ['ctrl+t'],
  'nav.outputStyle':     ['ctrl+o'],
  'nav.scrollUp':        ['pageup'],
  'nav.scrollDown':      ['pagedown'],
  // ...
}

// Override in .claude/settings.json:
// { "keybindings": [{ "action": "editor.submit", "key": "ctrl+enter" }] }`,

  "src/tasks/types.ts": `// tasks/types.ts — Task interface (46 lines)
// All background tasks implement this interface: agents, shell commands,
// dream tasks, session tasks, and remote agents.

export type TaskStatus =
  | 'pending'    // created, not yet started
  | 'running'    // currently executing
  | 'done'       // completed successfully
  | 'error'      // terminated with error
  | 'stopped'    // externally killed

export interface TaskResult {
  status:   'done' | 'error'
  output:   string    // final output text
  exitCode: number    // 0 = success
}

export interface Task {
  readonly id:   string        // unique task ID (e.g. "a-agent-3f9c2b1a")
  readonly type: string        // "agent" | "shell" | "dream" | "session"
  status:        TaskStatus

  start():   Promise<void>
  stop():    Promise<void>     // graceful shutdown
  getOutput(): string          // all output so far (streamed)
  waitForCompletion(): Promise<TaskResult>

  // Optional: called when new output bytes arrive
  onOutput?: (chunk: string) => void
}

// Every task implementation (LocalAgentTask, LocalShellTask, DreamTask, etc.)
// exports a class that implements this interface.
// The coordinator and bridge treat all tasks uniformly via this contract.`,

  "src/services/api/claude.ts": `// services/api/claude.ts — core streaming API client (3,419 lines)
// Every message Claude sends or receives flows through this file.

import Anthropic from '@anthropic-ai/sdk'
import { addCost, getSessionId } from '../../bootstrap/state.js'
import { withRetry }             from './withRetry.js'
import { logApiCall }            from './logging.js'

const anthropic = new Anthropic({ apiKey: getApiKey() })

export async function* streamMessage(params: {
  messages:    Anthropic.MessageParam[]
  system:      Anthropic.SystemContentBlockParam[]   // cacheable + uncacheable sections
  tools:       Anthropic.Tool[]
  model:       string
  maxTokens:   number
  thinkingBudget?: number
}): AsyncGenerator<StreamEvent> {

  const request = buildRequest(params)   // adds cache_control headers to stable sections

  // withRetry handles 429/529/network errors with exponential backoff
  const stream = await withRetry(() =>
    anthropic.beta.messages.stream(request, { betas: ['interleaved-thinking-2025-05-14'] })
  )

  let inputTokens  = 0
  let outputTokens = 0
  let cacheRead    = 0
  let cacheCreated = 0

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      yield normaliseContentDelta(event)   // text | thinking | tool_use_input
    }

    if (event.type === 'message_stop') {
      const usage = stream.finalMessage().usage
      inputTokens  = usage.input_tokens
      outputTokens = usage.output_tokens
      cacheRead    = usage.cache_read_input_tokens    ?? 0
      cacheCreated = usage.cache_creation_input_tokens ?? 0

      // Track cost: (input × $3/Mtok) + (output × $15/Mtok) − (cache_read × discount)
      const costUSD = calculateCost(params.model, inputTokens, outputTokens, cacheRead)
      addCost(costUSD)

      yield { type: 'message_stop', usage: { inputTokens, outputTokens, cacheRead, cacheCreated } }
    }
  }
}`,

  "src/services/mcp/client.ts": `// services/mcp/client.ts — MCP protocol client (3,348 lines)
// Connects Claude to any MCP-compatible tool server.

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { Tool } from '../../Tool.js'

export class MCPClient {
  private client:  Client
  private tools:   Map<string, MCPToolProxy> = new Map()

  async connect(config: MCPServerConfig): Promise<void> {
    // Create transport: stdio for local, SSE for remote
    const transport = config.type === 'stdio'
      ? new StdioClientTransport({ command: config.command, args: config.args })
      : new SSEClientTransport(new URL(config.url!))

    this.client = new Client({ name: 'claude-code', version: PKG_VERSION }, { capabilities: {} })
    await this.client.connect(transport)

    // Discover tools → register as Tool interface proxies
    const { tools } = await this.client.listTools()
    for (const mcpTool of tools) {
      this.tools.set(mcpTool.name, new MCPToolProxy(this.client, mcpTool))
    }
  }

  getTools(): Tool[] { return [...this.tools.values()] }
}

// Each MCP tool becomes a proxy implementing the native Tool interface
class MCPToolProxy implements Tool {
  readonly name:        string
  readonly description: string
  readonly inputSchema: z.ZodType

  constructor(private client: Client, private mcpTool: MCPTool) {
    this.name        = mcpTool.name
    this.description = mcpTool.description ?? ''
    this.inputSchema = jsonSchemaToZod(mcpTool.inputSchema)   // convert JSON Schema → Zod
  }

  async execute(input: unknown): Promise<ToolResult> {
    const result = await this.client.callTool({ name: this.mcpTool.name, arguments: input })
    return { type: 'tool_result', content: normaliseContent(result.content) }
  }
}`,

  "src/services/compact/autoCompact.ts": `// services/compact/autoCompact.ts — auto-compact trigger (351 lines)
// Monitors context usage and fires compaction when threshold is reached.

import { getState }  from '../../bootstrap/state.js'
import { compact }   from './compact.js'
import { getModel }  from '../../utils/model/model.js'

// Called before every LLM turn
export async function maybeAutoCompact(
  messages: Message[],
  ctx:       QueryContext,
): Promise<Message[]> {

  const model       = getModel()
  const contextSize = getContextWindow(model)    // e.g. 200,000 for Sonnet
  const usedTokens  = estimateTokenCount(messages)
  const usageRatio  = usedTokens / contextSize

  // Compact threshold: 85% by default, configurable via feature flag
  const threshold = getFeatureValue('auto_compact_threshold', 0.85)

  if (usageRatio < threshold) return messages   // nothing to do

  console.log(\`Context at \${Math.round(usageRatio * 100)}% — auto-compacting...\`)

  // Run compaction — returns a shorter message array
  const compacted = await compact(messages, ctx)

  const newRatio = estimateTokenCount(compacted) / contextSize
  console.log(\`Compacted: \${Math.round(usageRatio * 100)}% → \${Math.round(newRatio * 100)}%\`)

  return compacted
}`,

  "src/services/autoDream/autoDream.ts": `// services/autoDream/autoDream.ts — background memory consolidation (324 lines)

import { consolidationLock }  from './consolidationLock.js'
import { CONSOLIDATION_PROMPT } from './consolidationPrompt.js'
import { loadMemoryPrompt }   from '../../memdir/memdir.js'
import { sideQuery }          from '../../utils/sideQuery.js'

const MIN_SESSION_EXCHANGES = 3   // skip tiny/test sessions

export async function runAutoDream(
  sessionMessages: Message[],
  memoryDir:       string,
): Promise<void> {

  // Only dream about real sessions
  const exchanges = sessionMessages.filter(m => m.role === 'assistant').length
  if (exchanges < MIN_SESSION_EXCHANGES) return

  // One dream at a time across all sessions (file lock on MEMORY.md)
  const lock = await consolidationLock.acquire(memoryDir)
  if (!lock) { console.log('AutoDream: lock held by another session, skipping'); return }

  try {
    // Ask a cheap model to extract memorable facts
    const facts = await sideQuery({
      system: CONSOLIDATION_PROMPT,
      prompt: formatSessionForDreaming(sessionMessages),
      model:  getDefaultSonnetModel(),
      signal: AbortSignal.timeout(30_000),
    })

    if (!facts?.trim()) return

    // Append to MEMORY.md with datestamp
    const entry = \`\\n## Session \${new Date().toLocaleDateString()}\\n\${facts}\\n\`
    await appendFile(join(memoryDir, 'MEMORY.md'), entry, 'utf8')
    console.log(\`AutoDream: appended \${facts.split('\\n').length} facts to MEMORY.md\`)

  } finally {
    lock.release()
  }
}`,
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
type PageTab = "codeintel" | "architecture" | "dictionary" | "dod" | "shell" | "blueprint" | "learn" | "reference";
const PAGE_TABS: { id: PageTab; label: string; color: string; icon: ReactNode }[] = [
  { id: "codeintel",    label: "Code Intel",    color: "#4f8ef7", icon: <Code2 size={13}/> },
  { id: "architecture", label: "Architecture",  color: "#34d399", icon: <Layers size={13}/> },
  { id: "dictionary",   label: "AI Dictionary", color: "#a78bfa", icon: <BookOpen size={13}/> },
  { id: "dod",          label: "DoD Example",   color: "#fb923c", icon: <Building2 size={13}/> },
  { id: "shell",        label: "Prod Shell",    color: "#f472b6", icon: <Terminal size={13}/> },
  { id: "blueprint",    label: "AI Blueprint",  color: "#e879f9", icon: <Boxes size={13}/> },
  { id: "learn",        label: "🎓 Beginner Guide", color: "#f59e0b", icon: <GraduationCap size={13}/> },
  { id: "reference",    label: "📁 Reference",  color: "#22d3ee", icon: <FolderOpen size={13}/> },
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

// ─── REFERENCE GUIDE DATA ────────────────────────────────────────────────────
interface RefFolder { path: string; emoji: string; purpose: string; features: string[]; interaction: string; }
interface RefTool   { name: string; emoji: string; category: string; purpose: string; inputs: string; outputs: string; keyBehavior: string; usedBy: string[]; }
interface RefModule { name: string; emoji: string; path: string; role: string; keyFiles: string[]; connects: string[]; }
interface RefCommand{ cmd: string; category: string; emoji: string; description: string; usage: string; }
interface RefTask   { name: string; emoji: string; shortId: string; purpose: string; killMechanism: string; outputMethod: string; usedBy: string[]; }

const FOLDER_GUIDE: RefFolder[] = [
  // ── Root ──────────────────────────────────────────────────────────────────
  { path:"src", emoji:"🏗️", purpose:"Root source directory — the single top-level module containing all code. Node/Bun resolves imports starting here.", features:["Contains main.tsx entry point","Hosts all sub-modules as subdirectories","TypeScript path aliases map to this root"], interaction:"main.tsx bootstraps by importing from nearly every subdirectory. All inter-module communication flows upward through this root." },
  // ── Core engine files ─────────────────────────────────────────────────────
  { path:"src/tools", emoji:"🔧", purpose:"42 self-contained tool modules + shared utilities. Each tool is a directory with a prompt, JSON schema, execute function, and tests.", features:["Every tool exports a Tool interface object","Tool directories are individually versioned","shared/ holds cross-tool permission + diff utilities","utils.ts provides sanitisation helpers used by all tools"], interaction:"main.tsx calls loadAllTools() which imports each tool directory's index.ts. QueryEngine receives the resulting Map<string,Tool> and dispatches by name when Claude requests a tool call." },
  { path:"src/tools/AgentTool", emoji:"🤖", purpose:"Spawn sub-agents, load agent definition directories (.claude/agents/), and support Explore/Plan built-in agents.", features:["Reads agent .md files from .claude/agents/","Forks isolated QueryEngine instances for each sub-agent","Supports swarm (parallel) and sequential agent spawning","Built-in Explore (read-only search) and Plan (design) agents"], interaction:"Calls coordinatorMode.ts to wire multi-agent channels. Sub-agents communicate back via SendMessageTool." },
  { path:"src/tools/BashTool", emoji:"💻", purpose:"Execute shell commands with sandbox enforcement, timeout, and cross-platform path resolution.", features:["AST-based safe command analysis before execution","Timeout wrapper with SIGKILL fallback","Detects macOS/Linux/Windows shell paths","Sandbox adapter restricts filesystem access"], interaction:"Calls utils/bash/bashProvider.ts for execution. Validates commands through utils/permissions/bashClassifier.ts before running." },
  { path:"src/tools/PowerShellTool", emoji:"🪟", purpose:"Execute PowerShell scripts on Windows with proper escaping and output formatting.", features:["Detects pwsh vs legacy powershell.exe","Script argument escaping for special characters","Formats PSObject output as readable strings","Here-string safe execution"], interaction:"Calls utils/shell/powershellProvider.ts. Feeds output back to QueryEngine as tool_result text." },
  { path:"src/tools/FileEditTool", emoji:"✏️", purpose:"Precise old→new string replacement in files, with uniqueness enforcement to prevent accidental multi-replacement.", features:["Requires old_string to appear exactly once","Validates the replacement doesn't break uniqueness","Saves a before/after diff for the UI","Triggers LSP re-diagnostics after edit"], interaction:"Works with services/lsp to get post-edit diagnostics. FileEditToolDiff.tsx in components renders the visual diff." },
  { path:"src/tools/FileReadTool", emoji:"📖", purpose:"Read files with optional offset/limit, line numbers, PDF support, and Jupyter notebook rendering.", features:["offset+limit for reading large files in chunks","Adds cat -n style line numbers","PDF page range support (max 20 pages)","Jupyter .ipynb cell rendering"], interaction:"Used by QueryEngine to let Claude read source files. FileReadTool feeds content directly into the conversation as tool_result." },
  { path:"src/tools/FileWriteTool", emoji:"💾", purpose:"Write or overwrite full file contents, creating parent directories as needed.", features:["Creates nested parent directories automatically","Enforces reading the file first before overwriting","Triggers post-write LSP diagnostics"], interaction:"Called after FileReadTool in the typical read-modify-write flow. Edit is preferred for partial changes; Write is for new files." },
  { path:"src/tools/GlobTool", emoji:"🔍", purpose:"Fast file pattern matching (glob) returning results sorted by modification time.", features:["Supports ** recursive patterns","Returns absolute paths sorted newest-first","Respects .gitignore via filesystem service"], interaction:"Used by QueryEngine when Claude needs to discover files. Results are fed back as a newline-delimited list." },
  { path:"src/tools/GrepTool", emoji:"🔎", purpose:"ripgrep-powered content search with context lines, file type filtering, and multi-mode output.", features:["content / files_with_matches / count output modes","-A/-B/-C context line support","--type flag for language-specific search","head_limit and offset for pagination"], interaction:"Uses ripgrep binary on the system. Results feed into conversation for Claude to reason about code locations." },
  { path:"src/tools/WebFetchTool", emoji:"🌐", purpose:"HTTP fetch with Markdown conversion, robots.txt compliance, and content-length limits.", features:["Converts HTML to Markdown for LLM consumption","Checks robots.txt before fetching","Configurable max content length","Handles redirects and HTTPS"], interaction:"Feeds web content into conversation. Pairs with WebSearchTool — search first, then fetch specific URLs." },
  { path:"src/tools/WebSearchTool", emoji:"🔍", purpose:"Web search via Brave or Google Search API with result ranking.", features:["Returns title, URL, snippet for each result","Configurable max results","Falls back across providers","Filters explicit content"], interaction:"Results are summarised in tool_result. Typically followed by WebFetchTool to get full page content." },
  { path:"src/tools/TodoWriteTool", emoji:"✅", purpose:"Structured task list management with status transitions (pending → in_progress → completed).", features:["Enforces exactly one in_progress task","Validates status transition rules","Renders task list in the UI via tasks/ components","Persists task state in AppState"], interaction:"Writes to AppState.todos. TaskListV2.tsx component reads state and renders the live task display." },
  { path:"src/tools/TaskCreateTool", emoji:"▶️", purpose:"Create a background LocalAgentTask that runs a sub-agent asynchronously.", features:["Returns a task ID immediately","Sub-agent writes output to a per-task file","Supports prompt and model parameters","Task runs in parallel with main session"], interaction:"Pairs with TaskOutputTool (poll output), TaskGetTool (status), TaskStopTool (kill). Tasks tracked in AppState." },
  { path:"src/tools/TaskOutputTool", emoji:"📤", purpose:"Poll a running task's output file for new bytes, enabling live streaming of background task output.", features:["Reads new bytes since last poll position","Returns EOF signal when task completes","Used in polling loops by Claude"], interaction:"Works alongside TaskCreateTool. Output files are written by LocalAgentTask in a tmp scratchpad directory." },
  { path:"src/tools/TaskGetTool", emoji:"🔍", purpose:"Retrieve a specific background task by ID, returning its current status and metadata.", features:["Returns task type, status, start time","Includes output file path","Distinguishes running vs completed vs errored"], interaction:"Reads from QueryEngine's active task registry. Used by Claude to check on a specific task before polling its output." },
  { path:"src/tools/TaskListTool", emoji:"📋", purpose:"List all active tasks in the current session with their IDs, types, and statuses.", features:["Returns a table of all task IDs","Shows task type prefix in ID (a=agent, b=bash, d=dream)","Includes elapsed time"], interaction:"Reads the full task registry. Claude uses this to discover task IDs before calling TaskGetTool or TaskStopTool." },
  { path:"src/tools/TaskStopTool", emoji:"⛔", purpose:"Stop/kill a running background task by ID using SIGTERM then SIGKILL.", features:["Grace period before SIGKILL","Updates task status to 'stopped'","Works for shell, agent, and remote tasks"], interaction:"Calls stopTask.ts which manages the kill signal sequence. Task registry updated in AppState." },
  { path:"src/tools/TaskUpdateTool", emoji:"🔄", purpose:"Update task metadata or status — used to annotate tasks with progress notes.", features:["Can set custom status strings","Attaches metadata key-value pairs","Used for progress annotations"], interaction:"Writes to the task object in QueryEngine's task registry." },
  { path:"src/tools/SendMessageTool", emoji:"💬", purpose:"Send a message to a named team channel so other agents in a multi-agent session can receive it.", features:["Broadcasts to all channel subscribers","Messages are queued if subscriber is busy","Supports structured JSON payloads"], interaction:"Requires a team channel created by TeamCreateTool. Received by teammates via their inbox poller." },
  { path:"src/tools/TeamCreateTool", emoji:"👥", purpose:"Create a shared communication channel for a multi-agent session, returning a channel ID.", features:["Channel is scoped to the current session","All subsequent agents can subscribe","Supports broadcast and unicast modes"], interaction:"Called once at session start by the coordinator. Sub-agents use the channel ID with SendMessageTool." },
  { path:"src/tools/TeamDeleteTool", emoji:"🗑️", purpose:"Delete a team channel and clean up all subscribers when multi-agent work is complete.", features:["Notifies subscribers before deletion","Clears message queue","Prevents stale channel references"], interaction:"Called by coordinator at end of multi-agent session. Frees memory in the channel registry." },
  { path:"src/tools/MCPTool", emoji:"🔌", purpose:"Execute tools on a connected MCP (Model Context Protocol) server — the bridge to any external MCP capability.", features:["Dynamically dispatches to any registered MCP server","Handles MCP-specific error types","Passes structured parameters via JSON Schema","Supports streaming MCP responses"], interaction:"Reads available MCP servers from services/mcp/client.ts. Tool names are prefixed with server name to avoid collisions." },
  { path:"src/tools/ListMcpResourcesTool", emoji:"📚", purpose:"List available resources (files, data, endpoints) on a connected MCP server.", features:["Returns resource URIs and MIME types","Supports pagination for large resource lists","Works across all connected MCP servers"], interaction:"Pairs with ReadMcpResourceTool. Used by Claude to discover what data sources an MCP server exposes." },
  { path:"src/tools/ReadMcpResourceTool", emoji:"📄", purpose:"Read the contents of a specific MCP resource by URI.", features:["Returns raw content or structured data","MIME-type aware output formatting","Supports binary resources via base64"], interaction:"Called after ListMcpResourcesTool identifies a resource URI. Content fed into conversation." },
  { path:"src/tools/McpAuthTool", emoji:"🔐", purpose:"Initiate an OAuth authentication flow for an MCP server that requires login.", features:["Opens browser for OAuth consent","Stores token for future sessions","Supports PKCE flow"], interaction:"Triggers services/mcp/auth.ts OAuth flow. After completion, MCPTool calls work without re-authentication." },
  { path:"src/tools/SkillTool", emoji:"⚡", purpose:"Load and execute user-defined skills from .claude/skills/ — reusable task templates.", features:["Reads skill .md files and extracts the prompt template","Substitutes $ARGUMENTS into template","Returns skill result as tool_result"], interaction:"Calls services/skills/loadSkillsDir.ts for discovery. Skills appear in typeahead suggestions." },
  { path:"src/tools/ScheduleCronTool", emoji:"⏰", purpose:"Create, delete, and list cron-style recurring scheduled tasks.", features:["Cron expression parsing","Creates persistent task entries","Lists all scheduled tasks with next-fire time"], interaction:"Writes schedule records to AppState. Fires tasks via the task system (LocalAgentTask) at scheduled intervals." },
  { path:"src/tools/RemoteTriggerTool", emoji:"🚀", purpose:"Programmatically trigger a remote Claude Code agent session via the bridge API.", features:["Sends task prompt to a remote session","Returns session ID for tracking","Supports async fire-and-forget mode"], interaction:"Calls bridge/bridgeApi.ts HTTP endpoints. Used for cloud-hosted agent orchestration." },
  { path:"src/tools/EnterWorktreeTool", emoji:"🌿", purpose:"Switch the session's working directory into a git worktree for isolated branch work.", features:["Resolves worktree path from branch name","Updates AppState.cwd","Prevents nested worktree switches"], interaction:"Calls bridge/bridgePointer.ts to persist worktree state. ExitWorktreeTool reverses the operation." },
  { path:"src/tools/ExitWorktreeTool", emoji:"↩️", purpose:"Exit the current git worktree and restore the previous working directory.", features:["Restores original CWD from bridgePointer","Optionally cleans up worktree if no changes","Validates clean state before exit"], interaction:"Reads bridge/bridgePointer.ts for the saved prior CWD. Counterpart to EnterWorktreeTool." },
  { path:"src/tools/EnterPlanModeTool", emoji:"📝", purpose:"Enable read-only plan mode where writes, edits, and shell commands are blocked.", features:["Sets PermissionMode to plan_mode in AppState","All write tools return a soft refusal","LLM can still read and analyse freely"], interaction:"Updates utils/permissions/PermissionMode.ts state. ExitPlanModeTool restores normal permissions." },
  { path:"src/tools/ExitPlanModeTool", emoji:"🔓", purpose:"Exit plan mode and restore full normal permissions for the session.", features:["Reverts PermissionMode from plan_mode","Emits a PermissionUpdate event for UI refresh","Logs the mode change in session history"], interaction:"Counterpart to EnterPlanModeTool. Permission UI components in components/permissions/ react to the update." },
  { path:"src/tools/REPLTool", emoji:"🖥️", purpose:"Interactive REPL mode — starts a persistent JS or Python session that retains state between calls.", features:["Persistent interpreter process per language","State (variables, imports) survives between calls","Captures stdout/stderr streams","Timeout enforcement per call"], interaction:"Spawns a child process via a LocalShellTask. Output is streamed back to QueryEngine." },
  { path:"src/tools/LSPTool", emoji:"🔬", purpose:"Query Language Server Protocol servers for hover info, go-to-definition, and live diagnostics.", features:["Hover: type info and docs at cursor position","Definition: file + line of symbol declaration","Diagnostics: current errors and warnings in a file","Auto-starts the appropriate LSP for the file type"], interaction:"Calls services/lsp/manager.ts which routes to the right LSPServerInstance. Results enrich Claude's understanding of code." },
  { path:"src/tools/NotebookEditTool", emoji:"📓", purpose:"Edit Jupyter notebook cells — insert, delete, and modify cell content and metadata.", features:["Supports code and markdown cells","Cell index-based addressing","Preserves notebook JSON structure","Triggers kernel re-run suggestions"], interaction:"Reads .ipynb via FileReadTool first. Writes via notebook-specific JSON editing rather than raw string replacement." },
  { path:"src/tools/AskUserQuestionTool", emoji:"❓", purpose:"Pause execution and prompt the user for a clarification before proceeding.", features:["Renders a question prompt in the terminal UI","Waits for user input synchronously","Returns answer as tool_result string","Respects auto-mode (skips question if yolo-safe)"], interaction:"Suspends QueryEngine loop until user responds. AskUserQuestionTool.tsx component handles the UI." },
  { path:"src/tools/BriefTool", emoji:"📋", purpose:"Generate a concise brief or summary of work done in the current session.", features:["Summarises tool calls and file changes","Formats as Markdown with sections","Can be scoped to a task or the full session","Used by /brief slash command"], interaction:"Reads session history from AppState and calls the LLM via sideQuery.ts for the summary." },
  { path:"src/tools/ConfigTool", emoji:"⚙️", purpose:"Read and write Claude Code configuration from ~/.claude.json and .claude/settings.json.", features:["Supports get, set, and list operations","Path-based key access (e.g. 'model', 'permissions.allow')","Validates values against the settings schema before writing"], interaction:"Calls utils/settings/settings.ts. Changes take effect immediately via the live-reload changeDetector." },
  { path:"src/tools/SleepTool", emoji:"💤", purpose:"Wait N seconds — used for sequencing delays in multi-agent orchestration scripts.", features:["Simple promisified setTimeout","Max timeout configurable via schema","Used as a pacing primitive in complex workflows"], interaction:"Pure timing utility. No side effects. Typically used by coordinator agents to pace sub-agent launches." },
  { path:"src/tools/SyntheticOutputTool", emoji:"🧪", purpose:"Inject synthetic tool output into the conversation for testing and session replay.", features:["Bypasses actual tool execution","Inserts pre-canned tool_result into history","Used in test fixtures and demo sessions"], interaction:"Directly manipulates AppState message history. Only active in test/dev mode." },
  { path:"src/tools/ToolSearchTool", emoji:"🔎", purpose:"Search available tools by keyword for dynamic tool discovery — used when Claude needs to find a tool it hasn't loaded.", features:["Fuzzy keyword search across tool names and descriptions","Returns matching tool names with brief descriptions","Enables deferred tool loading (tools loaded on demand)"], interaction:"Reads the full tool registry from QueryEngine. Returned tool names can then be used in subsequent tool calls." },
  { path:"src/tools/shared", emoji:"🤝", purpose:"Shared utilities used across multiple tools: permission checking, diff formatting, and error type definitions.", features:["Permission pre-flight helpers used by write tools","Unified diff formatter for FileEdit output","Typed error classes (ToolError, PermissionError)"], interaction:"Imported by BashTool, FileEditTool, FileWriteTool, and others for consistent permission gating and error reporting." },
  // ── Services ──────────────────────────────────────────────────────────────
  { path:"src/services", emoji:"🔗", purpose:"Integration layer — connects Claude Code to external systems (API, MCP, analytics, LSP, OAuth). Each subdirectory is an independent service client.", features:["8 service directories — independently testable","Each service exposes a typed API to the rest of the app","Services are bootstrapped at startup in main.tsx"], interaction:"Services are consumed by tools, QueryEngine, and commands. They never import from each other to keep coupling low." },
  { path:"src/services/api", emoji:"☁️", purpose:"Anthropic Claude API client — streaming, retry, cost tracking, prompt cache, and session ingress.", features:["SSE streaming for word-by-word token delivery","Exponential backoff retry with jitter on 429/529","Per-session cost and token attribution","Prompt cache break detection to warn users"], interaction:"QueryEngine calls claude.ts to stream completions. withRetry.ts wraps every API call. errors.ts handles failure classification." },
  { path:"src/services/mcp", emoji:"🔌", purpose:"Full MCP (Model Context Protocol) client — OAuth, dynamic tool registration, multi-server management, SSE transport.", features:["Discovers and registers tools from any MCP server","OAuth 2.0 + PKCE authentication flow","Multi-server connection management","XAA registry integration for discovering new MCP servers"], interaction:"MCPTool dispatches through services/mcp/client.ts. UI connection status shown via MCPConnectionManager.tsx." },
  { path:"src/services/analytics", emoji:"📊", purpose:"Telemetry pipeline — GrowthBook feature flags, first-party event logging, Datadog metrics, opt-out support.", features:["GrowthBook A/B experiment framework","OpenTelemetry-based first-party event export","Datadog APM metrics (Anthropic-internal)","Runtime killswitch to disable all telemetry"], interaction:"Bootstrapped in main.tsx. GrowthBook gates feature flags checked throughout the app. Users can opt out via metricsOptOut.ts." },
  { path:"src/services/compact", emoji:"📦", purpose:"Conversation compaction — auto-compact, micro-compact, and session memory consolidation to free context window space.", features:["Full compaction: LLM summarises history into a compact block","Micro-compact: lightweight turn collapsing without LLM call","Auto-compact: monitors context usage and fires at threshold","Session memory: distils facts into MEMORY.md after sessions"], interaction:"QueryEngine triggers compaction when context nears the limit. Compact result replaces old messages in AppState." },
  { path:"src/services/lsp", emoji:"🔬", purpose:"Language Server Protocol client — hover, diagnostics, definition queries, auto-start for each language.", features:["Auto-starts the right LSP for each file type","Multi-language manager (TypeScript, Python, Rust, etc.)","Caches diagnostics across the session","Passively collects before/after-edit quality metrics"], interaction:"LSPTool calls services/lsp/manager.ts. Diagnostics feed into permission classifier to warn about risky edits." },
  { path:"src/services/oauth", emoji:"🔑", purpose:"OAuth 2.0 with PKCE for Console login and API key authentication.", features:["PKCE code verifier/challenge via Web Crypto","Local HTTP server catches redirect callback","Stores and refreshes tokens","Exposes getAccessToken() for all HTTP clients"], interaction:"Used by bridge/bridgeApi.ts and services/api/client.ts for auth headers. Login/logout commands trigger the flow." },
  { path:"src/services/plugins", emoji:"🧩", purpose:"Plugin lifecycle — download, signature verification, sandboxed installation, and activation of third-party plugins.", features:["GPG signature verification before install","Sandbox execution environment for plugins","CLI commands: install, list, remove, update","PluginInstallationManager UI component"], interaction:"Plugin commands (/plugin install) call services/plugins/pluginOperations.ts. Installed plugins register their tools in loadAllTools()." },
  { path:"src/services/autoDream", emoji:"💭", purpose:"Background memory consolidation — DreamTask runs after each session to distil key facts into MEMORY.md.", features:["LLM-powered fact extraction from session history","File-level lock prevents concurrent write corruption","Configurable min-session-length before dreaming","Appends to MEMORY.md (never overwrites)"], interaction:"DreamTask in src/tasks/ calls this service. Facts written to MEMORY.md are loaded by memdir.ts next session." },
  // ── Bridge ────────────────────────────────────────────────────────────────
  { path:"src/bridge", emoji:"🌉", purpose:"Remote Control bridge — 31 files enabling browser, mobile, and CI to control Claude Code over SSE+HTTP+JWT.", features:["SSE+CCR v2 and HybridTransport v1 protocol support","Session tunnelling with JWT work secrets","QR code display for mobile pairing","Bridge debug fault injection for testing recovery paths"], interaction:"bridgeMain.ts is the orchestrator. bridgeApi.ts handles HTTP calls. replBridge.ts manages the full REPL lifecycle for remote sessions. The UI renders status via BridgeDialog.tsx." },
  // ── Buddy ─────────────────────────────────────────────────────────────────
  { path:"src/buddy", emoji:"🐾", purpose:"Tamagotchi companion — 18 species deterministically generated from the user's ID hash, with animated ASCII art.", features:["Mulberry32 PRNG seeded from userId for deterministic generation","18 species × 3-frame ASCII animations","5 personality stats: DEBUGGING/PATIENCE/CHAOS/WISDOM/SNARK","Claude-generated personality cached after first generation"], interaction:"companion.ts + species.ts generate the buddy. soulGen.ts calls the LLM once for personality. stats.ts tracks the 5 stats." },
  // ── Coordinator ───────────────────────────────────────────────────────────
  { path:"src/coordinator", emoji:"🎯", purpose:"Multi-agent swarm orchestration — spawns and coordinates parallel worker agents.", features:["Parallel agent spawning from a task decomposition","Team channel creation for inter-agent communication","Worker progress monitoring and aggregation","Swarm status display in the UI"], interaction:"Calls AgentTool to spawn workers, TeamCreateTool to wire channels. CoordinatorAgentStatus.tsx renders progress." },
  // ── Components ────────────────────────────────────────────────────────────
  { path:"src/components", emoji:"🎨", purpose:"141 React/Ink terminal UI components — every visible element in the Claude Code terminal interface.", features:["React/Ink renders JSX to terminal ANSI output","Yoga flexbox layout engine","32 subdirectories organised by feature domain","Reusable primitives in design-system/"], interaction:"Components read from AppState via useAppStateStore(). Events dispatch state updates via onChangeAppState.ts." },
  { path:"src/components/agents", emoji:"🤖", purpose:"Agent spawning UI, sub-agent progress lines, swarm status view, and coordinator display.", features:["AgentProgressLine: shows tool call type + token count per agent","Swarm view: N parallel agents with live status","Coordinator status with task decomposition","Agent chat bubble theming"], interaction:"Reads agent task data from AppState.tasks. Connects to coordinator/coordinatorMode.ts via state watchers." },
  { path:"src/components/messages", emoji:"💬", purpose:"41 message content block renderers — text, tool use, tool result, images, code, and diff blocks.", features:["Handles all Anthropic message content block types","Streaming text with cursor animation","Inline image rendering","Tool use/result pair collapsing"], interaction:"Messages.tsx orchestrates the list. Each renderer is selected by message content type. Connects to VirtualMessageList.tsx." },
  { path:"src/components/permissions", emoji:"🛡️", purpose:"51 files covering permission request dialogs, allow/deny UI, and rule editors for the permission system.", features:["Tool call approval dialog with allow/deny/always-allow","Rule editor for alwaysAllow and alwaysDeny lists","Visual diff of what the tool will change","Bypass-permissions mode confirmation"], interaction:"Listens to PermissionUpdate events from utils/permissions/. Renders approval prompt before tool execution resumes." },
  { path:"src/components/PromptInput", emoji:"⌨️", purpose:"Multi-line input, typeahead popup, ghost text, and mode indicators for the chat input bar.", features:["Multi-line expandable textarea","/ command and @file typeahead","Ghost text completion hints","Vim mode indicator badge","Voice input button"], interaction:"useTypeahead.tsx provides suggestions. Submitting fires QueryEngine.query(). KeybindingContext handles shortcuts." },
  { path:"src/components/tasks", emoji:"📋", purpose:"TodoWrite task list display with completion tracking and visual progress.", features:["Real-time task status updates","Color-coded pending/in_progress/completed","Compact collapsed view for idle tasks","Keyboard-navigable task selection"], interaction:"Reads AppState.todos. Updated live as TodoWriteTool makes state changes." },
  { path:"src/components/mcp", emoji:"🔌", purpose:"MCP server connection dialogs, tool approval, and capability display.", features:["Server connection status indicators","Tool capability list per server","OAuth flow initiation from UI","Multi-server multiselect dialog"], interaction:"Connects to services/mcp/useManageMCPConnections.ts hook for live connection state." },
  { path:"src/components/design-system", emoji:"🎨", purpose:"Base design tokens, colour palette, typography scales, and box primitives.", features:["CSS-in-JS colour constants","Typography scale (xs → 2xl)","Box primitive for consistent padding","Dark theme base colours"], interaction:"Imported by every component for consistent visual language. No external dependencies." },
  { path:"src/components/permissions", emoji:"🔐", purpose:"Full permission request dialog system — handles all tool approval, rule management, and bypass mode.", features:["Displays before risky tool calls","Allow/deny with optional 'always' flag","Shows tool name, inputs, and risk level","Rule editor for session-level permissions"], interaction:"Triggered by utils/permissions/permissions.ts when a tool call requires approval." },
  { path:"src/components/hooks", emoji:"🪝", purpose:"Component-level React hooks: useFocus, useScrollPosition, useWindowSize, and other terminal UI utilities.", features:["useFocus: terminal focus management","useScrollPosition: scroll position tracking","useWindowSize: terminal dimensions","useContainerSize: Yoga layout measurements"], interaction:"Used by layout components like FullscreenLayout.tsx and VirtualMessageList.tsx." },
  // ── Utils ─────────────────────────────────────────────────────────────────
  { path:"src/utils", emoji:"🧰", purpose:"200+ shared utility modules across 20 domains — the standard library powering every subsystem.", features:["Organised into feature subdirectories","Zero circular dependencies — utils import only Node builtins","Comprehensive test coverage","Tree-shakeable — each file exports only what it needs"], interaction:"Imported bottom-up: tools and services import from utils, never the reverse. Prevents dependency cycles." },
  { path:"src/utils/permissions", emoji:"🛡️", purpose:"24 files — the core permission evaluation engine, filesystem sandbox, path validation, and auto-mode classifier.", features:["Evaluates every tool call against alwaysAllow/alwaysDeny rules","Filesystem sandbox path resolution and traversal detection","Yolo/auto classifier decides if a command is safe without asking","Shell rule matching via bash AST analysis"], interaction:"Called by QueryEngine before every tool dispatch. Results: allow (auto-run), deny (block), ask (show dialog)." },
  { path:"src/utils/git", emoji:"🌿", purpose:"Git filesystem operations, config parsing, and gitignore checking.", features:["diff, log, status, branch operations","~/.gitconfig and .git/config parsing","gitignore path checking for file indexing"], interaction:"Used by commands/diff, the bridge worktree system, and GlobTool's gitignore-aware filtering." },
  { path:"src/utils/shell", emoji:"🐚", purpose:"10 files — shell detection, bash/PowerShell providers, read-only command validation.", features:["readOnlyCommandValidation.ts: 1,893-line validator for truly read-only commands","bash/PS path resolution across macOS/Linux/Windows","Shell prefix injection for safety wrappers","Output size limit enforcement"], interaction:"BashTool and PowerShellTool call their respective providers here. Permission system uses readOnlyCommandValidation." },
  { path:"src/utils/model", emoji:"🧠", purpose:"16 files — model string parsing, context windows, cost, aliases, Bedrock/Vertex support.", features:["Canonical model ID parsing (claude-opus-4-7, etc.)","Context window sizes per model","AWS Bedrock model ID mapping","Model allowlist for enterprise restrictions"], interaction:"QueryEngine calls model.ts for context window limits. ModelPicker.tsx calls modelOptions.ts for the selection UI." },
  { path:"src/utils/settings", emoji:"⚙️", purpose:"15 entries — settings loading with priority merge, MDM policy, live reload, and validation.", features:["Priority: env vars > MDM > project settings > global settings","Live reload via file watcher changeDetector.ts","Zod-based schema validation with human-readable errors","MDM subdirectory for enterprise managed policies"], interaction:"Loaded at startup in main.tsx. ConfigTool reads/writes via settings.ts. MDM policies cannot be overridden by users." },
  { path:"src/utils/bash", emoji:"🔬", purpose:"11 entries — complete bash AST parser, command analysis, shell completion, heredoc handling.", features:["4,436-line complete bash parser producing an AST","AST visitor pattern for static analysis","Heredoc parsing (<<EOF, <<'EOF', <<-EOF)","Tree-sitter backed analysis for complex constructs"], interaction:"BashTool validates commands through this AST parser. Permission classifier uses AST to detect dangerous patterns." },
  { path:"src/utils/suggestions", emoji:"💡", purpose:"5 files — typeahead suggestion backends for commands, directories, shell history, Slack channels, and skills.", features:["Slash-command fuzzy match with argument hints","@file directory completion","Slack channel suggestions from connected MCP server","Shell history prefix completion"], interaction:"All suggestion sources feed into hooks/unifiedSuggestions.ts which merges them for the PromptInput typeahead." },
  { path:"src/utils/sandbox", emoji:"📦", purpose:"Sandbox adapter restricting tool execution to a Docker/sysbox container with limited filesystem and network.", features:["Intercepts Bash and FileEdit tool calls","Remaps filesystem paths to sandbox volume","Network restrictions via sandbox policy","Violation display via SandboxViolationExpandedView.tsx"], interaction:"Wraps tool execute() functions when sandbox mode is active (e.g. in CI environments)." },
  // ── Commands ──────────────────────────────────────────────────────────────
  { path:"src/commands", emoji:"⌨️", purpose:"100+ CLI subcommands and slash-commands — every /command and CLI verb is a directory or file here.", features:["Each command is an isolated module with description, handler, and optional UI component","Registered lazily in main.tsx via Commander.js","Slash commands available in the interactive REPL","CLI subcommands available from the terminal"], interaction:"main.tsx registers all commands. REPL.tsx routes slash-commands to the commands/ handlers. Commander routes CLI flags." },
  { path:"src/commands/session", emoji:"🗂️", purpose:"Session list, switch, and info commands — browse and resume previous conversation sessions.", features:["Lists sessions by date with title search","Switch to a session by ID","Shows session metadata (tokens, cost, model)"], interaction:"Reads sessionStorage.ts from utils. Renders session list in a dialog via LogSelector.tsx." },
  { path:"src/commands/review", emoji:"🔍", purpose:"4 files — /ultrareview command for AI-powered PR code review and remote review runner.", features:["Reads PR diff via GitHub API","Sends diff to Claude for review","Remote review: runs review on a bridge session","Checks ultrareview quota before running"], interaction:"Calls services/api to stream the review. Reads PR data via commands/pr_comments. Requires GitHub token." },
  { path:"src/commands/mcp", emoji:"🔌", purpose:"4 files — /mcp list/add/remove/auth commands for managing MCP server connections.", features:["List: shows all connected servers with tool counts","Add: registers a new MCP server with auto-discovery","Remove: disconnects and removes server config","Auth: triggers OAuth flow for a server"], interaction:"Calls services/mcp/config.ts for persistence. Connection lifecycle managed by useManageMCPConnections hook." },
  { path:"src/commands/memory", emoji:"🧠", purpose:"View, edit, and clear MEMORY.md and per-project memory files.", features:["List memory entries with source file","Edit opens MEMORY.md in the configured editor","Clear removes memory entries by tag","Project-scoped vs global memory distinction"], interaction:"Reads from services/memdir (via src/memdir). Changes to MEMORY.md are picked up next session." },
  { path:"src/commands/hooks", emoji:"🪝", purpose:"Manage PreToolUse, PostToolUse, and Stop hooks in settings.", features:["List all configured hooks with trigger conditions","Add/remove hooks with command and pattern","Validate hook commands before saving","Show hook execution history from logs"], interaction:"Writes to utils/settings/settings.ts. Hooks execute via query/stopHooks.ts after each tool call." },
  { path:"src/commands/permissions", emoji:"🔐", purpose:"Manage alwaysAllow and alwaysDeny permission rules from the command line.", features:["List current allow/deny rules","Add/remove rules with path glob or tool name","Test a path/command against current rules","Export rules to settings file"], interaction:"Reads/writes utils/permissions/permissionsLoader.ts. Changes take effect immediately for the running session." },
  { path:"src/commands/skills", emoji:"⚡", purpose:"List available skills (reusable task templates) and show their argument hints.", features:["Discovers all .claude/skills/*.md files","Shows skill description and $ARGUMENTS placeholders","Filters by keyword search"], interaction:"Calls services/skills/loadSkillsDir.ts. Skill names appear in PromptInput typeahead via commandSuggestions.ts." },
  // ── Other top-level dirs ──────────────────────────────────────────────────
  { path:"src/vim", emoji:"🖊️", purpose:"Full modal Vim editing mode — motions, operators, text objects, and mode transitions for the PromptInput.", features:["Normal/Insert/Visual mode state machine","h/j/k/l/w/b/e/0/$ motions","d/c/y/p operators with count prefixes","Text objects: word, WORD, quoted string, parentheses"], interaction:"Integrated into VimTextInput.tsx component. Mode state stored alongside PromptInput state." },
  { path:"src/ink", emoji:"🖥️", purpose:"Custom React/Ink terminal renderer with Yoga layout — extends the upstream Ink library for Claude Code's needs.", features:["Yoga CSS flexbox layout in the terminal","ANSI color and style output","Custom box model primitives","Event system for keyboard and mouse"], interaction:"All components in src/components/ render through this layer. Output goes to stdout as ANSI escape sequences." },
  { path:"src/native-ts", emoji:"⚡", purpose:"TypeScript bindings for native Node.js addons: file-index, color-diff, and Yoga layout.", features:["file-index: native C++ file indexing for fast GlobTool","color-diff: native diff algorithm for syntax-highlighted diffs","yoga-layout: Yoga CSS layout via WASM bindings"], interaction:"Loaded lazily — falls back to JS implementations if native bindings fail to load (important for CI)." },
  { path:"src/hooks", emoji:"🪝", purpose:"40+ React hooks for autocomplete, voice input, polling, REPL bridge, and history search.", features:["useTypeahead: smart autocomplete with keyboard nav and caching","useVoiceIntegration: voice recording and transcription","useInboxPoller: polls inbox for new tasks/messages","useReplBridge: bridges interactive REPL sessions"], interaction:"Used by components/ throughout. They read AppState and AppState services, encapsulating complex async logic." },
  { path:"src/constants", emoji:"📌", purpose:"21 config files — system prompts, API limits, beta flags, output styles, and product constants.", features:["prompts.ts: all Claude API system prompt templates","betas.ts: INTERLEAVED_THINKING and FAST_MODE_BETA headers","apiLimits.ts: image max size, token caps, message limits","files.ts: gitignore patterns and config file names"], interaction:"Imported by QueryEngine, tools, and settings validation. Never import from business logic — one-way dependency." },
  { path:"src/context", emoji:"🌐", purpose:"9 React Context providers — notifications, session stats, overlays, voice, modal, and message queue.", features:["NotificationsContext: priority queue with auto-dismiss","StatsContext: live token/cost metrics","OverlayContext: modal and overlay state","VoiceContext: voice recording state"], interaction:"Provided at the root in App.tsx. Components consume via useContext() hooks without prop drilling." },
  { path:"src/state", emoji:"🗃️", purpose:"6 files — AppState store, memoized selectors, change listeners, and multi-agent helpers.", features:["AppStateStore.ts: all state field definitions (messages, tasks, session, permissions)","onChangeAppState.ts: side-effect subscriptions","selectors.ts: memoized derived state","store.ts: generic reactive store primitive"], interaction:"Central hub: tools write via updateAppState(), components read via useAppStateStore(). Drives the entire UI reactivity." },
  { path:"src/types", emoji:"📐", purpose:"7 TypeScript definition files — permissions, plugins, hooks, branded IDs, and command types.", features:["permissions.ts: PermissionRule, PermissionResult, PermissionMode types","plugin.ts: PluginManifest and BuiltinPluginDefinition","hooks.ts: HookEvent, PreToolUse, PostToolUse, Stop schemas","ids.ts: branded SessionId and AgentId to prevent ID mix-ups"], interaction:"Imported by all other modules. No runtime code — pure type definitions. Enforced by TypeScript compiler." },
  { path:"src/memdir", emoji:"🧠", purpose:"Memory system — CLAUDE.md loading, LLM relevance scoring, team memory paths, and memory taxonomy.", features:["Loads CLAUDE.md files from project and global directories","LLM-powered relevance scoring to select relevant memories","Team memory path sharing across multi-agent sessions","Memory taxonomy: user / feedback / project / reference"], interaction:"Loaded at session start by main.tsx. Relevant memories injected into system prompt by QueryEngine." },
  { path:"src/bootstrap", emoji:"🚀", purpose:"Global session state — single source of truth for all non-reactive session globals (CWD, costs, tokens, permissions, plan mode).", features:["state.ts: 1,758-line singleton for session globals","CWD tracking independent of process.cwd()","Accumulated cost and token counters","Plan mode and bypass-permissions flags"], interaction:"Imported directly (not via React context) by modules that need low-latency reads. AppState wraps this for reactive UI." },
  { path:"src/schemas", emoji:"📋", purpose:"Zod validation schemas for hooks config and permission rule syntax.", features:["Validates hooks.ts event types","Permission rule string syntax validation","Used at settings load time for early error detection"], interaction:"Called by utils/settings/settings.ts during settings parsing. Errors surfaced via validationTips.ts." },
  { path:"src/migrations", emoji:"🔄", purpose:"11 migration files — model renames, settings moves, feature flag resets, and permission schema upgrades.", features:["Run automatically at startup if migration needed","Each migration is idempotent (safe to run twice)","Covers: model ID renames, settings key moves, auto-mode resets"], interaction:"Executed in main.tsx before the app starts. Ensures settings files from old versions work correctly." },
  { path:"src/keybindings", emoji:"⌨️", purpose:"14 files — keyboard shortcut registry, user overrides, Vim maps, platform normalisation, and conflict validation.", features:["defaultBindings.ts: full map of all actions to keys","User overrides merged from .claude/settings.json","macOS Ctrl→Cmd normalisation","Conflict detection and reserved shortcuts list"], interaction:"KeybindingContext.tsx provides the active map. useKeybinding.ts hook subscribes components to named bindings." },
  { path:"src/skills", emoji:"⚡", purpose:"4 entries — skill discovery, manifest loading, bundled skills, and MCP skill builders.", features:["Discovers all .claude/skills/*.md files","Validates skill manifest front-matter","Built-in bundled skills shipped with Claude Code (ultrareview)","MCP-compatible tool definitions from skill manifests"], interaction:"loadSkillsDir.ts called at startup. Skill definitions appear as virtual tools available to Claude." },
  { path:"src/screens", emoji:"📺", purpose:"3 top-level screen components — the main REPL chat, Doctor diagnostics, and ResumeConversation.", features:["REPL.tsx: 5,000-line main interactive screen","Doctor.tsx: health check for API, git, node, config","ResumeConversation.tsx: browse and resume past sessions"], interaction:"Rendered by main.tsx based on CLI subcommand. REPL is the default; /doctor and /resume route to their screens." },
  { path:"src/server", emoji:"🖧", purpose:"3 files — direct-connect session server for SDK mode without CLI polling.", features:["Accepts SDK connections and routes to session runners","Auth validation for incoming connections","Maps SDK message format to internal types"], interaction:"Used when Claude Code runs in SDK mode (no terminal UI). sdkMessageAdapter.ts in remote/ bridges the formats." },
  { path:"src/remote", emoji:"📡", purpose:"4 files — remote session management, WebSocket sessions, permission bridge, SDK adapter.", features:["WebSocket server for web/API clients","Remote session lifecycle: create, route, teardown, reconnect","Permission requests bridged back to local terminal","SDK wire format adapter"], interaction:"SessionsWebSocket.ts accepts web connections. Permissions flow back via remotePermissionBridge.ts to local approval dialog." },
  { path:"src/entrypoints", emoji:"🚪", purpose:"5 files + sdk/ — binary entry points for CLI, MCP server, SDK, init, and sandbox.", features:["cli.tsx: CLI REPL bootstrap and Commander routing","mcp.ts: exposes Claude Code as an MCP tool provider","sdk/: Claude Agent SDK npm package entry point","init.ts: one-time setup wizard"], interaction:"Each entrypoint is a separate binary target. cli.tsx is the default `claude` binary; mcp.ts enables MCP-as-server mode." },
  { path:"src/query", emoji:"⚙️", purpose:"4 files — query preprocessing, token budget management, stop hooks, and dependency injection.", features:["tokenBudget.ts: computes per-turn max_tokens and thinking budget","stopHooks.ts: runs PostToolUse and Stop shell hooks","config.ts: QueryEngine default parameters","deps.ts: dependency injection container types"], interaction:"Used exclusively by QueryEngine. stopHooks.ts runs after every tool call if hooks are configured in settings." },
  { path:"src/cli", emoji:"💻", purpose:"8 entries — CLI output engine, structured JSON output, remote I/O, update logic, and transports.", features:["print.ts: 5,500-line terminal ANSI renderer for all message types","structuredIO.ts: NDJSON output mode for CI/scripting","update.ts: semver check and upgrade prompt","transports/: stdio, SSE, WebSocket output delivery"], interaction:"print.ts called by REPL.tsx for each new message. structuredIO.ts active when --output-format json flag is set." },
  { path:"src/tasks", emoji:"📦", purpose:"9 entries — all 6 task type implementations plus stop utility, pill labels, and type definitions.", features:["LocalMainSessionTask: wraps the full REPL session","LocalAgentTask: background sub-agent with output file","LocalShellTask: shell command with stream and timeout","DreamTask: memory consolidation after sessions"], interaction:"Tasks registered in QueryEngine's task registry. TaskListTool reads it; TaskStopTool calls kill() on the right instance." },
  { path:"src/voice", emoji:"🎤", purpose:"1 file — voice mode entitlement check based on subscription tier and feature flags.", features:["Checks subscription plan via billing API","Reads GrowthBook voice feature flag","Returns enabled/disabled with reason"], interaction:"Called by useVoiceIntegration hook before starting recording. VoiceContext reflects the result." },
  { path:"src/upstreamproxy", emoji:"🔀", purpose:"2 files — HTTP proxy for routing API calls through enterprise proxy endpoints.", features:["Intercepts all API HTTP calls","Configurable upstream proxy URL from settings","TCP relay for tunnel connections","Certificate pinning support"], interaction:"Wraps services/api/client.ts HTTP transport when upstreamProxy setting is configured." },
];

const TOOLS_GUIDE: RefTool[] = [
  { name:"AgentTool",           emoji:"🤖", category:"Agents",       purpose:"Spawn a sub-agent to handle a subtask independently. The sub-agent gets its own ReAct loop, tool set, and context.", inputs:"prompt (required), model (optional), tools (optional subset)", outputs:"Final text response from the sub-agent", keyBehavior:"Forks an isolated QueryEngine. Sub-agents have the same tools unless restricted. Swarm mode spawns N agents in parallel.", usedBy:["coordinator/coordinatorMode.ts"] },
  { name:"BashTool",            emoji:"💻", category:"Shell",         purpose:"Execute any shell command with timeout, sandbox enforcement, and cross-platform path resolution.", inputs:"command (string), timeout (ms, optional)", outputs:"stdout + stderr text, exit code", keyBehavior:"Validates command through bash AST parser before execution. Checks permission rules. Enforces output size limits.", usedBy:["QueryEngine when Claude needs to run code or system commands"] },
  { name:"PowerShellTool",      emoji:"🪟", category:"Shell",         purpose:"Execute PowerShell scripts on Windows systems.", inputs:"command (string), timeout (ms, optional)", outputs:"stdout + stderr formatted output", keyBehavior:"Detects pwsh vs legacy powershell.exe. Escapes arguments safely. Formats PSObject output as readable text.", usedBy:["QueryEngine on Windows systems"] },
  { name:"FileEditTool",        emoji:"✏️", category:"File System",   purpose:"Make precise string replacements in files — the preferred way to modify existing files.", inputs:"file_path, old_string (must be unique in file), new_string", outputs:"Success confirmation with a diff snippet", keyBehavior:"Fails if old_string appears 0 or 2+ times (uniqueness enforcement). Triggers LSP diagnostics after edit.", usedBy:["QueryEngine for all code modifications"] },
  { name:"FileReadTool",        emoji:"📖", category:"File System",   purpose:"Read file contents with optional line number offset/limit, PDF page range, or Jupyter cell rendering.", inputs:"file_path, offset (line), limit (lines), pages (PDF range)", outputs:"File contents with cat -n line numbers", keyBehavior:"Reads files in chunks for large files. Renders .ipynb notebooks as combined cell text. Reads PDFs up to 20 pages.", usedBy:["QueryEngine to understand code before editing"] },
  { name:"FileWriteTool",       emoji:"💾", category:"File System",   purpose:"Write or completely overwrite a file. For new files or full rewrites — use FileEditTool for partial changes.", inputs:"file_path, content (full file contents)", outputs:"Success confirmation", keyBehavior:"Creates parent directories if they don't exist. Enforces reading the file first before overwriting existing files.", usedBy:["QueryEngine when creating new files"] },
  { name:"GlobTool",            emoji:"🔍", category:"File System",   purpose:"Match file paths using glob patterns (e.g. src/**/*.ts), returning results sorted by modification time.", inputs:"pattern (glob string), path (base directory, optional)", outputs:"Newline-delimited list of matching absolute file paths", keyBehavior:"Uses native file-index for speed. Results sorted newest-first. Respects .gitignore.", usedBy:["QueryEngine for file discovery"] },
  { name:"GrepTool",            emoji:"🔎", category:"File System",   purpose:"Search file contents using ripgrep with full regex support, context lines, and file type filters.", inputs:"pattern (regex), path, glob, type, output_mode, -A/-B/-C, head_limit", outputs:"Matching lines with context, file paths, or counts depending on output_mode", keyBehavior:"Uses system ripgrep binary. Three output modes: content, files_with_matches, count. Supports head_limit+offset pagination.", usedBy:["QueryEngine for code symbol and text search"] },
  { name:"WebFetchTool",        emoji:"🌐", category:"Web",           purpose:"Fetch a URL and return its content converted to Markdown for LLM-friendly reading.", inputs:"url (string), max_length (bytes, optional)", outputs:"Markdown-converted page content", keyBehavior:"Checks robots.txt. Converts HTML to Markdown. Truncates at max_length. Follows redirects.", usedBy:["QueryEngine when Claude needs to read web content"] },
  { name:"WebSearchTool",       emoji:"🔎", category:"Web",           purpose:"Search the web via Brave or Google Search API and return ranked results.", inputs:"query (string), num_results (optional)", outputs:"Array of {title, url, snippet} results", keyBehavior:"Routes to Brave API or Google Search API based on configuration. Filters explicit content. Ranks by relevance.", usedBy:["QueryEngine for research tasks"] },
  { name:"TodoWriteTool",       emoji:"✅", category:"Productivity",   purpose:"Create and manage a structured task list to track multi-step work progress.", inputs:"todos array with {content, activeForm, status} objects", outputs:"Updated task list confirmation", keyBehavior:"Enforces exactly one in_progress task. Validates status transitions. Displays live in the UI.", usedBy:["QueryEngine for task tracking across long sessions"] },
  { name:"TaskCreateTool",      emoji:"▶️", category:"Tasks",         purpose:"Create a background agent task that runs a sub-agent asynchronously while the main session continues.", inputs:"prompt (string), model (optional)", outputs:"task_id string for tracking", keyBehavior:"Returns immediately with a task ID. Sub-agent writes output to a file. Use TaskOutputTool to poll results.", usedBy:["QueryEngine for parallelising long-running work"] },
  { name:"TaskOutputTool",      emoji:"📤", category:"Tasks",         purpose:"Read new output bytes from a running background task's output file.", inputs:"task_id, offset (bytes already read)", outputs:"New output text + EOF flag when complete", keyBehavior:"Non-blocking poll. Returns empty string if no new output. Sets is_complete=true on task finish.", usedBy:["QueryEngine in polling loops for background tasks"] },
  { name:"TaskGetTool",         emoji:"🔍", category:"Tasks",         purpose:"Get the current status and metadata of a specific background task by ID.", inputs:"task_id", outputs:"Task object: {id, type, status, started_at, output_path}", keyBehavior:"Reads from in-memory task registry. Fast non-blocking call.", usedBy:["QueryEngine to check task status before polling output"] },
  { name:"TaskListTool",        emoji:"📋", category:"Tasks",         purpose:"List all active background tasks in the current session.", inputs:"(none)", outputs:"Table of all tasks: id, type, status, elapsed", keyBehavior:"Shows all tasks including completed and stopped ones. ID prefix encodes type: a=agent, b=bash, d=dream.", usedBy:["QueryEngine to discover task IDs in multi-task sessions"] },
  { name:"TaskStopTool",        emoji:"⛔", category:"Tasks",         purpose:"Stop a running background task by sending SIGTERM then SIGKILL after a grace period.", inputs:"task_id", outputs:"Confirmation of termination", keyBehavior:"5-second grace period before SIGKILL. Works for shell, agent, and remote tasks. Updates task status to 'stopped'.", usedBy:["QueryEngine when a task must be cancelled"] },
  { name:"TaskUpdateTool",      emoji:"🔄", category:"Tasks",         purpose:"Update metadata or add progress notes to a background task.", inputs:"task_id, metadata (key-value pairs)", outputs:"Updated task confirmation", keyBehavior:"Attaches arbitrary metadata to a task for tracking progress notes or annotations.", usedBy:["QueryEngine for annotating long-running tasks"] },
  { name:"SendMessageTool",     emoji:"💬", category:"Multi-Agent",   purpose:"Send a message to a named team channel so other agents in the session can receive it.", inputs:"channel_id, message (string or JSON)", outputs:"Delivery confirmation", keyBehavior:"Broadcasts to all channel subscribers. Messages queued if recipient is busy. Supports structured JSON payloads.", usedBy:["Sub-agents in coordinator-spawned sessions"] },
  { name:"TeamCreateTool",      emoji:"👥", category:"Multi-Agent",   purpose:"Create a shared communication channel for a multi-agent session.", inputs:"name (channel name)", outputs:"channel_id string", keyBehavior:"Channel scoped to current session. All agents in the session can subscribe. Supports broadcast and unicast modes.", usedBy:["Coordinator agents before spawning worker agents"] },
  { name:"TeamDeleteTool",      emoji:"🗑️", category:"Multi-Agent",   purpose:"Delete a team channel and notify all subscribers when multi-agent work completes.", inputs:"channel_id", outputs:"Deletion confirmation", keyBehavior:"Notifies subscribers before deletion. Clears message queue. Prevents stale references.", usedBy:["Coordinator agents at end of multi-agent session"] },
  { name:"MCPTool",             emoji:"🔌", category:"MCP",           purpose:"Execute any tool on a connected MCP server — the bridge to external MCP capabilities.", inputs:"server_name, tool_name, tool_parameters (JSON)", outputs:"Tool result from MCP server", keyBehavior:"Dynamically dispatches based on registered MCP servers. Tool names prefixed with server name to avoid collisions.", usedBy:["QueryEngine when Claude needs external MCP capabilities"] },
  { name:"ListMcpResourcesTool",emoji:"📚", category:"MCP",           purpose:"List available resources (files, data, endpoints) on a connected MCP server.", inputs:"server_name (optional — all servers if omitted)", outputs:"Array of {uri, mime_type, name} resources", keyBehavior:"Paginates for large resource lists. Works across all connected servers if server not specified.", usedBy:["QueryEngine before calling ReadMcpResourceTool"] },
  { name:"ReadMcpResourceTool", emoji:"📄", category:"MCP",           purpose:"Read the contents of a specific MCP resource by URI.", inputs:"uri (resource URI from ListMcpResourcesTool)", outputs:"Resource content (text or base64 for binary)", keyBehavior:"MIME-type aware formatting. Binary resources returned as base64. Text resources returned as UTF-8 string.", usedBy:["QueryEngine for reading MCP server data sources"] },
  { name:"McpAuthTool",         emoji:"🔐", category:"MCP",           purpose:"Initiate an OAuth authentication flow for an MCP server that requires login.", inputs:"server_name", outputs:"Auth status and token stored confirmation", keyBehavior:"Opens browser for OAuth consent. Stores token in ~/.claude/. Future MCPTool calls work without re-auth.", usedBy:["QueryEngine when an MCP server returns 401"] },
  { name:"SkillTool",           emoji:"⚡", category:"Skills",        purpose:"Execute a user-defined skill (reusable prompt template) from .claude/skills/.", inputs:"skill_name, arguments (substituted into $ARGUMENTS)", outputs:"Skill execution result", keyBehavior:"Reads .md skill file, substitutes $ARGUMENTS, executes as a sub-query. Skills appear in / typeahead.", usedBy:["QueryEngine when user invokes a named skill"] },
  { name:"ScheduleCronTool",    emoji:"⏰", category:"Scheduling",    purpose:"Create, delete, and list cron-style recurring scheduled tasks.", inputs:"action (create/delete/list), schedule (cron expr), prompt (for create)", outputs:"Created schedule ID or list of schedules", keyBehavior:"Cron expression parsed and stored. Fires LocalAgentTask at scheduled time. Lists show next-fire timestamp.", usedBy:["QueryEngine for recurring automation workflows"] },
  { name:"RemoteTriggerTool",   emoji:"🚀", category:"Remote",        purpose:"Programmatically trigger a remote Claude Code agent session via the bridge API.", inputs:"prompt, session_config (optional)", outputs:"session_id for the triggered remote session", keyBehavior:"Calls bridgeApi.ts HTTP POST. Returns immediately with session ID. Use bridge/session endpoints to monitor.", usedBy:["QueryEngine for cloud agent orchestration"] },
  { name:"EnterWorktreeTool",   emoji:"🌿", category:"Git",           purpose:"Switch the session working directory into a git worktree for isolated branch work.", inputs:"branch_name or worktree_path", outputs:"New CWD path confirmation", keyBehavior:"Resolves worktree from branch name. Updates AppState.cwd. Persists to bridgePointer.ts for reconnects.", usedBy:["QueryEngine for parallel branch workflows"] },
  { name:"ExitWorktreeTool",    emoji:"↩️", category:"Git",           purpose:"Exit the current git worktree and restore the previous working directory.", inputs:"(none)", outputs:"Restored CWD confirmation", keyBehavior:"Reads prior CWD from bridgePointer.ts. Optionally cleans up worktree if no changes were made.", usedBy:["QueryEngine after completing worktree-isolated work"] },
  { name:"EnterPlanModeTool",   emoji:"📝", category:"Permissions",   purpose:"Enable read-only plan mode — no writes, edits, or shell commands allowed.", inputs:"(none)", outputs:"Mode confirmation", keyBehavior:"Sets PermissionMode to plan_mode. All write tools return a polite refusal. LLM can read and analyse freely.", usedBy:["QueryEngine when user wants planning without execution"] },
  { name:"ExitPlanModeTool",    emoji:"🔓", category:"Permissions",   purpose:"Exit plan mode and restore full normal permissions.", inputs:"(none)", outputs:"Mode confirmation", keyBehavior:"Reverts PermissionMode. Emits PermissionUpdate event. Logged in session history.", usedBy:["QueryEngine after plan is approved and execution resumes"] },
  { name:"REPLTool",            emoji:"🖥️", category:"REPL",          purpose:"Start a persistent JS or Python interpreter session that retains state between calls.", inputs:"language (js|python), code (string)", outputs:"stdout/stderr from code execution", keyBehavior:"Spawns a persistent child process. Variables and imports survive between calls. Timeout per execution.", usedBy:["QueryEngine for iterative code experiments"] },
  { name:"LSPTool",             emoji:"🔬", category:"Language",      purpose:"Query Language Server Protocol for hover type info, go-to-definition, and live diagnostics.", inputs:"action (hover|definition|diagnostics), file_path, line, character", outputs:"Hover text / definition location / diagnostic list", keyBehavior:"Auto-starts the correct LSP for the file language. Caches results per file. Updates after edits.", usedBy:["QueryEngine to enrich code understanding"] },
  { name:"NotebookEditTool",    emoji:"📓", category:"Notebooks",     purpose:"Edit Jupyter notebook cells — insert, delete, modify cell content and metadata.", inputs:"file_path, cell_index, new_source, cell_type", outputs:"Updated notebook confirmation", keyBehavior:"Reads .ipynb JSON, mutates the cells array immutably, writes back. Preserves output metadata.", usedBy:["QueryEngine for data science notebook editing"] },
  { name:"AskUserQuestionTool", emoji:"❓", category:"UX",            purpose:"Pause execution and ask the user a clarifying question before proceeding.", inputs:"question (string)", outputs:"User's answer string", keyBehavior:"Suspends the ReAct loop until the user responds. Skipped in auto/yolo mode with a safe default.", usedBy:["QueryEngine when Claude needs disambiguation"] },
  { name:"BriefTool",           emoji:"📋", category:"Productivity",  purpose:"Generate a concise Markdown summary of work done in the current session.", inputs:"scope (task|session, optional)", outputs:"Markdown brief with sections for changes, decisions, next steps", keyBehavior:"Reads session history and file changes from AppState. Calls LLM via sideQuery.ts for the summary.", usedBy:["QueryEngine when user asks for a session summary"] },
  { name:"ConfigTool",          emoji:"⚙️", category:"Config",        purpose:"Read and write Claude Code settings from ~/.claude.json or .claude/settings.json.", inputs:"action (get|set|list), key (dot-path), value (for set)", outputs:"Current value or success confirmation", keyBehavior:"Validates against settings schema. Changes take effect immediately via live-reload changeDetector.", usedBy:["QueryEngine for reading/updating Claude Code config"] },
  { name:"SleepTool",           emoji:"💤", category:"Utility",       purpose:"Wait N seconds — used for pacing in multi-agent orchestration.", inputs:"duration_seconds (number)", outputs:"Completion confirmation after the wait", keyBehavior:"Pure promisified setTimeout. Maximum configurable via schema. No side effects.", usedBy:["Coordinator agents to pace sub-agent launches"] },
  { name:"SyntheticOutputTool", emoji:"🧪", category:"Testing",       purpose:"Inject synthetic tool output into the conversation for testing and replay scenarios.", inputs:"tool_name, output (pre-canned result string)", outputs:"The injected result (passed through as tool_result)", keyBehavior:"Bypasses actual tool execution. Inserts fake tool_result into AppState history. Dev/test mode only.", usedBy:["Test fixtures and demo session replay"] },
  { name:"ToolSearchTool",      emoji:"🔎", category:"Discovery",     purpose:"Search all available tools by keyword to find the right tool for a task.", inputs:"query (search terms)", outputs:"Array of {name, description} matching tools", keyBehavior:"Fuzzy search across tool names and descriptions. Enables deferred loading — tools can be discovered at runtime.", usedBy:["QueryEngine when Claude needs to find a less-common tool"] },
];

const MODULES_GUIDE: RefModule[] = [
  { name:"API Service",       emoji:"☁️",  path:"src/services/api",      role:"Anthropic Claude API client with streaming, retry logic, prompt cache, and cost tracking.", keyFiles:["claude.ts — streaming SSE client","withRetry.ts — exponential backoff","errors.ts — error hierarchy","filesApi.ts — Files API for vision"], connects:["QueryEngine","services/analytics"] },
  { name:"MCP Client",        emoji:"🔌",  path:"src/services/mcp",      role:"Full MCP (Model Context Protocol) client — connects to any MCP server, handles OAuth, and registers dynamic tools.", keyFiles:["client.ts — protocol client","auth.ts — OAuth 2.0 + PKCE","config.ts — server configuration","xaa.ts — registry integration"], connects:["MCPTool","ListMcpResourcesTool","McpAuthTool","useManageMCPConnections.ts"] },
  { name:"Analytics",         emoji:"📊",  path:"src/services/analytics", role:"Telemetry pipeline — GrowthBook feature flags, first-party events, Datadog APM, and opt-out enforcement.", keyFiles:["growthbook.ts — feature flags","firstPartyEventLogger.ts — structured event logging","datadog.ts — APM metrics","sinkKillswitch.ts — emergency disable"], connects:["main.tsx bootstrap","metricsOptOut.ts","all tool call sites"] },
  { name:"Compact Service",   emoji:"📦",  path:"src/services/compact",   role:"Conversation compaction — summarises history via LLM to free context window space when usage approaches limits.", keyFiles:["compact.ts — full LLM compaction","microCompact.ts — lightweight collapsing","autoCompact.ts — threshold trigger","sessionMemoryCompact.ts — MEMORY.md distillation"], connects:["QueryEngine","AppState","autoDream"] },
  { name:"LSP Service",       emoji:"🔬",  path:"src/services/lsp",       role:"Language Server Protocol client — manages one LSP process per language, caches diagnostics, queries hover/definition.", keyFiles:["LSPServerManager.ts — multi-language manager","LSPClient.ts — JSON-RPC client","LSPDiagnosticRegistry.ts — diagnostics cache","LSPServerInstance.ts — single server lifecycle"], connects:["LSPTool","FileEditTool (post-edit diagnostics)","PassiveFeedback"] },
  { name:"OAuth Service",     emoji:"🔑",  path:"src/services/oauth",     role:"OAuth 2.0 with PKCE for Console login and API key auth — handles code exchange, token refresh, and revocation.", keyFiles:["client.ts — PKCE flow","auth-code-listener.ts — local redirect server","index.ts — getAccessToken() export","crypto.ts — PKCE challenge generation"], connects:["services/api/client.ts","bridge/bridgeApi.ts","login/logout commands"] },
  { name:"Plugins Service",   emoji:"🧩",  path:"src/services/plugins",   role:"Plugin lifecycle management — download, GPG signature verify, sandbox install, activate, and uninstall plugins.", keyFiles:["pluginOperations.ts — full lifecycle","pluginCliCommands.ts — /plugin commands","PluginInstallationManager.ts — progress UI"], connects:["commands/plugin","loadAllTools() in main.tsx","sandbox adapter"] },
  { name:"AutoDream",         emoji:"💭",  path:"src/services/autoDream", role:"Background memory consolidation — LLM extracts key facts from session history and appends to MEMORY.md.", keyFiles:["autoDream.ts — DreamTask core","consolidationLock.ts — file-level lock","consolidationPrompt.ts — fact extraction prompt"], connects:["src/tasks/DreamTask","src/memdir","MEMORY.md file"] },
  { name:"Bridge",            emoji:"🌉",  path:"src/bridge",             role:"Remote Control bridge — enables browser, mobile, and CI to control Claude Code sessions over SSE+HTTP+JWT tunnels.", keyFiles:["bridgeMain.ts — poll loop orchestrator","replBridge.ts — REPL session lifecycle","bridgeApi.ts — HTTP client","replBridgeTransport.ts — v1/v2 transports"], connects:["services/api","services/oauth","RemoteTriggerTool","SessionsWebSocket.ts"] },
  { name:"Query Engine",      emoji:"⚙️",  path:"src/QueryEngine.ts",     role:"The ReAct reasoning loop — receives every user message, streams from Claude API, dispatches tool calls, and loops until end_turn.", keyFiles:["QueryEngine.ts — core loop","src/query/stopHooks.ts — post-tool hooks","src/query/tokenBudget.ts — per-turn token limits"], connects:["services/api","all tools (Map<string,Tool>)","AppState","services/compact"] },
  { name:"Permission System", emoji:"🛡️",  path:"src/utils/permissions",  role:"24-file permission engine — evaluates every tool call against rules, manages sandbox paths, and classifies auto-mode safety.", keyFiles:["permissions.ts — evaluation engine","yoloClassifier.ts — auto-mode classifier","filesystem.ts — path sandbox","permissionsLoader.ts — rule loading"], connects:["QueryEngine (pre-dispatch)","components/permissions (UI)","bootstrap/state.ts"] },
  { name:"Settings Loader",   emoji:"⚙️",  path:"src/utils/settings",     role:"Priority-merge settings system — loads from env vars, MDM, project settings, and global settings with live-reload.", keyFiles:["settings.ts — loader and merger","types.ts — all settings types","changeDetector.ts — file watcher","validation.ts — full schema validation"], connects:["main.tsx","ConfigTool","all tools that read config"] },
  { name:"Bash Parser",       emoji:"🔬",  path:"src/utils/bash",         role:"Complete bash AST parser + command analysis — used for safe command inspection, injection detection, and shell completion.", keyFiles:["bashParser.ts — 4,436-line parser","ast.ts — AST node types","commands.ts — command-level analysis","shellCompletion.ts — tab-complete"], connects:["BashTool","utils/permissions/bashClassifier.ts","PromptInput typeahead"] },
  { name:"Model Utilities",   emoji:"🧠",  path:"src/utils/model",        role:"Model string parsing, context windows, cost tables, aliases, and Bedrock/Vertex provider support.", keyFiles:["model.ts — canonical ID parsing","modelOptions.ts — all model parameters","bedrock.ts — AWS Bedrock mapping","modelStrings.ts — all model ID constants"], connects:["QueryEngine","ModelPicker.tsx","utils/settings (allowlist)"] },
  { name:"Memory System",     emoji:"🧠",  path:"src/memdir",             role:"CLAUDE.md loading, LLM-powered relevance scoring, team memory paths, and memory taxonomy.", keyFiles:["memdir.ts — core memory ops","findRelevantMemories.ts — LLM relevance scoring","memoryTypes.ts — taxonomy","teamMemPaths.ts — multi-agent paths"], connects:["QueryEngine (system prompt injection)","autoDream","commands/memory"] },
  { name:"State Store",       emoji:"🗃️",  path:"src/state",              role:"Central reactive AppState — all session state (messages, tasks, CWD, tokens, permissions) with change subscriptions.", keyFiles:["AppStateStore.ts — all state fields","AppState.tsx — React provider","onChangeAppState.ts — side-effect subscriptions","selectors.ts — memoized queries"], connects:["All components (via useAppStateStore)","QueryEngine","all tools (read/write state)"] },
  { name:"Keybindings",       emoji:"⌨️",  path:"src/keybindings",        role:"Keyboard shortcut registry — default map, user overrides, platform normalisation, conflict detection, and Vim maps.", keyFiles:["defaultBindings.ts — full action map","loadUserBindings.ts — user overrides","validate.ts — conflict detection","KeybindingContext.tsx — React provider"], connects:["PromptInput (submit, cancel)","VirtualMessageList (scroll)","all keyboard-driven components"] },
  { name:"Bootstrap State",   emoji:"🚀",  path:"src/bootstrap",          role:"Non-reactive session globals — CWD, accumulated costs, tokens, permission mode, plan mode, and slow-op flags.", keyFiles:["state.ts — 1,758-line singleton"], connects:["main.tsx","QueryEngine","utils/permissions","components via AppState wrapper"] },
  { name:"Task System",       emoji:"📦",  path:"src/tasks",              role:"6 task type implementations wrapping every kind of background work with a unified kill() interface.", keyFiles:["LocalMainSessionTask.ts","LocalAgentTask/ dir","LocalShellTask/ dir","DreamTask/ dir","InProcessTeammateTask/ dir","RemoteAgentTask/ dir"], connects:["TaskCreateTool","TaskStopTool","QueryEngine task registry","autoDream service"] },
  { name:"CLI Output Engine", emoji:"💻",  path:"src/cli",                role:"Terminal ANSI renderer, structured JSON output, update checker, and transport layer for all CLI output.", keyFiles:["print.ts — 5,500-line ANSI renderer","structuredIO.ts — NDJSON mode","update.ts — semver upgrade check","transports/ — stdio/SSE/WebSocket"], connects:["REPL.tsx (renders messages)","main.tsx (output mode selection)","bridge (remote output delivery)"] },
  { name:"Context Providers", emoji:"🌐",  path:"src/context",            role:"9 React Context providers for notifications, stats, overlays, voice, modals, and message queuing.", keyFiles:["notifications.tsx","stats.tsx","overlayContext.tsx","voice.tsx","modalContext.tsx"], connects:["All UI components consume these","main.tsx provides them at root","AppState updates trigger context re-renders"] },
];

const COMMANDS_GUIDE: RefCommand[] = [
  // Session
  { cmd:"/session",         category:"Session",       emoji:"🗂️", description:"List, switch between, and inspect previous conversation sessions.", usage:"/session list | /session switch <id> | /session info" },
  { cmd:"/resume",          category:"Session",       emoji:"▶️", description:"Resume a previous session by ID or fuzzy title search.", usage:"/resume <session-id or title fragment>" },
  { cmd:"/rewind",          category:"Session",       emoji:"⏪", description:"Rewind the current session to a previous turn, discarding later messages.", usage:"/rewind <turn-number>" },
  { cmd:"/teleport",        category:"Session",       emoji:"🌀", description:"Clone the current session state into a new git worktree for parallel experimentation.", usage:"/teleport <branch-name>" },
  // Code review & PR
  { cmd:"/review",          category:"Code Review",   emoji:"🔍", description:"Run an AI-powered code review on the current PR diff or staged changes.", usage:"/review [--remote] [--pr <url>]" },
  { cmd:"/diff",            category:"Code Review",   emoji:"📊", description:"Show the current git diff as context for the conversation.", usage:"/diff [--staged] [-- <file>]" },
  { cmd:"/export",          category:"Output",        emoji:"📤", description:"Export the current conversation transcript to Markdown or JSON.", usage:"/export [--format json|md] [--output <file>]" },
  { cmd:"/pr_comments",     category:"Code Review",   emoji:"💬", description:"Fetch GitHub PR comments and inject them as context.", usage:"/pr_comments <pr-url>" },
  { cmd:"/autofix-pr",      category:"Code Review",   emoji:"🔧", description:"Automatically fix failing CI checks on a pull request.", usage:"/autofix-pr <pr-url>" },
  // Model & effort
  { cmd:"/model",           category:"Model",         emoji:"🧠", description:"Open the model picker to switch the active LLM and configure effort level.", usage:"/model [claude-opus-4-7 | claude-sonnet-4-6 | ...]" },
  { cmd:"/effort",          category:"Model",         emoji:"⚡", description:"Set the thinking effort level for the current session.", usage:"/effort <low | medium | high | max>" },
  { cmd:"/fast",            category:"Model",         emoji:"🚀", description:"Toggle fast mode — reduced thinking budget for quicker, less expensive responses.", usage:"/fast [on|off]" },
  // MCP
  { cmd:"/mcp",             category:"MCP",           emoji:"🔌", description:"Manage MCP server connections — list, add, remove, and authenticate.", usage:"/mcp list | /mcp add <name> <url> | /mcp remove <name> | /mcp auth <name>" },
  // Agents & tasks
  { cmd:"/agents",          category:"Agents",        emoji:"🤖", description:"List all active sub-agents and their current status.", usage:"/agents [list]" },
  { cmd:"/tasks",           category:"Tasks",         emoji:"📋", description:"List and manage background tasks in the current session.", usage:"/tasks | /tasks stop <id>" },
  // Environment & health
  { cmd:"/doctor",          category:"Health",        emoji:"🩺", description:"Run a health check — verifies API key, network, git, Node version, and config validity.", usage:"/doctor" },
  { cmd:"/env",             category:"Config",        emoji:"🌿", description:"Show or set environment variables for the current session.", usage:"/env | /env set KEY=value" },
  { cmd:"/debug-tool-call", category:"Debug",         emoji:"🐛", description:"Replay a specific tool call with full debug logging to diagnose issues.", usage:"/debug-tool-call <tool-name> <json-args>" },
  // Configuration
  { cmd:"/config",          category:"Config",        emoji:"⚙️", description:"Read or write Claude Code settings in .claude/settings.json or ~/.claude.json.", usage:"/config get <key> | /config set <key> <value> | /config list" },
  { cmd:"/keybindings",     category:"Config",        emoji:"⌨️", description:"List all keyboard shortcut bindings and test key combinations.", usage:"/keybindings [list | test]" },
  { cmd:"/output-style",    category:"Config",        emoji:"🎨", description:"Switch the output display style between detailed, concise, and auto modes.", usage:"/output-style <detailed | concise | auto>" },
  { cmd:"/theme",           category:"Config",        emoji:"🎨", description:"Switch the colour theme with a live terminal preview.", usage:"/theme [list | <theme-name>]" },
  { cmd:"/hooks",           category:"Config",        emoji:"🪝", description:"Manage PreToolUse, PostToolUse, and Stop hooks in your settings.", usage:"/hooks list | /hooks add | /hooks remove <id>" },
  { cmd:"/permissions",     category:"Config",        emoji:"🔐", description:"View and edit alwaysAllow and alwaysDeny permission rules.", usage:"/permissions list | /permissions add <rule> | /permissions remove <rule>" },
  // Plugins & skills
  { cmd:"/plugin",          category:"Plugins",       emoji:"🧩", description:"Install, list, and remove third-party plugins from .claude/plugins/.", usage:"/plugin install <name-or-url> | /plugin list | /plugin remove <name>" },
  { cmd:"/skills",          category:"Skills",        emoji:"⚡", description:"List all available skills and their argument hints.", usage:"/skills [list | <name>]" },
  // Memory
  { cmd:"/memory",          category:"Memory",        emoji:"🧠", description:"View, edit, and clear MEMORY.md and per-project memory files.", usage:"/memory list | /memory edit | /memory clear [--project | --global]" },
  // UI & display
  { cmd:"/compact",         category:"Context",       emoji:"📦", description:"Compact the conversation history to free context window space.", usage:"/compact [--micro]" },
  { cmd:"/clear",           category:"Session",       emoji:"🗑️", description:"Clear the terminal and start a fresh conversation.", usage:"/clear" },
  { cmd:"/copy",            category:"Output",        emoji:"📋", description:"Copy the last assistant response to the system clipboard.", usage:"/copy" },
  { cmd:"/stats",           category:"Analytics",     emoji:"📊", description:"Show session statistics: tokens used, cost, tool calls, and response times.", usage:"/stats" },
  { cmd:"/cost",            category:"Analytics",     emoji:"💰", description:"Show the running cost breakdown for the current session by model and tool.", usage:"/cost" },
  { cmd:"/release-notes",   category:"Info",          emoji:"📰", description:"Display the changelog and release notes for the current Claude Code version.", usage:"/release-notes" },
  // IDE & integrations
  { cmd:"/ide",             category:"IDE",           emoji:"💻", description:"Connect or disconnect IDE extensions (VS Code, JetBrains, etc.).", usage:"/ide [connect | disconnect | status]" },
  { cmd:"/chrome",          category:"IDE",           emoji:"🌐", description:"Claude in Chrome extension — show status, connection info, and setup instructions.", usage:"/chrome [status | setup]" },
  { cmd:"/desktop",         category:"IDE",           emoji:"🖥️", description:"Claude Desktop integration commands — link, status, and handoff.", usage:"/desktop [link | status]" },
  { cmd:"/bridge",          category:"Remote",        emoji:"🌉", description:"Show Remote Control bridge status, QR code for mobile pairing, and connection URLs.", usage:"/bridge [status | qr]" },
  { cmd:"/remote-setup",    category:"Remote",        emoji:"📡", description:"Set up a new Remote Control session with a pairing QR code.", usage:"/remote-setup [--port <n>]" },
  // Auth & account
  { cmd:"/login",           category:"Auth",          emoji:"🔑", description:"Authenticate via OAuth (Anthropic Console) or enter an API key.", usage:"/login [--api-key <key>]" },
  { cmd:"/logout",          category:"Auth",          emoji:"🚪", description:"Clear stored credentials and sign out of the current account.", usage:"/logout" },
  { cmd:"/passes",          category:"Account",       emoji:"🎟️", description:"Show your subscription plan, tier, and usage limits.", usage:"/passes" },
  { cmd:"/usage",           category:"Account",       emoji:"📈", description:"Show token and API usage statistics for the current billing period.", usage:"/usage [--period <month>]" },
  // Git & GitHub
  { cmd:"/install-github-app",   category:"GitHub", emoji:"🐙", description:"Install the Claude Code GitHub App to enable PR review access and CI integration.", usage:"/install-github-app" },
  { cmd:"/install-slack-app",    category:"GitHub", emoji:"💬", description:"Install the Claude Code Slack integration to use Claude from Slack.", usage:"/install-slack-app" },
  // Composite commands
  { cmd:"insights",         category:"Analytics",     emoji:"📊", description:"3,200-line analytics command — usage trends, cost analysis, and session breakdowns.", usage:"claude insights [--period <days>] [--export]" },
  { cmd:"ultraplan",        category:"Planning",      emoji:"🗺️", description:"Deep task decomposition: analyse the problem, create a multi-phase implementation plan before writing any code.", usage:"claude ultraplan \"<goal>\"" },
  { cmd:"init",             category:"Setup",         emoji:"🚀", description:"Initialise a project — creates .claude/ directory, CLAUDE.md, and initial settings.json.", usage:"claude init [--template <name>]" },
  { cmd:"commit-push-pr",   category:"Git",           emoji:"📬", description:"Composite command: git commit + push + create a GitHub PR in a single step with AI-generated commit message.", usage:"claude commit-push-pr [--title <title>]" },
  { cmd:"security-review",  category:"Security",      emoji:"🔒", description:"Run a security review on changed files — checks against CVE database and OWASP Top 10.", usage:"claude security-review [--files <glob>]" },
  { cmd:"install",          category:"Setup",         emoji:"📦", description:"Claude Code installation and upgrade wizard — handles npm install, PATH setup, and config migration.", usage:"claude install [--upgrade]" },
  { cmd:"advisor",          category:"Planning",      emoji:"💡", description:"AI-powered architectural guidance — ask questions about system design and get Claude's expert opinion.", usage:"claude advisor \"<architecture question>\"" },
  { cmd:"brief",            category:"Output",        emoji:"📋", description:"Generate a concise Markdown brief summarising the current task or codebase state.", usage:"claude brief [--scope task|session]" },
  { cmd:"commit",           category:"Git",           emoji:"💾", description:"Commit staged changes with an AI-generated commit message following conventional commits.", usage:"claude commit [--no-verify]" },
  { cmd:"bridge-kick",      category:"Remote",        emoji:"🦵", description:"Kick a stuck bridge session and force a reconnection — useful when the bridge hangs.", usage:"claude bridge-kick [--session <id>]" },
  { cmd:"version",          category:"Info",          emoji:"ℹ️", description:"Print the current Claude Code version number and build metadata.", usage:"claude version [--json]" },
  { cmd:"statusline",       category:"Config",        emoji:"📺", description:"Configure the IDE status line display format and content.", usage:"claude statusline [--format <template>]" },
];

const TASK_TYPES_GUIDE: RefTask[] = [
  {
    name:"LocalMainSessionTask", emoji:"🏠", shortId:"m",
    purpose:"The primary session task — wraps the entire interactive REPL session lifecycle as a background task object. There is exactly one per session.",
    killMechanism:"AbortController signal propagated to QueryEngine, gracefully stops the streaming API call and all active sub-tasks.",
    outputMethod:"Renders directly to the terminal via React/Ink; no output file.",
    usedBy:["main.tsx — created at startup","bridge/replBridge.ts — bridge sessions wrap it"],
  },
  {
    name:"LocalAgentTask", emoji:"🤖", shortId:"a",
    purpose:"A background sub-agent task — spawns an independent ReAct loop for a given prompt. Used for parallel and delegated work. ID prefix: 'a'.",
    killMechanism:"AbortController.abort() terminates the sub-agent's streaming API call and all its tool calls.",
    outputMethod:"Writes stdout to a per-task file in the scratchpad directory. TaskOutputTool polls this file for new bytes.",
    usedBy:["AgentTool","TaskCreateTool","ScheduleCronTool"],
  },
  {
    name:"LocalShellTask", emoji:"💻", shortId:"b",
    purpose:"A shell command task — spawns a child_process, streams stdout/stderr to a file, and enforces a timeout. ID prefix: 'b' (bash).",
    killMechanism:"SIGTERM to the child process, escalating to SIGKILL after a configurable grace period.",
    outputMethod:"Writes stdout/stderr stream to a per-task file. TaskOutputTool polls for new bytes.",
    usedBy:["BashTool (long-running commands)","REPLTool (persistent interpreter process)"],
  },
  {
    name:"DreamTask", emoji:"💭", shortId:"d",
    purpose:"Background memory consolidation — runs after sessions end, calls the LLM to extract key facts from session history, and appends them to MEMORY.md. ID prefix: 'd'.",
    killMechanism:"AbortController signal; if killed mid-consolidation, consolidationLock.ts ensures MEMORY.md is not corrupted.",
    outputMethod:"Writes directly to MEMORY.md (not a task output file). Consolidation lock prevents concurrent writes.",
    usedBy:["services/autoDream — triggered after session ends","main.tsx — schedules dream on exit"],
  },
  {
    name:"InProcessTeammateTask", emoji:"👥", shortId:"t",
    purpose:"In-process multi-agent teammate — a sub-agent that shares memory with the coordinator via shared AppState, avoiding IPC overhead. ID prefix: 't'.",
    killMechanism:"AbortController; shares the same process space so termination is immediate.",
    outputMethod:"Writes to a shared AppState channel. The coordinator can read teammate output directly from state.",
    usedBy:["coordinator/coordinatorMode.ts — for high-speed parallel coordination","TeamCreateTool"],
  },
  {
    name:"RemoteAgentTask", emoji:"📡", shortId:"r",
    purpose:"A sub-agent running on a remote machine — communicates over WebSocket via the bridge protocol. ID prefix: 'r'.",
    killMechanism:"Sends a STOP control message over the WebSocket; the remote runner terminates and sends a final status message.",
    outputMethod:"Streams output via WebSocket messages, written to a local file for TaskOutputTool polling.",
    usedBy:["RemoteTriggerTool","bridge/remoteBridgeCore.ts","AgentTool with remote: true option"],
  },
];

// ════════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════
export default function CodeAnalysisPage() {
  const [pageTab, setPageTab]             = useState<PageTab>("codeintel");
  const [refSubTab, setRefSubTab]         = useState<"folders"|"tools"|"modules"|"commands"|"tasks">("folders");
  const [refSearch, setRefSearch]         = useState("");
  const [refExpanded, setRefExpanded]     = useState<Set<string>>(new Set());
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

      {/* ── REFERENCE GUIDE TAB ────────────────────────────────────────────── */}
      {pageTab === "reference" && (() => {
        const REF_SUBTABS: { id: typeof refSubTab; label: string; color: string; count: number }[] = [
          { id:"folders",  label:"📁 Folders & Subfolders", color:"#22d3ee", count: FOLDER_GUIDE.length },
          { id:"tools",    label:"🔧 Tools (40+)",          color:"#34d399", count: TOOLS_GUIDE.length },
          { id:"modules",  label:"🔌 Service Modules (21)", color:"#a78bfa", count: MODULES_GUIDE.length },
          { id:"commands", label:"⌨️ CLI Commands (70+)",   color:"#fb923c", count: COMMANDS_GUIDE.length },
          { id:"tasks",    label:"📦 Task Types (6)",       color:"#f472b6", count: TASK_TYPES_GUIDE.length },
        ];
        const q = refSearch.toLowerCase().trim();

        // ── Filtered data ────────────────────────────────────────────────────
        const filteredFolders  = FOLDER_GUIDE.filter(f  => !q || f.path.toLowerCase().includes(q) || f.purpose.toLowerCase().includes(q) || f.features.some(x=>x.toLowerCase().includes(q)));
        const filteredTools    = TOOLS_GUIDE.filter(t   => !q || t.name.toLowerCase().includes(q) || t.purpose.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
        const filteredModules  = MODULES_GUIDE.filter(m => !q || m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.path.toLowerCase().includes(q));
        const filteredCmds     = COMMANDS_GUIDE.filter(c=> !q || c.cmd.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
        const filteredTasks    = TASK_TYPES_GUIDE.filter(t=>!q || t.name.toLowerCase().includes(q) || t.purpose.toLowerCase().includes(q));

        const toggleCard = (key: string) => setRefExpanded(prev => {
          const next = new Set(prev);
          next.has(key) ? next.delete(key) : next.add(key);
          return next;
        });

        // ── Category group colours for tools ────────────────────────────────
        const TOOL_CAT_COLOR: Record<string,string> = {
          "Agents":"#34d399","Shell":"#fbbf24","File System":"#4f8ef7","Web":"#38bdf8",
          "Productivity":"#a78bfa","Tasks":"#fb923c","Multi-Agent":"#f472b6","MCP":"#22d3ee",
          "Skills":"#facc15","Scheduling":"#f97316","Remote":"#818cf8","Git":"#6ee7b7",
          "Permissions":"#f87171","REPL":"#86efac","Language":"#67e8f9","Notebooks":"#c4b5fd",
          "UX":"#fca5a5","Config":"#fcd34d","Utility":"#9ca3af","Testing":"#d1d5db","Discovery":"#e0f2fe",
        };

        const CMD_CAT_COLOR: Record<string,string> = {
          "Session":"#4f8ef7","Code Review":"#34d399","Output":"#a78bfa","Model":"#38bdf8",
          "MCP":"#22d3ee","Agents":"#f472b6","Tasks":"#fb923c","Health":"#34d399","Config":"#fbbf24",
          "Debug":"#f87171","Plugins":"#a78bfa","Skills":"#facc15","Memory":"#818cf8","Context":"#86efac",
          "Analytics":"#67e8f9","Info":"#9ca3af","IDE":"#4f8ef7","Remote":"#c4b5fd","Auth":"#fca5a5",
          "Account":"#fcd34d","GitHub":"#e0f2fe","Planning":"#f97316","Setup":"#6ee7b7","Git":"#22d3ee",
          "Security":"#f87171",
        };

        const hlQ = (text: string) => {
          if (!q) return <>{text}</>;
          const idx = text.toLowerCase().indexOf(q);
          if (idx === -1) return <>{text}</>;
          return <>{text.slice(0,idx)}<mark style={{background:"rgba(250,204,21,0.35)",color:"inherit",borderRadius:2,padding:"0 1px"}}>{text.slice(idx,idx+q.length)}</mark>{text.slice(idx+q.length)}</>;
        };

        return (
          <div style={{display:"flex",flexDirection:"column",height:"calc(100dvh - 96px)",background:"#0d0f1a",overflow:"hidden"}}>

            {/* ── Header bar ─────────────────────────────────────────────── */}
            <div style={{padding:"12px 18px 0",background:"#0a0c15",borderBottom:"1px solid #1a1e30",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <FolderOpen size={16} style={{color:"#22d3ee"}}/>
                <span style={{fontSize:14,fontWeight:800,color:"#eaedf8"}}>Codebase Reference Guide</span>
                <span style={{fontSize:11,color:"#3d4460",marginLeft:4}}>—</span>
                <span style={{fontSize:11,color:"#5c6480"}}>Every folder, tool, module, command & task type explained</span>
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
                  <Search size={13} style={{color:"#4a5270",flexShrink:0}}/>
                  <input
                    value={refSearch} onChange={e=>setRefSearch(e.target.value)} placeholder="Search anything…"
                    style={{background:"#12141f",border:"1px solid #1e2237",borderRadius:6,padding:"5px 10px",fontSize:12,color:"#eaedf8",width:220,outline:"none"}}
                  />
                </div>
              </div>
              {/* Sub-tab bar */}
              <div style={{display:"flex",gap:4,overflowX:"auto"}}>
                {REF_SUBTABS.map(st=>(
                  <button key={st.id} onClick={()=>setRefSubTab(st.id)} style={{
                    display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:"6px 6px 0 0",
                    fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,
                    background: refSubTab===st.id ? `${st.color}18` : "transparent",
                    borderTop: refSubTab===st.id ? `2px solid ${st.color}` : "2px solid transparent",
                    borderLeft:"1px solid transparent",borderRight:"1px solid transparent",borderBottom:"none",
                    color: refSubTab===st.id ? st.color : "#5c6480",
                    transition:"all 0.15s",
                  }}>
                    {st.label}
                    <span style={{fontSize:10,background:refSubTab===st.id?`${st.color}30`:"#1a1e30",color:refSubTab===st.id?st.color:"#3d4460",borderRadius:10,padding:"1px 6px"}}>{st.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Content area ───────────────────────────────────────────── */}
            <div style={{flex:1,overflowY:"auto",padding:"18px 18px 32px"}}>

              {/* ════════ FOLDERS ═══════════════════════════════════════════ */}
              {refSubTab==="folders" && (
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(480px,1fr))",gap:12}}>
                    {filteredFolders.length===0 && <div style={{color:"#4a5270",fontSize:13,gridColumn:"1/-1",padding:24}}>No folders match "{refSearch}".</div>}
                    {filteredFolders.map(f=>{
                      const key = "folder:"+f.path;
                      const open = refExpanded.has(key);
                      const isRoot = !f.path.includes("/");
                      const depth  = (f.path.match(/\//g)||[]).length;
                      const indent = depth * 8;
                      return (
                        <div key={f.path} style={{
                          borderRadius:10,background:"#12141f",
                          border:`1px solid ${open?"#22d3ee30":"#1a1e30"}`,
                          overflow:"hidden",transition:"border-color 0.15s",
                        }}>
                          <button onClick={()=>toggleCard(key)} style={{
                            width:"100%",display:"flex",alignItems:"flex-start",gap:10,
                            padding:"12px 14px",background:"transparent",border:"none",cursor:"pointer",
                            textAlign:"left",
                          }}>
                            <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{f.emoji}</span>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                                <code style={{fontSize:12,fontWeight:800,color:"#22d3ee",background:"rgba(34,211,238,0.08)",padding:"2px 7px",borderRadius:4,fontFamily:"monospace"}}>
                                  {hlQ(f.path)}
                                </code>
                                {isRoot && <span style={{fontSize:10,color:"#4a5270",background:"#1a1e30",borderRadius:10,padding:"1px 6px"}}>root</span>}
                                {depth===1 && !isRoot && <span style={{fontSize:10,color:"#4a5270",background:"#1a1e30",borderRadius:10,padding:"1px 6px"}}>top-level</span>}
                              </div>
                              <div style={{fontSize:12,color:"#9aa3c0",lineHeight:1.5}}>{hlQ(f.purpose)}</div>
                            </div>
                            <ChevronDown size={13} style={{color:"#3d4460",flexShrink:0,marginTop:4,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}/>
                          </button>
                          {open && (
                            <div style={{padding:"0 14px 14px",borderTop:"1px solid #1a1e30"}}>
                              <div style={{marginTop:12}}>
                                <div style={{fontSize:11,fontWeight:700,color:"#22d3ee",marginBottom:6,letterSpacing:"0.05em",textTransform:"uppercase"}}>Key Features</div>
                                <ul style={{margin:0,padding:"0 0 0 16px",listStyle:"disc"}}>
                                  {f.features.map((feat,i)=>(
                                    <li key={i} style={{fontSize:12,color:"#7d88a8",lineHeight:1.65,marginBottom:2}}>{feat}</li>
                                  ))}
                                </ul>
                              </div>
                              <div style={{marginTop:10,padding:"10px 12px",borderRadius:6,background:"rgba(34,211,238,0.05)",border:"1px solid rgba(34,211,238,0.12)"}}>
                                <div style={{fontSize:11,fontWeight:700,color:"#22d3ee",marginBottom:4}}>🔗 How Files Interact</div>
                                <div style={{fontSize:12,color:"#7d88a8",lineHeight:1.65}}>{f.interaction}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ════════ TOOLS ═════════════════════════════════════════════ */}
              {refSubTab==="tools" && (
                <div>
                  {/* Group by category */}
                  {Array.from(new Set(filteredTools.map(t=>t.category))).map(cat=>{
                    const catColor = TOOL_CAT_COLOR[cat]||"#9aa3c0";
                    const catTools = filteredTools.filter(t=>t.category===cat);
                    return (
                      <div key={cat} style={{marginBottom:24}}>
                        <div style={{fontSize:11,fontWeight:800,color:catColor,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
                          <span style={{display:"inline-block",width:3,height:14,borderRadius:2,background:catColor}}/>
                          {cat}
                          <span style={{fontSize:10,color:"#3d4460",background:"#1a1e30",borderRadius:10,padding:"1px 6px",fontWeight:700}}>{catTools.length}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(420px,1fr))",gap:10}}>
                          {catTools.map(tool=>{
                            const key = "tool:"+tool.name;
                            const open = refExpanded.has(key);
                            return (
                              <div key={tool.name} style={{
                                borderRadius:10,background:"#12141f",
                                border:`1px solid ${open?catColor+"30":"#1a1e30"}`,
                                overflow:"hidden",transition:"border-color 0.15s",
                              }}>
                                <button onClick={()=>toggleCard(key)} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:10,padding:"11px 13px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                                  <span style={{fontSize:18,flexShrink:0}}>{tool.emoji}</span>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                                      <span style={{fontSize:13,fontWeight:800,color:catColor}}>{hlQ(tool.name)}</span>
                                      <span style={{fontSize:10,color:catColor,background:`${catColor}20`,borderRadius:10,padding:"1px 6px"}}>{tool.category}</span>
                                    </div>
                                    <div style={{fontSize:12,color:"#9aa3c0",lineHeight:1.4}}>{hlQ(tool.purpose)}</div>
                                  </div>
                                  <ChevronDown size={13} style={{color:"#3d4460",flexShrink:0,marginTop:2,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}/>
                                </button>
                                {open && (
                                  <div style={{padding:"0 13px 13px",borderTop:"1px solid #1a1e30"}}>
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
                                      <div style={{padding:"8px 10px",borderRadius:6,background:"rgba(79,142,247,0.06)",border:"1px solid rgba(79,142,247,0.12)"}}>
                                        <div style={{fontSize:10,fontWeight:700,color:"#4f8ef7",marginBottom:4}}>📥 INPUTS</div>
                                        <div style={{fontSize:11,color:"#7d88a8",lineHeight:1.55}}>{tool.inputs}</div>
                                      </div>
                                      <div style={{padding:"8px 10px",borderRadius:6,background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.12)"}}>
                                        <div style={{fontSize:10,fontWeight:700,color:"#34d399",marginBottom:4}}>📤 OUTPUTS</div>
                                        <div style={{fontSize:11,color:"#7d88a8",lineHeight:1.55}}>{tool.outputs}</div>
                                      </div>
                                    </div>
                                    <div style={{marginTop:8,padding:"8px 10px",borderRadius:6,background:`${catColor}08`,border:`1px solid ${catColor}15`}}>
                                      <div style={{fontSize:10,fontWeight:700,color:catColor,marginBottom:4}}>⚙️ KEY BEHAVIOUR</div>
                                      <div style={{fontSize:11,color:"#7d88a8",lineHeight:1.55}}>{tool.keyBehavior}</div>
                                    </div>
                                    <div style={{marginTop:8}}>
                                      <div style={{fontSize:10,fontWeight:700,color:"#4a5270",marginBottom:4}}>USED BY</div>
                                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                                        {tool.usedBy.map((u,i)=>(
                                          <span key={i} style={{fontSize:10,color:"#5c6480",background:"#1a1e30",borderRadius:10,padding:"2px 8px"}}>{u}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {filteredTools.length===0 && <div style={{color:"#4a5270",fontSize:13,padding:24}}>No tools match "{refSearch}".</div>}
                </div>
              )}

              {/* ════════ MODULES ═══════════════════════════════════════════ */}
              {refSubTab==="modules" && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(460px,1fr))",gap:12}}>
                  {filteredModules.length===0 && <div style={{color:"#4a5270",fontSize:13,gridColumn:"1/-1",padding:24}}>No modules match "{refSearch}".</div>}
                  {filteredModules.map(mod=>{
                    const key = "mod:"+mod.name;
                    const open = refExpanded.has(key);
                    return (
                      <div key={mod.name} style={{borderRadius:10,background:"#12141f",border:`1px solid ${open?"#a78bfa30":"#1a1e30"}`,overflow:"hidden"}}>
                        <button onClick={()=>toggleCard(key)} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                          <span style={{fontSize:20,flexShrink:0}}>{mod.emoji}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                              <span style={{fontSize:13,fontWeight:800,color:"#a78bfa"}}>{hlQ(mod.name)}</span>
                            </div>
                            <code style={{fontSize:11,color:"#4a5270",fontFamily:"monospace"}}>{mod.path}</code>
                            <div style={{fontSize:12,color:"#9aa3c0",marginTop:3,lineHeight:1.4}}>{hlQ(mod.role)}</div>
                          </div>
                          <ChevronDown size={13} style={{color:"#3d4460",flexShrink:0,marginTop:2,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}/>
                        </button>
                        {open && (
                          <div style={{padding:"0 14px 14px",borderTop:"1px solid #1a1e30"}}>
                            <div style={{marginTop:10}}>
                              <div style={{fontSize:10,fontWeight:700,color:"#a78bfa",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.08em"}}>Key Files</div>
                              <div style={{display:"flex",flexDirection:"column",gap:3}}>
                                {mod.keyFiles.map((kf,i)=>(
                                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:6}}>
                                    <span style={{color:"#a78bfa",fontSize:10,marginTop:1,flexShrink:0}}>▸</span>
                                    <span style={{fontSize:11,color:"#7d88a8",lineHeight:1.55}}>{kf}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div style={{marginTop:10,padding:"8px 10px",borderRadius:6,background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.12)"}}>
                              <div style={{fontSize:10,fontWeight:700,color:"#a78bfa",marginBottom:4}}>🔗 CONNECTS TO</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                                {mod.connects.map((c,i)=>(
                                  <span key={i} style={{fontSize:10,color:"#6b7499",background:"#1a1e30",borderRadius:10,padding:"2px 8px"}}>{c}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ════════ COMMANDS ══════════════════════════════════════════ */}
              {refSubTab==="commands" && (
                <div>
                  {Array.from(new Set(filteredCmds.map(c=>c.category))).map(cat=>{
                    const catColor = CMD_CAT_COLOR[cat]||"#9aa3c0";
                    const catCmds = filteredCmds.filter(c=>c.category===cat);
                    return (
                      <div key={cat} style={{marginBottom:22}}>
                        <div style={{fontSize:11,fontWeight:800,color:catColor,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                          <span style={{display:"inline-block",width:3,height:14,borderRadius:2,background:catColor}}/>
                          {cat}
                          <span style={{fontSize:10,color:"#3d4460",background:"#1a1e30",borderRadius:10,padding:"1px 6px"}}>{catCmds.length}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:8}}>
                          {catCmds.map(cmd=>{
                            const key="cmd:"+cmd.cmd;
                            const open=refExpanded.has(key);
                            return (
                              <div key={cmd.cmd} style={{borderRadius:8,background:"#12141f",border:`1px solid ${open?catColor+"25":"#1a1e30"}`,overflow:"hidden"}}>
                                <button onClick={()=>toggleCard(key)} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:8,padding:"10px 12px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                                  <span style={{fontSize:16,flexShrink:0}}>{cmd.emoji}</span>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                                      <code style={{fontSize:12,fontWeight:800,color:catColor,fontFamily:"monospace"}}>{hlQ(cmd.cmd)}</code>
                                    </div>
                                    <div style={{fontSize:11,color:"#7d88a8",lineHeight:1.4}}>{hlQ(cmd.description)}</div>
                                  </div>
                                  <ChevronDown size={12} style={{color:"#3d4460",flexShrink:0,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}/>
                                </button>
                                {open && (
                                  <div style={{padding:"8px 12px 10px",borderTop:"1px solid #1a1e30"}}>
                                    <div style={{padding:"6px 8px",borderRadius:5,background:"#0d0f1a",border:"1px solid #1a1e30"}}>
                                      <div style={{fontSize:9,fontWeight:700,color:"#3d4460",letterSpacing:"0.08em",marginBottom:2}}>USAGE</div>
                                      <code style={{fontSize:11,color:"#22d3ee",fontFamily:"monospace"}}>{cmd.usage}</code>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {filteredCmds.length===0 && <div style={{color:"#4a5270",fontSize:13,padding:24}}>No commands match "{refSearch}".</div>}
                </div>
              )}

              {/* ════════ TASK TYPES ════════════════════════════════════════ */}
              {refSubTab==="tasks" && (
                <div>
                  <div style={{marginBottom:16,padding:"12px 14px",borderRadius:8,background:"rgba(244,114,182,0.06)",border:"1px solid rgba(244,114,182,0.15)"}}>
                    <div style={{fontSize:12,color:"#9aa3c0",lineHeight:1.7}}>
                      Claude Code has <strong style={{color:"#f472b6"}}>6 task types</strong> — all implement a common <code style={{background:"#1a1e30",padding:"1px 5px",borderRadius:3,fontSize:11}}>Task</code> interface with <code style={{background:"#1a1e30",padding:"1px 5px",borderRadius:3,fontSize:11}}>id</code>, <code style={{background:"#1a1e30",padding:"1px 5px",borderRadius:3,fontSize:11}}>type</code>, <code style={{background:"#1a1e30",padding:"1px 5px",borderRadius:3,fontSize:11}}>status</code>, and a universal <code style={{background:"#1a1e30",padding:"1px 5px",borderRadius:3,fontSize:11}}>kill()</code> method. Long-running tasks write output to per-task files; TaskOutputTool polls for new bytes.
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(500px,1fr))",gap:14}}>
                    {filteredTasks.length===0 && <div style={{color:"#4a5270",fontSize:13,padding:24,gridColumn:"1/-1"}}>No task types match "{refSearch}".</div>}
                    {filteredTasks.map(task=>{
                      const key="task:"+task.name;
                      const open=refExpanded.has(key)||!q;
                      return (
                        <div key={task.name} style={{borderRadius:12,background:"#12141f",border:"1px solid #1e2237",overflow:"hidden"}}>
                          <button onClick={()=>toggleCard(key)} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:12,padding:"14px 16px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                            <span style={{fontSize:28,flexShrink:0}}>{task.emoji}</span>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                <span style={{fontSize:14,fontWeight:900,color:"#f472b6"}}>{hlQ(task.name)}</span>
                                <span style={{fontSize:10,color:"#f472b6",background:"rgba(244,114,182,0.15)",borderRadius:10,padding:"1px 8px",fontFamily:"monospace",fontWeight:700}}>ID prefix: {task.shortId}…</span>
                              </div>
                              <div style={{fontSize:12,color:"#9aa3c0",lineHeight:1.5}}>{hlQ(task.purpose)}</div>
                            </div>
                            <ChevronDown size={14} style={{color:"#3d4460",flexShrink:0,marginTop:4,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}/>
                          </button>
                          {open && (
                            <div style={{padding:"0 16px 16px",borderTop:"1px solid #1a1e30"}}>
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:12}}>
                                <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.12)"}}>
                                  <div style={{fontSize:10,fontWeight:700,color:"#f87171",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.07em"}}>🛑 Kill Mechanism</div>
                                  <div style={{fontSize:11,color:"#7d88a8",lineHeight:1.6}}>{task.killMechanism}</div>
                                </div>
                                <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.12)"}}>
                                  <div style={{fontSize:10,fontWeight:700,color:"#34d399",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.07em"}}>📤 Output Method</div>
                                  <div style={{fontSize:11,color:"#7d88a8",lineHeight:1.6}}>{task.outputMethod}</div>
                                </div>
                              </div>
                              <div style={{marginTop:10}}>
                                <div style={{fontSize:10,fontWeight:700,color:"#4a5270",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.07em"}}>Used By</div>
                                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                                  {task.usedBy.map((u,i)=>(
                                    <span key={i} style={{fontSize:10,color:"#6b7499",background:"#1a1e30",borderRadius:10,padding:"2px 9px"}}>{u}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

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
