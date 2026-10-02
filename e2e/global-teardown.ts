import { existsSync, rmSync } from "node:fs";
import { ACCOUNT_FILE, adminFetch, readTestAccount } from "./test-account";

export default async function globalTeardown() {
  if (!existsSync(ACCOUNT_FILE)) return;
  const { id } = readTestAccount();
  // Borrar la persona borra su workspace y todo lo que creó, en cascada.
  const response = await adminFetch(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
  if (!response.ok) console.error(`No se pudo borrar la cuenta de prueba ${id}: borrala a mano.`);
  rmSync(ACCOUNT_FILE);
}
