"use client";

import { useState } from "react";
import {
  TrendingUp, Brain, Target, ChevronRight, Loader2, AlertCircle,
  CheckCircle, Clock, Star, Zap, Award, Code, Database, Globe,
  BarChart2, Briefcase, Plus, Minus
} from "lucide-react";

const SKILLS = [
  { id: "python", label: "Python", category: "languages" },
  { id: "typescript", label: "TypeScript", category: "languages" },
  { id: "pytorch", label: "PyTorch", category: "ml" },
  { id: "tensorflow", label: "TensorFlow", category: "ml" },
  { id: "gemini", label: "Gemini API", category: "llm" },
  { id: "openai", label: "OpenAI API", category: "llm" },
  { id: "langchain", label: "LangChain", category: "llm" },
  { id: "rag", label: "RAG pipelines", category: "llm" },
  { id: "react", label: "React/Next.js", category: "web" },
  { id: "fastapi", label: "FastAPI", category: "web" },
  { id: "docker", label: "Docker", category: "devops" },
  { id: "kubernetes", label: "Kubernetes", category: "devops" },
  { id: "vercel", label: "Vercel deploy", category: "devops" },
  { id: "pgvector", label: "pgvector/Neon", category: "db" },
  { id: "fine-tuning", label: "Fine-tuning LLMs", category: "ml" },
  { id: "mlops", label: "MLOps", category: "devops" },
];

interface Profile {
  yearsExp: number;
  currentRole: string;
  targetRole: string;
  skills: string[];
  projects: number;
  education: string;
  goals: string;
}

