/**
 * Prueba de aislamiento entre cuentas contra la base real.
 *
 * Crea una cuenta B temporal, entra con ella como lo haría el navegador (clave pública +
 * sesión) e intenta leer, crear, cambiar y borrar datos de las cuentas existentes, por
 * listado y por id. Al final borra la cuenta B. Cualquier fila ajena que B logre ver o
 * tocar es una falla de RLS.
 *
 * Uso: node scripts/security-cross-tenant.mjs
 */
import { readFileSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?/))
    .filter(Boolean)
    .map((match) => [match[1], match[2].trim()]),
);
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET_KEY = env.SUPABASE_SECRET_KEY;

const TABLES = [
  "ai_usage_events", "audience_profiles", "brand_profiles", "content_analyses", "content_items",
  "content_scripts", "director_chats", "director_message_feedback", "director_messages",
  "instagram_account_insights", "instagram_media", "instagram_media_children",
  "instagram_media_insight_snapshots", "instagram_media_insights", "memberships", "offers",
  "profiles", "social_accounts", "social_connections", "workspaces",
];

const failures = [];
const fail = (message) => failures.push(message);

const admin = (path, init = {}) =>
  fetch(`${URL_BASE}${path}`, {
    ...init,
    headers: { apikey: SECRET_KEY, Authorization: `Bearer ${SECRET_KEY}`, "Content-Type": "application/json", ...init.headers },
  });

const email = `rls-probe-${Date.now()}@example.com`;
const password = randomBytes(18).toString("base64url");
const created = await admin("/auth/v1/admin/users", {
  method: "POST",
  body: JSON.stringify({ email, password, email_confirm: true }),
});
if (!created.ok) throw new Error(`No se pudo crear la cuenta B: ${created.status}`);
const userB = await created.json();

try {
  const session = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: PUBLIC_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).then((response) => response.json());
  if (!session.access_token) throw new Error("La cuenta B no pudo iniciar sesión.");

  const asB = (path, init = {}) =>
    fetch(`${URL_BASE}${path}`, {
      ...init,
      headers: {
        apikey: PUBLIC_KEY,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...init.headers,
      },
    });

  // 1. Listar: B sólo puede ver filas propias (su perfil) y nada de nadie más.
  let readable = 0;
  for (const table of TABLES) {
    const response = await asB(`/rest/v1/${table}?select=*&limit=100`);
    if (!response.ok) continue;
    readable += 1;
    const rows = await response.json();
    const foreign = rows.filter((row) => !(table === "profiles" && row.id === userB.id));
    if (foreign.length) fail(`${table}: B ve ${foreign.length} filas ajenas al listar`);
  }

  // 2. Por id: con ids reales de otras cuentas, B no encuentra nada.
  const targets = {};
  for (const table of ["workspaces", "director_chats", "content_items", "instagram_media", "content_analyses", "social_connections"]) {
    const rows = await admin(`/rest/v1/${table}?select=id&limit=1`).then((response) => response.json());
    if (rows[0]?.id) targets[table] = rows[0].id;
  }
  // Sin ids ajenos ni tablas legibles, la prueba no probaría nada: se corta como falla.
  if (Object.keys(targets).length < 4 || readable < 10) fail(`prueba vacía: ${Object.keys(targets).length} ids ajenos, ${readable} tablas legibles`);
  console.log(`B leyó ${readable} tablas con su sesión; se probaron ${Object.keys(targets).length} filas ajenas por id.`);
  for (const [table, id] of Object.entries(targets)) {
    const rows = await asB(`/rest/v1/${table}?select=*&id=eq.${id}`).then((response) => (response.ok ? response.json() : []));
    if (rows.length) fail(`${table}: B lee una fila ajena por id`);
  }

  // 3. Escribir sobre lo ajeno: crear en otro workspace, cambiar y borrar filas ajenas.
  if (targets.workspaces) {
    const insert = await asB("/rest/v1/director_chats", {
      method: "POST",
      body: JSON.stringify({ id: randomUUID(), workspace_id: targets.workspaces, user_id: userB.id }),
    });
    if (insert.ok) fail("director_chats: B crea un chat dentro de un workspace ajeno");
    const ideaInsert = await asB("/rest/v1/content_items", {
      method: "POST",
      body: JSON.stringify({ workspace_id: targets.workspaces, title: "rls probe" }),
    });
    if (ideaInsert.ok) fail("content_items: B crea una idea dentro de un workspace ajeno");
    const update = await asB(`/rest/v1/workspaces?id=eq.${targets.workspaces}`, { method: "PATCH", body: JSON.stringify({ name: "rls probe" }) });
    if (update.ok && (await update.json()).length) fail("workspaces: B cambia un workspace ajeno");
    const join = await asB("/rest/v1/memberships", {
      method: "POST",
      body: JSON.stringify({ workspace_id: targets.workspaces, user_id: userB.id, role: "owner" }),
    });
    if (join.ok) fail("memberships: B se suma a un workspace ajeno");
  }
  for (const table of ["director_chats", "content_items"]) {
    if (!targets[table]) continue;
    const removed = await asB(`/rest/v1/${table}?id=eq.${targets[table]}`, { method: "DELETE" });
    if (removed.ok && (await removed.json()).length) fail(`${table}: B borra una fila ajena`);
  }

  // 4. Funciones y archivos que sólo usa el servidor.
  const rpc = await asB("/rest/v1/rpc/hit_rate_limit", {
    method: "POST",
    body: JSON.stringify({ p_key: "probe", p_limit: 1, p_window_seconds: 60 }),
  });
  if (rpc.ok) fail("hit_rate_limit: B puede llamar la función del servidor");
  for (const bucket of ["instagram-story-archive", "director-attachments"]) {
    const listed = await asB(`/storage/v1/object/list/${bucket}`, { method: "POST", body: JSON.stringify({ prefix: "" }) });
    const objects = listed.ok ? await listed.json() : [];
    if (objects.length) fail(`${bucket}: B lista archivos del bucket privado`);
  }
} finally {
  const removed = await admin(`/auth/v1/admin/users/${userB.id}`, { method: "DELETE" });
  console.log(removed.ok ? "Cuenta B temporal borrada." : `No se pudo borrar la cuenta B (${userB.id}): borrala a mano.`);
}

if (failures.length) {
  console.error(`\n${failures.length} fallas de aislamiento:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Aislamiento entre cuentas: sin fallas.");
