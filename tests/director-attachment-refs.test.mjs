import assert from "node:assert/strict";
import test from "node:test";
import {
  attachmentIdFromUrl,
  attachmentMediaType,
  attachmentPath,
  attachmentUrl,
} from "../lib/director/attachment-refs.ts";

const id = "0b3c6c1e-6f1d-4c55-9a0e-2f8c1d7e4b21.webp";

test("sólo una dirección propia con un id válido se reconoce como adjunto", () => {
  assert.equal(attachmentIdFromUrl(attachmentUrl(id)), id);
  assert.equal(attachmentIdFromUrl("https://evil.example/x.webp"), null);
  assert.equal(attachmentIdFromUrl("data:image/png;base64,AAAA"), null);
  assert.equal(attachmentIdFromUrl(`/api/director/attachments/../otro/${id}`), null);
  assert.equal(attachmentIdFromUrl("/api/director/attachments/0b3c6c1e-6f1d-4c55-9a0e-2f8c1d7e4b21.svg"), null);
  assert.equal(attachmentIdFromUrl(42), null);
});

test("la carpeta sale de la sesión y el tipo, de la extensión guardada", () => {
  assert.equal(attachmentPath("ws", "persona", id), `ws/persona/${id}`);
  assert.equal(attachmentMediaType(id), "image/webp");
  assert.equal(attachmentMediaType(id.replace(".webp", ".pdf")), "application/pdf");
});
