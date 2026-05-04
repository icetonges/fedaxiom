"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, FileText, Search, Trash2, Brain, ChevronRight,
  Database, Zap, BookOpen, AlertCircle, CheckCircle, Loader2, X, Plus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doc {
  id: string;
  name: string;
  size: number;
  chunks: number;
  uploadedAt: string;
  status: "processing" | "ready" | "error";
}

interface QAResult {
  answer: string;
  sources: { chunk: string; score: number; doc: string }[];
}

// ─── localStorage helpers ────────────────────────────────────────────────────

const DOCS_KEY   = "axiom_km_docs";
const CHUNKS_KEY = "axiom_km_chunks";

function loadDocs(): Doc[] {
  try { return JSON.parse(localStorage.getItem(DOCS_KEY) || "[]"); }
  catch { return []; }
}
function saveDocs(docs: Doc[]) {
  try { localStorage.setItem(DOCS_KEY, JSON.stringify(docs)); }
  catch { /* quota exceeded */ }
}
function loadChunks(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(CHUNKS_KEY) || "{}"); }
  catch { return {}; }
}
function saveChunks(chunks: Record<string, string[]>) {
  try { localStorage.setItem(CHUNKS_KEY, JSON.stringify(chunks)); }
  catch { /* quota exceeded */ }
}

