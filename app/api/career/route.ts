import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const CAREER_PROMPT = `You are a senior AI/ML engineering career advisor. Analyze the user's progress data and provide structured feedback.

Return ONLY valid JSON (no markdown, no preamble) with this exact structure:
{
  "score": <number 0-100>,
  "level": "<Junior | Mid-Level | Senior | Staff>",
  "headline": "<one sentence assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>", "<gap 3>"],
  "nextSteps": [
    { "action": "<specific action>", "priority": "high|medium|low", "timeframe": "<1 week|1 month|3 months>" },
    { "action": "<specific action>", "priority": "high|medium|low", "timeframe": "<timeframe>" },
    { "action": "<specific action>", "priority": "high|medium|low", "timeframe": "<timeframe>" }
  ],
  "marketReadiness": <number 0-100>,
  "salaryRange": "<range in USD>",
  "recommendedRoles": ["<role 1>", "<role 2>", "<role 3>"]
}`;

export async function POST(req: NextRequest) {
  try {
    const { profile } = await req.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `${CAREER_PROMPT}

User profile:
${JSON.stringify(profile, null, 2)}

Analyze based on current 2025 AI/ML job market standards.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      analysis = {
        score: 65,
        level: "Mid-Level",
        headline: "Solid foundation with room to grow in production AI systems.",
        strengths: ["AI/ML knowledge", "Web development skills", "Project portfolio"],
        gaps: ["Production ML deployment", "System design at scale", "MLOps practices"],
        nextSteps: [
          { action: "Deploy a model with monitoring to production", priority: "high", timeframe: "1 month" },
          { action: "Build an end-to-end ML pipeline", priority: "high", timeframe: "1 month" },
          { action: "Contribute to an open-source AI project", priority: "medium", timeframe: "3 months" },
        ],
        marketReadiness: 70,
        salaryRange: "$120,000 - $160,000",
        recommendedRoles: ["ML Engineer", "AI Application Developer", "Full-Stack AI Developer"],
      };
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Career API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
