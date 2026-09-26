/**
 * Sonda de sólo lectura: ¿se puede saber que un Reel fue de prueba?
 *
 * Los Trial Reels se muestran sólo a quienes no te siguen y después se "gradúan" —pasan
 * al perfil— a mano o por rendimiento. La documentación explica cómo crearlos, pero no
 * dice nada sobre cómo reconocerlos al leer el contenido ya publicado, que es lo que
 * Zenovi necesita: un Reel de prueba no se puede comparar contra uno normal, porque su
 * audiencia es otra por diseño.
 *
 * Esta sonda pregunta campo por campo cuáles acepta la API sobre un medio real, y
 * después pide los insights, para saber qué se puede guardar antes de escribir una línea
 * de sincronización. No escribe nada en ningún lado.
 *
 * Uso: node --env-file=.env.local scripts/probe-trial-reels.mjs [@usuario]
 */
import { createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const GRAPH_ORIGIN = "https://graph.instagram.com";
const GRAPH_VERSION = "v26.0";

/** Los nombres con los que la API podría exponer la condición de prueba. */
const CANDIDATE_FIELDS = [
  "is_trial",
  "is_trial_reel",
  "trial_params",
  "trial",
  "is_graduated",
  "graduation_strategy",
  "media_product_type",
  "is_shared_to_feed",
  "boost_eligibility_info",
];

/** Métricas que separarían la audiencia de prueba de la habitual, si existieran. */
const CANDIDATE_METRICS = [
  "views",
  "reach",
  "follows",
  "total_interactions",
  "ig_reels_avg_watch_time",
  "non_follower_reach",
  "trial_views",
];

const wanted = process.argv[2]?.replace(/^@/, "") ?? null;

const admin = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false } },
);

const accountQuery = admin
  .from("social_accounts")
  .select("id, username, provider_account_id, connection_id");
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
console.log(`Cuenta: @${account.username}\n`);

// 1. ¿Qué medios hay, y qué dice `media_product_type` de cada uno?
const listed = await graph(`${account.provider_account_id}/media`, {
  fields: "id,media_type,media_product_type,permalink,timestamp",
  limit: "25",
});

if (listed.error) exit(`No pude listar el contenido: ${listed.error.message}`);

const items = listed.data ?? [];
console.log(`${items.length} piezas devueltas por /media:`);
const productTypes = new Map();
for (const item of items) {
  const type = item.media_product_type ?? "(sin tipo)";
  productTypes.set(type, (productTypes.get(type) ?? 0) + 1);
  console.log(`  ${item.timestamp?.slice(0, 10)} ${String(type).padEnd(8)} ${item.media_type}`);
}
console.log(
  `\nvalores de media_product_type vistos: ${[...productTypes].map(([k, v]) => `${k}×${v}`).join(", ") || "ninguno"}`,
);

const reel = items.find((item) => item.media_product_type?.toUpperCase() === "REELS") ?? items[0];
if (!reel) exit("\nNo hay ninguna pieza para sondear campos.");

// 2. Campo por campo: ¿cuáles acepta la API sobre un medio ya publicado?
console.log(`\nCampos sobre ${reel.id} (${reel.media_product_type}):`);
for (const field of CANDIDATE_FIELDS) {
  const result = await graph(reel.id, { fields: field });
  if (result.error) {
    console.log(`  ${field.padEnd(24)} rechazado — ${result.error.message}`);
  } else {
    const value = result[field];
    console.log(`  ${field.padEnd(24)} ACEPTADO → ${JSON.stringify(value) ?? "(sin valor)"}`);
  }
}

// 3. ¿Y las métricas que separarían la audiencia de prueba?
console.log(`\nMétricas sobre ${reel.id}:`);
for (const metric of CANDIDATE_METRICS) {
  const result = await graph(`${reel.id}/insights`, { metric });
  if (result.error) {
    console.log(`  ${metric.padEnd(26)} rechazada — ${result.error.message}`);
  } else {
    const entry = result.data?.[0];
    console.log(`  ${metric.padEnd(26)} ACEPTADA → ${entry?.values?.[0]?.value ?? "(sin valor)"}`);
  }
}

async function graph(path, params) {
  const url = new URL(`${GRAPH_ORIGIN}/${GRAPH_VERSION}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);
  return response.json();
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
