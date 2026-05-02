import Link from "next/link";

const PROJECTS = [
  {
    name: "ShangThing",
    url: "https://shangthing.vercel.app/",
    tech: ["Next.js", "TypeScript"],
    desc: "Personal platform and portfolio hub.",
    status: "live",
  },
  {
    name: "FedFM",
    url: "https://fedfm.vercel.app/",
    tech: ["Next.js", "AI Summaries"],
    desc: "Federal news aggregator with AI-powered summarization.",
    status: "live",
  },
  {
    name: "PalantirLearning",
    url: "https://palantirthing.vercel.app/",
    tech: ["React", "Defense Analytics"],
    desc: "Defense analytics learning platform inspired by Palantir.",
    status: "live",
  },
  {
    name: "PeterShang.AI",
    url: "https://petershang.vercel.app/",
    tech: ["Next.js", "Gemini AI"],
    desc: "Personal AI portfolio with Gemini-powered chatbot.",
    status: "live",
  },
  {
    name: "AIML.Gov",
    url: "https://aimlgov.vercel.app/",
    tech: ["Next.js", "Research"],
    desc: "AI/ML in government — policy, research, and applications.",
    status: "live",
  },
  {
    name: "MLAIThing",
    url: "https://mlaithing.vercel.app/",
    tech: ["Next.js", "Experiments"],
    desc: "ML/AI experiments and prototypes.",
    status: "live",
  },
  {
    name: "AXIOM",
    url: "#",
    tech: ["Next.js 15", "Gemini", "Groq"],
    desc: "This platform — personal AI engineering studio.",
    status: "building",
  },
];

const live = PROJECTS.filter((p) => p.status === "live").length;
const building = PROJECTS.filter((p) => p.status === "building").length;

export default function ProjectsPage() {
  return (
    <div className="proj-page">
      {/* Header */}
      <div className="proj-header">
        <p className="proj-eyebrow">// PROJECTS</p>
        <h1 className="proj-title">Deployed Applications</h1>
        <p className="proj-count">{live} live · {building} in progress</p>
      </div>

      {/* Grid */}
      <div className="proj-grid">
        {PROJECTS.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target={p.url !== "#" ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={`proj-card ${p.status === "building" ? "building" : ""}`}
          >
            <div className="proj-card-top">
              <span className="proj-name">{p.name}</span>
              <span className={`proj-badge ${p.status === "building" ? "badge-building" : "badge-live"}`}>
                {p.status === "building" ? "BUILDING" : "LIVE"}
              </span>
            </div>

            <p className="proj-url">
              {p.url !== "#" ? p.url.replace("https://", "") : "in development"}
            </p>

            <p className="proj-desc">{p.desc}</p>

            <div className="proj-tags">
              {p.tech.map((t) => (
                <span key={t} className="proj-tag">{t}</span>
              ))}
            </div>
          </a>
        ))}
      </div>

      <style jsx>{`
        .proj-page {
          padding: 36px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Header */
        .proj-header { margin-bottom: 36px; }

        .proj-eyebrow {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 10px;
          font-family: 'JetBrains Mono', monospace;
        }

        .proj-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--tx);
          line-height: 1.2;
          margin-bottom: 10px;
        }

        .proj-count {
          font-size: 1rem;
          color: var(--tx2);
        }

        /* Grid */
        .proj-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 18px;
        }

        /* Card */
        .proj-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: var(--bg1);
          border: 1px solid var(--bd);
          border-radius: 12px;
          padding: 22px 24px;
          text-decoration: none;
          transition: all 0.18s;
          cursor: pointer;
        }
        .proj-card:hover {
          border-color: var(--accent);
          background: var(--bg2);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.25);
        }
        .proj-card.building {
          border-color: rgba(251, 146, 60, 0.3);
          background: rgba(251, 146, 60, 0.04);
        }
        .proj-card.building:hover {
          border-color: var(--or);
        }

        /* Card top row */
        .proj-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .proj-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--tx);
        }

        .proj-badge {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          padding: 3px 9px;
          border-radius: 20px;
          flex-shrink: 0;
        }
        .badge-live {
          background: rgba(52, 211, 153, 0.15);
          color: var(--em);
          border: 1px solid rgba(52, 211, 153, 0.3);
        }
        .badge-building {
          background: rgba(251, 146, 60, 0.15);
          color: var(--or);
          border: 1px solid rgba(251, 146, 60, 0.3);
        }

        /* URL */
        .proj-url {
          font-size: 0.82rem;
          color: var(--accent);
          font-family: 'JetBrains Mono', monospace;
          word-break: break-all;
        }

        /* Description */
        .proj-desc {
          font-size: 0.97rem;
          color: var(--tx2);
          line-height: 1.6;
        }

        /* Tech tags */
        .proj-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .proj-tag {
          font-size: 0.75rem;
          padding: 4px 10px;
          border-radius: 6px;
          background: var(--bg2);
          border: 1px solid var(--bd);
          color: var(--tx2);
          font-weight: 500;
        }

        /* Mobile */
        @media (max-width: 640px) {
          .proj-page { padding: 24px 16px; }
          .proj-title { font-size: 1.5rem; }
          .proj-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
