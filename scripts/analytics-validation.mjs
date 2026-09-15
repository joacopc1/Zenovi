/**
 * Informe de validación: las cifras que muestra Analíticas, para compararlas a mano con
 * el panel profesional de Instagram en el mismo período.
 *
 * Sólo lectura. Usa las mismas funciones que la página (`buildDailyMetricSeries`,
 * `summarizePeriod`…), así que si un número difiere de Instagram, la diferencia está en
 * los datos o en la definición de la métrica, no en un segundo cálculo distinto.
 *
 * Uso: npm run report:analytics [-- usuario]
 */
import { createClient } from "@supabase/supabase-js";
import { averagePerReportedDay } from "../lib/analytics/account-insights.ts";
import { closedWindow, summarizePeriod } from "../lib/analytics/period-totals.ts";
import { buildDailyMetricSeries } from "../lib/data/daily-metric-series.ts";
import { buildPeriodBreakdowns, PERIOD_WINDOW_DAYS, periodKey } from "../lib/data/period-breakdowns.ts";

const PERIODS = [7, 30];
// Igual que la página: 90 días más el margen de demora de Meta.
const SERIES_DAYS = 92;
const DAY_MS = 24 * 60 * 60 * 1000;

const METRICS = [
  { key: "views", label: "Visualizaciones", instagram: "Visualizaciones" },
  { key: "interactions", label: "Interacciones", instagram: "Interacciones con el contenido" },
  { key: "likes", label: "Me gusta", instagram: "Interacciones › Me gusta" },
  { key: "comments", label: "Comentarios", instagram: "Interacciones › Comentarios" },
  { key: "saves", label: "Guardados", instagram: "Interacciones › Guardados" },
  { key: "shares", label: "Compartidos", instagram: "Interacciones › Veces compartido" },
  { key: "profileViews", label: "Visitas al perfil", instagram: "Actividad del perfil › Visitas" },
  { key: "linkTaps", label: "Toques en el enlace", instagram: "Actividad del perfil › Toques en enlaces externos" },
];

const db = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false },
});

const username = process.argv[2]?.replace(/^@/, "");
let accountQuery = db.from("social_accounts").select("id, username, followers_count");
accountQuery = username ? accountQuery.eq("username", username) : accountQuery.limit(1);
const { data: accounts, error: accountError } = await accountQuery;
if (accountError || !accounts?.length) exit(username ? `No hay cuenta @${username} conectada.` : "No hay cuentas conectadas.");
const account = accounts[0];

const now = new Date();
const boundary = new Date(now.getTime() - SERIES_DAYS * DAY_MS).toISOString();
const [{ data: dailyRows }, { data: summaryRows }, { data: periodRows }] = await Promise.all([
  db.from("instagram_account_insights").select("metric, value, end_time").eq("social_account_id", account.id).eq("period", "day").gte("end_time", boundary),
  db.from("instagram_account_insights").select("metric, value, synced_at").eq("social_account_id", account.id).eq("period", "day_total_current_7d").order("synced_at", { ascending: false }).limit(12),
  db.from("instagram_account_insights").select("metric, period, value, end_time, synced_at").eq("social_account_id", account.id).in("period", PERIOD_WINDOW_DAYS.map(periodKey)).order("synced_at", { ascending: false }).limit(90),
]);
const breakdowns = buildPeriodBreakdowns(periodRows ?? []);

const series = buildDailyMetricSeries(dailyRows ?? [], now, SERIES_DAYS);

console.log(`\nValidación de Analíticas — @${account.username} · generado ${now.toISOString().slice(0, 16)} UTC`);
console.log("Compará cada fila con el panel profesional de Instagram, mismo período.\n");

for (const days of PERIODS) {
  const window = closedWindow(series, "views", days);
  console.log(`━━ Últimos ${days} días: del ${window[0]?.date} al ${window.at(-1)?.date} (días cerrados) ━━`);
  console.log(`${"Métrica".padEnd(22)}${"Zenovi".padStart(10)}  ${"Días con dato".padEnd(15)}Dónde mirarlo en Instagram`);

  for (const metric of METRICS) {
    const total = summarizePeriod(series, metric.key, days);
    const value = total.current === null ? "sin dato" : String(total.current);
    const coverage = `${total.reportedDays}/${total.days}${total.reportedDays < total.days ? " ⚠" : ""}`;
    console.log(`${metric.label.padEnd(22)}${value.padStart(10)}  ${coverage.padEnd(15)}${metric.instagram}`);
  }

  const breakdown = breakdowns.find((item) => item.days === days);
  if (breakdown) {
    const audience = breakdown.viewsByAudience;
    const pct = audience ? ((audience.followers / (audience.followers + audience.nonFollowers)) * 100).toFixed(1) + "%" : "sin dato";
    const byType = (breakdown.viewsByContent ?? []).map((item) => `${item.type}=${item.value}`).join(" ");
    console.log(`${"Alcance del período".padEnd(22)}${String(breakdown.reach ?? "sin dato").padStart(10)}  ${"".padEnd(15)}Espectadores (${breakdown.fromDate} al ${breakdown.toDate})`);
    console.log(`${"Vistas de seguidores".padEnd(22)}${pct.padStart(10)}  ${"".padEnd(15)}"% seguidores" bajo Reproducciones`);
    console.log(`${"Vistas por tipo".padEnd(22)}${"".padStart(10)}  ${"".padEnd(15)}${byType || "sin dato"}  → Visualizaciones por tipo de contenido`);
  } else {
    console.log(`${"Alcance del período".padEnd(22)}${"sin dato".padStart(10)}  ${"".padEnd(15)}Todavía no se sincronizó con la versión nueva`);
  }
  const reach = averagePerReportedDay(series.slice(-days), "reach");
  console.log(`${"Alcance prom./día".padEnd(22)}${(reach === null ? "sin dato" : reach.toFixed(1)).padStart(10)}  ${"".padEnd(15)}No es comparable directo: Instagram muestra cuentas únicas del período`);
  console.log("");
}

const latestReach = (summaryRows ?? []).find((row) => row.metric === "reach");
console.log("━━ Referencias oficiales de Meta ━━");
console.log(`Alcance 7 días (cuentas únicas): ${latestReach ? `${latestReach.value}  · sincronizado ${latestReach.synced_at.slice(0, 16)} UTC` : "sin dato"}  → Instagram: Cuentas alcanzadas, últimos 7 días`);
console.log(`Seguidores actuales: ${account.followers_count ?? "sin dato"}  → Instagram: número del perfil`);
console.log("\nNotas:");
console.log("- ⚠ indica días sin dato dentro del período: esa cifra no es comparable todavía.");
console.log("- Instagram usa la hora del Pacífico para cortar los días; si una cifra difiere poco, revisá el día del borde.");
console.log("- Meta puede tardar hasta 48 h en consolidar un día: sincronizá antes de comparar.\n");

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) exit(`Falta la variable ${name} en .env.local`);
  return value;
}

function exit(message) {
  console.error(message);
  process.exit(1);
}
