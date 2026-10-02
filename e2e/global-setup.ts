import { writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { ACCOUNT_FILE, adminFetch } from "./test-account";

export default async function globalSetup() {
  const email = `e2e-${Date.now()}@example.com`;
  const password = randomBytes(18).toString("base64url");
  const response = await adminFetch("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!response.ok) throw new Error(`No se pudo crear la cuenta de prueba (${response.status}).`);
  const user = await response.json();
  writeFileSync(ACCOUNT_FILE, JSON.stringify({ id: user.id, email, password }));
}
