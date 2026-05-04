"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Plus, Mic, MicOff, Trash2, FileAudio, Brain,
  Hash, Calendar, Loader2, X, Edit3,
  Search, Download, Eye, Code2, BookOpen, ChevronRight,
  FileText, AlignLeft, Clock,
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

const TEMPLATES: { icon: string; label: string; title: string; content: string; tags: string[] }[] = [
  {
    icon: "💡",
    label: "Idea Capture",
    title: "New Idea",
    content: `## Core Idea\n\n\n## Why It Matters\n\n\n## Next Steps\n- [ ] \n- [ ] \n- [ ] `,
    tags: ["idea"],
  },
  {
    icon: "📖",
    label: "Study Notes",
    title: "Study: ",
    content: `## Topic Overview\n\n\n## Key Concepts\n\n\n## Questions to Explore\n\n\n## Resources\n- `,
    tags: ["study", "learning"],
  },
  {
    icon: "🤖",
    label: "AI Research",
    title: "AI Research: ",
    content: `## Research Question\n\n\n## Findings\n\n\n## Model / Tool Used\n\n\n## Evaluation\n**Strengths:** \n**Limitations:** \n\n## References\n- `,
    tags: ["ai", "research"],
  },
  {
    icon: "📋",
    label: "Meeting Notes",
    title: "Meeting: ",
    content: `## Date & Attendees\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:** \n\n## Agenda\n\n\n## Key Decisions\n\n\n## Action Items\n- [ ] `,
    tags: ["meeting"],
  },
];

