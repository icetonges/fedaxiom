import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// In production, this route:
//   1. Embeds the query with Gemini embedding-001
//   2. Runs pgvector similarity search: SELECT * FROM knowledge_chunks ORDER BY embedding <=> $1 LIMIT 5
//   3. Feeds top chunks + query to Gemini Flash for answer generation
//   4. Returns answer + source citations

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Simulated in-memory chunk store (replace with pgvector queries)
const DEMO_CHUNKS: Record<string, { content: string; doc: string }[]> = {};

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  return dot / (magA * magB);
}

export async function POST(req: NextRequest) {
  try {
    const { query, docIds } = await req.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // ── In production: embed query + run pgvector search ──────────────────
    // const embModel = genAI.getGenerativeModel({ model: "text-embedding-004" })
    // const queryEmb = (await embModel.embedContent(query)).embedding.values
    // const chunks = await db.query(
    //   `SELECT content, doc_name, 1 - (embedding <=> $1::vector) AS score
    //    FROM knowledge_chunks
    //    WHERE doc_id = ANY($2)
    //    ORDER BY score DESC LIMIT 5`,
    //   [JSON.stringify(queryEmb), docIds]
    // )
    // ─────────────────────────────────────────────────────────────────────

    // Demo: generate an answer with Gemini using the query
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const contextNote = docIds && docIds.length > 0
      ? `The user has uploaded ${docIds.length} document(s) to the knowledge base.`
      : "No documents are indexed yet.";

    const prompt = `You are an AI assistant for a knowledge base system called AXIOM Knowledge Mirror.

${contextNote}

The user asked: "${query}"

Since this is a demo environment (no live pgvector database connected), provide a helpful response that:
1. Acknowledges what the system would do in production
2. Gives a genuinely useful answer to the question if possible
3. Explains that connecting Neon PostgreSQL with pgvector would enable semantic search over their actual documents

Keep your response concise and practical.`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    // Simulated source chunks
    const sources = docIds && docIds.length > 0
      ? [
          {
            chunk: `Relevant content from document matching "${query}" would appear here with pgvector similarity search enabled.`,
            score: 0.92,
            doc: "Document 1",
          },
          {
            chunk: `Additional context chunks would be retrieved based on cosine similarity to your query embedding.`,
            score: 0.81,
            doc: "Document 2",
          },
        ]
      : [];

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("Embeddings error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export const runtime = "nodejs";
