"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu, Sun, Moon, Menu, X,
  Bot, Rss, BookOpen, FileText, TrendingUp, FolderOpen
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/studio",     label: "AI Studio",    icon: Bot        },
  { href: "/live-feed",  label: "Live Feed",     icon: Rss        },
  { href: "/knowledge",  label: "Knowledge",     icon: BookOpen   },
  { href: "/notebook",   label: "Notebook",      icon: FileText   },
  { href: "/career",     label: "Career",        icon: TrendingUp },
  { href: "/projects",   label: "Projects",      icon: FolderOpen },
];

export function TopNav() {
  const path = usePathname();
  const [dark, setDark] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Apply theme to <html> element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [path]);

  // Close mobile menu on resize
  useEffect(() => {
    const handle = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return (
    <>
      <header className="topnav">
        {/* Logo */}
        <Link href="/studio" className="topnav-logo">
          <div className="logo-icon"><Cpu size={16} /></div>
          <span className="logo-text">AXIOM</span>
        </Link>

        {/* Desktop tabs */}
        <nav className="topnav-tabs">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-tab ${path === href || path.startsWith(href + "/") ? "active" : ""}`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Right controls */}
        <div className="topnav-right">
          <button
            className="icon-btn"
            onClick={() => setDark((d) => !d)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-drawer">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`mobile-nav-item ${path === href ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        /* ── Top nav bar ─────────────────────── */
        .topnav {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 20px;
          height: 56px;
          background: var(--bg1);
          border-bottom: 1px solid var(--bd);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: var(--shadow);
        }

        /* ── Logo ────────────────────────────── */
        .topnav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          margin-right: 16px;
          flex-shrink: 0;
        }
        .logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--cy);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .logo-text {
          font-size: 1rem;
          font-weight: 700;
          color: var(--tx);
          letter-spacing: 0.05em;
        }

        /* ── Desktop tabs ─────────────────────── */
        .topnav-tabs {
          display: flex;
          align-items: center;
          gap: 2px;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .topnav-tabs::-webkit-scrollbar { display: none; }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--tx2);
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .nav-tab:hover {
          background: var(--bg2);
          color: var(--tx);
        }
        .nav-tab.active {
          background: var(--bg2);
          color: var(--cy);
          border-color: var(--bd);
          font-weight: 600;
        }

        /* ── Right controls ─────────────────── */
        .topnav-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          margin-left: auto;
        }
        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--bg2);
          border: 1px solid var(--bd);
          color: var(--tx2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .icon-btn:hover { color: var(--tx); border-color: var(--bdh); }

        /* ── Mobile menu button ─────────────── */
        .mobile-menu-btn { display: none; }

        /* ── Mobile drawer ──────────────────── */
        .mobile-drawer {
          display: none;
          flex-direction: column;
          background: var(--bg1);
          border-bottom: 1px solid var(--bd);
          padding: 8px 12px 16px;
          gap: 2px;
          position: sticky;
          top: 56px;
          z-index: 99;
        }
        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          color: var(--tx2);
          text-decoration: none;
          transition: all 0.15s;
        }
        .mobile-nav-item:hover { background: var(--bg2); color: var(--tx); }
        .mobile-nav-item.active { background: var(--bg2); color: var(--cy); font-weight: 600; }

        /* ── Responsive ─────────────────────── */
        @media (max-width: 768px) {
          .topnav-tabs { display: none; }
          .mobile-menu-btn { display: flex; }
          .mobile-drawer { display: flex; }
          .topnav { padding: 0 14px; }
        }

        @media (max-width: 480px) {
          .logo-text { display: none; }
        }
      `}</style>
    </>
  );
}
