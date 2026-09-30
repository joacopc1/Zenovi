/**
 * Compara proveedores de transcripción sobre un Reel real de la cuenta.
 *
 * El PRD lo pide así: "no se selecciona un proveedor definitivo hasta ejecutar un
 * benchmark propio con contenido real en español". Elegir por la tabla de precios de cada
 * uno no sirve —el que transcribe mal barato es el más caro de todos— y el rioplatense es
 * justamente donde los modelos se caen: el voseo, el "ta", los nombres propios.
 *
 * Corre sólo los proveedores cuya clave esté en `.env.local`, así que se puede empezar con
 * uno. No escribe nada en la base: baja el video, lo manda y muestra lo que volvió.
 *
 * Claves que reconoce (todas opcionales):
 *   DEEPGRAM_API_KEY      https://console.deepgram.com     (acepta la URL, no sube archivo)
 *   OPENAI_API_KEY        https://platform.openai.com
 *   GROQ_API_KEY          https://console.groq.com         (whisper large v3, muy barato)
 *   ASSEMBLYAI_API_KEY    https://www.assemblyai.com       (acepta la URL)
 *
 * Uso: npm run bench:transcription [@usuario]
 */
import { loadFreshInstagramReel } from "./lib/fresh-instagram-reel.mjs";
// Con menos texto no hay material para juzgar voseo, nombres ni cortes de frase.
// No pretende ser una métrica académica: evita elegir proveedor con un Reel casi mudo.
const MINIMUM_USEFUL_WORDS = 20;

const wanted = process.argv[2]?.replace(/^@/, "") ?? null;

const providers = [
  { name: "Deepgram nova-3", key: "DEEPGRAM_API_KEY", run: deepgram },
  { name: "OpenAI gpt-4o-transcribe", key: "OPENAI_API_KEY", run: openai },
  { name: "Groq whisper-large-v3-turbo", key: "GROQ_API_KEY", run: groq },
  { name: "AssemblyAI", key: "ASSEMBLYAI_API_KEY", run: assemblyai },
];

const disponibles = providers.filter((provider) => process.env[provider.key]?.trim());

if (disponibles.length === 0) {
  console.log("Ninguna clave configurada en .env.local. Agregá al menos una:");
  for (const provider of providers) console.log(`  ${provider.key.padEnd(20)} ${provider.name}`);
  process.exit(0);
}

const { account, reel, unavailableReels, video, downloadMs } = await loadFreshInstagramReel(
  wanted,
).catch((error) => exit(error.message));
if (unavailableReels > 0) {
  console.log(
    `Meta no entregó el archivo de ${unavailableReels} ${unavailableReels === 1 ? "Reel" : "Reels"}; uso el siguiente disponible.\n`,
  );
}

console.log(`Cuenta @${account.username}`);
console.log(`Reel del ${reel.timestamp?.slice(0, 10)} · ${reel.permalink ?? reel.id}\n`);

console.log(`Video bajado: ${(video.length / 1024 / 1024).toFixed(1)} MB en ${downloadMs} ms\n`);

const results = [];

for (const provider of disponibles) {
  console.log(`${"─".repeat(72)}\n${provider.name}`);
  const inicio = Date.now();
  try {
    const text = await provider.run(reel.media_url, video);
    const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
    const palabras = countTranscriptWords(text);
    results.push({ provider: provider.name, words: palabras });
    console.log(`  ${segundos}s · ${palabras} palabras\n`);
    console.log(text.trim());
  } catch (error) {
    results.push({ provider: provider.name, words: 0 });
    console.log(`  FALLÓ: ${error.message}`);
  }
  console.log("");
}

console.log(`${"─".repeat(72)}`);
const bestWordCount = Math.max(...results.map((result) => result.words));

if (bestWordCount < MINIMUM_USEFUL_WORDS) {
  console.log("MUESTRA INSUFICIENTE: este Reel casi no tiene diálogo reconocible.");
  console.log(
    `Ningún proveedor llegó a ${MINIMUM_USEFUL_WORDS} palabras, así que esta corrida no sirve para elegir uno.`,
  );
  console.log("Probá con un Reel hablado en español, idealmente con voseo y algún nombre propio.");
} else {
  console.log("Qué mirar, en este orden:");
  console.log("  1. ¿Entendió el voseo y el 'ta'? Un modelo que lo neutraliza escribe otra persona.");
  console.log("  2. ¿Los nombres propios y las marcas están bien escritos?");
  console.log("  3. ¿Cortó las frases donde se cortan al hablar?");
  console.log("  4. Recién después, el precio por minuto de cada uno en su página.");
}

async function deepgram(url) {
  const response = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-3&language=es&smart_format=true&utterances=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    },
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.err_msg ?? `HTTP ${response.status}`);

  const utterances = data.results?.utterances;
  if (Array.isArray(utterances) && utterances.length > 0) {
    return utterances.map((u) => `[${formatSecond(u.start)}] ${u.transcript}`).join("\n");
  }

  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "(sin texto)";
}

async function openai(_url, video) {
  return whisperCompatible(
    "https://api.openai.com/v1/audio/transcriptions",
    process.env.OPENAI_API_KEY,
    "gpt-4o-transcribe",
    video,
  );
}

async function groq(_url, video) {
  return whisperCompatible(
    "https://api.groq.com/openai/v1/audio/transcriptions",
    process.env.GROQ_API_KEY,
    "whisper-large-v3-turbo",
    video,
    { timestamps: true },
  );
}

/** OpenAI y Groq comparten la misma forma de pedido; cambia el host y el modelo. */
async function whisperCompatible(endpoint, apiKey, model, video, options = {}) {
  const form = new FormData();
  form.append("file", new Blob([video], { type: "video/mp4" }), "reel.mp4");
  form.append("model", model);
  form.append("language", "es");
  if (options.timestamps) {
    form.append("response_format", "verbose_json");
    form.append("timestamp_granularities[]", "segment");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey.trim()}` },
    body: form,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);

  if (options.timestamps && Array.isArray(data.segments) && data.segments.length > 0) {
    return data.segments
      .map((segment) => `[${formatSecond(segment.start)}] ${segment.text.trim()}`)
      .join("\n");
  }

  return data.text ?? "(sin texto)";
}

async function assemblyai(url) {
  const key = process.env.ASSEMBLYAI_API_KEY.trim();
  const created = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: { authorization: key, "content-type": "application/json" },
    body: JSON.stringify({ audio_url: url, language_code: "es" }),
  }).then((response) => response.json());

  if (created.error) throw new Error(created.error);

  // Es asíncrono: se consulta hasta que termina, con tope para no quedarse colgado.
  for (let intento = 0; intento < 120; intento += 1) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const result = await fetch(`https://api.assemblyai.com/v2/transcript/${created.id}`, {
      headers: { authorization: key },
    }).then((response) => response.json());

    if (result.status === "completed") return result.text ?? "(sin texto)";
    if (result.status === "error") throw new Error(result.error);
  }

  throw new Error("no terminó en seis minutos");
}

function formatSecond(seconds) {
  const total = Math.round(seconds ?? 0);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/** Las marcas de tiempo se muestran, pero no son palabras dichas por la persona. */
function countTranscriptWords(text) {
  return text
    .replace(/\[\d+:\d{2}\]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function exit(message) {
  console.error(message);
  process.exit(1);
}
