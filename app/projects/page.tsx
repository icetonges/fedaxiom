const PROJECTS = [
  { name: "ShangThing",       url: "https://shangthing.vercel.app/",    tech: "Next.js · TypeScript",       desc: "Personal platform and portfolio hub.",                      live: true  },
  { name: "FedFM",            url: "https://fedfm.vercel.app/",         tech: "Next.js · AI Summaries",     desc: "Federal news aggregator with AI-powered summarization.",     live: true  },
  { name: "PalantirLearning", url: "https://palantirthing.vercel.app/", tech: "React · Defense Analytics",  desc: "Defense analytics learning platform inspired by Palantir.",  live: true  },
  { name: "PeterShang.AI",    url: "https://petershang.vercel.app/",    tech: "Next.js · Gemini AI",        desc: "Personal AI portfolio with Gemini-powered chatbot.",         live: true  },
  { name: "AIML.Gov",         url: "https://aimlgov.vercel.app/",       tech: "Next.js · Research",         desc: "AI/ML in government — policy, research, and applications.",  live: true  },
  { name: "MLAIThing",        url: "https://mlaithing.vercel.app/",     tech: "Next.js · ML Experiments",   desc: "ML/AI experiments and prototypes.",                          live: true  },
  { name: "AXIOM",            url: "#",                                  tech: "Next.js 15 · Gemini · Groq", desc: "Personal AI engineering studio. You are building this now.", live: false },
]

export default function ProjectsPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--or)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>
          // projects
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 5 }}>
          Deployed <span style={{ color: "var(--or)" }}>Applications</span>
        </div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--mu)" }}>
          {PROJECTS.filter(p => p.live).length} live · 1 in progress
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 14 }}>
        {PROJECTS.map(p => (
          <a
            key={p.name}
            href={p.url}
            target={p.live ? "_blank" : undefined}
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <div style={{
              background: p.live ? "var(--bg1)" : "rgba(251,146,60,0.04)",
              border: "1px solid " + (p.live ? "var(--bd)" : "rgba(251,146,60,0.28)"),
              borderRadius: 10, padding: "18px 20px",
              height: "100%", transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = p.live ? "var(--bdh)" : "rgba(251,146,60,0.6)"
              el.style.background  = p.live ? "var(--bg2)" : "rgba(251,146,60,0.08)"
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = p.live ? "var(--bd)" : "rgba(251,146,60,0.28)"
              el.style.background  = p.live ? "var(--bg1)" : "rgba(251,146,60,0.04)"
            }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: p.live ? "var(--tx)" : "var(--or)" }}>
                  {p.name}
                </div>
                <span style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700,
                  padding: "2px 6px", borderRadius: 3,
                  background: p.live ? "rgba(52,211,153,0.12)" : "rgba(251,146,60,0.15)",
                  color:      p.live ? "var(--em)"              : "var(--or)",
                }}>{p.live ? "LIVE" : "BUILDING"}</span>
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--or)", marginBottom: 8 }}>
                {p.url.replace("https://", "")}
              </div>
              <div style={{ fontSize: 12, color: "var(--di)", lineHeight: 1.55, marginBottom: 10 }}>
                {p.desc}
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--mu)" }}>
                {p.tech}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}