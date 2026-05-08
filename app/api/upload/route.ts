import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { saveKnowledgeDoc } from "@/lib/db/interactions";

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Mirror — Upload Route  (v2)
//
// Flow:
//   1. Client extracts text client-side (FileReader for TXT/MD)
//   2. POST JSON { fileName, text, fileSize } — no binary, no size-limit issues
//   3. Server chunks the text (800 chars, 120 overlap)
//   4. Uploads raw text to Vercel Blob for durable storage
//   5. Saves KnowledgeDoc record to Neon via Prisma
//   6. Returns chunks to client so it can also cache in localStorage
// ─────────────────────────────────────────────────────────────────────────────

const CHUNK_SIZE    = 800;
const CHUNK_OVERLAP = 120;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + CHUNK_SIZE).trim();
    if (chunk) chunks.push(chunk);
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

/** Infer a rough category from the file name */
function inferCategory(fileName: string): string {
  const name = fileName.toLowerCase();
  if (name.includes("meeting") || name.includes("minutes")) return "meetings";
  if (name.includes("research") || name.includes("paper"))   return "research";
  if (name.includes("manual") || name.includes("guide"))     return "guides";
  if (name.includes("code") || name.includes("impl"))        return "code";
  if (name.includes("spec") || name.includes("require"))     return "specs";
  return "general";
}

/** Extract simple word tags from the first 400 chars of content */
function extractTags(text: string, fileName: string): string[] {
  const tags = new Set<string>();

  // Tags from file extension
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext) tags.add(ext);

  // Common domain keywords in content
  const domainKeywords = [
    "react", "typescript", "python", "agent", "llm", "api", "database",
    "security", "cloud", "docker", "kubernetes", "aws", "azure", "gcp",
    "machine learning", "ai", "neural", "model", "training", "inference",
  ];
  const lower = text.slice(0, 1000).toLowerCase();
  for (const kw of domainKeywords) {
    if (lower.includes(kw)) tags.add(kw.replace(" ", "-"));
  }

  return [...tags].slice(0, 8);
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let fileName: string;
    let text: string;
    let fileSize: number;

    // ── Parse request ─────────────────────────────────────────────────────────
    if (contentType.includes("application/json")) {
      const body = await req.json();
      fileName   = body.fileName ?? "unknown";
      text       = body.text     ?? "";
      fileSize   = body.fileSize ?? 0;
    } else {
      // FormData fallback (small files only)
      const formData = await req.formData();
      const file     = formData.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

      fileName = file.name;
      fileSize = file.size;
      const name = file.name.toLowerCase();

      if (name.endsWith(".txt") || name.endsWith(".md")) {
        text = await file.text();
      } else {
        text =
          `[${file.name}] — PDF/DOCX parsing requires pdf-parse or mammoth.js. ` +
          `Convert to .txt or .md for full semantic search.`;
      }
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "No extractable text content" }, { status: 400 });
    }

    // ── Chunk ─────────────────────────────────────────────────────────────────
    const chunks = chunkText(text);
    const docId  = crypto.randomUUID();

    // ── Upload raw text to Vercel Blob (best-effort) ──────────────────────────
    let blobUrl: string | undefined;
    try {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const blob = await put(
          `knowledge/${docId}/${fileName}`,
          new Blob([text], { type: "text/plain" }),
          { access: "public" }
        );
        blobUrl = blob.url;
      }
    } catch (blobErr) {
      // Blob not configured or failed — continue without it
      console.warn("[upload] Blob upload skipped:", blobErr);
    }

    // ── Save KnowledgeDoc to Neon (best-effort) ───────────────────────────────
    try {
      await saveKnowledgeDoc({
        id:         docId,
        title:      fileName,
        content:    text,
        category:   inferCategory(fileName),
        tags:       extractTags(text, fileName),
        blobUrl,
        chunkCount: chunks.length,
      });
    } catch (dbErr) {
      // DB not connected in dev — continue without it
      console.warn("[upload] KnowledgeDoc DB save skipped:", dbErr);
    }

    return NextResponse.json({
      id:         docId,
      name:       fileName,
      size:       fileSize,
      chunks:     chunks.length,
      chunkTexts: chunks,       // for localStorage cache
      blobUrl,
      status:     "ready",
    });
  } catch (error) {
    console.error("[upload] Unhandled error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export const runtime     = "nodejs";
export const maxDuration = 30;
