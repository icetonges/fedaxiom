"use client"
import Link      from "next/link"
import { usePathname } from "next/navigation"

const NAV = [
  {
    group: "Modules",
    items: [
      { href: "/studio",    label: "AI Studio",      color: "#22D3EE", badge: "CORE",  badgeColor: "#FCD34D" },
      { href: "/live-feed", label: "Live Feed",       color: "#FCD34D", badge: "LIVE",  badgeColor: "#34D399" },
      { href: "/knowledge", label: "Knowledge",       color: "#A78BFA" },
      { href: "/notebook",  label: "Notebook",        color: "#34D399" },
      { href: "/career",    label: "Career Tracker",  color: "#FB7185" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/projects", label: "Projects", color: "#FB923C", badge: "LIVE", badgeColor: "#34D399" },
    ],
  },
]

const MODELS = [
  { name: "Gemini 2.0 Flash", free: true  },
  { name: "Llama 3.3 70B",    free: true  },
  { name: "DeepSeek R1",      free: true  },
  { name: "Mixtral 8x7B",     free: true  },
  { name: "Gemini 2.5 Pro",   free: false },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: 200, flexShrink: 0,
      background: "var(--bg1)",
      borderRight: "1px solid var(--bd)",
      padding: "14px 0",
      height: "calc(100vh - 46px)",
      overflowY: "auto",
      position: "sticky", top: 0,
    }}>

      {NAV.map(section => (
        <div key={section.group}>
          <div style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 9,
            color: "var(--mu)", letterSpacing: "0.12em", textTransform: "uppercase",
            padding: "6px 16px 3px",
          }}>
            {section.group}
          </div>

          {section.items.map(item => {
            const active = path === item.href || path.startsWith(item.href + "/")
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 12px 9px 14px", fontSize: 13,
                  color: active ? item.color : "var(--di)",
                  borderLeft: "2px solid " + (active ? item.color : "transparent"),
                  background: active ? item.color + "14" : "transparent",
                  transition: "all 0.15s", cursor: "pointer",
                }}>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span style={{
                      fontFamily: "JetBrains Mono, monospace", fontSize: 9, fontWeight: 700,
                      padding: "1px 5px", borderRadius: 2,
                      background: ("badgeColor" in item ? item.badgeColor : "#FCD34D") + "22",
                      color: "badgeColor" in item ? item.badgeColor : "#FCD34D",
                    }}>{item.badge}</span>
                  )}
                </div>
              </Link>
            )
          })}

          <div style={{ height: 1, background: "var(--bd)", margin: "10px 14px" }} />
        </div>
      ))}

      {/* Models box */}
      <div style={{
        margin: "4px 12px",
        background: "rgba(52,211,153,0.06)",
        border: "1px solid rgba(52,211,153,0.18)",
        borderRadius: 7, padding: "10px 12px",
      }}>
        <div style={{
          fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "var(--em)",
          textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
        }}>
          Models Ready
        </div>
        {MODELS.map(m => (
          <div key={m.name} style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 10,
            color: m.free ? "var(--di)" : "var(--mu)", lineHeight: 1.9,
            display: "flex", justifyContent: "space-between",
          }}>
            <span>{m.name}</span>
            <span style={{ color: m.free ? "var(--em)" : "var(--mu)" }}>{m.free ? "✓" : "$"}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}