import { NextResponse } from "next/server"

const FEEDS = [
  { url: "https://huggingface.co/blog/feed.xml",       source: "HuggingFace", tag: "models" },
  { url: "https://github.blog/feed/",                  source: "GitHub Blog", tag: "dev" },
  { url: "https://www.marktechpost.com/feed/",         source: "MarkTechPost", tag: "ai-news" },
  { url: "https://www.anthropic.com/rss.xml",          source: "Anthropic",   tag: "claude" },
]

async function parseFeed(url: string, source: string, tag: string) {
  try {
    const res  = await fetch(url, { next: { revalidate: 900 } })
    const text = await res.text()
    const items: { title: string; link: string; date: string; source: string; tag: string }[] = []

    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match
    while ((match = itemRegex.exec(text)) !== null && items.length < 8) {
      const block  = match[1]
      const title  = block.match(/<title[^>]*><!\[CDATA\[(.+?)\]\]><\/title>|<title[^>]*>(.+?)<\/title>/)?.[1] ?? ""
      const link   = block.match(/<link[^>]*>([^<]+)<\/link>|<link[^>]*\/>/)?.[1]?.trim() ?? ""
      const pubDate = block.match(/<pubDate>(.+?)<\/pubDate>/)?.[1] ?? ""
      if (title) items.push({ title: title.trim(), link, date: pubDate, source, tag })
    }
    return items
  } catch {
    return []
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(f => parseFeed(f.url, f.source, f.tag))
  )
  const items = results
    .flatMap(r => r.status === "fulfilled" ? r.value : [])
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  return NextResponse.json({ items }, {
    headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate" },
  })
}