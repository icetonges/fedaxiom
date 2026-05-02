"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Zap, Settings, Trash2, Copy, Check,
  ChevronDown, Loader2, Cpu, Brain, Terminal, ChevronRight,
  AlertCircle, CheckCircle
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "chat" | "agent";
type Role = "user" | "assistant" | "system";

interface Message {
  id: string;
  role: Role;
  content: string;
  model?: string;
  ts?: number;
}

interface AgentStep {
  type: "agent_start" | "step_start" | "thought" | "tool_call" | "tool_result" | "final_answer" | "max_steps" | "error" | "done";
  step?: number;
  content?: string;
  tool?: string;
  args?: Record<string, unknown>;
  result?: string;
  message?: string;
}

// ─── Model configs ────────────────────────────────────────────────────────────

const CHAT_MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", color: "var(--bl)", provider: "Google" },
  { id: "gemini-2.0-flash-lite", label: "Gemini Flash Lite", color: "var(--cy)", provider: "Google" },
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", color: "var(--vi)", provider: "Groq" },
  { id: "mistral-saba-24b", label: "Mistral Saba 24B", color: "var(--or)", provider: "Groq" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B", color: "var(--em)", provider: "Groq" },
  { id: "qwen-qwq-32b", label: "Qwen QwQ 32B", color: "var(--am)", provider: "Groq" },
];

