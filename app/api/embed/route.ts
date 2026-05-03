/**
 * /api/embed — Semantic embedding demo
 *
 * Given 1–3 texts, embeds each with gemini-embedding-2 (3072-dim),
 * computes pairwise cosine similarities, and returns a structured report.
 *
 * Also supports a "search" mode: given a query + a list of passages,
 * returns them ranked by cosine similarity to the query.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      texts?: string[];          // up to 3 texts to compare pairwise
      query?: string;            // for ranked search mode
      passages?: string[];       // passages to rank against query
      model?: string;            // "text-embedding-004" | "gemini-embedding-2"
    };

    const embModel = body.model ?? "text-embedding-004";
    const model    = genAI.getGenerativeModel({ model: embModel });

    // ── Mode 1: Pairwise comparison ───────────────────────────────────────
    if (body.texts && body.texts.length >= 2) {
      const texts = body.texts.slice(0, 3);
      const embeddings = await Promise.all(
        texts.map(t => model.embedContent(t).then(r => r.embedding.values))
      );

      const dims = embeddings[0].length;

      // All pairwise similarities
      const pairs: { a: string; b: string; similarity: number }[] = [];
      for (let i = 0; i < texts.length; i++) {
        for (let j = i + 1; j < texts.length; j++) {
          pairs.push({
            a: texts[i].slice(0, 60),
            b: texts[j].slice(0, 60),
            similarity: cosineSimilarity(embeddings[i], embeddings[j]),
          });
        }
      }

      // Sample dimensions (first 8 of each vector)
      const samples = embeddings.map((e, i) => ({
        text:   texts[i].slice(0, 80),
        sample: e.slice(0, 8).map(v => parseFloat(v.toFixed(4))),
      }));

      return NextResponse.json({ mode: "compare", model: embModel, dims, pairs, samples });
    }

    // ── Mode 2: Ranked search ─────────────────────────────────────────────
    if (body.query && body.passages && body.passages.length > 0) {
      const passages = body.passages.slice(0, 10);
      const [queryEmb, ...passEmbs] = await Promise.all([
        model.embedContent(body.query).then(r => r.embedding.values),
        ...passages.map(p => model.embedContent(p).then(r => r.embedding.values)),
      ]);

      const ranked = passages
        .map((p, i) => ({
          passage:    p,
          similarity: cosineSimilarity(queryEmb, passEmbs[i]),
        }))
        .sort((a, b) => b.similarity - a.similarity);

      return NextResponse.json({ mode: "search", model: embModel, query: body.query, ranked });
    }

    return NextResponse.json({ error: "Provide 'texts' (2–3 strings) or 'query' + 'passages'" }, { status: 400 });

  } catch (err) {
    console.error("Embed error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
