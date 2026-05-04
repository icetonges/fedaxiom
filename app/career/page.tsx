"use client";

import { useState } from "react";
import {
  TrendingUp, Brain, Target, ChevronRight, Loader2, AlertCircle,
  CheckCircle, Clock, Star, Zap, Award, Code, Database, Globe,
  BarChart2, Briefcase, Plus, Minus, ExternalLink, BookOpen,
  GitBranch, Users, GraduationCap, FileText,
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

// ─── Study & Community Resources ─────────────────────────────────────────────

const RESOURCES = [
  {
    cat: "Open-Source GitHub Guides",
    color: "#818cf8",
    icon: <GitBranch size={13}/>,
    items: [
      {
        name: "Awesome Generative AI Guide",
        stars: "26.5k ⭐",
        url: "https://github.com/aishwaryanr/awesome-generative-ai-guide",
        desc: "One-stop repo for GenAI — 90+ free courses, monthly research paper summaries, 10-week LLM mastery curriculum, interview Q&A banks, RAG & fine-tuning notebooks. MIT licensed.",
        tags: ["LLMs", "RAG", "Fine-tuning", "Interview Prep", "90+ Courses"],
      },
      {
        name: "AI Guide by 鱼皮 (liyupi)",
        stars: "13k ⭐",
        url: "https://github.com/liyupi/ai-guide",
        desc: "Practical Chinese-first AI guide covering vibe coding, DeepSeek / GPT / Claude / Gemini, prompt engineering, Agents, RAG, MCP, and monetisation strategies for AI products.",
        tags: ["Vibe Coding", "Agents", "MCP", "Chinese", "Practical"],
      },
      {
        name: "Awesome AI/ML Resources",
        stars: "2k+ ⭐",
        url: "https://github.com/armankhondker/awesome-ai-ml-resources",
        desc: "Beginner-friendly 7-stage structured roadmap: Python → Math → ML Theory → Projects → Specialisations → MLOps → Research Papers. Curates Coursera, MIT, Stanford, and AWS content.",
        tags: ["Beginners", "ML", "Roadmap", "Curated", "7-Stage"],
      },
      {
        name: "AI Guide Web Portal",
        stars: "",
        url: "https://ai.codefather.cn/library/2010994846520700929",
        desc: "Web version of the ai-guide knowledge library — browsable AI learning paths, tool tutorials, Cursor/Claude Code guides, and a growing community knowledge base.",
        tags: ["Web Library", "Claude Code", "Tutorials", "Community"],
      },
    ],
  },
  {
    cat: "Roadmaps & Structured Curricula",
    color: "#34d399",
    icon: <TrendingUp size={13}/>,
    items: [
      {
        name: "AI Engineer Roadmap (roadmap.sh)",
        stars: "",
        url: "https://roadmap.sh/ai/roadmap-chat/ai-engineer",
        desc: "Interactive visual roadmap with an AI tutor that personalises your learning path. Covers foundations through production deployment. Also see: ai-data-scientist roadmap.",
        tags: ["Visual Roadmap", "AI Tutor", "Interactive", "Career Path"],
      },
      {
        name: "Kaggle 5-Day Agents Course",
        stars: "",
        url: "https://www.kaggle.com/learn-guide/5-day-agents",
        desc: "Google's free intensive: 11 notebooks across 5 days covering agents, MCP, memory systems, evaluation, and production deployment with Google ADK + Gemini.",
        tags: ["Agents", "Free", "Hands-on", "Google ADK"],
      },
      {
        name: "fast.ai — Practical Deep Learning",
        stars: "",
        url: "https://course.fast.ai",
        desc: "Jeremy Howard's legendary top-down course. Best way to build real intuition for deep learning without getting buried in theory. Free, notebook-driven, production-focused.",
        tags: ["Deep Learning", "Free", "Top-down", "Practical"],
      },
      {
        name: "DeepLearning.AI (Andrew Ng)",
        stars: "",
        url: "https://deeplearning.ai",
        desc: "Gold standard structured curriculum: ML Specialization, Deep Learning, MLOps, LLM Engineering. Industry-recognised certificates. Best starting point for structured learners.",
        tags: ["Certificates", "ML", "LLMs", "Structured"],
      },
    ],
  },
  {
    cat: "Courses & Learning Platforms",
    color: "#38bdf8",
    icon: <GraduationCap size={13}/>,
    items: [
      {
        name: "Hugging Face Courses",
        stars: "",
        url: "https://huggingface.co/learn",
        desc: "Free NLP Course, Deep RL, Diffusion Models, Audio ML, and Agents courses — all notebook-based and tied directly to the open-source HF ecosystem.",
        tags: ["Free", "NLP", "Transformers", "Agents", "Open Source"],
      },
      {
        name: "Kaggle Learn",
        stars: "",
        url: "https://kaggle.com/learn",
        desc: "Free micro-courses on Python, ML, Deep Learning, Feature Engineering, SQL, NLP, and AI. Each takes 4–6 hours with a certificate. Best quick up-skilling tool.",
        tags: ["Free", "Micro-courses", "Certificates", "Practical"],
      },
      {
        name: "Google AI Developer Hub",
        stars: "",
        url: "https://ai.google.dev",
        desc: "Official Google AI documentation, quickstarts for Gemini API and ADK, codelabs, and production guides. Essential if you're building on Google's AI stack.",
        tags: ["Gemini", "ADK", "Official", "Codelabs"],
      },
      {
        name: "Anthropic Cookbook",
        stars: "",
        url: "https://github.com/anthropics/anthropic-cookbook",
        desc: "Official Claude engineering patterns: tool use, multi-agent, RAG, context management, streaming. Practical notebooks for building production Claude applications.",
        tags: ["Claude", "Tool Use", "RAG", "Official"],
      },
    ],
  },
  {
    cat: "Research & Papers",
    color: "#fbbf24",
    icon: <FileText size={13}/>,
    items: [
      {
        name: "Papers With Code",
        stars: "",
        url: "https://paperswithcode.com",
        desc: "ML papers + code implementations linked together. Track every SOTA benchmark, find implementations instantly. Best tool for turning research into practice.",
        tags: ["SOTA", "Research", "Code", "Benchmarks"],
      },
      {
        name: "ArXiv cs.AI / cs.LG",
        stars: "",
        url: "https://arxiv.org/list/cs.AI/recent",
        desc: "Where all major AI research appears first — preprints, hours after writing. Follow cs.AI (Artificial Intelligence) and cs.LG (Machine Learning) daily.",
        tags: ["Preprints", "Daily", "Free", "Frontier"],
      },
      {
        name: "Anthropic Research",
        stars: "",
        url: "https://anthropic.com/research",
        desc: "Claude scaling laws, Constitutional AI, interpretability, and alignment research. Essential reading for anyone building serious Claude-based systems.",
        tags: ["Alignment", "Interpretability", "Scaling", "Claude"],
      },
      {
        name: "Google DeepMind Research",
        stars: "",
        url: "https://deepmind.google/research/",
        desc: "Gemini, Gemma, AlphaCode, and frontier research. Cutting-edge work on agents, reasoning, multimodal models, and scientific AI.",
        tags: ["Gemini", "Agents", "Frontier", "Multimodal"],
      },
    ],
  },
  {
    cat: "Community & Networking",
    color: "#f472b6",
    icon: <Users size={13}/>,
    items: [
      {
        name: "Hugging Face Discord",
        stars: "",
        url: "https://discord.gg/huggingface",
        desc: "Largest open ML community online. Active #beginners, #NLP, #diffusion, and #agents channels. Maintainers answer questions. Best place to find collaborators.",
        tags: ["Discord", "Open ML", "Beginners", "Active"],
      },
      {
        name: "r/MachineLearning",
        stars: "1M+",
        url: "https://reddit.com/r/MachineLearning",
        desc: "1M+ members. Research paper discussions, AMAs from top researchers (Karpathy, LeCun, Bengio), industry news. High signal-to-noise ratio.",
        tags: ["Reddit", "Research", "AMAs", "High Signal"],
      },
      {
        name: "r/LocalLLaMA",
        stars: "500k+",
        url: "https://reddit.com/r/LocalLLaMA",
        desc: "Community for running LLMs locally — quantisation, hardware benchmarks, model comparisons, Ollama setups. Very practical, fast-moving.",
        tags: ["Local LLMs", "Practical", "Hardware", "Ollama"],
      },
      {
        name: "Latent Space (Podcast + Discord)",
        stars: "",
        url: "https://latent.space",
        desc: "Deep technical interviews with AI researchers and engineers. Episodes cover RAG, evals, agents, LLM internals, and AI infrastructure. Discord has active community.",
        tags: ["Podcast", "Technical", "Discord", "Deep Dives"],
      },
    ],
  },
  {
    cat: "Certifications",
    color: "#fb923c",
    icon: <Award size={13}/>,
    items: [
      {
        name: "Google Professional ML Engineer",
        stars: "",
        url: "https://cloud.google.com/learn/certification/machine-learning-engineer",
        desc: "Industry-recognised cert covering ML on GCP, Vertex AI, MLOps, and feature engineering. Strong signal for employers using Google Cloud stack. Recommended after 1yr experience.",
        tags: ["GCP", "Vertex AI", "MLOps", "Professional"],
      },
      {
        name: "AWS ML Specialty",
        stars: "",
        url: "https://aws.amazon.com/certification/certified-machine-learning-specialty/",
        desc: "Covers ML pipeline design, feature engineering, model evaluation, and deployment on SageMaker. Valuable if your target employer is AWS-heavy.",
        tags: ["AWS", "SageMaker", "Specialty", "Pipeline"],
      },
      {
        name: "DeepLearning.AI Certificates",
        stars: "",
        url: "https://deeplearning.ai/courses/",
        desc: "Andrew Ng's specialisations in LLM Engineering, MLOps, and GenAI for Everyone. Affordable, widely recognised, and directly linked to job postings.",
        tags: ["LLMs", "MLOps", "Affordable", "Recognised"],
      },
      {
        name: "Hugging Face Certifications",
        stars: "",
        url: "https://huggingface.co/learn",
        desc: "Community-recognised certificates in Transformers, Agents, and Audio ML. All free to earn. Strong open-source signal, especially for research-leaning roles.",
        tags: ["Free", "Transformers", "Agents", "Open Source"],
      },
    ],
  },
];

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

      {/* ── STUDY & COMMUNITY RESOURCES ────────────────────────────────── */}
      <div style={{ marginTop: 48, borderTop: "1px solid var(--bd)", paddingTop: 36 }}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <BookOpen size={18} color="var(--cy)" />
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--cy)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Study &amp; Community
          </span>
        </div>
        <h2 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 800, color: "var(--tx)", lineHeight: 1.2, marginBottom: 6 }}>
          Learning Resources
        </h2>
        <p style={{ fontSize: 14, color: "var(--tx2)", lineHeight: 1.65, marginBottom: 32 }}>
          Curated guides, courses, communities, and certifications to accelerate your AI engineering journey — from first commit to senior-level production systems
        </p>

        {RESOURCES.map(section => (
          <div key={section.cat} style={{ marginBottom: 32 }}>
            {/* Category header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7, marginBottom: 12,
              fontSize: 11, fontWeight: 800, color: section.color,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}>
              <div style={{ width: 3, height: 16, background: section.color, borderRadius: 2, flexShrink: 0 }}/>
              {section.icon}
              {section.cat}
            </div>

            {/* Resource cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
              {section.items.map(item => (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", flexDirection: "column", gap: 9,
                    background: "var(--bg1)", border: "1px solid var(--bd)",
                    borderRadius: 11, padding: "15px 17px", textDecoration: "none",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = section.color + "60";
                    (e.currentTarget as HTMLElement).style.background = section.color + "07";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--bd)";
                    (e.currentTarget as HTMLElement).style.background = "var(--bg1)";
                  }}
                >
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--tx)", lineHeight: 1.3 }}>
                      {item.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginTop: 1 }}>
                      {item.stars && (
                        <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, whiteSpace: "nowrap" }}>
                          {item.stars}
                        </span>
                      )}
                      <ExternalLink size={12} color="var(--tx3)" />
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.65, margin: 0 }}>{item.desc}</p>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 2 }}>
                    {item.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 11, padding: "2px 9px", borderRadius: 5,
                        background: section.color + "14",
                        color: section.color,
                        border: `1px solid ${section.color}30`,
                        whiteSpace: "nowrap",
                      }}>{tag}</span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

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
