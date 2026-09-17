import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  createDeletionCode,
  parseSignedRequest,
  readDeletionCode,
} from "../lib/meta/signed-request.ts";

const SECRET = "secreto-de-prueba";

/** Arma un signed_request igual que Meta. */
function signed(payload, secret = SECRET) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${signature}.${encoded}`;
}

test("acepta un pedido firmado por Meta y devuelve el usuario", () => {
  const request = signed({ algorithm: "HMAC-SHA256", user_id: "17841401130346306", issued_at: 1700000000 });

  assert.deepEqual(parseSignedRequest(request, SECRET), {
    userId: "17841401130346306",
    issuedAt: 1700000000,
  });
});

test("normaliza un user_id numérico a texto", () => {
  const request = signed({ algorithm: "HMAC-SHA256", user_id: 1234567890 });

  assert.equal(parseSignedRequest(request, SECRET).userId, "1234567890");
});

test("rechaza un pedido firmado con otro secreto", () => {
  const request = signed({ algorithm: "HMAC-SHA256", user_id: "123" }, "otro-secreto");

  assert.equal(parseSignedRequest(request, SECRET), null);
});

test("rechaza un payload cambiado después de firmar", () => {
  const [signature] = signed({ algorithm: "HMAC-SHA256", user_id: "123" }).split(".");
  const forged = Buffer.from(JSON.stringify({ algorithm: "HMAC-SHA256", user_id: "999" })).toString("base64url");

  assert.equal(parseSignedRequest(`${signature}.${forged}`, SECRET), null);
});

test("rechaza algoritmos ajenos, ids inválidos y formatos rotos", () => {
  assert.equal(parseSignedRequest(signed({ algorithm: "none", user_id: "123" }), SECRET), null);
  assert.equal(parseSignedRequest(signed({ algorithm: "HMAC-SHA256", user_id: "../otro" }), SECRET), null);
  assert.equal(parseSignedRequest(signed({ algorithm: "HMAC-SHA256" }), SECRET), null);
  assert.equal(parseSignedRequest("sin-punto", SECRET), null);
  assert.equal(parseSignedRequest("a.b.c", SECRET), null);
  assert.equal(parseSignedRequest("", SECRET), null);
});

test("el código de confirmación devuelve la fecha del pedido", () => {
  const now = new Date("2026-09-16T12:00:00Z");
  const code = createDeletionCode(now, SECRET);

  assert.equal(readDeletionCode(code, SECRET).toISOString(), "2026-09-16T12:00:00.000Z");
});

test("un código alterado o firmado con otro secreto no vale", () => {
  const code = createDeletionCode(new Date("2026-09-16T12:00:00Z"), SECRET);
  const [, signature] = code.split(".");
  const otherDate = Buffer.from("1600000000").toString("base64url");

  assert.equal(readDeletionCode(`${otherDate}.${signature}`, SECRET), null);
  assert.equal(readDeletionCode(code, "otro-secreto"), null);
  assert.equal(readDeletionCode("basura", SECRET), null);
});
