"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload, FileText, Search, Trash2, Brain, ChevronRight,
  Database, Zap, BookOpen, AlertCircle, CheckCircle, Loader2, X, Plus,
  Layers, Code2, HelpCircle, Sparkles, BarChart2, ListChecks, Cpu,
  Copy, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import type { StructuredAnswer } from "@/app/api/embeddings/route";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doc {
  id:         string;
  name:       string;
  size:       number;
  chunks:     number;
  uploadedAt: string;
  status:     "processing" | "ready" | "error";
  blobUrl?:   string;
}

interface QAResult {
  answer:     string;
  structured: StructuredAnswer | null;
  sources:    { chunk: string; score: number; doc: string }[];
  searchMode: "semantic" | "keyword" | "no-docs";
}

// ─── localStorage helpers ────────────────────────────────────────────────────

const DOCS_KEY   = "axiom_km_docs";
const CHUNKS_KEY = "axiom_km_chunks";

function load<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; }
  catch { return fallback; }
}
const save = (key: string, val: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
};

// ─── Client-side text extraction ─────────────────────────────────────────────

function readFileAsText(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload  = e => res((e.target?.result as string) || "");
    reader.onerror = () => rej(new Error("FileReader failed"));
    reader.readAsText(file);
  });
}

async function extractText(file: File): Promise<string> {
  const n = file.name.toLowerCase();
  if (n.endsWith(".txt") || n.endsWith(".md")) return readFileAsText(file);
  if (n.endsWith(".pdf"))  return `[PDF: ${file.name}] — Convert to .txt/.md for full semantic search.`;
  if (n.endsWith(".docx")) return `[DOCX: ${file.name}] — Convert to .txt/.md for full semantic search.`;
  return `[${file.name}] — unsupported type.`;
}

// ─── Colour helpers ───────────────────────────────────────────────────────────

const CONCEPT_COLORS: Record<string, string> = {
  blue:   "#4f8ef7",
  green:  "#34d399",
  purple: "#a78bfa",
  orange: "#fb923c",
  pink:   "#f472b6",
  cyan:   "#22d3ee",
  red:    "#f87171",
};
const colorHex = (c?: string) => CONCEPT_COLORS[c ?? "blue"] ?? "#4f8ef7";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const col = confidence >= 0.7 ? "#34d399" : confidence >= 0.4 ? "#fbbf24" : "#f87171";
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:4,
      fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,
      background:`${col}18`,border:`1px solid ${col}40`,color:col,
    }}>
      <Cpu size={9}/>{pct}% match
    </span>
  );
}

function SearchModeBadge({ mode }: { mode: string }) {
  const isSemantic = mode === "semantic";
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:4,
      fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,
      background: isSemantic ? "rgba(79,142,247,0.12)" : "rgba(251,191,36,0.12)",
      border:     isSemantic ? "1px solid rgba(79,142,247,0.3)" : "1px solid rgba(251,191,36,0.3)",
      color:      isSemantic ? "#4f8ef7" : "#fbbf24",
    }}>
      <Sparkles size={9}/>
      {isSemantic ? "Semantic search" : "Keyword fallback"}
    </span>
  );
}

