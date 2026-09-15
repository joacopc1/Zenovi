/**
 * Sonda de sólo lectura: ¿una ventana de un día devuelve el valor de ESE día?
 *
 * No escribe nada, ni en Supabase ni en Meta. Sólo hace GETs de insights.
 *
 * El control es `reach`: de esa métrica ya tenemos la serie diaria real guardada,
 * así que si el total_value de una ventana de un día coincide con el valor diario
 * almacenado, la técnica es válida y se puede confiar en ella para views e
 * interacciones, que no tienen serie diaria propia.
 *
 * Uso: node --env-file=.env.local scripts/probe-daily-metrics.mjs [metrica ...]
 */
import { createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const GRAPH_ORIGIN = "https://graph.instagram.com";
const GRAPH_VERSION = "v26.0";
const DAY_IN_SECONDS = 24 * 60 * 60;
// Métricas a sondear: por argumento, o las tres de la serie diaria por defecto.
const METRICS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["reach", "views", "total_interactions"];
const DAYS_TO_PROBE = 4;

const admin = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false } },
);

const { data: connection } = await admin
  .from("social_connections")
  .select("id")
  .eq("provider", "instagram")
  .in("status", ["connected", "account_resolved", "syncing"])
  .limit(1)
  .maybeSingle();

if (!connection) exit("No hay ninguna conexión de Instagram activa.");

const [{ data: account }, { data: credential }] = await Promise.all([
  admin
    .from("social_accounts")
    .select("id, username, provider_account_id")
    .eq("connection_id", connection.id)
    .maybeSingle(),
  admin
    .from("instagram_connection_credentials")
    .select("access_token_ciphertext, access_token_iv, access_token_auth_tag")
    .eq("connection_id", connection.id)
    .maybeSingle(),
]);

if (!account || !credential) exit("Falta la cuenta o la credencial de esa conexión.");

const accessToken = decryptToken(credential);
console.log(`Cuenta: @${account.username} (${account.provider_account_id})\n`);

// Valores diarios de reach ya guardados, para contrastar.
const { data: storedReach } = await admin
  .from("instagram_account_insights")
  .select("value, end_time")
  .eq("social_account_id", account.id)
  .eq("metric", "reach")
  .eq("period", "day");

const storedByDay = new Map(
  (storedReach ?? []).map((row) => [row.end_time.slice(0, 10), Number(row.value)]),
);

// Días completos, evitando el día en curso que todavía se está acumulando.
const midnightUtc = Math.floor(Date.now() / 1000 / DAY_IN_SECONDS) * DAY_IN_SECONDS;

for (let offset = 1; offset <= DAYS_TO_PROBE; offset += 1) {
  const until = midnightUtc - (offset - 1) * DAY_IN_SECONDS;
  const since = until - DAY_IN_SECONDS;
  const label = new Date(since * 1000).toISOString().slice(0, 10);
  const results = [];

  for (const metric of METRICS) {
    results.push(`${metric}=${await fetchTotal(metric, since, until)}`);
  }

  const stored = storedByDay.get(new Date(until * 1000).toISOString().slice(0, 10));
  const control = stored === undefined ? "sin guardar" : String(stored);
  console.log(`${label}  ${results.join("  ")}   [reach guardado: ${control}]`);
}

async function fetchTotal(metric, since, until) {
  const url = new URL(
    `/${GRAPH_VERSION}/${encodeURIComponent(account.provider_account_id)}/insights`,
    GRAPH_ORIGIN,
  );
  url.searchParams.set("metric", metric);
  url.searchParams.set("period", "day");
  url.searchParams.set("metric_type", "total_value");
  url.searchParams.set("since", String(since));
  url.searchParams.set("until", String(until));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await response.json();

  if (!response.ok) {
    return `ERROR(${payload?.error?.message ?? response.status})`;
  }

  const entry = payload?.data?.find((item) => item.name === metric);
  if (!entry) return "sin dato";
  if (entry.total_value) return entry.total_value.value ?? "sin valor";
  if (Array.isArray(entry.values)) {
    return `serie[${entry.values.map((point) => point.value).join(",")}]`;
  }
  return "formato inesperado";
}

function decryptToken({ access_token_ciphertext, access_token_iv, access_token_auth_tag }) {
  const key = Buffer.from(requireEnv("META_TOKEN_ENCRYPTION_KEY"), "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, fromBytea(access_token_iv));
  decipher.setAuthTag(fromBytea(access_token_auth_tag));

  return Buffer.concat([
    decipher.update(fromBytea(access_token_ciphertext)),
    decipher.final(),
  ]).toString("utf8");
}

function fromBytea(value) {
  return Buffer.from(value.slice(2), "hex");
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) exit(`Falta la variable ${name} en .env.local`);
  return value;
}

function exit(message) {
  console.error(message);
  process.exit(1);
}
