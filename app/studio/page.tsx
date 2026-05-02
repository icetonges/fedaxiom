"use client"; // <--- Add this line!

const PROJECTS = [
  { name: "ShangThing",       url: "https://shangthing.vercel.app/",    tech: "Next.js · TypeScript",          desc: "Personal platform and portfolio hub." },
  { name: "FedFM",            url: "https://fedfm.vercel.app/",         tech: "Next.js · AI Summaries",        desc: "Federal news aggregator with AI-powered summarization." },
  { name: "PalantirLearning", url: "https://palantirthing.vercel.app/", tech: "React · Defense Analytics",     desc: "Defense analytics learning platform inspired by Palantir." },
  { name: "PeterShang.AI",    url: "https://petershang.vercel.app/",    tech: "Next.js · Gemini AI",           desc: "Personal AI portfolio with Gemini-powered chatbot." },
  { name: "AIML.Gov",         url: "https://aimlgov.vercel.app/",       tech: "Next.js · Research",            desc: "AI/ML in government — policy, research, and applications." },
  { name: "MLAIThing",        url: "https://mlaithing.vercel.app/",     tech: "Next.js · Experiments",        desc: "ML/AI experiments and prototypes." },
  { name: "AXIOM",            url: "#",                                  tech: "Next.js 15 · Gemini · Groq",   desc: "This platform — personal AI engineering studio.", building: true },
]

export default function ProjectsPage() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--or)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>
          // projects
        </div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          Deployed <span style={{ color: "var(--or)" }}>Applications</span>
        </div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--mu)", marginTop: 5 }}>
          {PROJECTS.length} projects · all live on Vercel
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {PROJECTS.map(p => (
          <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{
              background: p.building ? "rgba(251,146,60,0.04)" : "var(--bg1)",
              border: `1px solid ${p.building ? "rgba(251,146,60,0.3)" : "var(--bd)"}`,
              borderRadius: 10, padding: "18px 20px", height: "100%",
              transition: "all 0.15s", cursor: "pointer",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = p.building ? "rgba(251,146,60,0.6)" : "var(--bdh)"; (e.currentTarget as HTMLElement).style.background = p.building ? "rgba(251,146,60,0.08)" : "var(--bg2)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = p.building ? "rgba(251,146,60,0.3)" : "var(--bd)"; (e.currentTarget as HTMLElement).style.background = p.building ? "rgba(251,146,60,0.04)" : "var(--bg1)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: p.building ? "var(--or)" : "var(--tx)" }}>
                  {p.name}
                </div>
                <span style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700,
                  padding: "2px 6px", borderRadius: 3,
                  background: p.building ? "rgba(251,146,60,0.15)" : "rgba(52,211,153,0.12)",
                  color: p.building ? "var(--or)" : "var(--em)",
                }}>{p.building ? "BUILDING" : "LIVE"}</span>
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--or)", marginBottom: 8 }}>
                {p.url.replace("https://", "")}
              </div>
              <div style={{ fontSize: 12, color: "var(--di)", lineHeight: 1.5, marginBottom: 10 }}>
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