// ─── Client-side text extraction ─────────────────────────────────────────────
// Reads .txt / .md in the browser so we send compact JSON (not binary FormData)
// and never hit Vercel's 4.5 MB serverless payload limit.
// PDF / DOCX need a server-side parser (pdf-parse / mammoth); for now we
// register them with a descriptive placeholder so queries still work.

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve((e.target?.result as string) || "");
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsText(file);
  });
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await readFileAsText(file);
  }

  if (name.endsWith(".pdf")) {
    return (
      `[PDF: ${file.name}] ` +
      `This document was registered but its text could not be extracted in this demo environment. ` +
      `In production, connect the pdf-parse library server-side to index real PDF content. ` +
      `Convert to .txt or .md for full semantic search right now.`
    );
  }

  if (name.endsWith(".docx")) {
    return (
      `[DOCX: ${file.name}] ` +
      `This Word document was registered but its text could not be extracted in this demo environment. ` +
      `In production, connect mammoth.js server-side to index real DOCX content. ` +
      `Convert to .txt or .md for full semantic search right now.`
    );
  }

  return `[${file.name}] — unsupported file type.`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const [docs, setDocs]                 = useState<Doc[]>([]);
  const [uploading, setUploading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingName, setUploadingName]   = useState("");
  const [query, setQuery]               = useState("");
  const [querying, setQuerying]         = useState(false);
  const [result, setResult]             = useState<QAResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load persisted docs from localStorage on first render
  useEffect(() => { setDocs(loadDocs()); }, []);

  // Keep localStorage in sync whenever docs list changes
  useEffect(() => { saveDocs(docs); }, [docs]);

  // ── Upload ───────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      setUploadingName(file.name);
      setUploadProgress(0);

      try {
        // 1. Extract text client-side — no binary payload, no size limit issue
        const text = await extractText(file);

        // Guard: even extracted text shouldn't exceed ~3.5 MB (Vercel JSON margin)
        if (text.length > 3_500_000) {
          throw new Error(
            `Extracted text is ${(text.length / 1_000_000).toFixed(1)} MB — ` +
            `please split the document into smaller files (< ~3 MB text).`
          );
        }

        // Animate progress bar while waiting for the API
        const progressInterval = setInterval(
          () => setUploadProgress((p) => Math.min(p + 12, 88)),
          180,
        );

        // 2. Send JSON (not FormData) — stays well under Vercel's payload cap
        const res = await fetch("/api/upload", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ fileName: file.name, text, fileSize: file.size }),
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg);
        }

        const data = await res.json();

        // 3. Persist chunks in localStorage keyed by docId
        const stored = loadChunks();
        stored[data.id] = data.chunkTexts ?? [];
        saveChunks(stored);

        // 4. Add doc metadata to the list
        setDocs((prev) => {
          // Avoid duplicates if the same file is re-uploaded
          const deduped = prev.filter((d) => d.name !== file.name);
          return [
            ...deduped,
            {
              id:         data.id,
              name:       file.name,
              size:       file.size,
              chunks:     data.chunks ?? (data.chunkTexts?.length ?? 0),
              uploadedAt: new Date().toISOString(),
              status:     "ready",
            },
          ];
        });
      } catch (err) {
        setError(`Failed to upload "${file.name}": ${err}`);
      }
    }

    setTimeout(() => { setUploading(false); setUploadProgress(0); setUploadingName(""); }, 600);
  }, []);

  // ── Query ────────────────────────────────────────────────────────────────
  const handleQuery = async () => {
    if (!query.trim() || docs.length === 0) return;
    setQuerying(true);
    setResult(null);
    setError(null);

    try {
      // Build the full chunk list from localStorage for all indexed docs
      const storedChunks = loadChunks();
      const allChunks: { content: string; doc: string }[] = [];

      for (const doc of docs) {
        const chunks = storedChunks[doc.id] ?? [];
        chunks.forEach((c) => allChunks.push({ content: c, doc: doc.name }));
      }

      const res = await fetch("/api/embeddings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ query, chunks: allChunks }),
      });

      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (err) {
      setError(String(err));
    } finally {
      setQuerying(false);
    }
  };

  // ── Remove ───────────────────────────────────────────────────────────────
  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    // Remove persisted chunks too
    const stored = loadChunks();
    delete stored[id];
    saveChunks(stored);
    setResult(null);
  };

  const clearAll = () => {
    setDocs([]);
    localStorage.removeItem(DOCS_KEY);
    localStorage.removeItem(CHUNKS_KEY);
    setResult(null);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const totalChunks = docs.reduce((a, d) => a + d.chunks, 0);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="km-page">

      {/* Header */}
      <div className="km-header">
        <div className="km-title-row">
          <div className="km-icon-wrap"><Brain size={20} /></div>
          <div>
            <h1 className="km-title">Knowledge Mirror</h1>
            <p className="km-sub">Upload documents · Search · Query with AI</p>
          </div>
        </div>
        <div className="km-stats">
          <div className="km-stat"><Database size={14} /><span>{docs.length} doc{docs.length !== 1 ? "s" : ""}</span></div>
          <div className="km-stat"><BookOpen size={14} /><span>{totalChunks} chunks</span></div>
          <div className="km-stat"><Database size={14} /><span>localStorage</span></div>
          <div className="km-stat"><Zap size={14} /><span>Gemini Flash</span></div>
        </div>
      </div>

      <div className="km-body">

        {/* ── Drop zone ── */}
        <div className="km-section">
          <div
            className={`km-dropzone ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef} type="file" hidden multiple
              accept=".pdf,.txt,.md,.docx"
              onChange={(e) => handleUpload(e.target.files)}
            />
            {uploading ? (
              <div className="km-uploading">
                <Loader2 size={28} className="spin" />
                <p className="km-uploading-name">Processing "{uploadingName}"…</p>
                <div className="km-progress-bar">
                  <div className="km-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p className="km-uploading-hint">{uploadProgress}% — extracting &amp; chunking text</p>
              </div>
            ) : (
              <div className="km-drop-content">
                <Upload size={32} className="km-upload-icon" />
                <p className="km-drop-title">Drop documents here</p>
                <p className="km-drop-sub">
                  <strong>TXT · MD</strong> — full semantic search &nbsp;·&nbsp;
                  <strong>PDF · DOCX</strong> — metadata registered (convert to TXT for full search)
                </p>
                <p className="km-drop-sub" style={{ marginTop: 2 }}>
                  Text extracted in browser · No binary upload · Saved across sessions
                </p>
                <button className="km-browse-btn"><Plus size={14} /> Browse files</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Indexed documents ── */}
        {docs.length > 0 && (
          <div className="km-section">
            <div className="km-section-header">
              <h2 className="km-section-title">Indexed Documents</h2>
              <button className="km-clear-btn" onClick={clearAll} title="Remove all documents">
                <Trash2 size={11} /> Clear all
              </button>
            </div>
            <div className="km-doc-list">
              {docs.map((doc) => (
                <div key={doc.id} className="km-doc-card">
                  <div className="km-doc-icon"><FileText size={16} /></div>
                  <div className="km-doc-meta">
                    <span className="km-doc-name">{doc.name}</span>
                    <span className="km-doc-info">
                      {formatSize(doc.size)} · {doc.chunks} chunks · saved locally
                    </span>
                  </div>
                  <div className="km-doc-status">
                    {doc.status === "ready"      && <CheckCircle size={14} className="status-ready" />}
                    {doc.status === "processing"  && <Loader2 size={14} className="spin status-proc" />}
                    {doc.status === "error"       && <AlertCircle size={14} className="status-err" />}
                  </div>
                  <button className="km-doc-remove" onClick={() => removeDoc(doc.id)} title="Remove">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Query ── */}
        <div className="km-section">
          <h2 className="km-section-title">Query Knowledge Base</h2>
          <div className="km-query-wrap">
            <Search size={16} className="km-query-icon" />
            <input
              className="km-query-input"
              placeholder={
                docs.length === 0
                  ? "Upload documents first…"
                  : "Ask anything about your documents…"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              disabled={docs.length === 0 || querying}
            />
            <button
              className="km-query-btn"
              onClick={handleQuery}
              disabled={!query.trim() || docs.length === 0 || querying}
            >
              {querying ? <Loader2 size={16} className="spin" /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="km-error">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* ── Result ── */}
        {result && (
          <div className="km-result">
            <div className="km-result-answer">
              <div className="km-result-label"><Brain size={14} /> AI Answer</div>
              <p className="km-result-text">{result.answer}</p>
            </div>
            {result.sources && result.sources.length > 0 && (
              <div className="km-sources">
                <div className="km-sources-label">Source Chunks</div>
                {result.sources.map((src, i) => (
                  <div key={i} className="km-source-chip">
                    <span className="km-src-score">{(src.score * 100).toFixed(0)}%</span>
                    <span className="km-src-doc">{src.doc}</span>
                    <span className="km-src-chunk">{src.chunk.slice(0, 140)}…</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .km-page { padding: 24px; max-width: 900px; margin: 0 auto; }
        .km-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .km-title-row { display: flex; align-items: center; gap: 12px; }
        .km-icon-wrap { width: 40px; height: 40px; border-radius: 10px; background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.3); display: flex; align-items: center; justify-content: center; color: var(--vi); }
        .km-title { font-size: 22px; font-weight: 700; color: var(--tx); }
        .km-sub { font-size: 13px; color: var(--mu); margin-top: 2px; }
        .km-stats { display: flex; gap: 8px; flex-wrap: wrap; }
        .km-stat { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--di); background: var(--bg1); border: 1px solid var(--bd); padding: 6px 12px; border-radius: 6px; }
        .km-body { display: flex; flex-direction: column; gap: 20px; }
        .km-section { }
        .km-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .km-section-title { font-size: 12px; font-weight: 600; color: var(--vi); text-transform: uppercase; letter-spacing: 0.08em; }
        .km-clear-btn { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--mu); background: none; border: none; cursor: pointer; padding: 3px 6px; border-radius: 5px; font-family: inherit; transition: color 0.15s; }
        .km-clear-btn:hover { color: var(--ro); }

        /* Drop zone */
        .km-dropzone { border: 2px dashed var(--bd); border-radius: 12px; padding: 36px 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg1); }
        .km-dropzone:hover, .km-dropzone.drag-over { border-color: var(--vi); background: rgba(167,139,250,0.06); }
        .km-drop-content { display: flex; flex-direction: column; align-items: center; gap: 7px; }
        .km-upload-icon { color: var(--vi); opacity: 0.6; }
        .km-drop-title { font-size: 16px; font-weight: 600; color: var(--tx); }
        .km-drop-sub { font-size: 13px; color: var(--mu); line-height: 1.5; }
        .km-browse-btn { margin-top: 8px; display: flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 8px; background: rgba(167,139,250,0.12); border: 1px solid rgba(167,139,250,0.3); color: var(--vi); font-size: 13px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .km-browse-btn:hover { background: rgba(167,139,250,0.22); }

        /* Upload progress */
        .km-uploading { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--vi); }
        .km-uploading-name { font-size: 14px; font-weight: 600; color: var(--tx); max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .km-uploading-hint { font-size: 12px; color: var(--mu); }
        .km-progress-bar { width: 220px; height: 5px; background: rgba(167,139,250,0.15); border-radius: 3px; overflow: hidden; }
        .km-progress-fill { height: 100%; background: var(--vi); border-radius: 3px; transition: width 0.2s; }

        /* Doc list */
        .km-doc-list { display: flex; flex-direction: column; gap: 6px; }
        .km-doc-card { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg1); border: 1px solid var(--bd); border-radius: 8px; }
        .km-doc-icon { color: var(--vi); flex-shrink: 0; }
        .km-doc-meta { flex: 1; min-width: 0; }
        .km-doc-name { font-size: 14px; font-weight: 600; color: var(--tx); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .km-doc-info { font-size: 12px; color: var(--mu); }
        .status-ready { color: var(--em); }
        .status-proc  { color: var(--am); }
        .status-err   { color: var(--ro); }
        .km-doc-remove { padding: 5px; background: none; border: none; cursor: pointer; color: var(--mu); border-radius: 5px; display: flex; align-items: center; transition: all 0.15s; }
        .km-doc-remove:hover { color: var(--ro); background: rgba(251,113,133,0.1); }

        /* Query bar */
        .km-query-wrap { display: flex; align-items: center; gap: 10px; background: var(--bg1); border: 1px solid var(--bd); border-radius: 10px; padding: 4px 4px 4px 14px; }
        .km-query-icon { color: var(--mu); flex-shrink: 0; }
        .km-query-input { flex: 1; background: none; border: none; outline: none; color: var(--tx); font-size: 14px; padding: 8px 0; font-family: inherit; }
        .km-query-input::placeholder { color: var(--mu); }
        .km-query-input:disabled { opacity: 0.5; }
        .km-query-btn { width: 38px; height: 38px; border-radius: 8px; background: var(--vi); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; transition: opacity 0.2s; }
        .km-query-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Error */
        .km-error { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(251,113,133,0.1); border: 1px solid rgba(251,113,133,0.3); border-radius: 8px; color: var(--ro); font-size: 13px; }
        .km-error button { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--ro); display: flex; align-items: center; }

        /* Result */
        .km-result { background: var(--bg1); border: 1px solid var(--bd); border-radius: 12px; overflow: hidden; }
        .km-result-answer { padding: 18px; }
        .km-result-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vi); margin-bottom: 10px; }
        .km-result-text { font-size: 14px; color: var(--tx); line-height: 1.75; white-space: pre-wrap; }
        .km-sources { padding: 14px 18px; border-top: 1px solid var(--bd); display: flex; flex-direction: column; gap: 8px; }
        .km-sources-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mu); margin-bottom: 4px; }
        .km-source-chip { display: flex; align-items: flex-start; gap: 8px; padding: 9px 11px; background: var(--bg2); border-radius: 7px; }
        .km-src-score { font-size: 11px; font-weight: 700; color: var(--em); flex-shrink: 0; padding-top: 1px; min-width: 32px; }
        .km-src-doc { font-size: 11px; color: var(--vi); flex-shrink: 0; padding-top: 1px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .km-src-chunk { font-size: 12px; color: var(--di); line-height: 1.55; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