const STORAGE_KEY = "axiom_notebook_notes";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Note[];
  } catch { /* ignore */ }
  return [
    {
      id: "demo-1",
      title: "AXIOM Architecture Notes",
      content: `## Platform Overview\n\nThe AXIOM platform combines multiple AI models via a unified API layer.\n\n- **Gemini** handles multimodal reasoning\n- **Groq** accelerates inference at 800+ tokens/sec\n- **pgvector** enables semantic retrieval across the knowledge base\n\nThe ReAct agent loop enables tool use with explicit reasoning traces.\n\n## Key Insight\n\nStreaming responses + topological BFS execution order = real-time pipeline visualization.`,
      tags: ["architecture", "ai", "axiom"],
      aiSummary: "Platform architecture overview covering AI model integration and infrastructure components.",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
}

function saveNotes(notes: Note[]) {
  try {
    // Strip blob URLs before persisting (they are session-only)
    const clean = notes.map((n) => ({ ...n, audioUrl: undefined }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch { /* storage full or unavailable */ }
}

/** Very lightweight markdown → HTML renderer (no dependencies) */
function renderMarkdown(md: string): string {
  return md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^#{3} (.+)$/gm, '<h3 style="color:var(--cy);font-size:14px;margin:16px 0 6px;font-weight:700;">$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2 style="color:var(--vi);font-size:16px;margin:18px 0 8px;font-weight:700;">$1</h2>')
    .replace(/^#{1} (.+)$/gm, '<h1 style="color:var(--tx);font-size:20px;margin:20px 0 10px;font-weight:800;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--tx)">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="color:var(--di)">$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(34,211,238,0.1);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px;color:var(--cy)">$1</code>')
    .replace(/^- \[ \] (.+)$/gm, '<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><span style="width:14px;height:14px;border:1.5px solid var(--bd);border-radius:3px;display:inline-block;flex-shrink:0"></span><span>$1</span></div>')
    .replace(/^- \[x\] (.+)$/gm, '<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><span style="width:14px;height:14px;border:1.5px solid var(--em);border-radius:3px;background:var(--em);display:inline-block;flex-shrink:0"></span><span style="text-decoration:line-through;opacity:0.5">$1</span></div>')
    .replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:6px;list-style:disc inside">$1</li>')
    .replace(/^\* (.+)$/gm, '<li style="margin:4px 0;padding-left:6px;list-style:disc inside">$1</li>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--vi);padding-left:12px;margin:8px 0;color:var(--di);font-style:italic">$1</blockquote>')
    .replace(/---/g, '<hr style="border:none;border-top:1px solid var(--bd);margin:16px 0"/>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:var(--cy);text-decoration:underline">$1</a>')
    .replace(/\n\n/g, '</p><p style="margin:0 0 12px">')
    .replace(/\n/g, "<br/>");
}

export default function NotebookPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [summarizing, setSummarizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadNotes();
    setNotes(loaded);
    setActiveId(loaded[0]?.id || "");
  }, []);

  // Persist whenever notes change
  useEffect(() => {
    if (notes.length > 0) saveNotes(notes);
  }, [notes]);

  const activeNote = notes.find((n) => n.id === activeId);

  // Derived: word count + reading time
  const wordCount = activeNote ? activeNote.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Filtered note list
  const filteredNotes = searchQuery.trim()
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notes;

  const createFromTemplate = (tpl: typeof TEMPLATES[0]) => {
    const note: Note = {
      id: crypto.randomUUID(),
      title: tpl.title,
      content: tpl.content,
      tags: tpl.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    setShowTemplates(false);
  };

  const createNote = () => {
    const note: Note = {
      id: crypto.randomUUID(),
      title: "Untitled Note",
      content: "",
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    setShowTemplates(false);
    setTimeout(() => setEditingTitle(true), 60);
  };

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n))
    );
  }, []);

  const deleteNote = (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (activeId === id) setActiveId(next[0]?.id || "");
      return next;
    });
  };

  const exportNote = () => {
    if (!activeNote) return;
    const blob = new Blob(
      [`# ${activeNote.title}\n\n_Tags: ${activeNote.tags.join(", ")}_\n_Updated: ${formatDate(activeNote.updatedAt)}_\n\n---\n\n${activeNote.content}`],
      { type: "text/markdown" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeNote.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
          messages: [
            {
              role: "user",
              content: `Summarize this note in 1-2 concise sentences, extracting the key insight:\n\n${activeNote.content}`,
            },
          ],
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
          for (const line of text.split("\n")) {
            if (line.startsWith("0:")) {
              try {
                summary += JSON.parse(line.slice(2));
              } catch { /* skip */ }
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
    saveNotes(notes);
    await new Promise((r) => setTimeout(r, 400));
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

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  useEffect(() => {
    if (activeNote && textareaRef.current && !previewMode) {
      textareaRef.current.focus();
    }
  }, [activeId, previewMode]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  return (
    <div className="nb-page">
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <div className="nb-sidebar">
        <div className="nb-sidebar-top">
          <div className="nb-sidebar-title-row">
            <BookOpen size={15} style={{ color: "var(--cy)" }} />
            <h2 className="nb-sidebar-title">Notebook</h2>
          </div>
          <div className="nb-sidebar-actions">
            <button
              className="nb-icon-btn"
              onClick={() => setShowSearch((v) => !v)}
              title="Search notes"
              style={{ color: showSearch ? "var(--cy)" : undefined }}
            >
              <Search size={14} />
            </button>
            <button
              className="nb-icon-btn"
              onClick={() => setShowTemplates((v) => !v)}
              title="Templates"
              style={{ color: showTemplates ? "var(--vi)" : undefined }}
            >
              <BookOpen size={14} />
            </button>
            <button className="nb-new-btn" onClick={createNote} title="New blank note">
              <Plus size={15} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="nb-search-wrap">
            <Search size={13} className="nb-search-icon" />
            <input
              className="nb-search-input"
              placeholder="Search notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="nb-search-clear" onClick={() => setSearchQuery("")}>
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Templates picker */}
        {showTemplates && (
          <div className="nb-templates">
            <div className="nb-templates-label">Quick Templates</div>
            {TEMPLATES.map((tpl) => (
              <button key={tpl.label} className="nb-tpl-item" onClick={() => createFromTemplate(tpl)}>
                <span className="nb-tpl-icon">{tpl.icon}</span>
                <span className="nb-tpl-label">{tpl.label}</span>
                <ChevronRight size={11} style={{ color: "var(--mu)", marginLeft: "auto" }} />
              </button>
            ))}
            <div style={{ borderTop: "1px solid var(--bd)", marginTop: 6, paddingTop: 6 }}>
              <button className="nb-tpl-item" onClick={createNote}>
                <span className="nb-tpl-icon"><FileText size={13} /></span>
                <span className="nb-tpl-label">Blank note</span>
                <ChevronRight size={11} style={{ color: "var(--mu)", marginLeft: "auto" }} />
              </button>
            </div>
          </div>
        )}

        {/* Note list */}
        <div className="nb-note-list">
          {filteredNotes.length === 0 && (
            <div className="nb-no-notes">
              {searchQuery ? "No notes match your search" : "No notes yet"}
            </div>
          )}
          {filteredNotes.map((note) => (
            <button
              key={note.id}
              className={`nb-note-item ${note.id === activeId ? "active" : ""}`}
              onClick={() => { setActiveId(note.id); setShowTemplates(false); }}
            >
              <div className="nb-note-item-title">{note.title}</div>
              <div className="nb-note-item-meta">
                <span>{formatDate(note.updatedAt)}</span>
                {note.audioUrl && <FileAudio size={10} style={{ marginLeft: 4, flexShrink: 0 }} />}
                {note.aiSummary && <Brain size={10} style={{ marginLeft: 3, color: "var(--vi)", flexShrink: 0 }} />}
              </div>
              {note.tags.length > 0 && (
                <div className="nb-note-item-tags">
                  {note.tags.slice(0, 3).map((t) => (
                    <span key={t} className="nb-note-tag-mini">{t}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Sidebar footer stats */}
        <div className="nb-sidebar-footer">
          <span>{notes.length} note{notes.length !== 1 ? "s" : ""}</span>
          <span>{notes.reduce((a, n) => a + n.tags.length, 0)} tags</span>
        </div>
      </div>

      {/* ── Editor / Preview ────────────────────────────────────────── */}
      {activeNote ? (
        <div className="nb-editor">
          {/* Toolbar */}
          <div className="nb-toolbar">
            <div className="nb-toolbar-left">
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  className="nb-title-input"
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeId, { title: e.target.value })}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                />
              ) : (
                <h1 className="nb-title" onClick={() => setEditingTitle(true)}>
                  {activeNote.title}
                  <Edit3 size={12} className="nb-edit-icon" />
                </h1>
              )}
              <div className="nb-meta-row">
                <Calendar size={11} />
                <span>{formatDate(activeNote.updatedAt)}</span>
                <span className="nb-dot">·</span>
                <AlignLeft size={11} />
                <span>{wordCount} words</span>
                <span className="nb-dot">·</span>
                <Clock size={11} />
                <span>{readingTime} min read</span>
              </div>
            </div>
            <div className="nb-toolbar-actions">
              {/* Preview toggle */}
              <button
                className={`nb-tb-btn ${previewMode ? "active-mode" : ""}`}
                onClick={() => setPreviewMode((v) => !v)}
                title={previewMode ? "Switch to edit mode" : "Markdown preview"}
              >
                {previewMode ? <Code2 size={15} /> : <Eye size={15} />}
              </button>
              {/* AI Summarize */}
              <button
                className="nb-tb-btn"
                onClick={summarizeNote}
                disabled={summarizing || !activeNote.content.trim()}
                title="AI Summarize"
              >
                {summarizing ? <Loader2 size={15} className="spin" /> : <Brain size={15} />}
              </button>
              {/* Record audio */}
              <button
                className={`nb-tb-btn ${recording ? "recording" : ""}`}
                onClick={recording ? stopRecording : startRecording}
                title={recording ? "Stop recording" : "Record voice note"}
              >
                {recording ? <MicOff size={15} /> : <Mic size={15} />}
                {recording && <span className="nb-rec-timer">{formatTime(recordSeconds)}</span>}
              </button>
              {/* Export */}
              <button className="nb-tb-btn" onClick={exportNote} title="Export as Markdown">
                <Download size={15} />
              </button>
              {/* Delete */}
              <button className="nb-tb-btn danger" onClick={() => deleteNote(activeId)} title="Delete note">
                <Trash2 size={15} />
              </button>
              {/* Save */}
              <button className="nb-save-btn" onClick={handleSave}>
                {saving ? <Loader2 size={14} className="spin" /> : <FileText size={14} />}
                {saving ? "Saved ✓" : "Save"}
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="nb-tags-row">
            {activeNote.tags.map((tag) => (
              <span key={tag} className="nb-tag">
                <Hash size={10} />
                {tag}
                <button onClick={() => removeTag(tag)}>
                  <X size={10} />
                </button>
              </span>
            ))}
            <div className="nb-tag-input-wrap">
              <input
                className="nb-tag-input"
                placeholder="+ add tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
            </div>
          </div>

          {/* AI Summary */}
          {activeNote.aiSummary && (
            <div className="nb-summary">
              <Brain size={13} className="nb-sum-icon" />
              <div>
                <span className="nb-sum-label">AI Summary</span>
                <p className="nb-sum-text">{activeNote.aiSummary}</p>
              </div>
              <button
                className="nb-sum-close"
                onClick={() => updateNote(activeId, { aiSummary: undefined })}
                title="Dismiss"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Audio player */}
          {activeNote.audioUrl && (
            <div className="nb-audio">
              <FileAudio size={14} className="nb-audio-icon" />
              <audio controls src={activeNote.audioUrl} className="nb-audio-player" />
              <span className="nb-audio-dur">
                {activeNote.audioDuration ? formatTime(activeNote.audioDuration) : ""}
              </span>
            </div>
          )}

          {/* Edit / Preview content */}
          {previewMode ? (
            <div
              className="nb-preview"
              dangerouslySetInnerHTML={{
                __html: activeNote.content
                  ? `<p style="margin:0 0 12px">${renderMarkdown(activeNote.content)}</p>`
                  : '<p style="color:var(--mu);font-style:italic">Nothing to preview yet.</p>',
              }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              className="nb-content"
              value={activeNote.content}
              onChange={(e) => updateNote(activeId, { content: e.target.value })}
              placeholder={`Start writing… Markdown is supported.\n\n## Headings  **bold**  *italic*  \`code\`\n- bullet lists   - [ ] checkboxes   > blockquotes`}
              spellCheck
            />
          )}

          {/* Bottom status bar */}
          <div className="nb-status-bar">
            <span className="nb-status-item">
              {previewMode ? (
                <><Eye size={11} /> Preview mode</>
              ) : (
                <><Code2 size={11} /> Edit mode</>
              )}
            </span>
            <span className="nb-status-item">{wordCount} words · {readingTime} min</span>
            <span className="nb-status-item">
              Auto-saved to localStorage
            </span>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="nb-empty">
          <div className="nb-empty-icon">
            <BookOpen size={40} style={{ color: "var(--cy)", opacity: 0.4 }} />
          </div>
          <h3 className="nb-empty-title">Your notebook is empty</h3>
          <p className="nb-empty-sub">Capture ideas, study notes, AI research — all saved locally in your browser.</p>
          <div className="nb-empty-actions">
            {TEMPLATES.map((tpl) => (
              <button key={tpl.label} className="nb-empty-tpl-btn" onClick={() => createFromTemplate(tpl)}>
                <span>{tpl.icon}</span>
                <span>{tpl.label}</span>
              </button>
            ))}
            <button className="nb-empty-tpl-btn blank" onClick={createNote}>
              <Plus size={14} />
              <span>Blank note</span>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ── Layout ───────────────────────────────────────────────── */
        .nb-page { display: flex; height: 100%; overflow: hidden; background: var(--bg); }

        /* ── Sidebar ──────────────────────────────────────────────── */
        .nb-sidebar { width: 260px; flex-shrink: 0; border-right: 1px solid var(--bd); display: flex; flex-direction: column; background: var(--bg1); overflow: hidden; }
        .nb-sidebar-top { display: flex; align-items: center; justify-content: space-between; padding: 14px 12px 10px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
        .nb-sidebar-title-row { display: flex; align-items: center; gap: 7px; }
        .nb-sidebar-title { font-size: 13px; font-weight: 700; color: var(--tx); text-transform: uppercase; letter-spacing: 0.07em; }
        .nb-sidebar-actions { display: flex; align-items: center; gap: 4px; }
        .nb-icon-btn { width: 28px; height: 28px; border-radius: 6px; background: none; border: 1px solid var(--bd); color: var(--di); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .nb-icon-btn:hover { background: var(--bg2); color: var(--tx); }
        .nb-new-btn { width: 28px; height: 28px; border-radius: 6px; background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.25); color: var(--cy); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .nb-new-btn:hover { background: rgba(34,211,238,0.22); }

        /* Search */
        .nb-search-wrap { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--bd); background: var(--bg2); flex-shrink: 0; }
        .nb-search-icon { color: var(--mu); flex-shrink: 0; }
        .nb-search-input { flex: 1; background: none; border: none; outline: none; color: var(--tx); font-size: 13px; font-family: inherit; }
        .nb-search-input::placeholder { color: var(--mu); }
        .nb-search-clear { background: none; border: none; cursor: pointer; color: var(--mu); display: flex; align-items: center; padding: 2px; }
        .nb-search-clear:hover { color: var(--tx); }

        /* Templates panel */
        .nb-templates { padding: 8px; border-bottom: 1px solid var(--bd); background: var(--bg2); flex-shrink: 0; }
        .nb-templates-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mu); padding: 2px 4px 6px; }
        .nb-tpl-item { width: 100%; display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 7px; background: none; border: none; cursor: pointer; color: var(--di); font-size: 13px; font-family: inherit; transition: background 0.15s; }
        .nb-tpl-item:hover { background: rgba(167,139,250,0.08); color: var(--tx); }
        .nb-tpl-icon { width: 20px; text-align: center; flex-shrink: 0; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .nb-tpl-label { flex: 1; text-align: left; }

        /* Note list */
        .nb-note-list { flex: 1; overflow-y: auto; padding: 6px; }
        .nb-no-notes { padding: 20px 8px; text-align: center; color: var(--mu); font-size: 13px; }
        .nb-note-item { width: 100%; text-align: left; padding: 10px 11px; border-radius: 8px; background: none; border: 1px solid transparent; cursor: pointer; transition: background 0.15s; margin-bottom: 2px; }
        .nb-note-item:hover { background: rgba(255,255,255,0.04); }
        .nb-note-item.active { background: rgba(34,211,238,0.07); border-color: rgba(34,211,238,0.18); }
        .nb-note-item-title { font-size: 13px; font-weight: 600; color: var(--tx); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-note-item-meta { font-size: 11px; color: var(--mu); margin-top: 3px; display: flex; align-items: center; }
        .nb-note-item-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 5px; }
        .nb-note-tag-mini { font-size: 10px; padding: 2px 6px; border-radius: 10px; background: rgba(167,139,250,0.1); color: var(--vi); }

        /* Sidebar footer */
        .nb-sidebar-footer { padding: 8px 14px; border-top: 1px solid var(--bd); display: flex; gap: 12px; font-size: 11px; color: var(--mu); flex-shrink: 0; }

        /* ── Editor ───────────────────────────────────────────────── */
        .nb-editor { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .nb-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid var(--bd); gap: 10px; flex-wrap: wrap; flex-shrink: 0; }
        .nb-toolbar-left { flex: 1; min-width: 0; }
        .nb-title { font-size: 19px; font-weight: 700; color: var(--tx); cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-edit-icon { color: var(--mu); opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
        .nb-title:hover .nb-edit-icon { opacity: 1; }
        .nb-title-input { font-size: 19px; font-weight: 700; color: var(--tx); background: none; border: none; border-bottom: 2px solid var(--cy); outline: none; width: 100%; font-family: inherit; }
        .nb-meta-row { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--mu); margin-top: 4px; flex-wrap: wrap; }
        .nb-dot { color: var(--bd); }
        .nb-toolbar-actions { display: flex; align-items: center; gap: 5px; }
        .nb-tb-btn { width: 34px; height: 34px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--bd); color: var(--di); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s; font-size: 13px; }
        .nb-tb-btn:hover { background: var(--bg1); color: var(--tx); border-color: var(--bdh); }
        .nb-tb-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .nb-tb-btn.active-mode { background: rgba(34,211,238,0.12); border-color: rgba(34,211,238,0.3); color: var(--cy); }
        .nb-tb-btn.recording { background: rgba(251,113,133,0.12); border-color: rgba(251,113,133,0.35); color: var(--ro); width: auto; padding: 0 11px; }
        .nb-tb-btn.danger:hover { background: rgba(251,113,133,0.1); color: var(--ro); border-color: rgba(251,113,133,0.35); }
        .nb-rec-timer { font-size: 13px; font-family: 'JetBrains Mono', monospace; }
        .nb-save-btn { display: flex; align-items: center; gap: 6px; padding: 7px 15px; border-radius: 8px; background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.25); color: var(--cy); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .nb-save-btn:hover { background: rgba(34,211,238,0.18); }

        /* Tags */
        .nb-tags-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 9px 18px; border-bottom: 1px solid var(--bd); min-height: 40px; flex-shrink: 0; }
        .nb-tag { display: flex; align-items: center; gap: 4px; padding: 3px 9px; background: rgba(34,211,238,0.07); border: 1px solid rgba(34,211,238,0.18); border-radius: 20px; font-size: 12px; color: var(--cy); }
        .nb-tag button { background: none; border: none; cursor: pointer; color: var(--cy); display: flex; align-items: center; opacity: 0.5; transition: opacity 0.15s; }
        .nb-tag button:hover { opacity: 1; }
        .nb-tag-input { background: none; border: none; outline: none; font-size: 12px; color: var(--tx3); width: 75px; font-family: inherit; }
        .nb-tag-input::placeholder { color: var(--mu); }

        /* AI Summary */
        .nb-summary { display: flex; align-items: flex-start; gap: 10px; padding: 10px 18px; background: rgba(167,139,250,0.04); border-bottom: 1px solid rgba(167,139,250,0.1); flex-shrink: 0; }
        .nb-sum-icon { color: var(--vi); flex-shrink: 0; margin-top: 2px; }
        .nb-sum-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vi); display: block; margin-bottom: 3px; }
        .nb-sum-text { font-size: 13px; color: var(--di); line-height: 1.6; margin: 0; }
        .nb-sum-close { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--mu); display: flex; align-items: center; flex-shrink: 0; padding: 2px; }
        .nb-sum-close:hover { color: var(--tx); }

        /* Audio */
        .nb-audio { display: flex; align-items: center; gap: 10px; padding: 9px 18px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
        .nb-audio-icon { color: var(--cy); flex-shrink: 0; }
        .nb-audio-player { height: 32px; flex: 1; }
        .nb-audio-dur { font-size: 12px; color: var(--mu); font-family: 'JetBrains Mono', monospace; }

        /* Content area */
        .nb-content { flex: 1; padding: 22px 24px; background: transparent; border: none; outline: none; color: var(--tx); font-size: 15px; line-height: 1.9; resize: none; font-family: inherit; min-height: 0; }
        .nb-content::placeholder { color: var(--mu); }

        /* Markdown preview */
        .nb-preview { flex: 1; padding: 22px 24px; overflow-y: auto; color: var(--tx); font-size: 15px; line-height: 1.9; min-height: 0; }

        /* Status bar */
        .nb-status-bar { display: flex; align-items: center; gap: 16px; padding: 6px 18px; border-top: 1px solid var(--bd); background: var(--bg1); flex-shrink: 0; }
        .nb-status-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--mu); }

        /* ── Empty state ──────────────────────────────────────────── */
        .nb-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 40px; }
        .nb-empty-icon { opacity: 0.6; }
        .nb-empty-title { font-size: 18px; font-weight: 700; color: var(--tx); margin: 0; }
        .nb-empty-sub { font-size: 14px; color: var(--mu); text-align: center; max-width: 400px; margin: 0; line-height: 1.6; }
        .nb-empty-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 8px; }
        .nb-empty-tpl-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; background: var(--bg1); border: 1px solid var(--bd); color: var(--di); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .nb-empty-tpl-btn:hover { background: var(--bg2); color: var(--tx); border-color: var(--bdh); }
        .nb-empty-tpl-btn.blank { background: rgba(34,211,238,0.07); border-color: rgba(34,211,238,0.22); color: var(--cy); }
        .nb-empty-tpl-btn.blank:hover { background: rgba(34,211,238,0.14); }

        /* ── Utils ────────────────────────────────────────────────── */
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
