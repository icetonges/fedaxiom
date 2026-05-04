import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Mirror — Upload Route
//
// Strategy: the client extracts text BEFORE sending (FileReader API for
// TXT/MD; placeholder for PDF/DOCX which need server-side parsers in prod).
// We receive a small JSON payload instead of a raw binary file, staying well
// under Vercel's 4.5 MB serverless function payload limit.
//
// The chunk texts are returned to the client so it can persist them in
// localStorage — no database required for the demo.
//
// Production upgrade path:
//   1. Replace placeholder PDF/DOCX text with pdf-parse / mammoth extraction
//   2. Embed chunks with text-embedding-004
//   3. INSERT INTO knowledge_chunks (doc_id, content, embedding) in pgvector
//   4. Remove chunkTexts from response (DB stores them)
// ─────────────────────────────────────────────────────────────────────────────

const CHUNK_SIZE    = 800;   // characters per chunk
const CHUNK_OVERLAP = 120;   // character overlap between adjacent chunks

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

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let fileName: string;
    let text: string;
    let fileSize: number;

    if (contentType.includes("application/json")) {
      // Primary path: client already extracted the text
      const body = await req.json();
      fileName = body.fileName ?? "unknown";
      text     = body.text     ?? "";
      fileSize = body.fileSize ?? 0;
    } else {
      // Fallback: FormData — only safe for very small files (< ~4 MB)
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

      fileName = file.name;
      fileSize = file.size;

      const name = file.name.toLowerCase();
      if (name.endsWith(".txt") || name.endsWith(".md")) {
        text = await file.text();
      } else {
        // PDF / DOCX: return a descriptive placeholder
        // In production: use pdf-parse or mammoth here
        text = `[${file.name}] — PDF/DOCX parsing requires pdf-parse or mammoth.js. ` +
               `In this demo environment, convert your document to .txt or .md for real semantic search. ` +
               `The document metadata has been registered with ${Math.ceil(file.size / CHUNK_SIZE)} estimated chunks.`;
      }
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "No extractable text content" }, { status: 400 });
    }

    const chunks = chunkText(text);
    const docId  = crypto.randomUUID();

    return NextResponse.json({
      id:         docId,
      name:       fileName,
      size:       fileSize,
      chunks:     chunks.length,
      chunkTexts: chunks,   // returned so client can store in localStorage
      status:     "ready",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export const runtime    = "nodejs";
export const maxDuration = 30;
