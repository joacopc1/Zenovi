import assert from "node:assert/strict";
import test from "node:test";
import { parseCarouselMediaChildren } from "../lib/meta/carousel-media.ts";

test("conserva el orden y los tipos válidos de un carrusel", () => {
  const slides = parseCarouselMediaChildren({
    data: [
      { id: "10", media_type: "IMAGE", media_url: " https://cdn.test/uno.jpg " },
      { id: 11, media_type: "VIDEO", media_url: "https://cdn.test/dos.mp4", thumbnail_url: "https://cdn.test/dos.jpg" },
    ],
  });

  assert.deepEqual(slides, [
    { id: "10", mediaType: "IMAGE", mediaUrl: "https://cdn.test/uno.jpg", thumbnailUrl: null },
    { id: "11", mediaType: "VIDEO", mediaUrl: "https://cdn.test/dos.mp4", thumbnailUrl: "https://cdn.test/dos.jpg" },
  ]);
});

test("descarta slides rotos o de tipos que la interfaz no presenta", () => {
  const slides = parseCarouselMediaChildren({
    data: [
      { id: "", media_type: "IMAGE", media_url: "x" },
      { id: "12", media_type: "CAROUSEL_ALBUM", media_url: "x" },
      null,
    ],
  });

  assert.deepEqual(slides, []);
  assert.deepEqual(parseCarouselMediaChildren(null), []);
});
