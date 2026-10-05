import type { RankedContentItem } from "@/lib/content/library";
import { compareWithOwnSequences, type StorySequence } from "../content/story-sequences.ts";
import { pieceLabel } from "../director/account-snapshots.ts";

/**
 * Lo que arma el Inicio: qué funcionó, qué sigue y qué preguntarle al Director. Todo sale
 * de datos que ya existen; el Inicio resume y lleva a donde se actúa, no repite Analíticas.
 */

/** Lo que mejor funcionó se busca en las últimas dos semanas: más atrás ya no es noticia. */
export const STANDOUT_WINDOW_DAYS = 14;
const DAY_MS = 86_400_000;

/**
 * Las piezas recientes que mejor rindieron contra lo habitual de su formato, de la mejor
 * a la peor. Las Historias van aparte: se miden por secuencia, no por pieza.
 */
export function pickTopPieces(ranked: readonly RankedContentItem[], now: Date, limit = 4): RankedContentItem[] {
  const since = now.getTime() - STANDOUT_WINDOW_DAYS * DAY_MS;
  return ranked
    .filter((item) => item.kind !== "story" && item.multiplier !== null && Date.parse(item.postedAt) >= since)
    .toSorted((left, right) => right.multiplier! - left.multiplier!)
    .slice(0, limit);
}

export type StorySnapshot = {
  anchorId: string;
  startedAt: string;
  stories: number;
  completion: number | null;
  habitualCompletion: number | null;
};

/** La última secuencia de Historias, si es de los últimos dos días, contra lo habitual. */
export function latestStories(sequences: readonly StorySequence[], now: Date): StorySnapshot | null {
  const latest = sequences[0];
  if (!latest || now.getTime() - Date.parse(latest.startedAt) > 2 * DAY_MS) return null;
  return {
    anchorId: latest.id,
    startedAt: latest.startedAt,
    stories: latest.stories.length,
    completion: latest.completionRate,
    habitualCompletion: compareWithOwnSequences(sequences, latest.id, "completion")?.median ?? null,
  };
}

const EVERGREEN_QUESTIONS = [
  "Armame el plan de publicación de esta semana.",
  "Dame 3 ganchos para mi próximo Reel.",
  "¿Qué tema le interesaría a mi audiencia que todavía no toqué?",
  "¿Qué formato me conviene probar este mes?",
  "Revisá mi último Reel y decime qué mejorar.",
  "Dame una idea de Historia para vender sin parecer vendedor.",
];

/**
 * Preguntas para el Director armadas con lo que pasó de verdad: no son genéricas, cada una
 * parte de un dato de la cuenta y abre el chat con la pregunta escrita.
 */
export function directorQuestions({
  standout,
  viewsCurrent,
  viewsPrevious,
  daysSinceLast,
  hasStories,
  timeZone,
  now,
}: {
  standout: RankedContentItem | null;
  viewsCurrent: number | null;
  viewsPrevious: number | null;
  daysSinceLast: number | null;
  hasStories: boolean;
  timeZone?: string;
  now?: Date;
}): string[] {
  const questions: string[] = [];
  if (standout) questions.push(`¿Por qué funcionó tan bien mi ${pieceLabel(standout, timeZone)}? ¿Qué repito?`);
  if (viewsCurrent !== null && viewsPrevious !== null && viewsPrevious > 0) {
    questions.push(
      viewsCurrent < viewsPrevious
        ? "Mis visualizaciones bajaron esta semana. ¿Qué cambio?"
        : "Esta semana me fue mejor que la anterior. ¿Qué hice distinto?",
    );
  }
  if (daysSinceLast !== null && daysSinceLast >= 3) {
    questions.push(`Hace ${daysSinceLast} días que no publico. Dame 3 ideas para grabar hoy.`);
  }
  if (hasStories) questions.push("¿Cómo hago para que más gente vea mis Historias hasta el final?");
  // Las que completan hasta tres valen para cualquier cuenta y cambian cada día, para que
  // el Inicio no muestre siempre las mismas.
  const day = Math.floor((now ?? new Date()).getTime() / 86_400_000);
  for (let offset = 0; questions.length < 3 && offset < EVERGREEN_QUESTIONS.length; offset += 1) {
    const question = EVERGREEN_QUESTIONS[(day + offset) % EVERGREEN_QUESTIONS.length];
    if (!questions.includes(question)) questions.push(question);
  }
  return questions.slice(0, 3);
}

