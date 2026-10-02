import assert from "node:assert/strict";
import test from "node:test";
import { instagramTrialFingerprint, trialFingerprintKey } from "../lib/billing/trial-fingerprint.ts";

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
