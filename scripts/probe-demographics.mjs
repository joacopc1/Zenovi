/**
 * Sonda de sólo lectura: ¿qué demografía entrega Meta para esta cuenta?
 *
 * No escribe nada, ni en Supabase ni en Meta. Sólo hace GETs de insights.
 *
 * Prueba las tres métricas demográficas contra cada dimensión y cada marco temporal,
 * y también las dos formas en que la documentación nombra el parámetro (`breakdown` y
 * `breakdowns`), porque conviven según la variante de la API. Sirve para saber qué se
 * puede guardar antes de escribir una línea de sincronización.
 *
 * Uso: node --env-file=.env.local scripts/probe-demographics.mjs [@usuario]
 */
import { createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const GRAPH_ORIGIN = "https://graph.instagram.com";
const GRAPH_VERSION = "v26.0";

const METRICS = ["follower_demographics", "engaged_audience_demographics", "reached_audience_demographics"];
const BREAKDOWNS = ["age", "gender", "country", "city"];
const TIMEFRAMES = ["last_30_days", "last_90_days"];

const wanted = process.argv[2]?.replace(/^@/, "") ?? null;

const admin = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false } },
);

const accountQuery = admin
  .from("social_accounts")
  .select("id, username, provider_account_id, connection_id, followers_count");
const { data: accounts } = wanted ? await accountQuery.eq("username", wanted) : await accountQuery;

const account = (accounts ?? []).at(-1);
if (!account) exit(wanted ? `No encontré la cuenta @${wanted}.` : "No hay ninguna cuenta guardada.");

const { data: credential } = await admin
  .from("instagram_connection_credentials")
  .select("access_token_ciphertext, access_token_iv, access_token_auth_tag")
  .eq("connection_id", account.connection_id)
  .maybeSingle();

if (!credential) exit("Esa conexión no tiene credencial guardada.");

const accessToken = decryptToken(credential);
console.log(`Cuenta: @${account.username} · ${account.followers_count ?? "?"} seguidores\n`);

for (const metric of METRICS) {
  for (const timeframe of TIMEFRAMES) {
    for (const breakdown of BREAKDOWNS) {
      for (const parameter of ["breakdown", "breakdowns"]) {
        const result = await probe(metric, timeframe, breakdown, parameter);
        console.log(`${metric} · ${timeframe} · ${breakdown} · ${parameter} → ${result}`);
      }
    }
  }
  console.log("");
}

async function probe(metric, timeframe, breakdown, parameter) {
  const url = new URL(
    `/${GRAPH_VERSION}/${encodeURIComponent(account.provider_account_id)}/insights`,
    GRAPH_ORIGIN,
  );
  url.searchParams.set("metric", metric);
  url.searchParams.set("period", "lifetime");
  url.searchParams.set("metric_type", "total_value");
  url.searchParams.set("timeframe", timeframe);
  url.searchParams.set(parameter, breakdown);

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const payload = await response.json();

  if (!response.ok) return `ERROR ${payload?.error?.message ?? response.status}`;

  const entry = payload?.data?.find((item) => item.name === metric);
  if (!entry) return "sin dato";

  const breakdowns = entry.total_value?.breakdowns ?? [];
  const results = breakdowns[0]?.results ?? [];
  if (results.length === 0) return "conjunto vacío";

  const keys = breakdowns[0].dimension_keys?.join("+") ?? "?";
  const top = results
    .slice()
    .sort((left, right) => right.value - left.value)
    .slice(0, 4)
    .map((item) => `${item.dimension_values.join("/")}=${item.value}`)
    .join(" ");

  return `${results.length} valores [${keys}] · ${top}`;
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
