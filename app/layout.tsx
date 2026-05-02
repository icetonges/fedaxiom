import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"

export const metadata: Metadata = {
  title: "AXIOM · AI Engineering Platform",
  description: "Personal AI studio, live feed, knowledge base, and career tracker",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <TopBar />
        <div style={{ display: "flex", flex: 1 }}>
          <Sidebar />
          <main style={{ flex: 1, overflow: "auto" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}