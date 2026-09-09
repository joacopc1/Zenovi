import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getMetaTokenEncryptionKey } from "@/lib/meta/config";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: 1;
};

export function encryptMetaToken(token: string): EncryptedSecret {
  if (!token) {
    throw new Error("No se puede cifrar un token vacío.");
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getMetaTokenEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);

  return {
    ciphertext: toPostgresBytea(ciphertext),
    iv: toPostgresBytea(iv),
    authTag: toPostgresBytea(cipher.getAuthTag()),
    keyVersion: 1,
  };
}

export function decryptMetaToken(secret: EncryptedSecret) {
  if (secret.keyVersion !== 1) {
    throw new Error("Versión de cifrado no compatible.");
  }

  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      getMetaTokenEncryptionKey(),
      fromPostgresBytea(secret.iv),
    );
    decipher.setAuthTag(fromPostgresBytea(secret.authTag));

    return Buffer.concat([
      decipher.update(fromPostgresBytea(secret.ciphertext)),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("No fue posible descifrar la credencial de Meta.");
  }
}

function toPostgresBytea(value: Buffer) {
  return `\\x${value.toString("hex")}`;
}

function fromPostgresBytea(value: string) {
  if (!/^\\x[\da-f]+$/i.test(value)) {
    throw new Error("Credencial cifrada inválida.");
  }

  return Buffer.from(value.slice(2), "hex");
}
