import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { archivedVideoCutoff, isArchivedVideo, toArchiveFile } from "../lib/meta/story-archive-file.ts";

test("convierte una imagen de Historia a WebP y pesa menos que el JPEG", async () => {
  const jpeg = await sharp({
    create: { width: 1080, height: 1920, channels: 3, background: { r: 30, g: 30, b: 30 } },
  })
    .composite([{ input: Buffer.from('<svg width="1080" height="1920"><text x="80" y="900" font-size="120" fill="white">Tu contenido</text></svg>') }])
    .jpeg({ quality: 90 })
    .toBuffer();

  const file = await toArchiveFile("image/jpeg", jpeg);
  const metadata = await sharp(file.bytes).metadata();

  assert.equal(file.contentType, "image/webp");
  assert.equal(file.extension, "webp");
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.width, 1080);
  assert.ok(file.bytes.byteLength < jpeg.byteLength);
});

test("guarda el video tal cual", async () => {
  const bytes = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112]);
  const file = await toArchiveFile("video/mp4", bytes);
  assert.equal(file.bytes, bytes);
  assert.equal(file.extension, "mp4");
});

test("rechaza formatos que no sabe guardar", async () => {
  await assert.rejects(() => toArchiveFile("application/octet-stream", new Uint8Array([1])), /archive_type_unsupported/);
});

test("sólo los videos de más de 30 días se borran del archivo", () => {
  const now = new Date("2026-10-31T12:00:00Z");
  assert.equal(archivedVideoCutoff(now).toISOString(), "2026-10-01T12:00:00.000Z");
  assert.equal(isArchivedVideo("cuenta/historia/media.mp4"), true);
  assert.equal(isArchivedVideo("cuenta/historia/media.mov"), true);
  assert.equal(isArchivedVideo("cuenta/historia/media.webp"), false);
});
