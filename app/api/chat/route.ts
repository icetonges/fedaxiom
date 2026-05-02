import { NextResponse } from "next/server"

const FEEDS = [
  { url: "https://huggingface.co/blog/feed.xml",     source: "HuggingFace", tag: "models"   },
  { url: "https://github.blog/feed/",                source: "GitHub Blog", tag: "dev"      },
  { url: "https://www.marktechpost.com/feed/",       source: "MarkTechPost",tag: "ai-news"  },
  { url: "https://www.anthropic.com/rss.xml",        source: "Anthropic",   tag: "claude"   },
  { url: "https://openai.com/blog/rss.xml",          source: "OpenAI",      tag: "openai"   },
]

async function parseFeed(url: string, source: string, tag: string) {
  try {
    const res  = await fetch(url, { next: { revalidate: 900 } })
    const text = await res.text()
    const out: { title: string; link: string; date: string; source: string; tag: string }[] = []

    // Match <item> blocks
    const itemRx = /<item[^>]*>([\s\S]*?)<\/item>/g
    let m: RegExpExecArray | null
    while ((m = itemRx.exec(text)) !== null && out.length < 8) {
      const block = m[1]
      const title = (
        block.match(/<title[^>]*><!\[CDATA\[(.+?)\]\]><\/title>/s)?.[1] ??
        block.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] ?? ""
      ).trim()
      const link = (
        block.match(/<link[^>]*>([^<]+)<\/link>/)?.[1] ??
        block.match(/<link href="([^"]+)"/)?.[1] ?? ""
      ).trim()
      const date = block.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim() ?? ""
      if (title) out.push({ title, link, date, source, tag })
    }
    return out
  } catch {
    return []
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    FEEDS.map(f => parseFeed(f.url, f.source, f.tag))
  )
  const items = results
    .flatMap(r => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())

  return NextResponse.json({ items }, {
    headers: { "Cache-Control": "s-maxage=900, stale-while-revalidate" },
  })
}