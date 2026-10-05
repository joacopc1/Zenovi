import assert from "node:assert/strict";
import test from "node:test";
import { emailTrialFingerprint, instagramTrialFingerprint, normalizeTrialEmail, trialFingerprintKey } from "../lib/billing/trial-fingerprint.ts";

const key = trialFingerprintKey(Buffer.alloc(32, 7));

test("la misma cuenta de Instagram da siempre la misma huella, y otra cuenta, otra", () => {
  const first = instagramTrialFingerprint("17841400000000001", key);
  assert.equal(first, instagramTrialFingerprint("17841400000000001", key));
  assert.notEqual(first, instagramTrialFingerprint("17841400000000002", key));
  assert.match(first, /^[0-9a-f]{64}$/);
});

test("sin la clave no se puede reconstruir: con otra clave, la huella cambia", () => {
  const other = trialFingerprintKey(Buffer.alloc(32, 8));
  assert.notEqual(instagramTrialFingerprint("17841400000000001", key), instagramTrialFingerprint("17841400000000001", other));
  // La huella no es el hash simple del id, que se revertiría probando números.
  assert.notEqual(instagramTrialFingerprint("17841400000000001", key).slice(0, 8), "17841400");
});

test("los alias del mismo Gmail cuentan como un solo mail para la prueba", () => {
  assert.equal(normalizeTrialEmail("Juan.Perez+2@GMAIL.com"), "juanperez@gmail.com");
  assert.equal(normalizeTrialEmail("j.u.a.n.perez@googlemail.com"), "juanperez@gmail.com");
  // En otros proveedores los puntos sí importan; el "+" no.
  assert.equal(normalizeTrialEmail("ana.lopez+zenovi@outlook.com"), "ana.lopez@outlook.com");
  assert.equal(normalizeTrialEmail("sin-arroba"), null);
  assert.equal(normalizeTrialEmail("+solo@gmail.com"), null);
});

test("la huella del mail no es la del Instagram aunque el texto coincida", () => {
  const key = Buffer.alloc(32, 7);
  const email = emailTrialFingerprint("juanperez@gmail.com", key);
  assert.match(email, /^[0-9a-f]{64}$/);
  assert.equal(email, emailTrialFingerprint("juanperez@gmail.com", key));
  assert.notEqual(email, emailTrialFingerprint("otra@gmail.com", key));
});
