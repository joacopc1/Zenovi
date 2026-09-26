/**
 * Sonda de sólo lectura: ¿el camino de Facebook Login ve lo que el de Instagram Login no?
 *
 * Zenovi usa Instagram Login (`graph.instagram.com`), que es una superficie reducida y ni
 * siquiera soporta introspección. Moka muestra Trial Reels, así que o usa el camino de
 * Facebook Login (`graph.facebook.com` con una cuenta Business vinculada a una Página) o
 * los saca de otro lado. Esto lo averigua en vez de suponerlo.
 *
 * Pide la introspección del nodo —`metadata=1`, que la API contesta listando todos sus
 * campos— y busca ahí cualquier cosa relacionada con pruebas. No escribe nada.
 *
 * Uso: node --env-file=.env.local scripts/probe-trial-reels-facebook.mjs
 */
const GRAPH = "https://graph.facebook.com/v25.0";

const token = process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim();
if (!token) {
  console.error("Falta FACEBOOK_USER_ACCESS_TOKEN en .env.local");
  process.exit(1);
}

// 1. ¿A qué Páginas llega este token, y qué cuenta de Instagram cuelga de ellas?
const pages = await graph("me/accounts", { fields: "id,name,instagram_business_account{id,username}" });
if (pages.error) exit(`No pude listar Páginas: ${pages.error.message}`);

const linked = (pages.data ?? []).filter((page) => page.instagram_business_account);
console.log(`Páginas con Instagram vinculado: ${linked.length}`);
for (const page of linked) {
  console.log(`  ${page.name} → @${page.instagram_business_account.username}`);
}

if (linked.length === 0) {
  exit(
    "\nEste token no llega a ninguna cuenta de Instagram Business.\n" +
      "Sin eso no se puede comparar el camino de Facebook Login contra el de Instagram Login.",
  );
}

const igUser = linked[0].instagram_business_account;

// 2. Introspección de la cuenta: qué campos y conexiones declara.
console.log(`\nIntrospección de la cuenta @${igUser.username}:`);
await introspect(igUser.id);

// 3. Introspección de un medio: acá viviría la marca de "fue una prueba".
const media = await graph(`${igUser.id}/media`, {
  fields: "id,media_type,media_product_type,timestamp",
  limit: "25",
});
if (media.error) exit(`No pude listar el contenido: ${media.error.message}`);

const items = media.data ?? [];
console.log(`\n${items.length} piezas; tipos: ${[...new Set(items.map((i) => i.media_product_type))].join(", ")}`);

const reel = items.find((item) => item.media_product_type?.toUpperCase() === "REELS") ?? items[0];
if (!reel) exit("No hay piezas para introspeccionar.");

console.log(`\nIntrospección del medio ${reel.id} (${reel.media_product_type}):`);
await introspect(reel.id);

async function introspect(id) {
  const result = await graph(id, { metadata: "1" });
  if (result.error) {
    console.log(`  no disponible — ${result.error.message}`);
    return;
  }

  const fields = result.metadata?.fields ?? [];
  const connections = Object.keys(result.metadata?.connections ?? {});
  console.log(`  ${fields.length} campos: ${fields.map((f) => f.name).join(", ") || "(ninguno)"}`);
  console.log(`  conexiones: ${connections.join(", ") || "(ninguna)"}`);

  const suspects = [
    ...fields.filter((f) => /trial|graduat|test|experiment|non_?follow/i.test(f.name)).map((f) => `campo ${f.name}`),
    ...connections.filter((name) => /trial|graduat|test|experiment/i.test(name)).map((name) => `conexión ${name}`),
  ];
  console.log(suspects.length > 0 ? `  RELACIONADO CON PRUEBAS: ${suspects.join(" · ")}` : "  nada relacionado con pruebas");
}

async function graph(path, params) {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", token);

  const response = await fetch(url);
  return response.json();
}

function exit(message) {
  console.error(message);
  process.exit(1);
}
