/**
 * Cuánto contenido traer y de qué piezas pedir estadísticas en cada sincronización.
 *
 * Traer la lista es barato —una llamada cada 100 piezas—, pero las estadísticas son una
 * llamada por pieza. Por eso la lista se trae completa hasta un tope y las estadísticas se
 * planifican: las piezas recientes se actualizan siempre y las viejas se completan una vez.
 */

/** El máximo que acepta Meta por página, verificado contra la API. */
export const MEDIA_PAGE_SIZE = 100;

/**
 * Lo que importa es qué tan reciente es el contenido, no cuánto hay: una publicación de
 * hace años no ayuda a crecer hoy. Se traen siempre las últimas 100 y, si todavía son de
 * los últimos 90 días, se sigue hasta cubrir ese período.
 */
export const MIN_MEDIA_ITEMS = 100;

/** Tope de seguridad aunque alguien publique muchísimo: 3 llamadas como máximo. */
export const MAX_MEDIA_ITEMS = 300;

/** Piezas de esta antigüedad todavía cambian y alimentan las analíticas de 90 días. */
export const RECENT_MEDIA_DAYS = 90;

/**
 * ¿Hace falta otra página? Sólo si faltan piezas para llegar a las últimas 100, o si la
 * más vieja traída sigue dentro de los 90 días. Quien tiene 80 piezas no llega acá: Meta
 * avisa antes que no hay más páginas.
 */
export function needsMoreMedia({
  fetchedCount,
  oldestPostedAt,
  now,
}: {
  fetchedCount: number;
  oldestPostedAt: string | null;
  now: Date;
}) {
  if (fetchedCount >= MAX_MEDIA_ITEMS) return false;
  if (fetchedCount < MIN_MEDIA_ITEMS) return true;
  if (oldestPostedAt === null) return false;

  return Date.parse(oldestPostedAt) >= now.getTime() - RECENT_MEDIA_DAYS * 24 * 60 * 60 * 1000;
}

/** Tope de llamadas de estadísticas por pieza en cada sincronización. */
export const MEDIA_INSIGHTS_PER_RUN = 150;

const CURSOR_PATTERN = /^[A-Za-z0-9_\-=]{1,512}$/;

/**
 * Cursor de la página siguiente, o `null` si no hay más.
 *
 * Lo que indica que hay otra página es `paging.next`: Meta deja un cursor `after` también
 * en la última, y seguirlo pediría páginas de más. Nunca se usa la URL de `next`: la
 * página siguiente se arma con el cursor, así no se pide a una dirección que llegó en la
 * respuesta.
 */
export function readNextCursor(payload: unknown): string | null {
  if (!isRecord(payload) || !isRecord(payload.paging)) return null;
  if (typeof payload.paging.next !== "string") return null;

  const cursors = payload.paging.cursors;
  const after = isRecord(cursors) ? cursors.after : null;

  return typeof after === "string" && CURSOR_PATTERN.test(after) ? after : null;
}

export type MediaInsightCandidate = {
  id: string;
  postedAt: string;
  hasInsights: boolean;
};

/**
 * Piezas a las que pedirles estadísticas en esta corrida, de la más nueva a la más vieja:
 * primero todas las recientes, después las viejas que nunca tuvieron datos. Las viejas
 * que ya tienen datos no se vuelven a pedir: sus números casi no cambian.
 */
export function planMediaInsightRefresh({
  media,
  now,
  budget = MEDIA_INSIGHTS_PER_RUN,
  recentDays = RECENT_MEDIA_DAYS,
}: {
  media: readonly MediaInsightCandidate[];
  now: Date;
  budget?: number;
  recentDays?: number;
}): string[] {
  const recentFrom = now.getTime() - recentDays * 24 * 60 * 60 * 1000;
  const newestFirst = [...media].sort((left, right) => Date.parse(right.postedAt) - Date.parse(left.postedAt));

  const recent = newestFirst.filter((item) => Date.parse(item.postedAt) >= recentFrom);
  const olderMissing = newestFirst.filter(
    (item) => Date.parse(item.postedAt) < recentFrom && !item.hasInsights,
  );

  return [...recent, ...olderMissing].slice(0, budget).map((item) => item.id);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
