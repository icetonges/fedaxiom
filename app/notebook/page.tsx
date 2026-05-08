"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ReactElement } from "react";
import {
  Plus, Mic, MicOff, Trash2, FileAudio, Brain,
  Hash, Calendar, Loader2, X, Edit3,
  Search, Download, Eye, Code2, BookOpen, ChevronRight,
  FileText, AlignLeft, Clock, Sparkles, Database, AlertCircle,
  ChevronDown, ChevronUp, Lightbulb, BarChart2,
  Layers, HelpCircle, Map, Copy, Check, ListChecks,
} from "lucide-react";
import type { GeneratedNote, GeneratedSection } from "@/app/api/notebook/generate/route";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Note {
  id:           string;
  title:        string;
  content:      string;
  tags:         string[];
  audioUrl?:    string;
  audioDuration?: number;
  aiSummary?:   string;
  generated?:   boolean;
  generatedData?: GeneratedNote;
  dbId?:        string;
  createdAt:    string;
  updatedAt:    string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATES: { icon: string; label: string; title: string; content: string; tags: string[] }[] = [
  {
    icon: "💡", label: "Idea Capture", title: "New Idea",
    content: `## Core Idea\n\n\n## Why It Matters\n\n\n## Next Steps\n- [ ] \n- [ ] \n- [ ] `,
    tags: ["idea"],
  },
  {
    icon: "📖", label: "Study Notes", title: "Study: ",
    content: `## Topic Overview\n\n\n## Key Concepts\n\n\n## Questions to Explore\n\n\n## Resources\n- `,
    tags: ["study", "learning"],
  },
  {
    icon: "🤖", label: "AI Research", title: "AI Research: ",
    content: `## Research Question\n\n\n## Findings\n\n\n## Model / Tool Used\n\n\n## Evaluation\n**Strengths:** \n**Limitations:** \n\n## References\n- `,
    tags: ["ai", "research"],
  },
  {
    icon: "📋", label: "Meeting Notes", title: "Meeting: ",
    content: `## Date & Attendees\n**Date:** ${new Date().toLocaleDateString()}\n**Attendees:** \n\n## Agenda\n\n\n## Key Decisions\n\n\n## Action Items\n- [ ] `,
    tags: ["meeting"],
  },
];

const STORAGE_KEY = "axiom_notebook_notes";

const CONCEPT_HEX: Record<string, string> = {
  blue: "#4f8ef7", green: "#34d399", purple: "#a78bfa",
  orange: "#fb923c", pink: "#f472b6", cyan: "#22d3ee", red: "#f87171",
};
const cx = (c?: string) => CONCEPT_HEX[c ?? "blue"] ?? "#4f8ef7";

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Note[];
  } catch { /* ignore */ }
  return [{
    id: "demo-1",
    title: "AXIOM Architecture Notes",
    content: `## Platform Overview\n\nThe AXIOM platform combines multiple AI models via a unified API layer.\n\n- **Gemini** handles multimodal reasoning\n- **Groq** accelerates inference at 800+ tokens/sec\n- **pgvector** enables semantic retrieval across the knowledge base\n\nThe ReAct agent loop enables tool use with explicit reasoning traces.\n\n## Key Insight\n\nStreaming responses + topological BFS execution order = real-time pipeline visualization.`,
    tags: ["architecture", "ai", "axiom"],
    aiSummary: "Platform architecture overview covering AI model integration and infrastructure.",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  }];
}

