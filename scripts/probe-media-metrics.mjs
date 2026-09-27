/**
 * Sonda de sólo lectura: ¿qué métricas entrega Meta por pieza, y para qué formato?
 *
 * Zenovi sincroniza diez métricas, pero la API acepta muchas más y no todas sirven para
 * todos los formatos: un Reel y una publicación del feed admiten cosas distintas, y la
 * única forma de saberlo es preguntar. Importa sobre todo por las de crecimiento
 * —seguidores ganados, visitas al perfil, toques en el enlace—, que son las que dicen si
 * una pieza hizo crecer la marca y no sólo si se vio.
 *
 * No escribe nada. Recorre una pieza de cada formato y pide métrica por métrica.
 *
 * Uso: npm run probe:metrics [@usuario]
 */
import { createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const GRAPH_ORIGIN = "https://graph.instagram.com";
const GRAPH_VERSION = "v26.0";

/** Todas las que la API declaró como válidas al rechazar una inventada. */
const METRICS = [
  "views",
  "reach",
  "total_interactions",
  "likes",
  "comments",
  "saved",
  "shares",
  "replies",
  "follows",
  "profile_visits",
  "profile_activity",
  "navigation",
  "link_clicks",
  "impressions",
  "total_views",
  "total_likes",
  "total_comments",
  "facebook_views",
  "crossposted_views",
  "ig_reels_avg_watch_time",
  "ig_reels_video_view_total_time",
  "reels_skip_rate",
];

/** Las que Zenovi ya guarda, para separar lo nuevo de lo conocido. */
const SINCRONIZADAS = new Set([
  "views",
  "reach",
  "total_interactions",
  "likes",
  "comments",
  "saved",
  "shares",
  "ig_reels_avg_watch_time",
  "ig_reels_video_view_total_time",
  "reels_skip_rate",
]);

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

const listed = await graph(`${account.provider_account_id}/media`, {
  fields: "id,media_type,media_product_type,timestamp",
  limit: "50",
});
if (listed.error) exit(`No pude listar el contenido: ${listed.error.message}`);

// Una pieza por formato: lo que acepta la API depende del formato, no de la pieza.
const porFormato = new Map();
for (const item of listed.data ?? []) {
  const clave = `${item.media_product_type ?? "SIN_TIPO"} / ${item.media_type}`;
  if (!porFormato.has(clave)) porFormato.set(clave, item);
}

for (const [formato, item] of porFormato) {
  console.log(`${formato}  ·  ${item.timestamp?.slice(0, 10)}  ·  ${item.id}`);

  const nuevas = [];
  for (const metric of METRICS) {
    const result = await graph(`${item.id}/insights`, { metric });
    if (result.error) continue;

    const value = result.data?.[0]?.values?.[0]?.value;
    const marca = SINCRONIZADAS.has(metric) ? "   " : "NUEVA";
    console.log(`  ${marca} ${metric.padEnd(30)} ${JSON.stringify(value)}`);
    if (!SINCRONIZADAS.has(metric)) nuevas.push(metric);
  }

  console.log(
    nuevas.length > 0
      ? `  → sin sincronizar: ${nuevas.join(", ")}\n`
      : "  → no hay nada nuevo para este formato\n",
  );
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
