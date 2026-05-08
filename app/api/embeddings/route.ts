import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logAI } from "@/lib/db/interactions";

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge Mirror — Smart Embeddings / Query Route  (v2)
//
// Retrieval pipeline:
//   1. Keyword pre-filter  → top-20 candidates  (fast, O(n))
//   2. Real vector embedding via text-embedding-004  → cosine re-rank
//   3. Gemini 2.5 Flash grounded answer  → returns structured JSON
//      { answer, keyPoints, processFlow, codeSnippets, followUpQuestions, confidence }
//   4. Fire-and-forget DB log via AILog table
// ─────────────────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface Chunk       { content: string; doc: string }
interface ScoredChunk extends Chunk { score: number }

export interface StructuredAnswer {
  answer:              string;
  keyPoints:           string[];
  processFlow:         { step: number; title: string; detail: string }[];
  codeSnippets:        { lang: string; title: string; code: string }[];
  followUpQuestions:   string[];
  confidence:          number;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

/** Fast keyword pre-filter: score each chunk by term frequency, return top-N */
function keywordPreFilter(chunks: Chunk[], query: string, n = 20): ScoredChunk[] {
  const words = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  if (words.length === 0) return chunks.slice(0, n).map(c => ({ ...c, score: 0.5 }));

  return chunks
    .map(c => {
      const lower = c.content.toLowerCase();
      const score = words.reduce((s, w) => {
        const hits = (lower.match(new RegExp(w, "g")) || []).length;
        // Phrase-level boost: if the full query appears in the chunk
        const phraseBoost = lower.includes(query.toLowerCase()) ? 5 : 0;
        return s + hits + phraseBoost;
      }, 0);
      return { ...c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/** Strip any accidental markdown code fences from Gemini JSON output */
function stripFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body          = await req.json();
    const query: string   = (body.query ?? "").trim();
    const chunks: Chunk[] = body.chunks ?? [];

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const flashModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ── No documents ─────────────────────────────────────────────────────────
    if (chunks.length === 0) {
      const r = await flashModel.generateContent(
        `The user asked: "${query}"\n\n` +
        `No documents are in the Knowledge Mirror yet. ` +
        `Warmly let them know they need to upload at least one .txt or .md file first. ` +
        `Suggest what kinds of documents work best.`
      );
      return NextResponse.json({
        answer:     r.response.text(),
        structured: null,
        sources:    [],
        searchMode: "no-docs",
      });
    }

    // ── Phase 1: keyword pre-filter → top 20 ─────────────────────────────────
    const candidates = keywordPreFilter(chunks, query, 20);

    // ── Phase 2: real vector re-rank via text-embedding-004 ──────────────────
    let top5: ScoredChunk[];
    let searchMode = "semantic";

    try {
      const embModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

      // Embed query + all candidates in parallel (cap chunk length to 2 000 chars)
      const [queryResult, ...chunkResults] = await Promise.all([
        embModel.embedContent(query),
        ...candidates.map(c => embModel.embedContent(c.content.slice(0, 2000))),
      ]);

      const qVec = queryResult.embedding.values;
      const reRanked = candidates.map((c, i) => ({
        ...c,
        score: cosine(qVec, chunkResults[i].embedding.values),
      }));

      top5 = reRanked.sort((a, b) => b.score - a.score).slice(0, 5);
    } catch (embErr) {
      // Embedding API quota or network error — fall back to keyword scores
      console.warn("[embeddings] Vector embedding failed, using keyword fallback:", embErr);
      top5       = candidates.slice(0, 5);
      searchMode = "keyword";
    }

    // Normalise scores 0–1
    const maxScore = Math.max(...top5.map(c => c.score), 0.001);
    const sources  = top5.map(c => ({
      chunk: c.content,
      score: Math.min(c.score / maxScore, 1),
      doc:   c.doc,
    }));

    // ── Phase 3: structured Gemini answer ────────────────────────────────────
    const context = top5
      .map((c, i) => `[Source ${i + 1} — ${c.doc}]\n${c.content}`)
      .join("\n\n---\n\n");

    const systemPrompt =
      `You are an expert AI knowledge assistant for AXIOM Knowledge Mirror.\n` +
      `You analyse technical and domain documents and produce structured, educational answers.\n` +
      `Always ground your answer in the provided sources. Cite [Source N] inline.`;

    const structuredPrompt =
      `${systemPrompt}\n\n` +
      `DOCUMENT EXCERPTS:\n${context}\n\n` +
      `USER QUESTION: ${query}\n\n` +
      `Respond with ONLY a valid JSON object in this exact structure (no markdown, no code fences):\n` +
      `{\n` +
      `  "answer": "<Comprehensive 2-4 paragraph answer that cites [Source N] where relevant. Be specific and use technical depth.>",\n` +
      `  "keyPoints": ["<concrete key fact 1>", "<concrete key fact 2>", "<concrete key fact 3>"],\n` +
      `  "processFlow": [\n` +
      `    { "step": 1, "title": "<step name>", "detail": "<what happens in this step>" }\n` +
      `  ],\n` +
      `  "codeSnippets": [\n` +
      `    { "lang": "typescript", "title": "<what this code does>", "code": "<the actual code>" }\n` +
      `  ],\n` +
      `  "followUpQuestions": ["<natural follow-up question 1>", "<question 2>", "<question 3>"],\n` +
      `  "confidence": <number 0.0 to 1.0 representing how well the sources answer the question>\n` +
      `}\n\n` +
      `Rules:\n` +
      `- keyPoints: 3–6 bullet points — the most important concrete facts from the sources\n` +
      `- processFlow: fill only if a sequential process, algorithm, or workflow is described; otherwise empty array []\n` +
      `- codeSnippets: fill only if actual code appears in the sources; otherwise empty array []\n` +
      `- followUpQuestions: 2–3 questions the user would naturally want to ask next\n` +
      `- confidence: 0.9+ means sources directly answer the question; below 0.4 means poor match\n` +
      `- If confidence < 0.4, say so clearly in the answer and suggest better search terms`;

    const result  = await flashModel.generateContent(structuredPrompt);
    const rawText = result.response.text().trim();

    let structured: StructuredAnswer | null = null;
    try {
      structured = JSON.parse(stripFences(rawText)) as StructuredAnswer;
    } catch {
      // JSON parse failed — return raw text as plain answer
      structured = null;
    }

    const answer = structured?.answer ?? rawText;

    // ── DB log (fire-and-forget) ──────────────────────────────────────────────
    void logAI({
      page:     "knowledge",
      prompt:   query,
      response: answer,
      model:    "gemini-2.5-flash",
      metadata: {
        searchMode,
        sourceCount:    sources.length,
        latencyMs:      Date.now() - t0,
        confidence:     structured?.confidence ?? null,
        docNames:       [...new Set(top5.map(c => c.doc))],
        keyPointsCount: structured?.keyPoints?.length ?? 0,
      },
    });

    return NextResponse.json({ answer, structured, sources, searchMode });
  } catch (error) {
    console.error("[embeddings] Unhandled error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export const runtime     = "nodejs";
export const maxDuration = 30;