const AGENT_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", color: "var(--vi)" },
  { id: "mistral-saba-24b", label: "Mistral Saba 24B", color: "var(--or)" },
];

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(CHAT_MODELS[0].id);
  const [systemPrompt, setSystemPrompt] = useState("You are AXIOM — an expert AI engineering assistant. Be precise, technical, and insightful.");
  const [streaming, setStreaming] = useState(false);
  const [showSystem, setShowSystem] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input.trim(), ts: Date.now() };
    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", content: "", model, ts: Date.now() }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          model,
          systemPrompt,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (line.startsWith("0:")) {
            try { full += JSON.parse(line.slice(2)); } catch { /* skip */ }
          }
        }
        setMessages((m) => m.map((msg) => msg.id === assistantId ? { ...msg, content: full } : msg));
      }
    } catch (err) {
      setMessages((m) => m.map((msg) => msg.id === assistantId ? { ...msg, content: `Error: ${err}` } : msg));
    } finally {
      setStreaming(false);
    }
  };

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const selectedModel = CHAT_MODELS.find((m) => m.id === model)!;

  return (
    <div className="chat-wrap">
      {/* Config bar */}
      <div className="config-bar">
        <div className="model-select-wrap">
          <div className="model-dot" style={{ background: selectedModel.color }} />
          <select className="model-select" value={model} onChange={(e) => setModel(e.target.value)}>
            {CHAT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label} ({m.provider})</option>
            ))}
          </select>
          <ChevronDown size={13} className="select-arrow" />
        </div>
        <button className="sys-toggle" onClick={() => setShowSystem((s) => !s)}>
          <Settings size={13} /> System
        </button>
        <button className="clear-btn" onClick={() => setMessages([])} disabled={messages.length === 0}>
          <Trash2 size={13} /> Clear
        </button>
      </div>

      {/* System prompt */}
      {showSystem && (
        <div className="system-panel">
          <label className="system-label">System Prompt</label>
          <textarea className="system-input" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} />
        </div>
      )}

      {/* Messages */}
      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <Bot size={32} className="empty-icon" />
            <p className="empty-title">AXIOM AI Studio</p>
            <p className="empty-sub">6 models · streaming · system prompt control</p>
            <div className="quick-prompts">
              {["Explain RAG architecture", "Write a Python embedding pipeline", "Compare Groq vs Gemini for production"].map((q) => (
                <button key={q} className="quick-btn" onClick={() => { setInput(q); textareaRef.current?.focus(); }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`msg msg-${msg.role}`}>
            <div className="msg-avatar">
              {msg.role === "user" ? <User size={13} /> : <Bot size={13} />}
            </div>
            <div className="msg-body">
              {msg.role === "assistant" && msg.model && (
                <div className="msg-model-tag" style={{ color: CHAT_MODELS.find((m) => m.id === msg.model)?.color || "var(--di)" }}>
                  {CHAT_MODELS.find((m) => m.id === msg.model)?.label}
                </div>
              )}
              <div className="msg-content">
                {msg.content || (msg.role === "assistant" && streaming ? <span className="cursor-blink">▋</span> : "")}
              </div>
              {msg.content && msg.role === "assistant" && (
                <button className="copy-btn" onClick={() => copy(msg.id, msg.content)}>
                  {copied === msg.id ? <Check size={11} /> : <Copy size={11} />}
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="input-bar">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={1}
        />
        <button className="send-btn" onClick={send} disabled={!input.trim() || streaming}>
          {streaming ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── Agent Tab ────────────────────────────────────────────────────────────────

function AgentTab() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(AGENT_MODELS[0].id);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [steps]);

  const run = async () => {
    if (!prompt.trim() || running) return;
    setSteps([]);
    setDone(false);
    setRunning(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, systemPrompt }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as AgentStep;
              setSteps((s) => [...s, data]);
              if (data.type === "done") setDone(true);
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setSteps((s) => [...s, { type: "error", message: String(err) }]);
    } finally {
      setRunning(false);
      setDone(true);
    }
  };

  const STEP_ICONS: Record<string, React.ReactNode> = {
    thought: <Brain size={13} className="step-icon thought" />,
    tool_call: <Terminal size={13} className="step-icon tool" />,
    tool_result: <CheckCircle size={13} className="step-icon result" />,
    final_answer: <Zap size={13} className="step-icon answer" />,
    error: <AlertCircle size={13} className="step-icon error" />,
    agent_start: <Cpu size={13} className="step-icon start" />,
  };

  return (
    <div className="agent-wrap">
      <div className="agent-config">
        <div className="model-select-wrap">
          <div className="model-dot" style={{ background: AGENT_MODELS.find((m) => m.id === model)?.color }} />
          <select className="model-select" value={model} onChange={(e) => setModel(e.target.value)}>
            {AGENT_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <ChevronDown size={13} className="select-arrow" />
        </div>
        <div className="agent-tools-info">
          Available tools: <span className="tool-badge">web_search</span>
          <span className="tool-badge">calculate</span>
          <span className="tool-badge">summarize_url</span>
          <span className="tool-badge">analyze_data</span>
        </div>
      </div>

      <div className="agent-input-area">
        <textarea
          className="agent-input"
          placeholder="Give the agent a goal: 'Research the latest Gemini models and compare their capabilities' or 'Calculate compound interest on $10,000 at 7% for 10 years'..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
        <button className="agent-run-btn" onClick={run} disabled={!prompt.trim() || running}>
          {running ? <><Loader2 size={15} className="spin" /> Running...</> : <><Zap size={15} /> Run Agent</>}
        </button>
      </div>

      {steps.length > 0 && (
        <div className="agent-trace">
          <div className="trace-header">
            <Terminal size={13} /> Reasoning Trace
            {running && <span className="trace-live">● LIVE</span>}
          </div>
          {steps.map((step, i) => (
            <div key={i} className={`trace-step trace-${step.type}`}>
              <div className="trace-step-icon">{STEP_ICONS[step.type] || <ChevronRight size={13} />}</div>
              <div className="trace-step-body">
                {step.type === "agent_start" && <span className="trace-label">{step.message}</span>}
                {step.type === "step_start" && <span className="trace-label muted">Step {step.step}</span>}
                {step.type === "thought" && (
                  <div>
                    <span className="trace-type-tag thought-tag">THOUGHT</span>
                    <p className="trace-text">{step.content}</p>
                  </div>
                )}
                {step.type === "tool_call" && (
                  <div>
                    <span className="trace-type-tag tool-tag">TOOL → {step.tool}</span>
                    <pre className="trace-args">{JSON.stringify(step.args, null, 2)}</pre>
                  </div>
                )}
                {step.type === "tool_result" && (
                  <div>
                    <span className="trace-type-tag result-tag">RESULT from {step.tool}</span>
                    <p className="trace-text">{typeof step.result === "string" ? step.result.slice(0, 300) : JSON.stringify(step.result)}</p>
                  </div>
                )}
                {step.type === "final_answer" && (
                  <div>
                    <span className="trace-type-tag answer-tag">FINAL ANSWER</span>
                    <p className="trace-text final">{step.content}</p>
                  </div>
                )}
                {step.type === "error" && (
                  <p className="trace-text error-text">{step.message}</p>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div className="studio-page">
      <div className="studio-header">
        <div className="studio-title-row">
          <div className="studio-icon"><Cpu size={18} /></div>
          <h1 className="studio-title">AI Studio</h1>
        </div>
        <div className="tab-bar">
          <button className={`tab-btn ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>
            <Bot size={13} /> Chat
          </button>
          <button className={`tab-btn ${tab === "agent" ? "active" : ""}`} onClick={() => setTab("agent")}>
            <Brain size={13} /> ReAct Agent
          </button>
        </div>
      </div>

      {tab === "chat" ? <ChatTab /> : <AgentTab />}

      <style jsx global>{`
        /* ── Shared ──────────────────────────────────── */
        .studio-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
        .studio-header { padding: 14px 20px 0; border-bottom: 1px solid var(--bd); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        .studio-title-row { display: flex; align-items: center; gap: 10px; }
        .studio-icon { width: 34px; height: 34px; border-radius: 8px; background: rgba(96,165,250,0.14); border: 1px solid rgba(96,165,250,0.28); display: flex; align-items: center; justify-content: center; color: var(--bl); }
        .studio-title { font-size: 16px; font-weight: 700; color: var(--tx); }
        .tab-bar { display: flex; gap: 4px; padding-bottom: 0; }
        .tab-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px 8px 0 0; background: none; border: none; color: var(--mu); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; border-bottom: 2px solid transparent; }
        .tab-btn.active { color: var(--cy); border-bottom-color: var(--cy); background: rgba(34,211,238,0.05); }
        .tab-btn:hover:not(.active) { color: var(--di); }

        /* ── Model selector ──────────────────────────── */
        .config-bar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-bottom: 1px solid var(--bd); flex-wrap: wrap; }
        .agent-config { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--bd); flex-wrap: wrap; }
        .model-select-wrap { position: relative; display: flex; align-items: center; gap: 8px; background: var(--bg2); border: 1px solid var(--bd); border-radius: 8px; padding: 6px 10px; }
        .model-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .model-select { background: none; border: none; outline: none; color: var(--tx); font-size: 13px; padding-right: 18px; cursor: pointer; font-family: inherit; appearance: none; }
        .select-arrow { position: absolute; right: 8px; color: var(--mu); pointer-events: none; }
        .sys-toggle, .clear-btn { display: flex; align-items: center; gap: 5px; padding: 6px 11px; border-radius: 7px; background: var(--bg2); border: 1px solid var(--bd); color: var(--di); font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .sys-toggle:hover, .clear-btn:hover { border-color: var(--bdh); color: var(--tx); }
        .clear-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── System panel ────────────────────────────── */
        .system-panel { padding: 10px 16px; border-bottom: 1px solid var(--bd); background: rgba(255,255,255,0.02); }
        .system-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mu); display: block; margin-bottom: 6px; }
        .system-input { width: 100%; background: var(--bg2); border: 1px solid var(--bd); border-radius: 8px; padding: 8px 12px; color: var(--tx); font-size: 13px; outline: none; resize: vertical; font-family: 'JetBrains Mono', monospace; line-height: 1.6; }
        .system-input:focus { border-color: var(--cy); }

        /* ── Messages ────────────────────────────────── */
        .chat-wrap { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 8px; text-align: center; padding: 40px 20px; }
        .empty-icon { color: var(--bl); opacity: 0.4; }
        .empty-title { font-size: 16px; font-weight: 700; color: var(--tx); }
        .empty-sub { font-size: 12px; color: var(--mu); }
        .quick-prompts { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 8px; }
        .quick-btn { padding: 7px 14px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--bd); color: var(--di); font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .quick-btn:hover { border-color: var(--bdh); color: var(--tx); }
        .msg { display: flex; gap: 10px; align-items: flex-start; }
        .msg-assistant { }
        .msg-user { flex-direction: row-reverse; }
        .msg-avatar { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .msg-user .msg-avatar { background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.25); color: var(--cy); }
        .msg-assistant .msg-avatar { background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.22); color: var(--bl); }
        .msg-body { max-width: 75%; position: relative; }
        .msg-user .msg-body { align-items: flex-end; }
        .msg-model-tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
        .msg-content { font-size: 14px; line-height: 1.75; color: var(--tx); white-space: pre-wrap; word-break: break-word; }
        .msg-user .msg-content { background: rgba(34,211,238,0.08); border: 1px solid rgba(34,211,238,0.18); border-radius: 12px 4px 12px 12px; padding: 10px 14px; }
        .msg-assistant .msg-content { background: var(--bg2); border: 1px solid var(--bd); border-radius: 4px 12px 12px 12px; padding: 10px 14px; }
        .copy-btn { position: absolute; top: 6px; right: 6px; background: none; border: none; cursor: pointer; color: var(--mu); opacity: 0; transition: opacity 0.15s; padding: 3px; border-radius: 4px; display: flex; }
        .msg-body:hover .copy-btn { opacity: 1; }
        .copy-btn:hover { color: var(--cy); }
        .cursor-blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }

        /* ── Input ───────────────────────────────────── */
        .input-bar { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--bd); }
        .chat-input { flex: 1; background: var(--bg2); border: 1px solid var(--bd); border-radius: 10px; padding: 10px 14px; color: var(--tx); font-size: 14px; outline: none; resize: none; font-family: inherit; line-height: 1.6; transition: border-color 0.15s; }
        .chat-input:focus { border-color: var(--cy); }
        .chat-input::placeholder { color: var(--mu); }
        .send-btn { width: 42px; height: 42px; border-radius: 10px; background: var(--cy); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--bg0); flex-shrink: 0; transition: opacity 0.2s; align-self: flex-end; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Agent ───────────────────────────────────── */
        .agent-wrap { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
        .agent-tools-info { font-size: 11px; color: var(--mu); display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
        .tool-badge { padding: 2px 7px; background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.22); border-radius: 4px; color: var(--vi); font-size: 10px; font-family: 'JetBrains Mono', monospace; }
        .agent-input-area { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; border-bottom: 1px solid var(--bd); }
        .agent-input { background: var(--bg2); border: 1px solid var(--bd); border-radius: 10px; padding: 12px 14px; color: var(--tx); font-size: 14px; outline: none; resize: vertical; font-family: inherit; line-height: 1.6; width: 100%; }
        .agent-input:focus { border-color: var(--vi); }
        .agent-input::placeholder { color: var(--mu); }
        .agent-run-btn { align-self: flex-end; display: flex; align-items: center; gap: 7px; padding: 9px 18px; border-radius: 9px; background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.35); color: var(--vi); font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .agent-run-btn:hover { background: rgba(167,139,250,0.25); }
        .agent-run-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .agent-trace { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
        .trace-header { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mu); padding-bottom: 8px; border-bottom: 1px solid var(--bd); margin-bottom: 4px; }
        .trace-live { color: var(--ro); animation: blink 1s step-end infinite; }
        .trace-step { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border-radius: 8px; background: var(--bg1); border: 1px solid var(--bd); }
        .trace-step-icon { flex-shrink: 0; margin-top: 2px; }
        .trace-step-body { flex: 1; min-width: 0; }
        .trace-label { font-size: 12px; color: var(--di); }
        .trace-label.muted { color: var(--mu); font-size: 11px; }
        .trace-type-tag { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; padding: 2px 7px; border-radius: 3px; margin-bottom: 5px; }
        .thought-tag { background: rgba(96,165,250,0.12); color: var(--bl); }
        .tool-tag { background: rgba(167,139,250,0.12); color: var(--vi); }
        .result-tag { background: rgba(52,211,153,0.1); color: var(--em); }
        .answer-tag { background: rgba(252,211,77,0.12); color: var(--am); }
        .trace-text { font-size: 13px; color: var(--di); line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
        .trace-text.final { color: var(--tx); font-size: 14px; }
        .trace-args { font-size: 11px; color: var(--mu); font-family: 'JetBrains Mono', monospace; background: var(--bg2); padding: 6px 10px; border-radius: 6px; overflow-x: auto; }
        .error-text { color: var(--ro); font-size: 13px; }
        .step-icon { }
        .step-icon.thought { color: var(--bl); }
        .step-icon.tool { color: var(--vi); }
        .step-icon.result { color: var(--em); }
        .step-icon.answer { color: var(--am); }
        .step-icon.error { color: var(--ro); }
        .step-icon.start { color: var(--cy); }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
