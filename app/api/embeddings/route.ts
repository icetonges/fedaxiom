import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Mirror — Embeddings / Query Route
//
// Receives the actual chunk texts from the client (stored in localStorage),
// ranks them by keyword overlap, picks the top-5, then calls Gemini Flash
// to generate a grounded answer with source citations.
//
// Production upgrade path:
//   1. Embed the query with text-embedding-004
//   2. Run pgvector similarity search (chunks already stored in DB)
//   3. Remove the `chunks` parameter — DB handles retrieval
// ─────────────────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface Chunk { content: string; doc: string }
interface ScoredChunk extends Chunk { score: number }

/** Simple TF keyword scorer — good enough without real embeddings */
function rankChunks(chunks: Chunk[], query: string): ScoredChunk[] {
  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 2);

  return chunks.map(c => {
    const lower = c.content.toLowerCase();
    const score = words.reduce((s, w) => {
      // count occurrences, boost exact phrase match
      const count = (lower.match(new RegExp(w, "g")) || []).length;
      return s + count;
    }, 0);
    return { ...c, score };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string           = body.query ?? "";
    const chunks: Chunk[]         = body.chunks ?? [];   // from localStorage

    if (!query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ── No documents uploaded yet ────────────────────────────────────────────
    if (chunks.length === 0) {
      const result = await model.generateContent(
        `The user asked: "${query}"\n\n` +
        `No documents have been uploaded to the knowledge base yet. ` +
        `Politely let them know they need to upload at least one document first, ` +
        `then they can ask questions about its content.`
      );
      return NextResponse.json({ answer: result.response.text(), sources: [] });
    }

    // ── Rank and pick top 5 chunks ───────────────────────────────────────────
    const scored = rankChunks(chunks, query);
    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5);

    // Normalise scores 0–1 for display
    const maxScore = Math.max(...scored.map(c => c.score), 1);
    const sources = top5.map(c => ({
      chunk: c.content,
      score: maxScore > 0 ? Math.min(c.score / maxScore, 1) : 0.5,
      doc:   c.doc,
    }));

    // ── Build grounded prompt ────────────────────────────────────────────────
    const context = top5
      .map((c, i) => `[Source ${i + 1} — ${c.doc}]\n${c.content}`)
      .join("\n\n---\n\n");

    const prompt =
      `You are an AI assistant for a knowledge base called AXIOM Knowledge Mirror.\n` +
      `Answer the user's question using ONLY the document excerpts below.\n` +
      `Cite sources as [Source N]. If the answer isn't in the excerpts, say so.\n\n` +
      `DOCUMENT EXCERPTS:\n${context}\n\n` +
      `USER QUESTION: ${query}`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("Embeddings error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export const runtime = "nodejs";
