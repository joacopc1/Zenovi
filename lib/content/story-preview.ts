import { STORY_ANALYSIS_PIPELINE_VERSION, type StorySequenceAnalysis } from "./story-analysis";
import type { RankedContentItem } from "./library";
import { buildStorySequences } from "./story-sequences";

const baseStory: Omit<RankedContentItem, "id" | "caption" | "mediaUrl" | "postedAt" | "views" | "reach" | "replies" | "storyForwardTaps" | "storyBackTaps" | "storyExits" | "storyNextSwipes"> = {
  kind: "story",
  comparisonFormat: "story",
  formatLabel: "Historia",
  mediaType: "IMAGE",
  thumbnailUrl: null,
  mediaWidth: 1080,
  mediaHeight: 1920,
  slides: [],
  durationMs: null,
  permalink: null,
  dateLabel: "30 de septiembre de 2026",
  relativeDateLabel: "Hoy",
  likes: null,
  comments: null,
  interactions: null,
  saves: null,
  shares: null,
  follows: null,
  profileVisits: null,
  profileActivity: null,
  averageWatchTimeMs: null,
  totalWatchTimeMs: null,
  skipRate: null,
  multiplier: null,
};

export const STORY_PREVIEW_ITEMS: RankedContentItem[] = [
  { ...story("story-preview-1", "/demo/story-1.svg", "2026-09-30T12:05:00Z", 2_460, 2_180, 18, 1_410, 42, 118, 190), profileVisits: 34, follows: 3, shares: 6 },
  { ...story("story-preview-2", "/demo/story-2.svg", "2026-09-30T12:08:00Z", 2_090, 1_870, 12, 1_240, 76, 96, 158), profileVisits: 21, follows: 1, shares: 2 },
  { ...story("story-preview-3", "/demo/story-3.svg", "2026-09-30T12:12:00Z", 1_920, 1_730, 31, 1_080, 130, 84, 141), profileVisits: 47, follows: 5, shares: 11 },
  { ...story("story-preview-4", "/demo/story-4.svg", "2026-09-30T12:16:00Z", 1_710, 1_560, 64, 890, 92, 106, 126), profileVisits: 58, follows: 4, shares: 3 },
];

/**
 * Secuencias anteriores, sólo para que la comparación "vs. tus secuencias" tenga contra qué
 * medirse. No se muestran: cada una es primera y última Historia del día.
 */
const STORY_PREVIEW_HISTORY_DAYS: Array<[date: string, startReach: number, endReach: number, replies: number, profileVisits: number, follows: number]> = [
  ["2026-09-23", 2_050, 1_310, 90, 96, 12],
  ["2026-09-24", 2_240, 1_590, 120, 120, 9],
  ["2026-09-25", 1_980, 1_150, 60, 61, 6],
  ["2026-09-26", 2_310, 1_480, 100, 102, 14],
  ["2026-09-28", 2_120, 1_400, 80, 88, 10],
];

const STORY_PREVIEW_HISTORY = STORY_PREVIEW_HISTORY_DAYS.flatMap(
  ([date, startReach, endReach, replies, profileVisits, follows]) => [
    story(`story-history-${date}-a`, "", `${date}T13:00:00Z`, startReach, startReach, 0, 0, 0, 0, 0),
    { ...story(`story-history-${date}-b`, "", `${date}T13:06:00Z`, endReach, endReach, replies, 0, 0, 0, 0), profileVisits, follows },
  ],
);

export const STORY_PREVIEW_SEQUENCES = buildStorySequences([...STORY_PREVIEW_ITEMS, ...STORY_PREVIEW_HISTORY]);
export const STORY_PREVIEW_SEQUENCE = STORY_PREVIEW_SEQUENCES.find((sequence) =>
  sequence.stories.some((item) => item.id === STORY_PREVIEW_ITEMS[0].id),
)!;

