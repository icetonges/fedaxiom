/**
 * /api/imagine — Imagen 4 image generation
 *
 * Generates images using Google's Imagen 4 Fast model via the Gemini REST API.
 * Requires a Google AI Studio API key with billing enabled.
 *
 * Returns: { images: [{ b64: string, mimeType: string }], model, prompt }
 * Or on billing/permission error: { error, tip, model, prompt }
 */

import { NextRequest, NextResponse } from "next/server";

const IMAGEN_MODELS = {
  fast:     "imagen-4.0-fast-generate-001",   // fastest, free-tier candidate
  standard: "imagen-4.0-generate-001",         // higher quality
  ultra:    "imagen-4.0-ultra-generate-001",   // best quality, slowest
} as const;

export async function POST(req: NextRequest) {
  const {
    prompt,
    model     = "fast" as keyof typeof IMAGEN_MODELS,
    count     = 1,
    style,
  } = await req.json() as {
    prompt:  string;
    model?:  keyof typeof IMAGEN_MODELS;
    count?:  number;
    style?:  string;
  };

  const apiKey   = process.env.GEMINI_API_KEY;
  const modelId  = IMAGEN_MODELS[model] ?? IMAGEN_MODELS.fast;
  const numImages = Math.min(Math.max(count, 1), 4);

  const enhancedPrompt = style
    ? `${prompt}. Style: ${style}.`
    : prompt;

  if (!apiKey) {
    return NextResponse.json({
      error: "GEMINI_API_KEY not configured",
      tip:   "Add GEMINI_API_KEY to your .env.local",
    }, { status: 503 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateImages?key=${apiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:              { text: enhancedPrompt },
          number_of_images:    numImages,
          output_image_config: { image_format: { mime_type: "image/jpeg" } },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();

      if (res.status === 403 || body.includes("PERMISSION_DENIED") || body.includes("billing")) {
        return NextResponse.json({
          error:   "Imagen 4 requires billing enabled on your Google Cloud project.",
          tip:     "Visit https://aistudio.google.com → Settings → Billing to upgrade.",
          model:   modelId,
          prompt:  enhancedPrompt,
        }, { status: 403 });
      }

      return NextResponse.json({
        error: `Imagen API error ${res.status}`,
        detail: body.slice(0, 400),
        model:  modelId,
        prompt: enhancedPrompt,
      }, { status: res.status });
    }

    const data = await res.json() as {
      generatedImages?: { image?: { imageBytes?: string; mimeType?: string } }[];
    };

    const images = (data.generatedImages ?? [])
      .map(g => ({
        b64:      g.image?.imageBytes ?? "",
        mimeType: g.image?.mimeType ?? "image/jpeg",
      }))
      .filter(img => img.b64);

    return NextResponse.json({ images, model: modelId, prompt: enhancedPrompt });

  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
