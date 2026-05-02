"use client"
export function TopBar() {
  const news = [
    { label: "Gemini 2.5 Pro", detail: "1M token context released", tag: "MODEL", tagColor: "var(--cy)" },
    { label: "Claude Sonnet 4.5", detail: "extended thinking now available", tag: "ANTHROPIC", tagColor: "var(--vi)" },
    { label: "Llama 4 Scout", detail: "tops open-source benchmarks", tag: "OPEN SOURCE", tagColor: "var(--am)" },
    { label: "MCP standard", detail: "adopted by 50+ AI providers", tag: "PROTOCOL", tagColor: "var(--cy)" },
    { label: "Groq", detail: "DeepSeek R1 at 800 tok/s", tag: "INFERENCE", tagColor: "var(--em)" },
    { label: "LangGraph 0.3", detail: "native multi-agent orchestration", tag: "FRAMEWORK", tagColor: "var(--vi)" },
  ]
  const doubled = [...news, ...news]

  return (
    <div style={{
      background: "rgba(13,20,38,0.98)",
      borderBottom: "1px solid var(--bd)",
      display: "flex", alignItems: "center", gap: 14,
      height: 46, padding: "0 18px", flexShrink: 0,
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ fontWeight: 900, fontSize: 15, letterSpacing: "0.16em", color: "var(--cy)", whiteSpace: "nowrap" }}>
        AXIOM<span style={{ color: "rgba(241,245,249,0.3)" }}>.</span>AI
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        fontFamily: "JetBrains Mono, monospace", fontSize: 9,
        color: "var(--em)", background: "rgba(52,211,153,0.1)",
        border: "1px solid rgba(52,211,153,0.22)", padding: "2px 7px",
        borderRadius: 3, letterSpacing: "0.06em", flexShrink: 0,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--em)", display: "inline-block", animation: "pulse 1.6s infinite" }} />
        LIVE
      </div>

      <div style={{ flex: 1, overflow: "hidden", height: 15 }}>
        <div style={{
          display: "flex", gap: 56, whiteSpace: "nowrap",
          animation: "ticker 55s linear infinite",
          fontFamily: "JetBrains Mono, monospace", fontSize: 10,
          color: "var(--di)", alignItems: "center",
        }}>
          {doubled.map((item, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <b style={{ color: "var(--cy)" }}>{item.label}</b>
              {item.detail}
              <span style={{
                fontSize: 9, padding: "0 5px", borderRadius: 2,
                background: `${item.tagColor}18`, color: item.tagColor,
              }}>{item.tag}</span>
            </span>
          ))}
        </div>
      </div>

      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--mu)", whiteSpace: "nowrap" }}>
        <b style={{ color: "var(--di)" }}>Peter Shang</b> · GS-15 → AI Engineer
      </div>

      <style>{`
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.25 } }
      `}</style>
    </div>
  )
}