/** Un trozo de la frase del Insight; los números y las piezas van resaltados. */
export type InsightPart = { text: string; strong?: boolean };

const percentFormatter = new Intl.NumberFormat("es-UY", { style: "percent", maximumFractionDigits: 0 });
const multiplierFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

/**
 * La lectura de la semana en una frase, armada con datos y sin IA: qué cambió, qué pieza
 * lo explicó y qué está pendiente. Un cambio menor al 5 % no se cuenta como cambio.
 */
export function buildInsight({
  viewsCurrent,
  viewsPrevious,
  standout,
  daysSinceLast,
  timeZone,
}: {
  viewsCurrent: number | null;
  viewsPrevious: number | null;
  standout: RankedContentItem | null;
  daysSinceLast: number | null;
  timeZone?: string;
}): InsightPart[] {
  const parts: InsightPart[] = [];
  const change = viewsCurrent !== null && viewsPrevious !== null && viewsPrevious > 0 ? (viewsCurrent - viewsPrevious) / viewsPrevious : null;

  if (change !== null && Math.abs(change) >= 0.05) {
    parts.push({ text: `Tus visualizaciones ${change > 0 ? "subieron" : "bajaron"} ` }, { text: percentFormatter.format(Math.abs(change)), strong: true }, { text: " esta semana" });
    if (standout) {
      parts.push({ text: change > 0 ? ", impulsadas por tu " : "; lo que mejor rindió fue tu " }, { text: pieceLabel(standout, timeZone), strong: true }, { text: "." });
    } else {
      parts.push({ text: "." });
    }
  } else if (standout) {
    parts.push({ text: "Tu " }, { text: pieceLabel(standout, timeZone), strong: true }, { text: " rindió " }, { text: `${multiplierFormatter.format(standout.multiplier!)}×`, strong: true }, { text: " tu habitual." });
  } else {
    parts.push({ text: "Esta semana tus visualizaciones se mantuvieron estables." });
  }

  if (daysSinceLast !== null && daysSinceLast >= 3) {
    parts.push({ text: " Hace " }, { text: `${daysSinceLast} días`, strong: true }, { text: " que no publicás." });
  }
  return parts;
}

export type AttentionItem = {
  id: string;
  label: string;
  /** Mayor que cero cuando hay algo que atender; ordena y filtra. */
  count: number;
  /** Lo que se lee en la etiqueta: el contador, o un porcentaje cuando eso dice más. */
  badge: string;
  href: string;
};

/** Debajo de esta parte del ADN, el Director todavía no conoce la marca (mismo umbral que su aviso). */
const BRAND_DNA_READY_PERCENT = 50;
/** Con menos de esta parte de los créditos del mes, se avisa antes de quedarse sin. */
const LOW_CREDITS_SHARE = 0.1;

/**
 * Lo que quedó a medio hacer o frena el trabajo, con su contador. Lo que está en cero no
 * se muestra; los contadores de días y porcentajes muestran el número que importa.
 */
