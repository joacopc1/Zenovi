import "server-only";

import type { GeminiInlineMedia } from "@/lib/ai/gemini-json";

const MAX_SEQUENCE_BYTES = 14 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/mov", "video/quicktime"]);

export async function downloadStorySequenceMedia(
  sources: Array<{ url: string; type: "image" | "video"; name: string }>,
): Promise<GeminiInlineMedia[]> {
  const media: GeminiInlineMedia[] = [];
  let totalBytes = 0;

  for (const source of sources) {
    const response = await fetch(source.url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`story_media_download_http_${response.status}`);
    if (!response.body) throw new Error("story_media_download_empty");

    const mimeType = normalizeMimeType(response.headers.get("content-type"), source.type);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let itemBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      itemBytes += value.byteLength;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_SEQUENCE_BYTES) {
        await reader.cancel();
        throw new Error("story_sequence_too_large_for_inline_analysis");
      }
      chunks.push(value);
    }

    media.push({
      type: source.type,
      data: Buffer.concat(chunks, itemBytes),
      mimeType,
      name: source.name,
    });
  }

  return media;
}

function normalizeMimeType(rawValue: string | null, type: "image" | "video") {
  const mimeType = rawValue?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (type === "image" && ALLOWED_IMAGE_TYPES.has(mimeType)) return mimeType;
  if (type === "video" && ALLOWED_VIDEO_TYPES.has(mimeType)) {
    return mimeType === "video/quicktime" ? "video/mov" : mimeType;
  }
  throw new Error("story_media_type_unsupported");
}
