"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus, Mic, MicOff, Save, Trash2, FileAudio, Brain,
  Hash, Calendar, Loader2, ChevronDown, ChevronRight,
  X, Edit3, Check
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  audioUrl?: string;
  audioDuration?: number;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NotebookPage() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "demo-1",
      title: "AXIOM Architecture Notes",
      content: "The AXIOM platform combines multiple AI models via a unified API layer. Gemini handles multimodal reasoning, Groq accelerates inference at 800+ tokens/sec, and pgvector enables semantic retrieval across the knowledge base. The ReAct agent loop enables tool use with explicit reasoning traces.",
      tags: ["architecture", "ai", "notes"],
      aiSummary: "Platform architecture overview covering AI model integration and infrastructure components.",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]);
  const [activeId, setActiveId] = useState<string>("demo-1");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [summarizing, setSummarizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeNote = notes.find((n) => n.id === activeId);

  const createNote = () => {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "New Note",
      content: "",
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
  };

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
  }, []);

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (activeId === id) setActiveId(next[0]?.id || "");
      return next;
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        updateNote(activeId, { audioUrl: url, audioDuration: recordSeconds });
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      alert("Microphone permission denied");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const summarizeNote = async () => {
    if (!activeNote?.content.trim()) return;
    setSummarizing(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Summarize this note in 1-2 concise sentences, extracting the key insight:\n\n${activeNote.content}`
          }],
          model: "gemini-2.5-flash",
          systemPrompt: "You are a concise note summarizer. Return only the summary, no preamble.",
        }),
      });

      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let summary = "";
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          // Parse streaming chunks
          for (const line of text.split("\n")) {
            if (line.startsWith("0:")) {
              try { summary += JSON.parse(line.slice(2)); } catch { /* skip */ }
            }
          }
        }
        updateNote(activeId, { aiSummary: summary.trim() || "Summary generated." });
      }
    } catch {
      updateNote(activeId, { aiSummary: "Summary unavailable — check API connection." });
    } finally {
      setSummarizing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // In production: PUT /api/notebook/:id to persist to DB or Blob
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
  };

  const addTag = () => {
    if (!newTag.trim() || !activeNote) return;
    const tag = newTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!activeNote.tags.includes(tag)) {
      updateNote(activeId, { tags: [...activeNote.tags, tag] });
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    if (!activeNote) return;
    updateNote(activeId, { tags: activeNote.tags.filter((t) => t !== tag) });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    if (activeNote && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeId]);

  return (
    <div className="nb-page">
      {/* Sidebar */}
      <div className="nb-sidebar">
        <div className="nb-sidebar-top">
          <h2 className="nb-sidebar-title">Notebook</h2>
          <button className="nb-new-btn" onClick={createNote}><Plus size={15} /></button>
        </div>
        <div className="nb-note-list">
          {notes.map((note) => (
            <button
              key={note.id}
              className={`nb-note-item ${note.id === activeId ? "active" : ""}`}
              onClick={() => setActiveId(note.id)}
            >
              <div className="nb-note-item-title">{note.title}</div>
              <div className="nb-note-item-meta">
                {formatDate(note.updatedAt)}
                {note.audioUrl && <FileAudio size={10} style={{ marginLeft: 4 }} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      {activeNote ? (
        <div className="nb-editor">
          {/* Toolbar */}
          <div className="nb-toolbar">
            <div className="nb-toolbar-left">
              {editingTitle ? (
                <input
                  className="nb-title-input"
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeId, { title: e.target.value })}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                  autoFocus
                />
              ) : (
                <h1 className="nb-title" onClick={() => setEditingTitle(true)}>
                  {activeNote.title}
                  <Edit3 size={13} className="nb-edit-icon" />
                </h1>
              )}
              <div className="nb-date"><Calendar size={11} /> {formatDate(activeNote.updatedAt)}</div>
            </div>
            <div className="nb-toolbar-actions">
              <button className="nb-tb-btn" onClick={summarizeNote} disabled={summarizing || !activeNote.content.trim()} title="AI Summarize">
                {summarizing ? <Loader2 size={15} className="spin" /> : <Brain size={15} />}
              </button>
              <button
                className={`nb-tb-btn ${recording ? "recording" : ""}`}
                onClick={recording ? stopRecording : startRecording}
                title={recording ? "Stop recording" : "Record audio"}
              >
                {recording ? <MicOff size={15} /> : <Mic size={15} />}
                {recording && <span className="nb-rec-timer">{formatTime(recordSeconds)}</span>}
              </button>
              <button className="nb-tb-btn" onClick={() => deleteNote(activeId)} title="Delete note">
                <Trash2 size={15} />
              </button>
              <button className="nb-save-btn" onClick={handleSave}>
                {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="nb-tags-row">
            {activeNote.tags.map((tag) => (
              <span key={tag} className="nb-tag">
                <Hash size={10} />{tag}
                <button onClick={() => removeTag(tag)}><X size={10} /></button>
              </span>
            ))}
            <div className="nb-tag-input-wrap">
              <input
                className="nb-tag-input"
                placeholder="+ tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
            </div>
          </div>

          {/* AI Summary */}
          {activeNote.aiSummary && (
            <div className="nb-summary">
              <Brain size={12} className="nb-sum-icon" />
              <span className="nb-sum-label">AI Summary</span>
              <p className="nb-sum-text">{activeNote.aiSummary}</p>
            </div>
          )}

          {/* Audio player */}
          {activeNote.audioUrl && (
            <div className="nb-audio">
              <FileAudio size={14} className="nb-audio-icon" />
              <audio controls src={activeNote.audioUrl} className="nb-audio-player" />
              <span className="nb-audio-dur">{activeNote.audioDuration ? formatTime(activeNote.audioDuration) : ""}</span>
            </div>
          )}

          {/* Content */}
          <textarea
            ref={textareaRef}
            className="nb-content"
            value={activeNote.content}
            onChange={(e) => updateNote(activeId, { content: e.target.value })}
            placeholder="Start writing... (Markdown supported)"
          />
        </div>
      ) : (
        <div className="nb-empty">
          <Plus size={32} />
          <p>Create your first note</p>
          <button className="nb-new-btn-lg" onClick={createNote}>New Note</button>
        </div>
      )}

      <style jsx>{`
        .nb-page { display: flex; height: 100%; overflow: hidden; }
        .nb-sidebar { width: 250px; flex-shrink: 0; border-right: 1px solid var(--bd); display: flex; flex-direction: column; background: var(--bg1); }
        .nb-sidebar-top { display: flex; align-items: center; justify-content: space-between; padding: 16px 14px 12px; border-bottom: 1px solid var(--bd); }
        .nb-sidebar-title { font-size: 14px; font-weight: 700; color: var(--tx); text-transform: uppercase; letter-spacing: 0.06em; }
        .nb-new-btn { width: 28px; height: 28px; border-radius: 6px; background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.25); color: var(--cy); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .nb-new-btn:hover { background: rgba(34,211,238,0.2); }
        .nb-note-list { flex: 1; overflow-y: auto; padding: 6px; }
        .nb-note-item { width: 100%; text-align: left; padding: 10px 11px; border-radius: 8px; background: none; border: 1px solid transparent; cursor: pointer; transition: background 0.15s; }
        .nb-note-item:hover { background: rgba(255,255,255,0.04); }
        .nb-note-item.active { background: rgba(34,211,238,0.08); border-color: rgba(34,211,238,0.18); }
        .nb-note-item-title { font-size: 14px; font-weight: 600; color: var(--tx); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-note-item-meta { font-size: 12px; color: var(--tx3); margin-top: 3px; display: flex; align-items: center; }
        .nb-editor { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .nb-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--bd); gap: 12px; flex-wrap: wrap; }
        .nb-toolbar-left { flex: 1; min-width: 0; }
        .nb-title { font-size: 20px; font-weight: 700; color: var(--tx); cursor: pointer; display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-edit-icon { color: var(--tx3); opacity: 0; transition: opacity 0.15s; }
        .nb-title:hover .nb-edit-icon { opacity: 1; }
        .nb-title-input { font-size: 20px; font-weight: 700; color: var(--tx); background: none; border: none; border-bottom: 1px solid var(--cy); outline: none; width: 100%; font-family: inherit; }
        .nb-date { font-size: 13px; color: var(--tx3); display: flex; align-items: center; gap: 4px; margin-top: 4px; }
        .nb-toolbar-actions { display: flex; align-items: center; gap: 6px; }
        .nb-tb-btn { width: 34px; height: 34px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--bd); color: var(--di); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s; font-size: 13px; }
        .nb-tb-btn:hover { background: var(--bg1); color: var(--tx); border-color: var(--bdh); }
        .nb-tb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .nb-tb-btn.recording { background: rgba(251,113,133,0.15); border-color: rgba(251,113,133,0.4); color: var(--ro); width: auto; padding: 0 12px; }
        .nb-rec-timer { font-size: 13px; font-family: 'JetBrains Mono', monospace; }
        .nb-save-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.28); color: var(--cy); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .nb-save-btn:hover { background: rgba(34,211,238,0.2); }
        .nb-tags-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 10px 20px; border-bottom: 1px solid var(--bd); min-height: 42px; }
        .nb-tag { display: flex; align-items: center; gap: 4px; padding: 4px 10px; background: rgba(34,211,238,0.08); border: 1px solid rgba(34,211,238,0.2); border-radius: 20px; font-size: 13px; color: var(--cy); }
        .nb-tag button { background: none; border: none; cursor: pointer; color: var(--cy); display: flex; align-items: center; opacity: 0.6; }
        .nb-tag button:hover { opacity: 1; }
        .nb-tag-input { background: none; border: none; outline: none; font-size: 13px; color: var(--tx3); width: 70px; font-family: inherit; }
        .nb-tag-input::placeholder { color: var(--tx3); }
        .nb-summary { display: flex; align-items: flex-start; gap: 10px; padding: 12px 20px; background: rgba(167,139,250,0.05); border-bottom: 1px solid rgba(167,139,250,0.12); }
        .nb-sum-icon { color: var(--vi); flex-shrink: 0; margin-top: 2px; }
        .nb-sum-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vi); flex-shrink: 0; padding-top: 1px; white-space: nowrap; }
        .nb-sum-text { font-size: 14px; color: var(--di); line-height: 1.65; }
        .nb-audio { display: flex; align-items: center; gap: 10px; padding: 10px 20px; border-bottom: 1px solid var(--bd); }
        .nb-audio-icon { color: var(--cy); flex-shrink: 0; }
        .nb-audio-player { height: 32px; flex: 1; }
        .nb-audio-dur { font-size: 13px; color: var(--tx3); font-family: 'JetBrains Mono', monospace; }
        .nb-content { flex: 1; padding: 22px; background: transparent; border: none; outline: none; color: var(--tx); font-size: 16px; line-height: 1.85; resize: none; font-family: inherit; }
        .nb-content::placeholder { color: var(--tx3); }
        .nb-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--tx2); font-size: 15px; }
        .nb-new-btn-lg { padding: 11px 22px; border-radius: 10px; background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.28); color: var(--cy); font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
