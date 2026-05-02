import { NextRequest, NextResponse } from "next/server";

// This route handles file upload and chunking for the Knowledge Mirror.
// In production:
//   1. Save file to Vercel Blob: const blob = await put(file.name, file, { access: 'private' })
//   2. Parse content (pdf-parse, mammoth for docx, plain text for md/txt)
//   3. Chunk content (sliding window, ~500 tokens each)
//   4. Embed chunks with Gemini embedding-001 or OpenAI ada-002
//   5. Store vectors in pgvector table
//
// The in-memory demo below simulates this flow without DB dependencies.

const CHUNK_SIZE = 800; // characters per chunk

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
    i += CHUNK_SIZE - 100; // 100 char overlap
  }
  return chunks;
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return await file.text();
  }
  
  if (name.endsWith(".pdf")) {
    // In production: const pdf = await pdfParse(Buffer.from(await file.arrayBuffer()))
    // return pdf.text
    return `[PDF content from ${file.name}] — In production, connect pdf-parse to extract real text from this PDF file. The content would be chunked and embedded into pgvector for semantic search.`;
  }
  
  if (name.endsWith(".docx")) {
    // In production: const { value } = await mammoth.extractRawText({ buffer: ... })
    return `[DOCX content from ${file.name}] — In production, connect mammoth.js to extract text from this Word document. The content would then be embedded and stored in your Neon pgvector database.`;
  }
  
  return `[Content from ${file.name}]`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
    }

    const text = await extractText(file);
    const chunks = chunkText(text);
    
    // In production: embed + store in pgvector here
    // const embeddings = await embedChunks(chunks)
    // await db.query(`INSERT INTO knowledge_chunks (doc_id, content, embedding) VALUES ...`)

    const docId = crypto.randomUUID();

    return NextResponse.json({
      id: docId,
      name: file.name,
      size: file.size,
      chunks: chunks.length,
      status: "ready",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export const runtime = "nodejs";
