import assert from "node:assert/strict";
import test from "node:test";
import { readMetaErrorCode, requiresReauthorization } from "../lib/meta/meta-error.ts";

test("el código 190 de Meta es un acceso revocado, venga con el estado que venga", () => {
  // Respuesta real de graph.instagram.com con un token inválido.
  const payload = { error: { message: "Failed to decrypt", type: "OAuthException", code: 190 } };

  assert.equal(readMetaErrorCode(401, payload), "authorization_revoked");
  assert.equal(readMetaErrorCode(400, payload), "authorization_revoked");
});

test("cualquier otro error conserva su estado HTTP", () => {
  assert.equal(readMetaErrorCode(400, { error: { type: "OAuthException", code: 10 } }), "meta_http_400");
  assert.equal(readMetaErrorCode(500, { error: { code: 1 } }), "meta_http_500");
  assert.equal(readMetaErrorCode(502, null), "meta_http_502");
  assert.equal(readMetaErrorCode(429, "texto"), "meta_http_429");
});

test("sólo el acceso revocado o vencido pide volver a autorizar", () => {
  assert.equal(requiresReauthorization("authorization_revoked"), true);
  assert.equal(requiresReauthorization("authorization_expired"), true);
  assert.equal(requiresReauthorization("meta_http_500"), false);
  assert.equal(requiresReauthorization("media_persistence_failed"), false);
});