export const STORY_PREVIEW_ANALYSIS: StorySequenceAnalysis = {
  pipelineVersion: STORY_ANALYSIS_PIPELINE_VERSION,
  completedAt: "2026-09-30T15:00:00Z",
  diagnosis: {
    verdict: "La secuencia gana intención cuando muestra prueba, pero pierde atención antes de llegar ahí.",
    explanation:
      "La apertura plantea un problema reconocible y la oferta cierra con una acción simple. La caída más fuerte sucede antes de la prueba: para próximas secuencias conviene hacer tangible el resultado una slide antes y dejar la explicación como soporte.",
    confidence: "medium",
  },
  findings: [
    {
      kind: "friction",
      title: "La explicación ocupa el lugar donde debería aparecer la prueba",
      insight: "La segunda Historia suma tres conceptos antes de demostrar que el método produjo un resultado.",
      impact: "La secuencia pierde 14% de las personas antes de mostrar la evidencia que puede justificar seguir mirando.",
      slideNumbers: [2, 3],
    },
    {
      kind: "strength",
      title: "La prueba mejora la intención aunque llegue a menos personas",
      insight: "Las respuestas suben con fuerza cuando aparece el resultado concreto y vuelven a crecer en el CTA.",
      impact: "La secuencia no sólo retiene: convierte el interés restante en conversaciones medibles.",
      slideNumbers: [3, 4],
    },
  ],
  actions: [
    {
      kind: "keep",
      title: "Conservá una única palabra de respuesta",
      why: "La última Historia concentra la mayor cantidad de respuestas con una acción sin pasos extra.",
      how: "Cerrá futuras secuencias con una palabra vinculada al recurso y repetila una sola vez.",
      metricToWatch: "respuestas en la Historia de CTA",
      slideNumbers: [4],
    },
    {
      kind: "change",
      title: "Adelantá la prueba a la segunda Historia",
      why: "El descenso principal ocurre mientras todavía se enumeran señales y antes de mostrar un resultado.",
      how: "Abrí el problema, mostrá el resultado y recién después explicá el mecanismo en uno o dos puntos.",
      metricToWatch: "personas en la segunda Historia frente a la primera",
      slideNumbers: [1, 2, 3],
    },
    {
      kind: "test",
      title: "Probá una secuencia de tres pasos",
      why: "La oferta puede entenderse sin dedicar una slide completa a enumerar todas las métricas.",
      how: "Probá problema → prueba → CTA y compará respuestas y salidas contra una secuencia de cuatro slides.",
      metricToWatch: "salidas totales y respuestas por cada 1.000 views iniciales",
      slideNumbers: [1, 4],
    },
  ],
  slides: [
    {
      slideNumber: 1,
      role: "opening",
      visibleText: "Tu contenido no falla por falta de ideas",
      visual: "Fondo negro, una sola afirmación grande y alto contraste.",
      reading: "Plantea una tensión reconocible y deja una pregunta abierta.",
      recommendation: "Conservar la apertura breve y visualmente dominante.",
    },
    {
      slideNumber: 2,
      role: "context",
      visibleText: "Respuestas, visitas al perfil y conversaciones",
      visual: "Tres filas equivalentes sobre un fondo claro.",
      reading: "Ordena la explicación, pero todavía no demuestra el resultado.",
      recommendation: "Reducir la lista o moverla después de la prueba.",
    },
    {
      slideNumber: 3,
      role: "proof",
      visibleText: "Duplicamos las respuestas en una semana",
      visual: "Testimonio en una tarjeta blanca con el resultado destacado.",
      reading: "Hace tangible la promesa y coincide con un aumento de respuestas.",
      recommendation: "Adelantar esta evidencia a la segunda posición.",
    },
    {
      slideNumber: 4,
      role: "cta",
      visibleText: "Respondé MAPA",
      visual: "CTA blanco centrado sobre fondo negro.",
      reading: "Pide una sola acción y concentra la mayor intención de la secuencia.",
      recommendation: "Conservar una palabra corta y específica.",
    },
  ],
};

function story(
  id: string,
  mediaUrl: string,
  postedAt: string,
  views: number,
  reach: number,
  replies: number,
  storyForwardTaps: number,
  storyBackTaps: number,
  storyExits: number,
  storyNextSwipes: number,
): RankedContentItem {
  return {
    ...baseStory,
    id,
    caption: null,
    mediaUrl,
    postedAt,
    views,
    reach,
    replies,
    storyForwardTaps,
    storyBackTaps,
    storyExits,
    storyNextSwipes,
  };
}
