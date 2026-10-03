import assert from "node:assert/strict";
import test from "node:test";
import { directorQuestions, greetingFor, pickTopPieces } from "../lib/home/home-model.ts";

const now = new Date("2026-10-02T15:00:00Z");
const piece = (id, daysAgo, multiplier, kind = "reel") => ({
  id, kind, formatLabel: kind === "reel" ? "Reel" : "Historia", multiplier,
  postedAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
});

test("lo que mejor funcionó son las piezas recientes que más superaron su habitual, sin Historias", () => {
  const top = pickTopPieces([piece("a", 3, 1.4), piece("b", 20, 5), piece("c", 6, 2.1), piece("d", 1, 9, "story"), piece("e", 2, null), piece("f", 4, 0.6)], now);
  assert.deepEqual(top.map((item) => item.id), ["c", "a", "f"]);
  assert.deepEqual(pickTopPieces([piece("viejo", 30, 3)], now), []);
});

test("las preguntas al Director salen de lo que pasó en la cuenta", () => {
  const questions = directorQuestions({
    standout: { formatLabel: "Reel", postedAt: "2026-09-29T15:00:00Z" },
    viewsCurrent: 800,
    viewsPrevious: 1200,
    daysSinceLast: 4,
    hasStories: true,
  });
  assert.deepEqual(questions, [
    "¿Por qué funcionó tan bien mi Reel del 29 de setiembre? ¿Qué repito?",
    "Mis visualizaciones bajaron esta semana. ¿Qué cambio?",
    "Hace 4 días que no publico. Dame 3 ideas para grabar hoy.",
  ]);
  const withStories = directorQuestions({ standout: null, viewsCurrent: null, viewsPrevious: null, daysSinceLast: 1, hasStories: true });
  assert.equal(withStories[0], "¿Cómo hago para que más gente vea mis Historias hasta el final?");
  assert.equal(withStories.length, 3);
  // Sin pieza destacada ni Historias, igual hay tres preguntas con sentido.
  assert.equal(
    directorQuestions({ standout: null, viewsCurrent: 9, viewsPrevious: 3, daysSinceLast: 23, hasStories: false }).length,
    3,
  );
});

test("el Insight dice qué cambió, qué pieza lo explicó y qué falta, resaltando los datos", async () => {
  const { buildInsight } = await import("../lib/home/home-model.ts");
  const text = (parts) => parts.map((part) => (part.strong ? `**${part.text}**` : part.text)).join("");
  const standout = { formatLabel: "Reel", postedAt: "2026-09-28T15:00:00Z", multiplier: 2.14 };
  assert.equal(
    text(buildInsight({ viewsCurrent: 900, viewsPrevious: 300, standout, daysSinceLast: 4 })),
    "Tus visualizaciones subieron **200%** esta semana, impulsadas por tu **Reel del 28 de setiembre**. Hace **4 días** que no publicás.",
  );
  assert.equal(
    text(buildInsight({ viewsCurrent: 100, viewsPrevious: 102, standout, daysSinceLast: 0 })),
    "Tu **Reel del 28 de setiembre** rindió **2,1×** tu habitual.",
  );
  assert.equal(
    text(buildInsight({ viewsCurrent: null, viewsPrevious: null, standout: null, daysSinceLast: null })),
    "Esta semana tus visualizaciones se mantuvieron estables.",
  );
});

test("necesita atención muestra lo que frena el trabajo, con su contador o porcentaje", async () => {
  const { needsAttention } = await import("../lib/home/home-model.ts");
  const items = needsAttention({
    production: [
      { status: "idea", hook: "", development: "", targetDate: "2026-09-30" },
      { status: "guion", hook: "Gancho", development: "", targetDate: "2026-10-08" },
      { status: "publicada", hook: "", development: "", targetDate: "2026-09-20" },
    ],
    today: "2026-10-03",
    reelsWithoutAnalysis: 0,
    failedAnalyses: 2,
    daysSinceLast: 5,
    brandDnaPercent: 0,
    credits: { remaining: 120, total: 1500 },
  });
  assert.deepEqual(items.map((item) => [item.id, item.badge]), [
    ["overdue", "1"],
    ["script", "1"],
    ["failed", "2"],
    ["posting", "5"],
    ["brand", "0%"],
    ["credits", "120"],
  ]);
  const calm = needsAttention({
    production: [],
    today: "2026-10-03",
    reelsWithoutAnalysis: 0,
    failedAnalyses: 0,
    daysSinceLast: 1,
    brandDnaPercent: 80,
    credits: { remaining: 900, total: 1500 },
  });
  assert.deepEqual(calm, []);
});

