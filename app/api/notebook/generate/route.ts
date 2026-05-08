import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logAI, saveNote } from "@/lib/db/interactions";

// ─────────────────────────────────────────────────────────────────────────────
// Notebook — Comprehensive Study Note Generation  (AI-powered)
//
// POST { topic, context?, style? }
//
// Generates a fully structured study note with:
//   • Executive summary
//   • Key concepts with definitions + color coding
//   • Process / workflow diagram (text-based)
//   • Dashboard metrics (extracted stats/numbers)
//   • Code examples
//   • Mind map (hierarchical text tree)
//   • Quiz cards (Q&A self-testing)
//   • Related topics
//
// Saves to Note table (generated=true) + logs to AILog.
// Returns { noteId, title, sections, markdown, tags }
// ─────────────────────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface GeneratedSection {
  type:
    | "summary"
    | "concepts"
    | "processFlow"
    | "dashboard"
    | "codeExamples"
    | "mindMap"
    | "quiz"
    | "relatedTopics";
  title: string;
  content: unknown;
}

export interface GeneratedNote {
  title:    string;
  subtitle: string;
  tags:     string[];
  sections: GeneratedSection[];
  markdown: string;   // full note as persisted Markdown
  noteId:   string | null;
}

function stripFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

/** Convert structured note JSON → rich Markdown for DB + export */
function toMarkdown(data: {
  title: string;
  subtitle: string;
  tags: string[];
  summary: string;
  keyPoints: string[];
  concepts: { term: string; definition: string; example?: string; color?: string }[];
  processFlow: { step: number; icon: string; title: string; detail: string; note?: string }[];
  dashboard: { label: string; value: string; desc: string; color?: string }[];
  codeExamples: { title: string; lang: string; code: string; explanation?: string }[];
  mindMap: { root: string; branches: { label: string; children: string[] }[] };
  quiz: { question: string; answer: string; hint?: string }[];
  relatedTopics: string[];
}): string {
  const lines: string[] = [];

  lines.push(`# ${data.title}`);
  lines.push(`> ${data.subtitle}`);
  lines.push(`\n_Tags: ${data.tags.join(", ")}_\n`);
  lines.push("---\n");

  // Summary
  lines.push("## 📋 Executive Summary\n");
  lines.push(data.summary);
  lines.push("");

  // Key Points
  if (data.keyPoints?.length) {
    lines.push("## 🎯 Key Points\n");
    data.keyPoints.forEach(p => lines.push(`- ${p}`));
    lines.push("");
  }

  // Concepts
  if (data.concepts?.length) {
    lines.push("## 🧩 Key Concepts\n");
    data.concepts.forEach(c => {
      lines.push(`### ${c.term}`);
      lines.push(c.definition);
      if (c.example) lines.push(`\n_Example: ${c.example}_`);
      lines.push("");
    });
  }

  // Process Flow
  if (data.processFlow?.length) {
    lines.push("## ⚡ Process Flow\n");
    data.processFlow.forEach(s => {
      lines.push(`**Step ${s.step}: ${s.icon} ${s.title}**`);
      lines.push(s.detail);
      if (s.note) lines.push(`> 💡 ${s.note}`);
      lines.push("");
    });
  }

  // Dashboard
  if (data.dashboard?.length) {
    lines.push("## 📊 Key Metrics & Facts\n");
    data.dashboard.forEach(d => {
      lines.push(`- **${d.label}**: \`${d.value}\` — ${d.desc}`);
    });
    lines.push("");
  }

  // Code examples
  if (data.codeExamples?.length) {
    lines.push("## 💻 Code Examples\n");
    data.codeExamples.forEach(ex => {
      lines.push(`### ${ex.title}`);
      if (ex.explanation) lines.push(`${ex.explanation}\n`);
      lines.push(`\`\`\`${ex.lang}`);
      lines.push(ex.code);
      lines.push("```\n");
    });
  }

  // Mind Map
  if (data.mindMap?.root) {
    lines.push("## 🗺️ Mind Map\n");
    lines.push(`\`\`\`\n${data.mindMap.root}`);
    data.mindMap.branches?.forEach(b => {
      lines.push(`  ├── ${b.label}`);
      b.children?.forEach((ch, i) => {
        const connector = i === b.children.length - 1 ? "└──" : "├──";
        lines.push(`  │   ${connector} ${ch}`);
      });
    });
    lines.push("```\n");
  }

  // Quiz
  if (data.quiz?.length) {
    lines.push("## 🧠 Quiz — Test Your Knowledge\n");
    data.quiz.forEach((q, i) => {
      lines.push(`**Q${i + 1}: ${q.question}**`);
      if (q.hint) lines.push(`_Hint: ${q.hint}_`);
      lines.push(`<details><summary>Show Answer</summary>\n\n${q.answer}\n\n</details>\n`);
    });
  }

  // Related topics
  if (data.relatedTopics?.length) {
    lines.push("## 🔗 Related Topics\n");
    lines.push(data.relatedTopics.map(t => `- ${t}`).join("\n"));
    lines.push("");
  }

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body                   = await req.json();
    const topic: string          = (body.topic ?? "").trim();
    const context: string        = (body.context ?? "").trim();
    const style: string          = body.style ?? "comprehensive"; // "comprehensive" | "quick" | "visual"

    if (!topic) {
      return NextResponse.json({ error: "topic is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ── Build generation prompt ───────────────────────────────────────────────
    const contextBlock = context
      ? `\n\nSOURCE MATERIAL (use this as the primary knowledge base):\n---\n${context.slice(0, 15000)}\n---`
      : "";

    const styleInstruction =
      style === "quick"
        ? "Keep it concise — 3–4 key concepts, 3 process steps max, 2 quiz questions."
        : style === "visual"
        ? "Emphasise the process flow and mind map sections with extra detail."
        : "Be comprehensive — rich definitions, detailed process flow, multiple code examples.";

    const prompt =
      `You are an expert educational content creator and AI engineer.\n` +
      `Generate a comprehensive, visually structured study note on the topic below.\n` +
      `Style instruction: ${styleInstruction}${contextBlock}\n\n` +
      `TOPIC: ${topic}\n\n` +
      `Respond with ONLY a valid JSON object (no markdown fences) in this exact structure:\n` +
      `{\n` +
      `  "title": "<Engaging title for this study note>",\n` +
      `  "subtitle": "<One sentence describing what this note covers>",\n` +
      `  "tags": ["<tag1>", "<tag2>", "<tag3>"],\n` +
      `  "summary": "<2-3 paragraph executive summary covering the main ideas, context, and why this matters>",\n` +
      `  "keyPoints": ["<most important fact>", "<second>", "<third>", "<fourth>", "<fifth>"],\n` +
      `  "concepts": [\n` +
      `    {\n` +
      `      "term": "<technical term or concept name>",\n` +
      `      "definition": "<clear, precise definition in 1-3 sentences>",\n` +
      `      "example": "<real-world or code example>",\n` +
      `      "color": "<one of: blue|green|purple|orange|pink|cyan>"\n` +
      `    }\n` +
      `  ],\n` +
      `  "processFlow": [\n` +
      `    {\n` +
      `      "step": 1,\n` +
      `      "icon": "<single emoji representing this step>",\n` +
      `      "title": "<step name>",\n` +
      `      "detail": "<what happens in this step, 1-3 sentences>",\n` +
      `      "note": "<optional insight or warning>"\n` +
      `    }\n` +
      `  ],\n` +
      `  "dashboard": [\n` +
      `    {\n` +
      `      "label": "<metric or fact label>",\n` +
      `      "value": "<the number, stat, or key value>",\n` +
      `      "desc": "<brief context for this metric>",\n` +
      `      "color": "<one of: blue|green|purple|orange|pink|cyan|red>"\n` +
      `    }\n` +
      `  ],\n` +
      `  "codeExamples": [\n` +
      `    {\n` +
      `      "title": "<descriptive title>",\n` +
      `      "lang": "typescript",\n` +
      `      "code": "<complete, well-commented code snippet>",\n` +
      `      "explanation": "<1-2 sentences explaining what the code demonstrates>"\n` +
      `    }\n` +
      `  ],\n` +
      `  "mindMap": {\n` +
      `    "root": "${topic}",\n` +
      `    "branches": [\n` +
      `      { "label": "<branch topic>", "children": ["<sub-concept>", "<sub-concept>"] }\n` +
      `    ]\n` +
      `  },\n` +
      `  "quiz": [\n` +
      `    {\n` +
      `      "question": "<challenging but fair question>",\n` +
      `      "answer": "<complete answer with explanation>",\n` +
      `      "hint": "<optional hint>"\n` +
      `    }\n` +
      `  ],\n` +
      `  "relatedTopics": ["<topic 1>", "<topic 2>", "<topic 3>", "<topic 4>"]\n` +
      `}\n\n` +
      `Requirements:\n` +
      `- concepts: 4–8 terms covering the most important ideas\n` +
      `- processFlow: 4–8 numbered steps (always include even for non-procedural topics — describe how it works)\n` +
      `- dashboard: 4–6 key statistics, counts, or facts with concrete values\n` +
      `- codeExamples: 1–3 realistic, runnable code snippets (TypeScript preferred; use Python if topic is ML/data)\n` +
      `- mindMap: 4–6 branches, each with 2–4 children\n` +
      `- quiz: 4–6 questions progressing from recall to application\n` +
      `- relatedTopics: 4–6 topics for further study`;

    const result  = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(stripFences(rawText));
    } catch {
      return NextResponse.json({
        error:   "AI returned invalid JSON — please retry",
        rawText: rawText.slice(0, 500),
      }, { status: 502 });
    }

    // ── Build Markdown for DB storage ─────────────────────────────────────────
    const markdown = toMarkdown(data as Parameters<typeof toMarkdown>[0]);

    // ── Save to Note table (best-effort) ──────────────────────────────────────
    let noteId: string | null = null;
    try {
      noteId = await saveNote({
        title:     data.title as string ?? topic,
        content:   markdown,
        tags:      (data.tags as string[]) ?? [],
        generated: true,
      });
    } catch (dbErr) {
      console.warn("[notebook/generate] Note DB save skipped:", dbErr);
    }

    // ── DB log ────────────────────────────────────────────────────────────────
    void logAI({
      page:     "notebook",
      prompt:   topic + (context ? ` [+${context.length} chars context]` : ""),
      response: markdown.slice(0, 2000),
      model:    "gemini-2.5-flash",
      metadata: {
        style,
        noteId,
        latencyMs:       Date.now() - t0,
        sectionsCount:   Object.keys(data).length,
        conceptsCount:   (data.concepts as unknown[])?.length ?? 0,
        processFlowSteps:(data.processFlow as unknown[])?.length ?? 0,
        quizCount:       (data.quiz as unknown[])?.length ?? 0,
      },
    });

    // ── Build sections array for the UI ──────────────────────────────────────
    const sections: GeneratedSection[] = ([
      { type: "summary",       title: "Executive Summary",     content: { summary: data.summary, keyPoints: data.keyPoints } },
      { type: "concepts",      title: "Key Concepts",          content: data.concepts },
      { type: "processFlow",   title: "Process Flow",          content: data.processFlow },
      { type: "dashboard",     title: "Metrics & Facts",       content: data.dashboard },
      { type: "codeExamples",  title: "Code Examples",         content: data.codeExamples },
      { type: "mindMap",       title: "Mind Map",              content: data.mindMap },
      { type: "quiz",          title: "Quiz — Test Yourself",  content: data.quiz },
      { type: "relatedTopics", title: "Related Topics",        content: data.relatedTopics },
    ] as GeneratedSection[]).filter(s => {
      const c = s.content;
      if (!c) return false;
      if (Array.isArray(c) && (c as unknown[]).length === 0) return false;
      return true;
    });

    const response: GeneratedNote = {
      title:    data.title as string ?? topic,
      subtitle: data.subtitle as string ?? "",
      tags:     data.tags as string[] ?? [],
      sections,
      markdown,
      noteId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[notebook/generate] Unhandled error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export const runtime     = "nodejs";
export const maxDuration = 60;
