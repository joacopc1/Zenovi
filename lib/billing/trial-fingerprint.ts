import { createHmac, hkdfSync } from "node:crypto";

/**
 * La huella de una cuenta de Instagram para la prueba gratis: un HMAC del id con una clave
 * propia, derivada de la de cifrado de tokens (así no hace falta otra variable). El id de
 * Instagram es un número y un hash simple se revertiría probando; con clave, no.
 */
export function trialFingerprintKey(tokenEncryptionKey: Buffer) {
  return Buffer.from(hkdfSync("sha256", tokenEncryptionKey, Buffer.alloc(0), "zenovi-instagram-trial-claims", 32));
}

export function instagramTrialFingerprint(providerAccountId: string, key: Buffer) {
  return createHmac("sha256", key).update(`instagram:${providerAccountId}`).digest("hex");
}