test("la agenda arranca hoy y muestra los próximos días", async () => {
  const { upcomingDays } = await import("../lib/home/home-model.ts");
  assert.deepEqual(upcomingDays(new Date(2026, 9, 3, 13)), [
    "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09",
  ]);
});

test("las preguntas que completan cambian de un día a otro", async () => {
  const { directorQuestions } = await import("../lib/home/home-model.ts");
  const ask = (date) => directorQuestions({ standout: null, viewsCurrent: null, viewsPrevious: null, daysSinceLast: 1, hasStories: false, now: new Date(date) });
  assert.equal(ask("2026-10-03T12:00:00Z").length, 3);
  assert.notDeepEqual(ask("2026-10-03T12:00:00Z"), ask("2026-10-04T12:00:00Z"));
});

test("el calendario de constancia cuenta lo publicado por día, en columnas de domingo a sábado", async () => {
  const { buildActivityGrid } = await import("../lib/home/home-model.ts");
  const now = new Date("2026-10-03T15:00:00Z"); // sábado
  const activity = buildActivityGrid(
    ["2026-10-02T15:00:00Z", "2026-10-02T20:00:00Z", "2026-09-28T12:00:00Z", "2026-05-01T12:00:00Z"],
    now,
    2,
    "America/Montevideo",
  );
  assert.equal(activity.grid.length, 2);
  // La última columna es la semana de hoy: arranca el domingo 27 y termina hoy, sábado.
  assert.deepEqual(activity.grid[1].map((day) => day?.date), ["2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"]);
  assert.equal(activity.grid[1][5].count, 2);
  assert.equal(activity.grid[1][1].count, 1);
  // Lo de mayo queda fuera de las dos semanas.
  assert.equal(activity.total, 3);
  assert.equal(activity.activeDays, 2);

  const midweek = buildActivityGrid([], new Date("2026-09-30T15:00:00Z"), 1, "America/Montevideo");
  assert.equal(midweek.grid[0][4], null); // el jueves todavía no llegó
});

test("la lectura de la IA se muestra con sus resaltados, y sin ellos si vinieron mal", async () => {
  const { parseInsightText } = await import("../lib/home/home-model.ts");
  assert.deepEqual(parseInsightText("Subiste **200%** con tu **Reel del 28**."), [
    { text: "Subiste ", strong: false },
    { text: "200%", strong: true },
    { text: " con tu ", strong: false },
    { text: "Reel del 28", strong: true },
    { text: ".", strong: false },
  ]);
  assert.deepEqual(parseInsightText("**Hoy** y **hoy** otra vez"), [
    { text: "Hoy", strong: true },
    { text: " y ", strong: false },
    { text: "hoy", strong: true },
    { text: " otra vez", strong: false },
  ]);
  assert.deepEqual(parseInsightText("Quedó **abierto sin cerrar"), [{ text: "Quedó abierto sin cerrar" }]);
});

test("el saludo sigue la hora de Montevideo", () => {
  // Montevideo es UTC−3.
  assert.equal(greetingFor(new Date("2026-10-03T11:00:00Z")), "Buen día");
  assert.equal(greetingFor(new Date("2026-10-03T14:59:00Z")), "Buen día");
  assert.equal(greetingFor(new Date("2026-10-03T15:00:00Z")), "Buenas tardes");
  assert.equal(greetingFor(new Date("2026-10-03T23:30:00Z")), "Buenas noches");
  assert.equal(greetingFor(new Date("2026-10-04T05:00:00Z")), "Buenas noches");
});