interface Analysis {
  score: number;
  level: string;
  headline: string;
  strengths: string[];
  gaps: string[];
  nextSteps: { action: string; priority: string; timeframe: string }[];
  marketReadiness: number;
  salaryRange: string;
  recommendedRoles: string[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "var(--ro)",
  medium: "var(--am)",
  low: "var(--em)",
};

export default function CareerPage() {
  const [profile, setProfile] = useState<Profile>({
    yearsExp: 1,
    currentRole: "Full-Stack Developer",
    targetRole: "AI/ML Engineer",
    skills: ["python", "typescript", "react", "gemini", "vercel"],
    projects: 5,
    education: "Self-taught + online courses",
    goals: "Build production AI systems and land an AI engineering role within 6 months",
  });
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "result">("form");

  const toggleSkill = (id: string) => {
    setProfile((p) => ({
      ...p,
      skills: p.skills.includes(id) ? p.skills.filter((s) => s !== id) : [...p.skills, id],
    }));
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/career", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAnalysis(data);
      setStep("result");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const ScoreRing = ({ value, label, color }: { value: number; label: string; color: string }) => {
    const r = 36, cx = 44, cy = 44;
    const circ = 2 * Math.PI * r;
    const dash = (value / 100) * circ;
    return (
      <div className="score-ring-wrap">
        <svg width="88" height="88">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
            strokeLinecap="round" />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="700" fill={color}>{value}</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="var(--di)">{label}</text>
        </svg>
      </div>
    );
  };

  const catIcons: Record<string, React.ReactNode> = {
    languages: <Code size={12} />, ml: <Brain size={12} />, llm: <Zap size={12} />,
    web: <Globe size={12} />, devops: <Database size={12} />, db: <Database size={12} />,
  };

  const skillsByCategory = SKILLS.reduce<Record<string, typeof SKILLS>>((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <div className="ca-page">
      <div className="ca-header">
        <div className="ca-header-inner">
          <div className="ca-icon-wrap"><TrendingUp size={20} /></div>
          <div>
            <h1 className="ca-title">Career Tracker</h1>
            <p className="ca-sub">AI-powered analysis of your path to AI engineering</p>
          </div>
        </div>
        {step === "result" && (
          <button className="ca-redo-btn" onClick={() => setStep("form")}>
            Edit Profile
          </button>
        )}
      </div>

      {step === "form" ? (
        <div className="ca-form">
          <div className="ca-card">
            <h2 className="ca-card-title"><Briefcase size={14} /> Background</h2>
            <div className="ca-row">
              <div className="ca-field">
                <label>Current Role</label>
                <input value={profile.currentRole} onChange={(e) => setProfile((p) => ({ ...p, currentRole: e.target.value }))} className="ca-input" />
              </div>
              <div className="ca-field">
                <label>Target Role</label>
                <input value={profile.targetRole} onChange={(e) => setProfile((p) => ({ ...p, targetRole: e.target.value }))} className="ca-input" />
              </div>
            </div>
            <div className="ca-row">
              <div className="ca-field">
                <label>Years of Experience</label>
                <div className="ca-counter">
                  <button onClick={() => setProfile((p) => ({ ...p, yearsExp: Math.max(0, p.yearsExp - 1) }))}><Minus size={14} /></button>
                  <span>{profile.yearsExp}</span>
                  <button onClick={() => setProfile((p) => ({ ...p, yearsExp: p.yearsExp + 1 }))}><Plus size={14} /></button>
                </div>
              </div>
              <div className="ca-field">
                <label>Projects Shipped</label>
                <div className="ca-counter">
                  <button onClick={() => setProfile((p) => ({ ...p, projects: Math.max(0, p.projects - 1) }))}><Minus size={14} /></button>
                  <span>{profile.projects}</span>
                  <button onClick={() => setProfile((p) => ({ ...p, projects: p.projects + 1 }))}><Plus size={14} /></button>
                </div>
              </div>
            </div>
            <div className="ca-field" style={{ marginTop: 12 }}>
              <label>Education Background</label>
              <input value={profile.education} onChange={(e) => setProfile((p) => ({ ...p, education: e.target.value }))} className="ca-input" />
            </div>
            <div className="ca-field" style={{ marginTop: 12 }}>
              <label>Career Goals (be specific)</label>
              <textarea value={profile.goals} onChange={(e) => setProfile((p) => ({ ...p, goals: e.target.value }))} className="ca-textarea" rows={3} />
            </div>
          </div>

          <div className="ca-card">
            <h2 className="ca-card-title"><Code size={14} /> Skills & Technologies</h2>
            <p className="ca-card-sub">Select everything you have practical experience with</p>
            {Object.entries(skillsByCategory).map(([cat, skills]) => (
              <div key={cat} className="ca-skill-group">
                <div className="ca-skill-cat">{catIcons[cat]} {cat.toUpperCase()}</div>
                <div className="ca-skill-chips">
                  {skills.map((s) => (
                    <button key={s.id} className={`ca-chip ${profile.skills.includes(s.id) ? "active" : ""}`} onClick={() => toggleSkill(s.id)}>
                      {profile.skills.includes(s.id) && <CheckCircle size={11} />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="ca-error"><AlertCircle size={15} /><span>{error}</span></div>
          )}

          <button className="ca-analyze-btn" onClick={analyze} disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> Analyzing your profile...</> : <><Brain size={16} /> Analyze My Career Path</>}
          </button>
        </div>
      ) : analysis ? (
        <div className="ca-result">
          {/* Hero scores */}
          <div className="ca-scores-row">
            <ScoreRing value={analysis.score} label="SCORE" color="var(--cy)" />
            <ScoreRing value={analysis.marketReadiness} label="MARKET" color="var(--em)" />
            <div className="ca-level-card">
              <Award size={20} className="ca-level-icon" />
              <div className="ca-level-text">{analysis.level}</div>
              <div className="ca-level-salary">{analysis.salaryRange}</div>
            </div>
          </div>

          <div className="ca-headline">"{analysis.headline}"</div>

          <div className="ca-two-col">
            {/* Strengths */}
            <div className="ca-card">
              <h2 className="ca-card-title"><Star size={14} /> Strengths</h2>
              {analysis.strengths.map((s, i) => (
                <div key={i} className="ca-list-item ca-strength">
                  <CheckCircle size={13} className="ca-li-icon strength-icon" />
                  <span>{s}</span>
                </div>
              ))}
            </div>

            {/* Gaps */}
            <div className="ca-card">
              <h2 className="ca-card-title"><Target size={14} /> Skill Gaps</h2>
              {analysis.gaps.map((g, i) => (
                <div key={i} className="ca-list-item ca-gap">
                  <AlertCircle size={13} className="ca-li-icon gap-icon" />
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="ca-card">
            <h2 className="ca-card-title"><ChevronRight size={14} /> Action Plan</h2>
            {analysis.nextSteps.map((step, i) => (
              <div key={i} className="ca-step">
                <div className="ca-step-num">{i + 1}</div>
                <div className="ca-step-body">
                  <p className="ca-step-action">{step.action}</p>
                  <div className="ca-step-meta">
                    <span className="ca-priority" style={{ color: PRIORITY_COLORS[step.priority] || "var(--di)" }}>
                      ● {step.priority}
                    </span>
                    <span className="ca-timeframe"><Clock size={10} /> {step.timeframe}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommended Roles */}
          <div className="ca-card">
            <h2 className="ca-card-title"><BarChart2 size={14} /> Recommended Roles</h2>
            <div className="ca-roles-wrap">
              {analysis.recommendedRoles.map((role, i) => (
                <div key={i} className="ca-role-chip">
                  <Briefcase size={12} />
                  <span>{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .ca-page { padding: 28px 24px; max-width: 900px; margin: 0 auto; }
        .ca-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 26px; }
        .ca-header-inner { display: flex; align-items: center; gap: 14px; }
        .ca-icon-wrap { width: 44px; height: 44px; border-radius: 11px; background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.28); display: flex; align-items: center; justify-content: center; color: var(--em); }
        .ca-title { font-size: 24px; font-weight: 700; color: var(--tx); }
        .ca-sub { font-size: 14px; color: var(--tx2); margin-top: 3px; }
        .ca-redo-btn { padding: 9px 18px; border-radius: 8px; background: var(--bg2); border: 1px solid var(--bd); color: var(--di); font-size: 14px; cursor: pointer; font-family: inherit; }
        .ca-redo-btn:hover { border-color: var(--bdh); color: var(--tx); }
        .ca-form { display: flex; flex-direction: column; gap: 16px; }
        .ca-card { background: var(--bg1); border: 1px solid var(--bd); border-radius: 12px; padding: 20px; }
        .ca-card-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--em); display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }
        .ca-card-sub { font-size: 14px; color: var(--tx2); margin-bottom: 14px; margin-top: -10px; }
        .ca-row { display: flex; gap: 14px; flex-wrap: wrap; }
        .ca-field { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 6px; }
        .ca-field label { font-size: 12px; font-weight: 600; color: var(--di); text-transform: uppercase; letter-spacing: 0.05em; }
        .ca-input { background: var(--bg2); border: 1px solid var(--bd); border-radius: 8px; padding: 9px 13px; color: var(--tx); font-size: 15px; outline: none; font-family: inherit; transition: border-color 0.15s; }
        .ca-input:focus { border-color: var(--em); }
        .ca-textarea { background: var(--bg2); border: 1px solid var(--bd); border-radius: 8px; padding: 10px 13px; color: var(--tx); font-size: 15px; outline: none; font-family: inherit; resize: vertical; line-height: 1.65; }
        .ca-textarea:focus { border-color: var(--em); }
        .ca-counter { display: flex; align-items: center; gap: 14px; background: var(--bg2); border: 1px solid var(--bd); border-radius: 8px; padding: 7px 14px; width: fit-content; }
        .ca-counter button { background: none; border: none; cursor: pointer; color: var(--di); display: flex; align-items: center; }
        .ca-counter button:hover { color: var(--em); }
        .ca-counter span { font-size: 17px; font-weight: 700; color: var(--tx); min-width: 26px; text-align: center; }
        .ca-skill-group { margin-bottom: 16px; }
        .ca-skill-cat { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--di); display: flex; align-items: center; gap: 5px; margin-bottom: 8px; }
        .ca-skill-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .ca-chip { display: flex; align-items: center; gap: 5px; padding: 6px 13px; border-radius: 20px; background: var(--bg2); border: 1px solid var(--bd); color: var(--di); font-size: 13px; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .ca-chip.active { background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.35); color: var(--em); }
        .ca-chip:hover { border-color: var(--bdh); color: var(--tx); }
        .ca-error { display: flex; align-items: center; gap: 8px; padding: 14px; background: rgba(251,113,133,0.08); border: 1px solid rgba(251,113,133,0.25); border-radius: 8px; color: var(--ro); font-size: 14px; }
        .ca-analyze-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 15px; border-radius: 10px; background: linear-gradient(135deg, rgba(52,211,153,0.15), rgba(34,211,238,0.1)); border: 1px solid rgba(52,211,153,0.35); color: var(--em); font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: inherit; }
        .ca-analyze-btn:hover { background: linear-gradient(135deg, rgba(52,211,153,0.25), rgba(34,211,238,0.15)); }
        .ca-analyze-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        /* Results */
        .ca-result { display: flex; flex-direction: column; gap: 16px; }
        .ca-scores-row { display: flex; align-items: center; gap: 20px; background: var(--bg1); border: 1px solid var(--bd); border-radius: 12px; padding: 22px 26px; }
        .score-ring-wrap { }
        .ca-level-card { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; }
        .ca-level-icon { color: var(--am); }
        .ca-level-text { font-size: 24px; font-weight: 900; color: var(--tx); }
        .ca-level-salary { font-size: 14px; color: var(--em); font-weight: 600; }
        .ca-headline { padding: 18px 22px; background: rgba(34,211,238,0.05); border: 1px solid rgba(34,211,238,0.15); border-radius: 10px; font-size: 16px; color: var(--di); font-style: italic; text-align: center; line-height: 1.6; }
        .ca-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .ca-two-col { grid-template-columns: 1fr; } }
        .ca-list-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--bd); font-size: 14px; color: var(--tx2); line-height: 1.6; }
        .ca-list-item:last-child { border-bottom: none; }
        .ca-li-icon { flex-shrink: 0; margin-top: 3px; }
        .strength-icon { color: var(--em); }
        .gap-icon { color: var(--am); }
        .ca-step { display: flex; gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--bd); }
        .ca-step:last-child { border-bottom: none; }
        .ca-step-num { width: 26px; height: 26px; border-radius: 50%; background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.25); color: var(--cy); font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ca-step-body { flex: 1; }
        .ca-step-action { font-size: 15px; color: var(--tx); margin-bottom: 5px; line-height: 1.55; }
        .ca-step-meta { display: flex; align-items: center; gap: 14px; }
        .ca-priority { font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .ca-timeframe { font-size: 12px; color: var(--tx3); display: flex; align-items: center; gap: 3px; }
        .ca-roles-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
        .ca-role-chip { display: flex; align-items: center; gap: 7px; padding: 8px 16px; background: var(--bg2); border: 1px solid var(--bd); border-radius: 8px; font-size: 14px; color: var(--tx2); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
