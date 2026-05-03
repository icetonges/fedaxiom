"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Sun, Moon, Menu, X, Bot, Rss, BookOpen, FileText, TrendingUp, FolderOpen, Code2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/studio",        label: "AI Studio",  icon: Bot        },
  { href: "/live-feed",     label: "Live Feed",   icon: Rss        },
  { href: "/knowledge",     label: "Knowledge",   icon: BookOpen   },
  { href: "/notebook",      label: "Notebook",    icon: FileText   },
  { href: "/career",        label: "Career",      icon: TrendingUp },
  { href: "/projects",      label: "Projects",    icon: FolderOpen },
  { href: "/code-analysis", label: "Code Intel",  icon: Code2      },
];

// Home route — logo links here
const HOME_HREF = "/";

export function TopNav() {
  const path = usePathname();
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => { setMobileOpen(false); }, [path]);

  return (
    <>
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: "58px",
        background: "var(--bg1)",
        borderBottom: "1px solid var(--bd)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "var(--shadow)",
        gap: "16px",
      }}>

        {/* LEFT: Logo → home page */}
        <Link href={HOME_HREF} style={{
          display: "flex", alignItems: "center", gap: "9px",
          textDecoration: "none", flexShrink: 0,
        }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "9px",
            background: "linear-gradient(135deg, var(--bl) 0%, var(--vi) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            flexShrink: 0, boxShadow: "0 2px 8px rgba(79,142,247,0.35)",
          }}>
            <Cpu size={17} />
          </div>
          <span style={{
            fontSize: "1.1rem", fontWeight: 800,
            background: "linear-gradient(90deg, var(--bl), var(--vi))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "0.06em",
          }}>
            AXIOM
          </span>
        </Link>

        {/* RIGHT: Nav tabs + theme toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>

          {/* Desktop tabs */}
          <nav className="desktop-tabs" style={{ display: "flex", alignItems: "center", gap: "2px", marginRight: "8px" }}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = path === href || path.startsWith(href + "/");
              return (
                <Link key={href} href={href} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "8px 14px", borderRadius: "8px",
                  fontSize: "0.92rem", fontWeight: active ? 600 : 500,
                  color: active ? "var(--accent)" : "var(--tx2)",
                  textDecoration: "none",
                  background: active ? "rgba(79,142,247,0.12)" : "transparent",
                  border: active ? "1px solid rgba(79,142,247,0.25)" : "1px solid transparent",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}>
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <button
            onClick={() => setDark(d => !d)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: "38px", height: "38px", borderRadius: "9px",
              background: "var(--bg2)", border: "1px solid var(--bd)",
              color: "var(--tx2)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", flexShrink: 0,
            }}
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="mobile-only"
            style={{
              width: "38px", height: "38px", borderRadius: "9px",
              background: "var(--bg2)", border: "1px solid var(--bd)",
              color: "var(--tx2)", cursor: "pointer",
              display: "none", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="mobile-drawer" style={{
          background: "var(--bg1)",
          borderBottom: "1px solid var(--bd)",
          padding: "8px 14px 14px",
          display: "flex", flexDirection: "column", gap: "2px",
          position: "sticky", top: "58px", zIndex: 99,
        }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
                display: "flex", alignItems: "center", gap: "13px",
                padding: "13px 14px", borderRadius: "9px",
                fontSize: "1.05rem", fontWeight: active ? 600 : 500,
                color: active ? "var(--accent)" : "var(--tx2)",
                textDecoration: "none",
                background: active ? "rgba(79,142,247,0.10)" : "transparent",
              }}>
                <Icon size={19} />
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 820px) {
          .desktop-tabs { display: none !important; }
          .mobile-only  { display: flex !important; }
        }
        header a:hover {
          background: var(--bg2) !important;
          color: var(--tx) !important;
        }
      `}</style>
    </>
  );
}