function KeyPointsCard({ points }: { points: string[] }) {
  return (
    <div className="km-card">
      <div className="km-card-header">
        <ListChecks size={14} style={{color:"#34d399"}}/>
        <span style={{color:"#34d399"}}>Key Points</span>
      </div>
      <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:6}}>
        {points.map((p, i) => (
          <li key={i} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            <div style={{
              width:18,height:18,borderRadius:"50%",flexShrink:0,marginTop:1,
              background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.3)",
              color:"#34d399",fontSize:9,fontWeight:800,
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>{i+1}</div>
            <span style={{fontSize:13,color:"var(--di)",lineHeight:1.6}}>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProcessFlowCard({ steps }: { steps: { step: number; title: string; detail: string }[] }) {
  return (
    <div className="km-card">
      <div className="km-card-header">
        <Layers size={14} style={{color:"#a78bfa"}}/>
        <span style={{color:"#a78bfa"}}>Process Flow</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {steps.map((s, i) => (
          <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
              <div style={{
                width:26,height:26,borderRadius:8,
                background:"rgba(167,139,250,0.15)",border:"1px solid rgba(167,139,250,0.35)",
                color:"#a78bfa",fontSize:11,fontWeight:800,
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>{s.step}</div>
              {i < steps.length - 1 && (
                <div style={{width:1,flex:1,minHeight:16,background:"rgba(167,139,250,0.2)",margin:"3px 0"}}/>
              )}
            </div>
            <div style={{paddingBottom:i < steps.length - 1 ? 10 : 0}}>
              <div style={{fontSize:13,fontWeight:700,color:"var(--tx)",marginBottom:2}}>{s.title}</div>
              <div style={{fontSize:12.5,color:"var(--di)",lineHeight:1.65}}>{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeSnippetCard({ snippets }: { snippets: { lang: string; title: string; code: string }[] }) {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div className="km-card">
      <div className="km-card-header">
        <Code2 size={14} style={{color:"#22d3ee"}}/>
        <span style={{color:"#22d3ee"}}>Code Examples</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {snippets.map((s, i) => (
          <div key={i} style={{borderRadius:8,overflow:"hidden",border:"1px solid rgba(34,211,238,0.15)"}}>
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"6px 12px",background:"rgba(34,211,238,0.06)",
              borderBottom:"1px solid rgba(34,211,238,0.12)",
            }}>
              <span style={{fontSize:11,fontWeight:600,color:"#22d3ee"}}>{s.title}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:10,color:"var(--mu)",fontFamily:"monospace"}}>{s.lang}</span>
                <button onClick={() => { navigator.clipboard.writeText(s.code); setCopied(i); setTimeout(()=>setCopied(null),1500); }}
                  style={{display:"flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:4,fontSize:10,
                    background:"rgba(34,211,238,0.1)",border:"1px solid rgba(34,211,238,0.25)",color:"#22d3ee",cursor:"pointer"}}>
                  <Copy size={9}/>{copied === i ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <pre style={{margin:0,padding:"12px 14px",fontSize:11.5,lineHeight:1.7,
              fontFamily:"'JetBrains Mono','Fira Code',Consolas,monospace",
              color:"var(--tx3)",background:"var(--bg2)",overflowX:"auto",whiteSpace:"pre"}}>
              {s.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function FollowUpCard({ questions, onAsk }: { questions: string[]; onAsk: (q: string) => void }) {
  return (
    <div className="km-card">
      <div className="km-card-header">
        <HelpCircle size={14} style={{color:"#fb923c"}}/>
        <span style={{color:"#fb923c"}}>Follow-up Questions</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {questions.map((q, i) => (
          <button key={i} onClick={() => onAsk(q)} style={{
            display:"flex",alignItems:"center",gap:8,padding:"9px 12px",
            borderRadius:8,cursor:"pointer",textAlign:"left",width:"100%",
            background:"rgba(251,146,60,0.05)",border:"1px solid rgba(251,146,60,0.15)",
            transition:"all 0.15s",fontFamily:"inherit",
          }}
            onMouseEnter={e=>(e.currentTarget.style.background="rgba(251,146,60,0.12)")}
            onMouseLeave={e=>(e.currentTarget.style.background="rgba(251,146,60,0.05)")}>
            <ChevronRight size={12} style={{color:"#fb923c",flexShrink:0}}/>
            <span style={{fontSize:12.5,color:"var(--di)",lineHeight:1.55}}>{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const [docs, setDocs]                         = useState<Doc[]>([]);
  const [uploading, setUploading]               = useState(false);
  const [uploadProgress, setUploadProgress]     = useState(0);
  const [uploadingName, setUploadingName]        = useState("");
  const [query, setQuery]                       = useState("");
  const [querying, setQuerying]                 = useState(false);
  const [result, setResult]                     = useState<QAResult | null>(null);
  const [error, setError]                       = useState<string | null>(null);
  const [dragOver, setDragOver]                 = useState(false);
  const [sourcesOpen, setSourcesOpen]           = useState(false);
  const [generatingNote, setGeneratingNote]     = useState(false);
  const [noteGenerated, setNoteGenerated]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDocs(load<Doc[]>(DOCS_KEY, [])); }, []);
  useEffect(() => { save(DOCS_KEY, docs); }, [docs]);

  const totalChunks = docs.reduce((a, d) => a + d.chunks, 0);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true); setError(null);

    for (const file of Array.from(files)) {
      setUploadingName(file.name); setUploadProgress(0);
      try {
        const text = await extractText(file);
        if (text.length > 3_500_000) throw new Error("File too large — split into smaller documents.");

        const prog = setInterval(() => setUploadProgress(p => Math.min(p + 12, 88)), 180);
        const res  = await fetch("/api/upload", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, text, fileSize: file.size }),
        });
        clearInterval(prog); setUploadProgress(100);

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        // Cache chunks in localStorage
        const stored = load<Record<string, string[]>>(CHUNKS_KEY, {});
        stored[data.id] = data.chunkTexts ?? [];
        save(CHUNKS_KEY, stored);

        setDocs(prev => {
          const deduped = prev.filter(d => d.name !== file.name);
          return [...deduped, {
            id: data.id, name: file.name, size: file.size,
            chunks: data.chunks ?? 0,
            uploadedAt: new Date().toISOString(),
            status: "ready",
            blobUrl: data.blobUrl,
          }];
        });
      } catch (err) {
        setError(`Failed to upload "${file.name}": ${err}`);
      }
    }
    setTimeout(() => { setUploading(false); setUploadProgress(0); setUploadingName(""); }, 600);
  }, []);

  // ── Query ─────────────────────────────────────────────────────────────────
  const handleQuery = async (q?: string) => {
    const qText = (q ?? query).trim();
    if (!qText) return;
    if (q) setQuery(q);
    setQuerying(true); setResult(null); setError(null); setNoteGenerated(null);

    try {
      const stored     = load<Record<string, string[]>>(CHUNKS_KEY, {});
      const allChunks: { content: string; doc: string }[] = [];
      for (const doc of docs) {
        (stored[doc.id] ?? []).forEach(c => allChunks.push({ content: c, doc: doc.name }));
      }

      const res = await fetch("/api/embeddings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ query: qText, chunks: allChunks }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (err) {
      setError(String(err));
    } finally {
      setQuerying(false);
    }
  };

  // ── Generate study note from current result ───────────────────────────────
  const handleGenerateNote = async () => {
    if (!result) return;
    setGeneratingNote(true); setNoteGenerated(null);
    try {
      const context = result.sources.map(s => s.chunk).join("\n\n");
      const res = await fetch("/api/notebook/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ topic: query, context, style: "comprehensive" }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNoteGenerated(data.title ?? "Note generated");
    } catch (err) {
      setError(`Study note generation failed: ${err}`);
    } finally {
      setGeneratingNote(false);
    }
  };

  const removeDoc = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    const stored = load<Record<string, string[]>>(CHUNKS_KEY, {});
    delete stored[id]; save(CHUNKS_KEY, stored);
    setResult(null);
  };

  const clearAll = () => {
    setDocs([]); localStorage.removeItem(DOCS_KEY); localStorage.removeItem(CHUNKS_KEY);
    setResult(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1024*1024)  return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1024/1024).toFixed(1)} MB`;
  };

  const structured = result?.structured;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="km-page">

      {/* ── Header ── */}
      <div className="km-header">
        <div className="km-title-row">
          <div className="km-icon-wrap"><Brain size={20}/></div>
          <div>
            <h1 className="km-title">Knowledge Mirror</h1>
            <p className="km-sub">Upload documents · Semantic search · AI-powered answers</p>
          </div>
        </div>
        <div className="km-stats">
          <div className="km-stat"><Database size={13}/><span>{docs.length} doc{docs.length!==1?"s":""}</span></div>
          <div className="km-stat"><BookOpen size={13}/><span>{totalChunks} chunks</span></div>
          <div className="km-stat"><Sparkles size={13}/><span>Gemini 2.5 Flash</span></div>
          <div className="km-stat"><Zap size={13}/><span>text-embedding-004</span></div>
        </div>
      </div>

      <div className="km-body">

        {/* ── Drop zone ── */}
        <div
          className={`km-dropzone ${dragOver ? "drag-over" : ""}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" hidden multiple accept=".pdf,.txt,.md,.docx"
            onChange={e => handleUpload(e.target.files)}/>
          {uploading ? (
            <div className="km-uploading">
              <Loader2 size={28} className="spin"/>
              <p className="km-uploading-name">Processing "{uploadingName}"…</p>
              <div className="km-progress-bar"><div className="km-progress-fill" style={{width:`${uploadProgress}%`}}/></div>
              <p className="km-uploading-hint">{uploadProgress}% — chunking &amp; saving to knowledge base</p>
            </div>
          ) : (
            <div className="km-drop-content">
              <Upload size={32} className="km-upload-icon"/>
              <p className="km-drop-title">Drop documents here</p>
              <p className="km-drop-sub"><strong>TXT · MD</strong> — full semantic search &nbsp;·&nbsp; <strong>PDF · DOCX</strong> — register metadata</p>
              <p className="km-drop-sub" style={{marginTop:2}}>Saved to Neon DB + Blob storage · Cached locally</p>
              <button className="km-browse-btn"><Plus size={14}/> Browse files</button>
            </div>
          )}
        </div>

        {/* ── Indexed docs ── */}
        {docs.length > 0 && (
          <div className="km-section">
            <div className="km-section-header">
              <h2 className="km-section-title">Indexed Documents</h2>
              <button className="km-clear-btn" onClick={clearAll}><Trash2 size={11}/> Clear all</button>
            </div>
            <div className="km-doc-list">
              {docs.map(doc => (
                <div key={doc.id} className="km-doc-card">
                  <div className="km-doc-icon"><FileText size={16}/></div>
                  <div className="km-doc-meta">
                    <span className="km-doc-name">{doc.name}</span>
                    <span className="km-doc-info">
                      {formatSize(doc.size)} · {doc.chunks} chunks
                      {doc.blobUrl ? " · 🟢 Blob" : " · 🟡 Local"}
                    </span>
                  </div>
                  <div className="km-doc-status">
                    {doc.status === "ready"      && <CheckCircle size={14} className="status-ready"/>}
                    {doc.status === "processing" && <Loader2 size={14} className="spin status-proc"/>}
                    {doc.status === "error"      && <AlertCircle size={14} className="status-err"/>}
                  </div>
                  {doc.blobUrl && (
                    <a href={doc.blobUrl} target="_blank" rel="noreferrer"
                      style={{display:"flex",alignItems:"center",padding:"4px",color:"var(--mu)",opacity:0.6}}
                      title="View in Blob storage">
                      <ExternalLink size={12}/>
                    </a>
                  )}
                  <button className="km-doc-remove" onClick={() => removeDoc(doc.id)}><Trash2 size={13}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Query ── */}
        <div className="km-section">
          <h2 className="km-section-title">Query Knowledge Base</h2>
          <div className="km-query-wrap">
            <Search size={16} className="km-query-icon"/>
            <input
              className="km-query-input"
              placeholder={docs.length === 0 ? "Upload documents first…" : "Ask anything about your documents…"}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleQuery()}
              disabled={docs.length === 0 || querying}
            />
            <button className="km-query-btn" onClick={() => handleQuery()} disabled={!query.trim() || docs.length === 0 || querying}>
              {querying ? <Loader2 size={16} className="spin"/> : <ChevronRight size={16}/>}
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="km-error">
            <AlertCircle size={16}/>
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={14}/></button>
          </div>
        )}

        {/* ── Result ── */}
        {result && (
          <div className="km-result-wrap">

            {/* Result meta bar */}
            <div className="km-result-meta">
              <Brain size={14} style={{color:"var(--vi)"}}/>
              <span style={{fontSize:12,fontWeight:700,color:"var(--vi)"}}>AI Answer</span>
              {result.structured?.confidence != null && (
                <ConfidenceBadge confidence={result.structured.confidence}/>
              )}
              {result.searchMode && <SearchModeBadge mode={result.searchMode}/>}
              {/* Generate Study Note */}
              <button
                className="km-gen-note-btn"
                onClick={handleGenerateNote}
                disabled={generatingNote}
                title="Generate a comprehensive study note from this query"
              >
                {generatingNote ? <Loader2 size={13} className="spin"/> : <Sparkles size={13}/>}
                {generatingNote ? "Generating…" : "Generate Study Note"}
              </button>
            </div>

            {/* Study note success toast */}
            {noteGenerated && (
              <div className="km-toast">
                <CheckCircle size={14} style={{color:"#34d399"}}/>
                <span>Study note "<strong>{noteGenerated}</strong>" saved to Notebook &amp; database</span>
                <button onClick={() => setNoteGenerated(null)}><X size={12}/></button>
              </div>
            )}

            {/* Main answer */}
            <div className="km-result-answer">
              <p className="km-result-text">{result.answer}</p>
            </div>

            {/* Structured sections */}
            {structured && (
              <div className="km-structured">

                {/* Key Points */}
                {structured.keyPoints?.length > 0 && (
                  <KeyPointsCard points={structured.keyPoints}/>
                )}

                {/* Process Flow */}
                {structured.processFlow?.length > 0 && (
                  <ProcessFlowCard steps={structured.processFlow}/>
                )}

                {/* Code Snippets */}
                {structured.codeSnippets?.length > 0 && (
                  <CodeSnippetCard snippets={structured.codeSnippets}/>
                )}

                {/* Follow-up Questions */}
                {structured.followUpQuestions?.length > 0 && (
                  <FollowUpCard questions={structured.followUpQuestions} onAsk={handleQuery}/>
                )}

              </div>
            )}

            {/* Sources (collapsible) */}
            {result.sources?.length > 0 && (
              <div className="km-sources">
                <button className="km-sources-toggle" onClick={() => setSourcesOpen(v => !v)}>
                  <BarChart2 size={13}/>
                  <span>Source Chunks ({result.sources.length})</span>
                  {sourcesOpen ? <ChevronUp size={12} style={{marginLeft:"auto"}}/> : <ChevronDown size={12} style={{marginLeft:"auto"}}/>}
                </button>
                {sourcesOpen && (
                  <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:10}}>
                    {result.sources.map((src, i) => (
                      <div key={i} className="km-source-chip">
                        <span className="km-src-score">{(src.score * 100).toFixed(0)}%</span>
                        <span className="km-src-doc">{src.doc}</span>
                        <span className="km-src-chunk">{src.chunk.slice(0, 160)}…</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      <style jsx>{`
        .km-page       { padding: 24px; max-width: 920px; margin: 0 auto; }
        .km-header     { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
        .km-title-row  { display: flex; align-items: center; gap: 12px; }
        .km-icon-wrap  { width: 40px; height: 40px; border-radius: 10px; background: rgba(167,139,250,0.15); border: 1px solid rgba(167,139,250,0.3); display: flex; align-items: center; justify-content: center; color: var(--vi); }
        .km-title      { font-size: 22px; font-weight: 700; color: var(--tx); margin: 0; }
        .km-sub        { font-size: 13px; color: var(--mu); margin-top: 2px; }
        .km-stats      { display: flex; gap: 7px; flex-wrap: wrap; }
        .km-stat       { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--di); background: var(--bg1); border: 1px solid var(--bd); padding: 5px 11px; border-radius: 6px; }
        .km-body       { display: flex; flex-direction: column; gap: 20px; }
        .km-section    { }
        .km-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .km-section-title  { font-size: 11px; font-weight: 700; color: var(--vi); text-transform: uppercase; letter-spacing: 0.09em; margin: 0; }
        .km-clear-btn  { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--mu); background: none; border: none; cursor: pointer; padding: 3px 6px; border-radius: 5px; font-family: inherit; }
        .km-clear-btn:hover { color: var(--ro); }

        /* Drop zone */
        .km-dropzone   { border: 2px dashed var(--bd); border-radius: 12px; padding: 36px 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--bg1); }
        .km-dropzone:hover, .km-dropzone.drag-over { border-color: var(--vi); background: rgba(167,139,250,0.06); }
        .km-drop-content { display: flex; flex-direction: column; align-items: center; gap: 7px; }
        .km-upload-icon  { color: var(--vi); opacity: 0.6; }
        .km-drop-title   { font-size: 16px; font-weight: 600; color: var(--tx); margin: 0; }
        .km-drop-sub     { font-size: 13px; color: var(--mu); line-height: 1.5; margin: 0; }
        .km-browse-btn   { margin-top: 8px; display: flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 8px; background: rgba(167,139,250,0.12); border: 1px solid rgba(167,139,250,0.3); color: var(--vi); font-size: 13px; cursor: pointer; font-family: inherit; }
        .km-browse-btn:hover { background: rgba(167,139,250,0.22); }

        /* Upload progress */
        .km-uploading       { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--vi); }
        .km-uploading-name  { font-size: 14px; font-weight: 600; color: var(--tx); max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin: 0; }
        .km-uploading-hint  { font-size: 12px; color: var(--mu); margin: 0; }
        .km-progress-bar    { width: 220px; height: 5px; background: rgba(167,139,250,0.15); border-radius: 3px; overflow: hidden; }
        .km-progress-fill   { height: 100%; background: var(--vi); border-radius: 3px; transition: width 0.2s; }

        /* Doc list */
        .km-doc-list  { display: flex; flex-direction: column; gap: 6px; }
        .km-doc-card  { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg1); border: 1px solid var(--bd); border-radius: 8px; }
        .km-doc-icon  { color: var(--vi); flex-shrink: 0; }
        .km-doc-meta  { flex: 1; min-width: 0; }
        .km-doc-name  { font-size: 13.5px; font-weight: 600; color: var(--tx); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .km-doc-info  { font-size: 11.5px; color: var(--mu); }
        .status-ready { color: var(--em); } .status-proc { color: var(--am); } .status-err { color: var(--ro); }
        .km-doc-remove { padding: 5px; background: none; border: none; cursor: pointer; color: var(--mu); border-radius: 5px; display: flex; align-items: center; }
        .km-doc-remove:hover { color: var(--ro); }

        /* Query */
        .km-query-wrap  { display: flex; align-items: center; gap: 10px; background: var(--bg1); border: 1px solid var(--bd); border-radius: 10px; padding: 4px 4px 4px 14px; }
        .km-query-icon  { color: var(--mu); flex-shrink: 0; }
        .km-query-input { flex: 1; background: none; border: none; outline: none; color: var(--tx); font-size: 14px; padding: 8px 0; font-family: inherit; }
        .km-query-input::placeholder { color: var(--mu); }
        .km-query-input:disabled { opacity: 0.5; }
        .km-query-btn   { width: 38px; height: 38px; border-radius: 8px; background: var(--vi); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
        .km-query-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Error */
        .km-error { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(251,113,133,0.1); border: 1px solid rgba(251,113,133,0.3); border-radius: 8px; color: var(--ro); font-size: 13px; }
        .km-error button { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--ro); display: flex; align-items: center; }

        /* Result */
        .km-result-wrap   { background: var(--bg1); border: 1px solid var(--bd); border-radius: 12px; overflow: hidden; }
        .km-result-meta   { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 12px 16px; border-bottom: 1px solid var(--bd); background: var(--bg2); }
        .km-gen-note-btn  { display: flex; align-items: center; gap: 5px; margin-left: auto; padding: 5px 12px; border-radius: 7px; background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.3); color: var(--vi); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .km-gen-note-btn:hover:not(:disabled) { background: rgba(167,139,250,0.2); }
        .km-gen-note-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Toast */
        .km-toast { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: rgba(52,211,153,0.08); border-bottom: 1px solid rgba(52,211,153,0.2); font-size: 13px; color: var(--di); }
        .km-toast button { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--mu); display: flex; }

        .km-result-answer { padding: 18px; }
        .km-result-text   { font-size: 14px; color: var(--tx); line-height: 1.8; white-space: pre-wrap; margin: 0; }

        /* Structured cards */
        .km-structured { display: flex; flex-direction: column; gap: 1px; border-top: 1px solid var(--bd); }
        .km-card        { padding: 16px 18px; border-top: 1px solid var(--bd); }
        .km-card-header { display: flex; align-items: center; gap: 7px; margin-bottom: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }

        /* Sources */
        .km-sources        { border-top: 1px solid var(--bd); }
        .km-sources-toggle { display: flex; align-items: center; gap: 7px; width: 100%; padding: 11px 18px; background: none; border: none; cursor: pointer; font-size: 11.5px; font-weight: 600; color: var(--mu); font-family: inherit; }
        .km-sources-toggle:hover { color: var(--di); background: rgba(255,255,255,0.02); }
        .km-source-chip    { display: flex; align-items: flex-start; gap: 8px; padding: 9px 11px; margin: 0 18px; background: var(--bg2); border-radius: 7px; }
        .km-src-score      { font-size: 11px; font-weight: 700; color: var(--em); flex-shrink: 0; padding-top: 1px; min-width: 32px; }
        .km-src-doc        { font-size: 11px; color: var(--vi); flex-shrink: 0; padding-top: 1px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .km-src-chunk      { font-size: 12px; color: var(--di); line-height: 1.55; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
