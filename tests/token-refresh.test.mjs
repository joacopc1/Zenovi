import assert from "node:assert/strict";
import test from "node:test";
import { decideTokenRefresh } from "../lib/meta/token-refresh.ts";

const now = new Date("2026-10-20T10:00:00Z");

test("un token vencido no se puede renovar", () => {
  assert.equal(
    decideTokenRefresh({ issuedAt: "2026-08-01T00:00:00Z", expiresAt: "2026-10-19T00:00:00Z", now }),
    "expired",
  );
});

test("no intenta renovar antes de las 24 horas que exige Meta", () => {
  assert.equal(
    decideTokenRefresh({ issuedAt: "2026-10-20T02:00:00Z", expiresAt: "2026-10-25T00:00:00Z", now }),
    "wait",
  );
});

test("renueva cuando faltan 20 días o menos", () => {
  // Caso real: conectado el 9 de septiembre, vence el 8 de noviembre.
  assert.equal(
    decideTokenRefresh({ issuedAt: "2026-09-09T22:04:59Z", expiresAt: "2026-11-08T22:04:58Z", now }),
    "refresh",
  );
});

test("espera mientras queda margen de sobra", () => {
  assert.equal(
    decideTokenRefresh({
      issuedAt: "2026-09-09T22:04:59Z",
      expiresAt: "2026-11-08T22:04:58Z",
      now: new Date("2026-09-15T10:00:00Z"),
    }),
    "wait",
  );
});

test("sin vencimiento conocido renueva para obtener uno", () => {
  assert.equal(decideTokenRefresh({ issuedAt: "2026-10-01T00:00:00Z", expiresAt: null, now }), "refresh");
});
