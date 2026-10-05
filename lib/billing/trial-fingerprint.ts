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

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/**
 * El mail tal como llega a una casilla: sin lo que va después de un "+" (cualquier
 * proveedor lo ignora) y, en Gmail, sin puntos, que Gmail también ignora. Así
 * "J.uan+2@GoogleMail.com" y "juan@gmail.com" son la misma persona para la prueba.
 */
export function normalizeTrialEmail(email: string) {
  const [rawLocal, rawDomain] = email.trim().toLowerCase().split("@");
  if (!rawLocal || !rawDomain) return null;
  let local = rawLocal.split("+")[0];
  let domain = rawDomain;
  if (GMAIL_DOMAINS.has(domain)) {
    local = local.replaceAll(".", "");
    domain = "gmail.com";
  }
  return local ? `${local}@${domain}` : null;
}

export function emailTrialFingerprint(normalizedEmail: string, key: Buffer) {
  return createHmac("sha256", key).update(`email:${normalizedEmail}`).digest("hex");
}
