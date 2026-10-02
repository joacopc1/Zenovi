import { readFileSync } from "node:fs";

/**
 * La cuenta de prueba: se crea antes de las pruebas y se borra al final (con su workspace,
 * en cascada). Vive en el Supabase del proyecto, por eso cada corrida usa un correo único.
 */
export const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?/))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => [match[1], match[2].trim()]),
);

export const ACCOUNT_FILE = "e2e/.account.json";

export type TestAccount = { id: string; email: string; password: string };

export function readTestAccount(): TestAccount {
  return JSON.parse(readFileSync(ACCOUNT_FILE, "utf8"));
}

export function adminFetch(path: string, init: RequestInit = {}) {
  const key = env.SUPABASE_SECRET_KEY;
  return fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers },
  });
}