export function needsAttention({
  production,
  today,
  reelsWithoutAnalysis,
  failedAnalyses,
  daysSinceLast,
  brandDnaPercent,
  credits,
}: {
  production: readonly { status: string; hook: string; development: string; targetDate: string | null }[];
  today: string;
  reelsWithoutAnalysis: number;
  failedAnalyses: number;
  daysSinceLast: number | null;
  brandDnaPercent: number;
  credits: { remaining: number; total: number };
}): AttentionItem[] {
  const pending = production.filter((item) => item.status !== "publicada");
  const withoutScript = pending.filter((item) => !item.hook.trim() && !item.development.trim()).length;
  const overdue = pending.filter((item) => item.targetDate !== null && item.targetDate < today).length;
  const lowCredits = credits.total > 0 && credits.remaining / credits.total < LOW_CREDITS_SHARE;
  const items: Array<Omit<AttentionItem, "badge"> & { badge?: string }> = [
    { id: "overdue", label: "Ideas con fecha vencida", count: overdue, href: "/production" },
    { id: "script", label: "Ideas sin guion", count: withoutScript, href: "/production" },
    { id: "analysis", label: "Reels recientes sin analizar", count: reelsWithoutAnalysis, href: "/content" },
    { id: "failed", label: "Análisis que fallaron", count: failedAnalyses, href: "/content" },
    { id: "posting", label: "Días sin publicar", count: daysSinceLast !== null && daysSinceLast >= 3 ? daysSinceLast : 0, href: "/production" },
    // Aparece aunque esté en 0 %: justo ahí es cuando más falta.
    { id: "brand", label: "ADN de marca incompleto", count: brandDnaPercent < BRAND_DNA_READY_PERCENT ? 1 : 0, badge: `${brandDnaPercent}%`, href: "/brand" },
    { id: "credits", label: "Créditos por agotarse", count: lowCredits ? 1 : 0, badge: String(Math.floor(credits.remaining)), href: "/settings/billing" },
  ];
  return items
    .filter((item) => item.count > 0)
    .map((item) => ({ ...item, badge: item.badge ?? String(item.count) }));
}

/**
 * Los próximos siete días empezando por hoy: lo que importa en el Inicio es qué viene, no
 * lo que ya pasó.
 */
export function upcomingDays(now: Date, count = 7): string[] {
  return Array.from({ length: count }, (_, offset) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  });
}

export type ActivityDay = { date: string; count: number };

/**
 * Lo publicado por día en las últimas semanas, armado como el calendario de actividad de
 * GitHub: una columna por semana (de domingo a sábado) y una fila por día. Los días que
 * todavía no llegaron quedan vacíos. Cuenta en el día local del creador.
 */
export function buildActivityGrid(postedAt: readonly string[], now: Date, weeks = 17, timeZone?: string) {
  const dayKey = (date: Date) =>
    new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(date);
  const counts = new Map<string, number>();
  for (const value of postedAt) {
    const key = dayKey(new Date(value));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = dayKey(now);
  const [year, month, day] = today.split("-").map(Number);
  const todayDate = new Date(Date.UTC(year, month - 1, day));
  const start = new Date(todayDate);
  start.setUTCDate(start.getUTCDate() - todayDate.getUTCDay() - (weeks - 1) * 7);

  const grid: Array<Array<ActivityDay | null>> = [];
  let activeDays = 0;
  let total = 0;
  for (let week = 0; week < weeks; week += 1) {
    const column: Array<ActivityDay | null> = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + week * 7 + weekday);
      const key = date.toISOString().slice(0, 10);
      if (key > today) {
        column.push(null);
        continue;
      }
      const count = counts.get(key) ?? 0;
      if (count > 0) activeDays += 1;
      total += count;
      column.push({ date: key, count });
    }
    grid.push(column);
  }
  return { grid, activeDays, total, max: Math.max(1, ...[...counts.values()]) };
}

/**
 * La lectura que escribió la IA, con los **resaltados** convertidos en partes fuertes. Si
 * los asteriscos quedaron desparejos, el texto se muestra igual, sin resaltar.
 */
export function parseInsightText(text: string): InsightPart[] {
  const pieces = text.trim().split("**");
  if (pieces.length % 2 === 0) return [{ text: text.replaceAll("**", "").trim() }];
  return pieces
    .map((piece, index) => ({ text: piece, strong: index % 2 === 1 }))
    .filter((part) => part.text.length > 0);
}

/** El saludo del Inicio según la hora de la persona: buen día, buenas tardes o buenas noches. */
export function greetingFor(now: Date, timeZone = "America/Montevideo") {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone }).format(now));
  if (hour >= 5 && hour < 12) return "Buen día";
  if (hour >= 12 && hour < 20) return "Buenas tardes";
  return "Buenas noches";
}
