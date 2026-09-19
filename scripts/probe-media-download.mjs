/**
 * Sonda de sólo lectura: ¿se puede bajar el video de un Reel desde el servidor?
 *
 * Todo el análisis con IA depende de esto: sin acceso al archivo no hay transcripción
 * ni lectura de escenas. La duda es doble —si la URL que guardamos sigue viva y si la
 * que devuelve Meta hoy se puede descargar sin sesión de navegador—, así que prueba las
 * dos. No descarga el video entero: pide sólo el primer medio mega con un rango.
 *
 * No escribe nada. Uso: node --env-file=.env.local scripts/probe-media-download.mjs
 */
import { createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const GRAPH_ORIGIN = "https://graph.instagram.com";
const GRAPH_VERSION = "v26.0";
const RANGE_BYTES = 512 * 1024;

const admin = createClient(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requireEnv("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false } },
);

const { data: reels } = await admin
  .from("instagram_media")
  .select("id, provider_media_id, media_product_type, media_type, posted_at, media_url, synced_at, social_account_id")
  .in("media_product_type", ["REELS", "VIDEO"])
  .order("posted_at", { ascending: false })
  .limit(1);

const reel = reels?.[0];
if (!reel) exit("No hay ningún Reel guardado para probar.");

const { data: account } = await admin
  .from("social_accounts")
  .select("username, connection_id")
  .eq("id", reel.social_account_id)
  .single();

console.log(`Reel de @${account.username} · publicado ${reel.posted_at.slice(0, 10)} · sincronizado ${reel.synced_at.slice(0, 16)}\n`);

console.log("1. URL guardada en la base");
await probe(reel.media_url);

const { data: credential } = await admin
  .from("instagram_connection_credentials")
  .select("access_token_ciphertext, access_token_iv, access_token_auth_tag")
  .eq("connection_id", account.connection_id)
  .single();

const token = decryptToken(credential);
const url = new URL(`/${GRAPH_VERSION}/${reel.provider_media_id}`, GRAPH_ORIGIN);
url.searchParams.set("fields", "media_url,thumbnail_url");
const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
const payload = await response.json();

console.log("\n2. URL pedida a Meta recién ahora");
if (!response.ok || !payload.media_url) {
  console.log(`   Meta no devolvió media_url: ${payload?.error?.message ?? response.status}`);
} else {
  console.log(`   ¿misma URL que la guardada? ${payload.media_url === reel.media_url ? "sí" : "no, cambió"}`);
  await probe(payload.media_url);
}

async function probe(mediaUrl) {
  if (!mediaUrl) return console.log("   no hay URL");

  const host = new URL(mediaUrl).host;
  try {
    const response = await fetch(mediaUrl, { headers: { Range: `bytes=0-${RANGE_BYTES - 1}` } });
    const bytes = response.ok ? (await response.arrayBuffer()).byteLength : 0;

    console.log(`   host: ${host}`);
    console.log(`   HTTP ${response.status} · tipo: ${response.headers.get("content-type") ?? "?"}`);
    console.log(`   bajados: ${Math.round(bytes / 1024)} KB · tamaño total: ${response.headers.get("content-range") ?? response.headers.get("content-length") ?? "?"}`);
  } catch (error) {
    console.log(`   falló la descarga: ${error.message}`);
  }
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
