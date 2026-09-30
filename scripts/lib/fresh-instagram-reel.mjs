import { createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const GRAPH_ORIGIN = "https://graph.instagram.com";
const GRAPH_VERSION = "v26.0";

/**
 * Trae el Reel más reciente cuyo archivo Meta permita descargar.
 *
 * Las URL guardadas vencen, así que los benchmarks comparten este único camino: leer la
 * conexión, pedir una URL fresca y mantener el video solamente en memoria.
 */
export async function loadFreshInstagramReel(wantedUsername) {
  const admin = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false } },
  );

  const accountQuery = admin
    .from("social_accounts")
    .select("id, username, provider_account_id, connection_id");
  const { data: accounts, error: accountError } = wantedUsername
    ? await accountQuery.eq("username", wantedUsername)
    : await accountQuery;

  if (accountError) throw new Error(`No pude leer las cuentas de Supabase: ${accountError.message}`);

  const account = (accounts ?? []).at(-1);
  if (!account) {
    throw new Error(
      wantedUsername
        ? `No encontré la cuenta @${wantedUsername}.`
        : "No hay ninguna cuenta guardada.",
    );
  }

  const { data: credential, error: credentialError } = await admin
    .from("instagram_connection_credentials")
    .select("access_token_ciphertext, access_token_iv, access_token_auth_tag")
    .eq("connection_id", account.connection_id)
    .maybeSingle();

  if (credentialError) {
    throw new Error(`No pude leer la credencial de Instagram: ${credentialError.message}`);
  }
  if (!credential) throw new Error("Esa conexión no tiene credencial guardada.");

  const accessToken = decryptToken(credential);
  const listed = await graph(
    `${account.provider_account_id}/media`,
    {
      fields: "id,media_product_type,media_url,permalink,timestamp",
      limit: "25",
    },
    accessToken,
  );

  if (listed.error) throw new Error(`No pude listar el contenido: ${listed.error.message}`);

  const reels = (listed.data ?? []).filter(
    (item) => item.media_product_type?.toUpperCase() === "REELS",
  );
  if (reels.length === 0) throw new Error("Esta cuenta no tiene ningún Reel para analizar.");

  const reel = reels.find((item) => item.media_url);
  if (!reel) throw new Error("Meta no entregó el archivo de ninguno de los Reels de esta cuenta.");

  const startedAt = Date.now();
  const download = await fetch(reel.media_url);
  if (!download.ok) throw new Error(`No pude bajar el video: HTTP ${download.status}`);

  return {
    account,
    reel,
    unavailableReels: reels.filter((item) => !item.media_url).length,
    video: Buffer.from(await download.arrayBuffer()),
    downloadMs: Date.now() - startedAt,
  };
}

export function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name} en .env.local`);
  return value;
}

async function graph(path, params, accessToken) {
  const url = new URL(`${GRAPH_ORIGIN}/${GRAPH_VERSION}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", accessToken);

  return (await fetch(url)).json();
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