function saveNotes(notes: Note[]) {
  try {
    const clean = notes.map(n => ({ ...n, audioUrl: undefined, generatedData: undefined }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch { /* storage full */ }
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

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

// ─── Generated Note Renderer ──────────────────────────────────────────────────

function SummarySection({ content }: { content: { summary: string; keyPoints: string[] } }) {
  return (
    <div className="gs-section">
      <div className="gs-section-title" style={{color:"#4f8ef7"}}><ListChecks size={14}/> Executive Summary</div>
      <p style={{fontSize:14,color:"var(--di)",lineHeight:1.8,margin:"0 0 14px"}}>{content.summary}</p>
      {content.keyPoints?.length > 0 && (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {content.keyPoints.map((p, i) => (
            <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
              <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,
                background:"rgba(79,142,247,0.15)",border:"1px solid rgba(79,142,247,0.3)",
                color:"#4f8ef7",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",marginTop:1}}>
                {i+1}
              </div>
              <span style={{fontSize:13,color:"var(--di)",lineHeight:1.65}}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConceptsSection({ content }: { content: { term: string; definition: string; example?: string; color?: string }[] }) {
  return (
    <div className="gs-section">
      <div className="gs-section-title" style={{color:"#a78bfa"}}><Lightbulb size={14}/> Key Concepts</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
        {content.map((c, i) => {
          const col = cx(c.color);
          return (
            <div key={i} style={{borderRadius:9,background:`${col}08`,border:`1px solid ${col}25`,padding:"12px 14px"}}>
              <div style={{fontSize:13,fontWeight:700,color:col,marginBottom:5}}>{c.term}</div>
              <p style={{fontSize:12.5,color:"var(--di)",lineHeight:1.65,margin:"0 0 6px"}}>{c.definition}</p>
              {c.example && (
                <div style={{fontSize:11.5,color:"var(--mu)",fontStyle:"italic",borderTop:`1px solid ${col}18`,paddingTop:6}}>
                  <em>e.g. {c.example}</em>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProcessFlowSection({ content }: { content: { step: number; icon: string; title: string; detail: string; note?: string }[] }) {
  return (
    <div className="gs-section">
      <div className="gs-section-title" style={{color:"#34d399"}}><Layers size={14}/> Process Flow</div>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {content.map((s, i) => (
          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flexShrink:0}}>
              <div style={{
                width:36,height:36,borderRadius:10,
                background:"rgba(52,211,153,0.15)",border:"1px solid rgba(52,211,153,0.35)",
                fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",
              }}>{s.icon}</div>
              {i < content.length - 1 && (
                <div style={{width:2,flex:1,minHeight:20,background:"rgba(52,211,153,0.2)",margin:"4px 0"}}/>
              )}
            </div>
            <div style={{paddingBottom: i < content.length - 1 ? 14 : 0, flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                <span style={{fontSize:10,fontWeight:800,color:"rgba(52,211,153,0.7)",letterSpacing:"0.06em"}}>STEP {s.step}</span>
                <span style={{fontSize:14,fontWeight:700,color:"var(--tx)"}}>{s.title}</span>
              </div>
              <p style={{fontSize:13,color:"var(--di)",lineHeight:1.68,margin:"0 0 4px"}}>{s.detail}</p>
              {s.note && (
                <div style={{display:"flex",gap:6,alignItems:"flex-start",padding:"7px 10px",borderRadius:6,
                  background:"rgba(251,191,36,0.07)",border:"1px solid rgba(251,191,36,0.2)",marginTop:5}}>
                  <span style={{fontSize:12,flexShrink:0}}>💡</span>
                  <span style={{fontSize:12,color:"#d4b04a",lineHeight:1.6}}>{s.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSection({ content }: { content: { label: string; value: string; desc: string; color?: string }[] }) {
  return (
    <div className="gs-section">
      <div className="gs-section-title" style={{color:"#fb923c"}}><BarChart2 size={14}/> Metrics &amp; Facts</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10}}>
        {content.map((d, i) => {
          const col = cx(d.color);
          return (
            <div key={i} style={{padding:"14px 16px",borderRadius:10,background:"var(--bg2)",border:`1px solid ${col}20`,textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:col,marginBottom:4}}>{d.value}</div>
              <div style={{fontSize:12,fontWeight:700,color:"var(--tx)",marginBottom:3}}>{d.label}</div>
              <div style={{fontSize:11,color:"var(--mu)",lineHeight:1.5}}>{d.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CodeExamplesSection({ content }: { content: { title: string; lang: string; code: string; explanation?: string }[] }) {
  const [copied, setCopied] = useState<number | null>(null);
  return (
    <div className="gs-section">
      <div className="gs-section-title" style={{color:"#22d3ee"}}><Code2 size={14}/> Code Examples</div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {content.map((ex, i) => (
          <div key={i} style={{borderRadius:9,overflow:"hidden",border:"1px solid rgba(34,211,238,0.18)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",
              background:"rgba(34,211,238,0.06)",borderBottom:"1px solid rgba(34,211,238,0.14)"}}>
              <div>
                <span style={{fontSize:12,fontWeight:700,color:"#22d3ee"}}>{ex.title}</span>
                {ex.explanation && <p style={{fontSize:11,color:"var(--mu)",margin:"2px 0 0",lineHeight:1.4}}>{ex.explanation}</p>}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(ex.code); setCopied(i); setTimeout(()=>setCopied(null),1500); }}
                style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:5,fontSize:10,
                  background:"rgba(34,211,238,0.1)",border:"1px solid rgba(34,211,238,0.25)",color:"#22d3ee",cursor:"pointer"}}>
                {copied === i ? <Check size={9}/> : <Copy size={9}/>}
                {copied === i ? "Copied" : "Copy"}
              </button>
            </div>
            <pre style={{margin:0,padding:"14px 16px",fontSize:12,lineHeight:1.75,
              fontFamily:"'JetBrains Mono','Fira Code',Consolas,monospace",
              color:"var(--tx3)",background:"var(--bg2)",overflowX:"auto",whiteSpace:"pre"}}>
              {ex.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function MindMapSection({ content }: { content: { root: string; branches: { label: string; children: string[] }[] } }) {
  return (
    <div className="gs-section">
      <div className="gs-section-title" style={{color:"#fbbf24"}}><Map size={14}/> Mind Map</div>
      <div style={{borderRadius:9,background:"var(--bg2)",border:"1px solid var(--bd)",padding:"16px 18px",
        fontFamily:"'JetBrains Mono','Fira Code',Consolas,monospace",fontSize:12,lineHeight:1.9}}>
        <div style={{fontWeight:800,color:"#fbbf24",marginBottom:6}}>📍 {content.root}</div>
        {content.branches?.map((b, bi) => (
          <div key={bi} style={{marginBottom:4}}>
            <div style={{color:"var(--tx)",fontWeight:600}}>
              {bi === content.branches.length - 1 ? "└──" : "├──"}
              <span style={{marginLeft:6,color:"#a78bfa"}}>{b.label}</span>
            </div>
            {b.children?.map((ch, ci) => (
              <div key={ci} style={{color:"var(--di)",paddingLeft:20}}>
                {bi === content.branches.length - 1 ? "   " : "│  "}
                {ci === b.children.length - 1 ? "└──" : "├──"}
                <span style={{marginLeft:6}}>{ch}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizSection({ content }: { content: { question: string; answer: string; hint?: string }[] }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setRevealed(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  return (
    <div className="gs-section">
      <div className="gs-section-title" style={{color:"#f472b6"}}><HelpCircle size={14}/> Quiz — Test Yourself</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {content.map((q, i) => (
          <div key={i} style={{borderRadius:9,background:"var(--bg2)",border:"1px solid var(--bd)",overflow:"hidden"}}>
            <button onClick={() => toggle(i)} style={{
              display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",width:"100%",
              textAlign:"left",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",
            }}>
              <span style={{width:22,height:22,borderRadius:7,flexShrink:0,
                background:"rgba(244,114,182,0.15)",border:"1px solid rgba(244,114,182,0.35)",
                color:"#f472b6",fontSize:11,fontWeight:800,
                display:"flex",alignItems:"center",justifyContent:"center"}}>Q{i+1}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--tx)",lineHeight:1.55}}>{q.question}</div>
                {q.hint && !revealed.has(i) && (
                  <div style={{fontSize:11.5,color:"var(--mu)",marginTop:3,fontStyle:"italic"}}>Hint: {q.hint}</div>
                )}
              </div>
              <span style={{color:"var(--mu)",flexShrink:0,marginTop:2}}>
                {revealed.has(i) ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </span>
            </button>
            {revealed.has(i) && (
              <div style={{padding:"10px 14px 14px 46px",borderTop:"1px solid var(--bd)",
                background:"rgba(244,114,182,0.04)"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#f472b6",letterSpacing:"0.07em",marginBottom:5}}>ANSWER</div>
                <p style={{fontSize:13,color:"var(--di)",lineHeight:1.7,margin:0}}>{q.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RelatedTopicsSection({ content }: { content: string[] }) {
  return (
    <div className="gs-section">
      <div className="gs-section-title" style={{color:"#34d399"}}><ChevronRight size={14}/> Related Topics</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {content.map((t, i) => (
          <span key={i} style={{fontSize:12,fontWeight:600,padding:"5px 12px",borderRadius:20,
            background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)",color:"#34d399"}}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function GeneratedNoteView({ data }: { data: GeneratedNote }) {
  const sectionRenderers: Record<string, (content: unknown) => ReactElement | null> = {
    summary:      c => <SummarySection content={c as never}/>,
    concepts:     c => <ConceptsSection content={c as never}/>,
    processFlow:  c => <ProcessFlowSection content={c as never}/>,
    dashboard:    c => <DashboardSection content={c as never}/>,
    codeExamples: c => <CodeExamplesSection content={c as never}/>,
    mindMap:      c => <MindMapSection content={c as never}/>,
    quiz:         c => <QuizSection content={c as never}/>,
    relatedTopics:c => <RelatedTopicsSection content={c as never}/>,
  };

  return (
    <div style={{padding:"0 24px 24px"}}>
      {/* Note header */}
      <div style={{padding:"16px 0 12px",borderBottom:"1px solid var(--bd)",marginBottom:4}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
          <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,
            background:"rgba(232,121,249,0.12)",border:"1px solid rgba(232,121,249,0.3)",color:"#e879f9"}}>
            🤖 AI GENERATED
          </span>
          {data.noteId && (
            <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,
              background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",color:"#34d399"}}>
              <Database size={9} style={{display:"inline",marginRight:3}}/>Saved to DB
            </span>
          )}
        </div>
        <h2 style={{fontSize:18,fontWeight:800,color:"var(--tx)",margin:"0 0 4px"}}>{data.title}</h2>
        <p style={{fontSize:13,color:"var(--mu)",margin:0,fontStyle:"italic"}}>{data.subtitle}</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
          {data.tags.map(t => (
            <span key={t} style={{fontSize:11,padding:"2px 8px",borderRadius:12,
              background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",color:"var(--vi)"}}>
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* All sections */}
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {data.sections.map((section: GeneratedSection) => {
          const renderer = sectionRenderers[section.type];
          return renderer ? renderer(section.content) : null;
        })}
      </div>
    </div>
  );
}

// ─── Generate Panel ───────────────────────────────────────────────────────────

function GeneratePanel({
  onGenerate, generating,
}: {
  onGenerate: (topic: string, context: string, style: string) => void;
  generating: boolean;
}) {
  const [topic,   setTopic]   = useState("");
  const [context, setContext] = useState("");
  const [style,   setStyle]   = useState("comprehensive");
  const [open,    setOpen]    = useState(false);

  const styles = [
    { id: "comprehensive", label: "Comprehensive", desc: "Full detail — all sections" },
    { id: "quick",         label: "Quick",         desc: "Concise overview" },
    { id: "visual",        label: "Visual",        desc: "Emphasise diagrams & flow" },
  ];

  return (
    <div style={{borderBottom:"1px solid var(--bd)",flexShrink:0}}>
      <button onClick={() => setOpen(v => !v)} style={{
        display:"flex",alignItems:"center",gap:7,width:"100%",padding:"11px 14px",
        background:"rgba(232,121,249,0.04)",border:"none",cursor:"pointer",
        fontFamily:"inherit",fontWeight:600,fontSize:12.5,color:"#e879f9",
      }}>
        <Sparkles size={14}/>
        Generate Study Note
        {open ? <ChevronUp size={13} style={{marginLeft:"auto"}}/> : <ChevronDown size={13} style={{marginLeft:"auto"}}/>}
      </button>

      {open && (
        <div style={{padding:"0 14px 14px",background:"rgba(232,121,249,0.02)"}}>
          {/* Topic */}
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:700,color:"var(--mu)",display:"block",marginBottom:5,letterSpacing:"0.07em"}}>
              TOPIC
            </label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. ReAct Agent Loop, RAG architecture, LLM fine-tuning…"
              style={{width:"100%",background:"var(--bg2)",border:"1px solid var(--bd)",borderRadius:7,
                padding:"8px 11px",fontSize:13,color:"var(--tx)",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
            />
          </div>

          {/* Context (optional) */}
          <div style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:700,color:"var(--mu)",display:"block",marginBottom:5,letterSpacing:"0.07em"}}>
              CONTEXT <span style={{fontWeight:400,textTransform:"none"}}>(optional — paste your notes or source text)</span>
            </label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              rows={3}
              placeholder="Paste document excerpts, existing notes, or leave blank for general AI knowledge…"
              style={{width:"100%",background:"var(--bg2)",border:"1px solid var(--bd)",borderRadius:7,
                padding:"8px 11px",fontSize:12.5,color:"var(--tx)",outline:"none",fontFamily:"inherit",
                resize:"vertical",lineHeight:1.6,boxSizing:"border-box"}}
            />
          </div>

          {/* Style */}
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {styles.map(s => (
              <button key={s.id} onClick={() => setStyle(s.id)} style={{
                flex:1,padding:"6px 8px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",
                background: style===s.id ? "rgba(232,121,249,0.15)" : "var(--bg2)",
                border:     style===s.id ? "1px solid rgba(232,121,249,0.4)" : "1px solid var(--bd)",
                color:      style===s.id ? "#e879f9" : "var(--di)",
              }}>
                <div style={{fontSize:11.5,fontWeight:700}}>{s.label}</div>
                <div style={{fontSize:10,opacity:0.7,marginTop:1}}>{s.desc}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => topic.trim() && onGenerate(topic.trim(), context.trim(), style)}
            disabled={!topic.trim() || generating}
            style={{
              display:"flex",alignItems:"center",justifyContent:"center",gap:7,
              width:"100%",padding:"9px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",
              fontWeight:700,fontSize:13,
              background: generating ? "rgba(232,121,249,0.08)" : "rgba(232,121,249,0.12)",
              border:"1px solid rgba(232,121,249,0.35)",color:"#e879f9",
              opacity: !topic.trim() ? 0.45 : 1,
            }}>
            {generating ? <Loader2 size={14} className="spin"/> : <Sparkles size={14}/>}
            {generating ? "Generating comprehensive note…" : "Generate Study Note"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotebookPage() {
  const [notes, setNotes]                     = useState<Note[]>([]);
  const [activeId, setActiveId]               = useState<string>("");
  const [recording, setRecording]             = useState(false);
  const [recordSeconds, setRecordSeconds]     = useState(0);
  const [summarizing, setSummarizing]         = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [newTag, setNewTag]                   = useState("");
  const [editingTitle, setEditingTitle]       = useState(false);
  const [previewMode, setPreviewMode]         = useState(false);
  const [searchQuery, setSearchQuery]         = useState("");
  const [showTemplates, setShowTemplates]     = useState(false);
  const [showSearch, setShowSearch]           = useState(false);
  const [generating, setGenerating]           = useState(false);
  const [genError, setGenError]               = useState<string | null>(null);

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadNotes();
    setNotes(loaded);
    setActiveId(loaded[0]?.id || "");
  }, []);

  useEffect(() => { if (notes.length > 0) saveNotes(notes); }, [notes]);

  const activeNote = notes.find(n => n.id === activeId);
  const wordCount  = activeNote ? activeNote.content.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const filteredNotes = searchQuery.trim()
    ? notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : notes;

  const createFromTemplate = (tpl: typeof TEMPLATES[0]) => {
    const note: Note = {
      id: crypto.randomUUID(), title: tpl.title, content: tpl.content,
      tags: tpl.tags, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]); setActiveId(note.id); setShowTemplates(false);
  };

  const createNote = () => {
    const note: Note = {
      id: crypto.randomUUID(), title: "Untitled Note", content: "",
      tags: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]); setActiveId(note.id); setShowTemplates(false);
    setTimeout(() => setEditingTitle(true), 60);
  };

  const updateNote = useCallback((id: string, patch: Partial<Note>) => {
    setNotes(prev =>
      prev.map(n => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)
    );
  }, []);

  const deleteNote = (id: string) => {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      if (activeId === id) setActiveId(next[0]?.id || "");
      return next;
    });
  };

  const exportNote = () => {
    if (!activeNote) return;
    const content = activeNote.generated && activeNote.generatedData
      ? activeNote.generatedData.markdown
      : `# ${activeNote.title}\n\n_Tags: ${activeNote.tags.join(", ")}_\n\n---\n\n${activeNote.content}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${activeNote.title.replace(/[^a-z0-9]/gi, "_")}.md`;
    a.click(); URL.revokeObjectURL(url);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        updateNote(activeId, { audioUrl: URL.createObjectURL(blob), audioDuration: recordSeconds });
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(); mediaRef.current = mr; setRecording(true); setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch { alert("Microphone permission denied"); }
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Summarize this note in 1-2 concise sentences, extracting the key insight:\n\n${activeNote.content}` }],
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
          for (const line of decoder.decode(value).split("\n")) {
            if (line.startsWith("0:")) { try { summary += JSON.parse(line.slice(2)); } catch { /* skip */ } }
          }
        }
        updateNote(activeId, { aiSummary: summary.trim() || "Summary generated." });
      }
    } catch {
      updateNote(activeId, { aiSummary: "Summary unavailable — check API connection." });
    } finally { setSummarizing(false); }
  };

  // ── Generate Study Note ────────────────────────────────────────────────────
  const handleGenerate = async (topic: string, context: string, style: string) => {
    setGenerating(true); setGenError(null);
    try {
      const res = await fetch("/api/notebook/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, context, style }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: GeneratedNote = await res.json();

      // Create a new note with the generated data
      const note: Note = {
        id:            crypto.randomUUID(),
        title:         data.title,
        content:       data.markdown,   // Markdown for export/edit
        tags:          data.tags,
        generated:     true,
        generatedData: data,
        dbId:          data.noteId ?? undefined,
        createdAt:     new Date().toISOString(),
        updatedAt:     new Date().toISOString(),
      };
      setNotes(prev => [note, ...prev]);
      setActiveId(note.id);
      setPreviewMode(false); // will show GeneratedNoteView instead
    } catch (err) {
      setGenError(String(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true); saveNotes(notes);
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
  };

  const addTag = () => {
    if (!newTag.trim() || !activeNote) return;
    const tag = newTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!activeNote.tags.includes(tag)) updateNote(activeId, { tags: [...activeNote.tags, tag] });
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    if (!activeNote) return;
    updateNote(activeId, { tags: activeNote.tags.filter(t => t !== tag) });
  };

  const formatTime = (s: number) =>
    `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });

  useEffect(() => {
    if (activeNote && textareaRef.current && !previewMode && !activeNote.generated) {
      textareaRef.current.focus();
    }
  }, [activeId, previewMode, activeNote]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) titleInputRef.current.select();
  }, [editingTitle]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="nb-page">

      {/* ── Sidebar ── */}
      <div className="nb-sidebar">
        <div className="nb-sidebar-top">
          <div className="nb-sidebar-title-row">
            <BookOpen size={15} style={{color:"var(--cy)"}}/>
            <h2 className="nb-sidebar-title">Notebook</h2>
          </div>
          <div className="nb-sidebar-actions">
            <button className="nb-icon-btn" onClick={() => setShowSearch(v => !v)} title="Search"
              style={{color: showSearch ? "var(--cy)" : undefined}}><Search size={14}/></button>
            <button className="nb-icon-btn" onClick={() => setShowTemplates(v => !v)} title="Templates"
              style={{color: showTemplates ? "var(--vi)" : undefined}}><BookOpen size={14}/></button>
            <button className="nb-new-btn" onClick={createNote} title="New blank note"><Plus size={15}/></button>
          </div>
        </div>

        {showSearch && (
          <div className="nb-search-wrap">
            <Search size={13} className="nb-search-icon"/>
            <input className="nb-search-input" placeholder="Search notes…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} autoFocus/>
            {searchQuery && <button className="nb-search-clear" onClick={() => setSearchQuery("")}><X size={12}/></button>}
          </div>
        )}

        {showTemplates && (
          <div className="nb-templates">
            <div className="nb-templates-label">Quick Templates</div>
            {TEMPLATES.map(tpl => (
              <button key={tpl.label} className="nb-tpl-item" onClick={() => createFromTemplate(tpl)}>
                <span className="nb-tpl-icon">{tpl.icon}</span>
                <span className="nb-tpl-label">{tpl.label}</span>
                <ChevronRight size={11} style={{color:"var(--mu)",marginLeft:"auto"}}/>
              </button>
            ))}
            <div style={{borderTop:"1px solid var(--bd)",marginTop:6,paddingTop:6}}>
              <button className="nb-tpl-item" onClick={createNote}>
                <span className="nb-tpl-icon"><FileText size={13}/></span>
                <span className="nb-tpl-label">Blank note</span>
                <ChevronRight size={11} style={{color:"var(--mu)",marginLeft:"auto"}}/>
              </button>
            </div>
          </div>
        )}

        {/* Generate panel in sidebar */}
        <GeneratePanel onGenerate={handleGenerate} generating={generating}/>

        {genError && (
          <div style={{padding:"8px 12px",background:"rgba(251,113,133,0.08)",
            borderBottom:"1px solid rgba(251,113,133,0.2)",display:"flex",gap:7,alignItems:"center",
            fontSize:11.5,color:"var(--ro)"}}>
            <AlertCircle size={12} style={{flexShrink:0}}/>
            <span style={{flex:1}}>{genError}</span>
            <button onClick={() => setGenError(null)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--mu)"}}>
              <X size={11}/>
            </button>
          </div>
        )}

        <div className="nb-note-list">
          {filteredNotes.length === 0 && (
            <div className="nb-no-notes">{searchQuery ? "No matching notes" : "No notes yet"}</div>
          )}
          {filteredNotes.map(note => (
            <button key={note.id}
              className={`nb-note-item ${note.id === activeId ? "active" : ""}`}
              onClick={() => { setActiveId(note.id); setShowTemplates(false); }}>
              <div className="nb-note-item-title">
                {note.generated && <span style={{fontSize:9,marginRight:4}}>🤖</span>}
                {note.title}
              </div>
              <div className="nb-note-item-meta">
                <span>{formatDate(note.updatedAt)}</span>
                {note.audioUrl && <FileAudio size={10} style={{marginLeft:4,flexShrink:0}}/>}
                {note.aiSummary && <Brain size={10} style={{marginLeft:3,color:"var(--vi)",flexShrink:0}}/>}
                {note.dbId && <Database size={10} style={{marginLeft:3,color:"var(--em)",flexShrink:0}}/>}
              </div>
              {note.tags.length > 0 && (
                <div className="nb-note-item-tags">
                  {note.tags.slice(0,3).map(t => <span key={t} className="nb-note-tag-mini">{t}</span>)}
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="nb-sidebar-footer">
          <span>{notes.length} note{notes.length!==1?"s":""}</span>
          <span>{notes.filter(n=>n.generated).length} AI generated</span>
          <span>{notes.reduce((a,n)=>a+n.tags.length,0)} tags</span>
        </div>
      </div>

      {/* ── Editor / Viewer ── */}
      {activeNote ? (
        <div className="nb-editor">

          {/* Toolbar */}
          <div className="nb-toolbar">
            <div className="nb-toolbar-left">
              {editingTitle ? (
                <input ref={titleInputRef} className="nb-title-input"
                  value={activeNote.title}
                  onChange={e => updateNote(activeId, { title: e.target.value })}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={e => e.key === "Enter" && setEditingTitle(false)}/>
              ) : (
                <h1 className="nb-title" onClick={() => setEditingTitle(true)}>
                  {activeNote.generated && <span style={{marginRight:6}}>🤖</span>}
                  {activeNote.title}
                  <Edit3 size={12} className="nb-edit-icon"/>
                </h1>
              )}
              <div className="nb-meta-row">
                <Calendar size={11}/><span>{formatDate(activeNote.updatedAt)}</span>
                <span className="nb-dot">·</span>
                <AlignLeft size={11}/><span>{wordCount} words</span>
                <span className="nb-dot">·</span>
                <Clock size={11}/><span>{readingTime} min read</span>
                {activeNote.dbId && (
                  <>
                    <span className="nb-dot">·</span>
                    <Database size={11} style={{color:"var(--em)"}}/>
                    <span style={{color:"var(--em)"}}>Saved to DB</span>
                  </>
                )}
              </div>
            </div>
            <div className="nb-toolbar-actions">
              {!activeNote.generated && (
                <button className={`nb-tb-btn ${previewMode?"active-mode":""}`}
                  onClick={() => setPreviewMode(v => !v)} title="Toggle preview">
                  {previewMode ? <Code2 size={15}/> : <Eye size={15}/>}
                </button>
              )}
              <button className="nb-tb-btn" onClick={summarizeNote}
                disabled={summarizing || !activeNote.content.trim()} title="AI Summarize">
                {summarizing ? <Loader2 size={15} className="spin"/> : <Brain size={15}/>}
              </button>
              <button className={`nb-tb-btn ${recording?"recording":""}`}
                onClick={recording ? stopRecording : startRecording} title="Voice note">
                {recording ? <MicOff size={15}/> : <Mic size={15}/>}
                {recording && <span className="nb-rec-timer">{formatTime(recordSeconds)}</span>}
              </button>
              <button className="nb-tb-btn" onClick={exportNote} title="Export as Markdown">
                <Download size={15}/>
              </button>
              <button className="nb-tb-btn danger" onClick={() => deleteNote(activeId)} title="Delete">
                <Trash2 size={15}/>
              </button>
              <button className="nb-save-btn" onClick={handleSave}>
                {saving ? <Loader2 size={14} className="spin"/> : <FileText size={14}/>}
                {saving ? "Saved ✓" : "Save"}
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="nb-tags-row">
            {activeNote.tags.map(tag => (
              <span key={tag} className="nb-tag">
                <Hash size={10}/>{tag}
                <button onClick={() => removeTag(tag)}><X size={10}/></button>
              </span>
            ))}
            <input className="nb-tag-input" placeholder="+ add tag" value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTag()}/>
          </div>

          {/* AI Summary */}
          {activeNote.aiSummary && (
            <div className="nb-summary">
              <Brain size={13} className="nb-sum-icon"/>
              <div>
                <span className="nb-sum-label">AI Summary</span>
                <p className="nb-sum-text">{activeNote.aiSummary}</p>
              </div>
              <button className="nb-sum-close" onClick={() => updateNote(activeId, { aiSummary: undefined })}><X size={12}/></button>
            </div>
          )}

          {/* Audio */}
          {activeNote.audioUrl && (
            <div className="nb-audio">
              <FileAudio size={14} className="nb-audio-icon"/>
              <audio controls src={activeNote.audioUrl} className="nb-audio-player"/>
              <span className="nb-audio-dur">{activeNote.audioDuration ? formatTime(activeNote.audioDuration) : ""}</span>
            </div>
          )}

          {/* Content — generated view OR markdown editor/preview */}
          {activeNote.generated && activeNote.generatedData ? (
            <div style={{flex:1,overflowY:"auto"}}>
              <GeneratedNoteView data={activeNote.generatedData}/>
            </div>
          ) : previewMode ? (
            <div className="nb-preview"
              dangerouslySetInnerHTML={{
                __html: activeNote.content
                  ? `<p style="margin:0 0 12px">${renderMarkdown(activeNote.content)}</p>`
                  : '<p style="color:var(--mu);font-style:italic">Nothing to preview yet.</p>',
              }}/>
          ) : (
            <textarea ref={textareaRef} className="nb-content"
              value={activeNote.content}
              onChange={e => updateNote(activeId, { content: e.target.value })}
              placeholder={`Start writing… Markdown is supported.\n\n## Headings  **bold**  *italic*  \`code\`\n- bullet lists   - [ ] checkboxes   > blockquotes`}
              spellCheck/>
          )}

          {/* Status bar */}
          <div className="nb-status-bar">
            <span className="nb-status-item">
              {activeNote.generated ? <><Sparkles size={11} style={{color:"#e879f9"}}/> AI Generated</> :
               previewMode ? <><Eye size={11}/> Preview</> : <><Code2 size={11}/> Edit mode</>}
            </span>
            <span className="nb-status-item">{wordCount} words · {readingTime} min</span>
            <span className="nb-status-item">
              {activeNote.dbId ? "✅ Saved to Neon DB" : "💾 localStorage only"}
            </span>
          </div>
        </div>
      ) : (
        <div className="nb-empty">
          <div className="nb-empty-icon"><BookOpen size={40} style={{color:"var(--cy)",opacity:0.4}}/></div>
          <h3 className="nb-empty-title">Your notebook is empty</h3>
          <p className="nb-empty-sub">Capture ideas, generate AI study notes, or record voice memos.</p>
          <div className="nb-empty-actions">
            {TEMPLATES.map(tpl => (
              <button key={tpl.label} className="nb-empty-tpl-btn" onClick={() => createFromTemplate(tpl)}>
                <span>{tpl.icon}</span><span>{tpl.label}</span>
              </button>
            ))}
            <button className="nb-empty-tpl-btn blank" onClick={createNote}><Plus size={14}/><span>Blank note</span></button>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ── Layout ── */
        .nb-page    { display: flex; height: 100%; overflow: hidden; background: var(--bg); }

        /* ── Sidebar ── */
        .nb-sidebar { width: 268px; flex-shrink: 0; border-right: 1px solid var(--bd); display: flex; flex-direction: column; background: var(--bg1); overflow: hidden; }
        .nb-sidebar-top { display: flex; align-items: center; justify-content: space-between; padding: 14px 12px 10px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
        .nb-sidebar-title-row { display: flex; align-items: center; gap: 7px; }
        .nb-sidebar-title { font-size: 13px; font-weight: 700; color: var(--tx); text-transform: uppercase; letter-spacing: 0.07em; margin: 0; }
        .nb-sidebar-actions { display: flex; align-items: center; gap: 4px; }
        .nb-icon-btn { width: 28px; height: 28px; border-radius: 6px; background: none; border: 1px solid var(--bd); color: var(--di); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .nb-icon-btn:hover { background: var(--bg2); color: var(--tx); }
        .nb-new-btn  { width: 28px; height: 28px; border-radius: 6px; background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.25); color: var(--cy); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .nb-new-btn:hover { background: rgba(34,211,238,0.22); }

        /* Search */
        .nb-search-wrap  { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid var(--bd); background: var(--bg2); flex-shrink: 0; }
        .nb-search-icon  { color: var(--mu); flex-shrink: 0; }
        .nb-search-input { flex: 1; background: none; border: none; outline: none; color: var(--tx); font-size: 13px; font-family: inherit; }
        .nb-search-input::placeholder { color: var(--mu); }
        .nb-search-clear { background: none; border: none; cursor: pointer; color: var(--mu); display: flex; align-items: center; padding: 2px; }

        /* Templates */
        .nb-templates       { padding: 8px; border-bottom: 1px solid var(--bd); background: var(--bg2); flex-shrink: 0; }
        .nb-templates-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mu); padding: 2px 4px 6px; }
        .nb-tpl-item  { width: 100%; display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 7px; background: none; border: none; cursor: pointer; color: var(--di); font-size: 13px; font-family: inherit; transition: background 0.15s; }
        .nb-tpl-item:hover { background: rgba(167,139,250,0.08); color: var(--tx); }
        .nb-tpl-icon  { width: 20px; text-align: center; flex-shrink: 0; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .nb-tpl-label { flex: 1; text-align: left; }

        /* Note list */
        .nb-note-list { flex: 1; overflow-y: auto; padding: 6px; }
        .nb-no-notes  { padding: 20px 8px; text-align: center; color: var(--mu); font-size: 13px; }
        .nb-note-item { width: 100%; text-align: left; padding: 10px 11px; border-radius: 8px; background: none; border: 1px solid transparent; cursor: pointer; transition: background 0.15s; margin-bottom: 2px; }
        .nb-note-item:hover { background: rgba(255,255,255,0.04); }
        .nb-note-item.active { background: rgba(34,211,238,0.07); border-color: rgba(34,211,238,0.18); }
        .nb-note-item-title { font-size: 13px; font-weight: 600; color: var(--tx); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .nb-note-item-meta  { font-size: 11px; color: var(--mu); margin-top: 3px; display: flex; align-items: center; }
        .nb-note-item-tags  { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 5px; }
        .nb-note-tag-mini   { font-size: 10px; padding: 2px 6px; border-radius: 10px; background: rgba(167,139,250,0.1); color: var(--vi); }

        /* Sidebar footer */
        .nb-sidebar-footer { padding: 8px 14px; border-top: 1px solid var(--bd); display: flex; gap: 10px; font-size: 11px; color: var(--mu); flex-shrink: 0; flex-wrap: wrap; }

        /* ── Editor ── */
        .nb-editor  { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
        .nb-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid var(--bd); gap: 10px; flex-wrap: wrap; flex-shrink: 0; }
        .nb-toolbar-left    { flex: 1; min-width: 0; }
        .nb-title           { font-size: 19px; font-weight: 700; color: var(--tx); cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
        .nb-edit-icon       { color: var(--mu); opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
        .nb-title:hover .nb-edit-icon { opacity: 1; }
        .nb-title-input     { font-size: 19px; font-weight: 700; color: var(--tx); background: none; border: none; border-bottom: 2px solid var(--cy); outline: none; width: 100%; font-family: inherit; }
        .nb-meta-row        { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--mu); margin-top: 4px; flex-wrap: wrap; }
        .nb-dot             { color: var(--bd); }
        .nb-toolbar-actions { display: flex; align-items: center; gap: 5px; }
        .nb-tb-btn          { width: 34px; height: 34px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--bd); color: var(--di); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s; font-size: 13px; }
        .nb-tb-btn:hover    { background: var(--bg1); color: var(--tx); }
        .nb-tb-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .nb-tb-btn.active-mode { background: rgba(34,211,238,0.12); border-color: rgba(34,211,238,0.3); color: var(--cy); }
        .nb-tb-btn.recording   { background: rgba(251,113,133,0.12); border-color: rgba(251,113,133,0.35); color: var(--ro); width: auto; padding: 0 11px; }
        .nb-tb-btn.danger:hover { background: rgba(251,113,133,0.1); color: var(--ro); border-color: rgba(251,113,133,0.35); }
        .nb-rec-timer       { font-size: 13px; font-family: 'JetBrains Mono', monospace; }
        .nb-save-btn        { display: flex; align-items: center; gap: 6px; padding: 7px 15px; border-radius: 8px; background: rgba(34,211,238,0.1); border: 1px solid rgba(34,211,238,0.25); color: var(--cy); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .nb-save-btn:hover  { background: rgba(34,211,238,0.18); }

        /* Tags */
        .nb-tags-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 9px 18px; border-bottom: 1px solid var(--bd); min-height: 40px; flex-shrink: 0; }
        .nb-tag      { display: flex; align-items: center; gap: 4px; padding: 3px 9px; background: rgba(34,211,238,0.07); border: 1px solid rgba(34,211,238,0.18); border-radius: 20px; font-size: 12px; color: var(--cy); }
        .nb-tag button { background: none; border: none; cursor: pointer; color: var(--cy); display: flex; align-items: center; opacity: 0.5; }
        .nb-tag-input  { background: none; border: none; outline: none; font-size: 12px; color: var(--tx3); width: 75px; font-family: inherit; }
        .nb-tag-input::placeholder { color: var(--mu); }

        /* AI Summary */
        .nb-summary  { display: flex; align-items: flex-start; gap: 10px; padding: 10px 18px; background: rgba(167,139,250,0.04); border-bottom: 1px solid rgba(167,139,250,0.1); flex-shrink: 0; }
        .nb-sum-icon { color: var(--vi); flex-shrink: 0; margin-top: 2px; }
        .nb-sum-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--vi); display: block; margin-bottom: 3px; }
        .nb-sum-text  { font-size: 13px; color: var(--di); line-height: 1.6; margin: 0; }
        .nb-sum-close { margin-left: auto; background: none; border: none; cursor: pointer; color: var(--mu); display: flex; align-items: center; flex-shrink: 0; padding: 2px; }

        /* Audio */
        .nb-audio        { display: flex; align-items: center; gap: 10px; padding: 9px 18px; border-bottom: 1px solid var(--bd); flex-shrink: 0; }
        .nb-audio-icon   { color: var(--cy); flex-shrink: 0; }
        .nb-audio-player { height: 32px; flex: 1; }
        .nb-audio-dur    { font-size: 12px; color: var(--mu); font-family: 'JetBrains Mono', monospace; }

        /* Content */
        .nb-content  { flex: 1; padding: 22px 24px; background: transparent; border: none; outline: none; color: var(--tx); font-size: 15px; line-height: 1.9; resize: none; font-family: inherit; min-height: 0; }
        .nb-content::placeholder { color: var(--mu); }
        .nb-preview  { flex: 1; padding: 22px 24px; overflow-y: auto; color: var(--tx); font-size: 15px; line-height: 1.9; min-height: 0; }

        /* Generated note sections */
        .gs-section       { padding: 18px 0; border-bottom: 1px solid var(--bd); }
        .gs-section:last-child { border-bottom: none; }
        .gs-section-title { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; margin-bottom: 14px; }

        /* Status bar */
        .nb-status-bar  { display: flex; align-items: center; gap: 16px; padding: 6px 18px; border-top: 1px solid var(--bd); background: var(--bg1); flex-shrink: 0; }
        .nb-status-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--mu); }

        /* Empty state */
        .nb-empty         { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 40px; }
        .nb-empty-icon    { opacity: 0.6; }
        .nb-empty-title   { font-size: 18px; font-weight: 700; color: var(--tx); margin: 0; }
        .nb-empty-sub     { font-size: 14px; color: var(--mu); text-align: center; max-width: 400px; margin: 0; line-height: 1.6; }
        .nb-empty-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; margin-top: 8px; }
        .nb-empty-tpl-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px; background: var(--bg1); border: 1px solid var(--bd); color: var(--di); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .nb-empty-tpl-btn:hover { background: var(--bg2); color: var(--tx); }
        .nb-empty-tpl-btn.blank { background: rgba(34,211,238,0.07); border-color: rgba(34,211,238,0.22); color: var(--cy); }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
