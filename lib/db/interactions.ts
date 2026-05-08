import { prisma } from "./client";

export interface LogOptions {
  page: string;
  prompt: string;
  response: string;
  model: string;
  tokens?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget AI interaction logger.
 * Writes prompt + response pairs to the AILog table for every page.
 * Never throws — DB failures are swallowed so the main request is not blocked.
 */
export async function logAI(opts: LogOptions): Promise<void> {
  try {
    await prisma.aILog.create({
      data: {
        page:     opts.page,
        prompt:   opts.prompt,
        response: opts.response,
        model:    opts.model,
        tokens:   opts.tokens ?? null,
        metadata: (opts.metadata ?? null) as object,
      },
    });
  } catch (err) {
    console.error("[AILog] DB write failed (non-fatal):", err);
  }
}

/**
 * Save or upsert a KnowledgeDoc record.
 * Returns the saved doc id.
 */
export async function saveKnowledgeDoc(opts: {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  blobUrl?: string;
  chunkCount?: number;
}): Promise<string> {
  try {
    const doc = await prisma.knowledgeDoc.upsert({
      where:  { id: opts.id },
      create: {
        id:        opts.id,
        title:     opts.title,
        content:   opts.content.slice(0, 100_000), // guard very large docs
        category:  opts.category ?? "general",
        tags:      opts.tags ?? [],
        blobUrl:   opts.blobUrl ?? null,
      },
      update: {
        title:    opts.title,
        content:  opts.content.slice(0, 100_000),
        category: opts.category ?? "general",
        tags:     opts.tags ?? [],
        blobUrl:  opts.blobUrl ?? null,
      },
    });
    return doc.id;
  } catch (err) {
    console.error("[saveKnowledgeDoc] DB write failed:", err);
    return opts.id; // return original id so caller can continue
  }
}

/**
 * Save a generated study note to the Note table.
 */
export async function saveNote(opts: {
  title: string;
  content: string;
  tags?: string[];
  blobUrls?: string[];
  generated?: boolean;
}): Promise<string | null> {
  try {
    const note = await prisma.note.create({
      data: {
        title:     opts.title,
        content:   opts.content,
        type:      opts.generated ? "generated" : "text",
        tags:      opts.tags ?? [],
        blobUrls:  opts.blobUrls ?? [],
        generated: opts.generated ?? false,
      },
    });
    return note.id;
  } catch (err) {
    console.error("[saveNote] DB write failed:", err);
    return null;
  }
}
