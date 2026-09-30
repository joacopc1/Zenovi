import "server-only";

const MAX_VIDEO_BYTES = 14 * 1024 * 1024;

export async function downloadReelVideo(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`media_download_http_${response.status}`);

  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > MAX_VIDEO_BYTES) {
    await response.body?.cancel();
    throw new Error("video_too_large_for_inline_analysis");
  }
  if (!response.body) throw new Error("media_download_empty");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_VIDEO_BYTES) {
      await reader.cancel();
      throw new Error("video_too_large_for_inline_analysis");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks, totalBytes);
}
