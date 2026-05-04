"use client"
import { useEffect, useState } from "react"
import { ExternalLink, RefreshCw } from "lucide-react"

interface FeedItem { title: string; link: string; date: string; source: string; tag: string }

const TAG_COLORS: Record<string, string> = {
  models:    "#22D3EE",
  dev:       "#A78BFA",
  "ai-news": "#FCD34D",
  claude:    "#34D399",
  openai:    "#60A5FA",
  research:  "#FB7185",
}

export default function LiveFeedPage() {
  const [items, setItems]     = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState("all")
  const [error, setError]     = useState("")

  const load = () => {
    setLoading(true)
    fetch("/api/news")
      .then(r => r.json())
      .then(d => { setItems(d.items ?? []); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const tags    = ["all", ...Array.from(new Set(items.map(i => i.tag)))]
  const visible = filter === "all" ? items : items.filter(i => i.tag === filter)

  return (
    <div style={{ padding: "28px 24px", maxWidth: 900, margin: "0 auto" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--am)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace" }}>
          // live feed
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "var(--tx)", marginBottom: 6, lineHeight: 1.2 }}>
          AI <span style={{ color: "var(--am)" }}>Intelligence</span> Feed
        </div>
        <div style={{ fontSize: 14, color: "var(--tx2)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <span>HuggingFace · GitHub · Anthropic · MarkTechPost · OpenAI — refreshed every 15 min</span>
          <button onClick={load} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600,
            background: "var(--bg2)", border: "1px solid var(--bd)",
            color: "var(--tx2)", cursor: "pointer",
          }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
        {tags.map(tag => {
          const color = TAG_COLORS[tag] ?? "var(--di)"
          const active = filter === tag
          return (
            <button key={tag} onClick={() => setFilter(tag)} style={{
              fontSize: 13, fontWeight: 600, padding: "5px 14px",
              borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
              border: `1px solid ${active ? color : "var(--bd)"}`,
              background: active ? `${color}18` : "transparent",
              color: active ? color : "var(--tx2)",
              letterSpacing: "0.02em",
            }}>
              {tag}
            </button>
          )
        })}
      </div>

      {/* ── States ── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "60px 0", color: "var(--tx2)", fontSize: 15 }}>
          <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
          Fetching feeds…
        </div>
      )}
      {error && (
        <div style={{ padding: "14px 16px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8, color: "#f87171", fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Feed items ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((item, i) => {
          const color = TAG_COLORS[item.tag] ?? "var(--di)"
          return (
            <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
               style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--bg1)", border: "1px solid var(--bd)",
                borderRadius: 10, padding: "16px 18px",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "var(--bdh)"
                el.style.background  = "var(--bg2)"
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = "var(--bd)"
                el.style.background  = "var(--bg1)"
              }}>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Title */}
                  <div style={{ fontSize: 15, fontWeight: 600, color: "var(--tx)", marginBottom: 6, lineHeight: 1.45, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ flex: 1 }}>{item.title}</span>
                    <ExternalLink size={13} style={{ color: "var(--tx3)", flexShrink: 0, marginTop: 2 }} />
                  </div>
                  {/* Meta row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: "var(--tx2)", fontWeight: 500 }}>{item.source}</span>
                    <span style={{ color: "var(--tx3)", fontSize: 12 }}>·</span>
                    <span style={{ fontSize: 13, color: "var(--tx3)" }}>
                      {item.date ? new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </span>
                  </div>
                </div>

                {/* Tag badge */}
                <span style={{
                  flexShrink: 0, fontSize: 12, fontWeight: 700,
                  padding: "3px 10px", borderRadius: 5,
                  background: `${color}20`, color,
                  border: `1px solid ${color}30`,
                  alignSelf: "flex-start", whiteSpace: "nowrap",
                }}>
                  {item.tag}
                </span>

              </div>
            </a>
          )
        })}
      </div>

      {/* ── Empty state ── */}
      {!loading && visible.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--tx2)", fontSize: 15 }}>
          No items found · check RSS sources or try refreshing
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
