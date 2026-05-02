import { put, del, list } from "@vercel/blob"

export type BlobFolder = "notes" | "knowledge" | "audio" | "images" | "docs"

/**
 * Upload a file to Vercel Blob
 */
export async function uploadFile(
  filename: string,
  content:  Blob | File,
  folder:   BlobFolder,
): Promise<string> {
  const { url } = await put(`${folder}/${Date.now()}-${filename}`, content, {
    access: "public",
  })
  return url
}

/**
 * Delete a file from Vercel Blob by its URL
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url)
}

/**
 * List all files in a folder
 */
export async function listFiles(folder: BlobFolder) {
  const { blobs } = await list({ prefix: `${folder}/` })
  return blobs
}