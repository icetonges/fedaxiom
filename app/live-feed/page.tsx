"use client"
import { useEffect, useState } from "react"

interface FeedItem {
  title:   string
  link:    string
  date:    string
  source:  string
  tag:     string
}

const TAG_COLORS: Record<string, string> = {
  models:   "var(--cy)",
  dev:      "var(--vi)",
  "ai-news":"var(--am)",
  claude:   "var(--em)",
  research: "var(--ro)",
}

export default function LiveFeedPage() {
  const [items, setItems]     = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState("all")

  useEffect(() => {
    fetch("/api/news")
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const tags    = ["all", ...Array.from(new Set(items.map(i => i.tag)))]
  const visible = filter === "all" ? items : items.filter(i => i.tag === filter)

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--am)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 5 }}>
          // live feed
        </div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          AI <span style={{ color: "var(--am)" }}>Intelligence</span> Feed
        </div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--mu)", marginTop: 5 }}>
          Real-time AI news · models · research · frameworks
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {tags.map(tag => (
          <button key={tag} onClick={() => setFilter(tag)} style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 10,
            padding: "4px 12px", borderRadius: 4, cursor: "pointer",
            border: `1px solid ${filter === tag ? "var(--am)" : "var(--bd)"}`,
            background: filter === tag ? "rgba(252,211,77,0.1)" : "transparent",
            color: filter === tag ? "var(--am)" : "var(--di)",
          }}>{tag}</button>
        ))}
      </div>

      {loading && (
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--mu)", textAlign: "center", marginTop: 60 }}>
          Fetching latest AI news...
        </div>
      )}

      {/* Feed items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((item, i) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--bg1)", border: "1px solid var(--bd)",
              borderRadius: 8, padding: "14px 16px",
              transition: "all 0.15s", cursor: "pointer",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--bdh)"; (e.currentTarget as HTMLElement).style.background = "var(--bg2)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--bd)"; (e.currentTarget as HTMLElement).style.background = "var(--bg1)" }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--tx)", marginBottom: 4, lineHeight: 1.4 }}>
                  {item.title}
                </div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--mu)" }}>
                  {item.source} · {item.date ? new Date(item.date).toLocaleDateString() : ""}
                </div>
              </div>
              <span style={{
                flexShrink: 0, fontFamily: "JetBrains Mono, monospace", fontSize: 9,
                fontWeight: 700, padding: "2px 7px", borderRadius: 3,
                background: `${TAG_COLORS[item.tag] ?? "var(--di)"}18`,
                color: TAG_COLORS[item.tag] ?? "var(--di)",
              }}>{item.tag}</span>
            </div>
          </a>
        ))}
      </div>

      {!loading && visible.length === 0 && (
        <div style={{ textAlign: "center", marginTop: 60, color: "var(--mu)", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>
          No items found · check your network or RSS sources
        </div>
      )}
    </div>
  )
}