"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, FileText, Search, Trash2, Brain, ChevronRight,
  Database, Zap, BookOpen, AlertCircle, CheckCircle, Loader2, X, Plus
} from "lucide-react";

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

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [query, setQuery] = useState("");
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState<QAResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    setUploadProgress(0);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((p) => Math.min(p + 15, 85));
        }, 200);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        setDocs((prev) => [...prev, {
          id: data.id || crypto.randomUUID(),
          name: file.name,
          size: file.size,
          chunks: data.chunks || Math.ceil(file.size / 800),
          uploadedAt: new Date().toISOString(),
          status: "ready",
        }]);
      } catch (err) {
        setError(`Failed to upload ${file.name}: ${err}`);
      }
    }

    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
  }, []);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setQuerying(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, docIds: docs.map((d) => d.id) }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setQuerying(false);
    }
  };

  const removeDoc = (id: string) => setDocs((prev) => prev.filter((d) => d.id !== id));

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="km-page">
      <div className="km-header">
        <div className="km-title-row">
          <div className="km-icon-wrap"><Brain size={20} /></div>
          <div>
            <h1 className="km-title">Knowledge Mirror</h1>
            <p className="km-sub">Upload documents · Embed · Query with AI</p>
          </div>
        </div>
        <div className="km-stats">
          <div className="km-stat"><Database size={14} /><span>{docs.length} docs</span></div>
          <div className="km-stat"><BookOpen size={14} /><span>{docs.reduce((a, d) => a + d.chunks, 0)} chunks</span></div>
          <div className="km-stat"><Zap size={14} /><span>pgvector</span></div>
        </div>
      </div>

      <div className="km-body">
        {/* Upload zone */}
        <div className="km-section">
          <div
            className={`km-dropzone ${dragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" hidden multiple accept=".pdf,.txt,.md,.docx" onChange={(e) => handleUpload(e.target.files)} />
            {uploading ? (
              <div className="km-uploading">
                <Loader2 size={28} className="spin" />
                <p>Embedding chunks... {uploadProgress}%</p>
                <div className="km-progress-bar"><div className="km-progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
              </div>
            ) : (
              <div className="km-drop-content">
                <Upload size={32} className="km-upload-icon" />
                <p className="km-drop-title">Drop documents here</p>
                <p className="km-drop-sub">PDF · TXT · MD · DOCX — chunks auto-embedded into pgvector</p>
                <button className="km-browse-btn"><Plus size={14} /> Browse files</button>
              </div>
            )}
          </div>
        </div>

        {/* Document list */}
        {docs.length > 0 && (
          <div className="km-section">
            <h2 className="km-section-title">Indexed Documents</h2>
            <div className="km-doc-list">
              {docs.map((doc) => (
                <div key={doc.id} className="km-doc-card">
                  <div className="km-doc-icon">
                    <FileText size={16} />
                  </div>
                  <div className="km-doc-meta">
                    <span className="km-doc-name">{doc.name}</span>
                    <span className="km-doc-info">{formatSize(doc.size)} · {doc.chunks} chunks</span>
                  </div>
                  <div className="km-doc-status">
                    {doc.status === "ready" && <CheckCircle size={14} className="status-ready" />}
                    {doc.status === "processing" && <Loader2 size={14} className="spin status-proc" />}
                    {doc.status === "error" && <AlertCircle size={14} className="status-err" />}
                  </div>
                  <button className="km-doc-remove" onClick={() => removeDoc(doc.id)}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Query */}
        <div className="km-section">
          <h2 className="km-section-title">Query Knowledge Base</h2>
          <div className="km-query-wrap">
            <Search size={16} className="km-query-icon" />
            <input
              className="km-query-input"
              placeholder={docs.length === 0 ? "Upload documents first..." : "Ask anything about your documents..."}
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

        {/* Error */}
        {error && (
          <div className="km-error">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={14} /></button>
          </div>
        )}

        {/* Result */}
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
                    <span className="km-src-chunk">{src.chunk.slice(0, 120)}...</span>
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
        .km-sub { font-size: 12px; color: var(--mu); margin-top: 2px; }
        .km-stats { display: flex; gap: 12px; }
        .km-stat { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--di); background: var(--bg1); border: 1px solid var(--bd); padding: 6px 12px; border-radius: 6px; }
        .km-body { display: flex; flex-direction: column; gap: 20px; }
        .km-section { }
        .km-section-title { font-size: 12px; font-weight: 600; color: var(--vi); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .km-dropzone { border: 2px dashed var(--bd); border-radius: 12px; padding: 40px 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg1); }
        .km-dropzone:hover, .km-dropzone.drag-over { border-color: var(--vi); background: rgba(167,139,250,0.06); }
        .km-drop-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .km-upload-icon { color: var(--vi); opacity: 0.6; }
        .km-drop-title { font-size: 15px; font-weight: 600; color: var(--tx); }
        .km-drop-sub { font-size: 12px; color: var(--mu); }
        .km-browse-btn { margin-top: 8px; display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.3); color: var(--vi); font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .km-browse-btn:hover { background: rgba(167,139,250,0.25); }
        .km-uploading { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--vi); font-size: 14px; }
        .km-progress-bar { width: 200px; height: 4px; background: rgba(167,139,250,0.2); border-radius: 2px; overflow: hidden; }
        .km-progress-fill { height: 100%; background: var(--vi); border-radius: 2px; transition: width 0.2s; }
        .km-doc-list { display: flex; flex-direction: column; gap: 6px; }
        .km-doc-card { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg1); border: 1px solid var(--bd); border-radius: 8px; }
        .km-doc-icon { color: var(--vi); flex-shrink: 0; }
        .km-doc-meta { flex: 1; min-width: 0; }
        .km-doc-name { font-size: 13px; font-weight: 600; color: var(--tx); display: block; truncate: true; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .km-doc-info { font-size: 11px; color: var(--mu); }
        .status-ready { color: var(--em); } .status-proc { color: var(--am); } .status-err { color: var(--ro); }
        .km-doc-remove { padding: 4px; background: none; border: none; cursor: pointer; color: var(--mu); border-radius: 4px; display: flex; align-items: center; }
        .km-doc-remove:hover { color: var(--ro); background: rgba(251,113,133,0.1); }
        .km-query-wrap { display: flex; align-items: center; gap: 10px; background: var(--bg1); border: 1px solid var(--bd); border-radius: 10px; padding: 4px 4px 4px 14px; }
        .km-query-icon { color: var(--mu); flex-shrink: 0; }
        .km-query-input { flex: 1; background: none; border: none; outline: none; color: var(--tx); font-size: 14px; padding: 8px 0; font-family: inherit; }
        .km-query-input::placeholder { color: var(--mu); }
        .km-query-input:disabled { opacity: 0.5; }
        .km-query-btn { width: 36px; height: 36px; border-radius: 8px; background: var(--vi); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; transition: opacity 0.2s; }
        .km-query-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .km-error { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(251,113,133,0.1); border: 1px solid rgba(251,113,133,0.3); border-radius: 8px; color: var(--ro); font-size: 13px; }
        .km-error button { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--ro); }
        .km-result { background: var(--bg1); border: 1px solid var(--bd); border-radius: 12px; overflow: hidden; }
        .km-result-answer { padding: 18px; }
        .km-result-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vi); margin-bottom: 10px; }
        .km-result-text { font-size: 14px; color: var(--tx); line-height: 1.7; }
        .km-sources { padding: 14px 18px; border-top: 1px solid var(--bd); display: flex; flex-direction: column; gap: 8px; }
        .km-sources-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mu); margin-bottom: 4px; }
        .km-source-chip { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; background: var(--bg2); border-radius: 6px; }
        .km-src-score { font-size: 11px; font-weight: 700; color: var(--em); flex-shrink: 0; padding-top: 1px; }
        .km-src-doc { font-size: 11px; color: var(--vi); flex-shrink: 0; padding-top: 1px; }
        .km-src-chunk { font-size: 12px; color: var(--di); line-height: 1.5; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
