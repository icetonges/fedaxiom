import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/layout/TopNav";

export const metadata: Metadata = {
  title: "AXIOM · AI Engineering Platform",
  description: "Personal AI studio, live feed, knowledge base, and career tracker",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <div id="app-shell">
          <TopNav />
          <main id="main-content" style={{ height: "calc(100dvh - 56px)", overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
