/** 90 es el techo: Meta no conserva insights de cuenta más allá de ese punto. */
export const RANGE_OPTIONS = [7, 30, 90] as const;
export const DEFAULT_RANGE_DAYS = 30;

export type RangeDays = (typeof RANGE_OPTIONS)[number];

export function parseRangeDays(value: string | string[] | undefined): RangeDays {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  return RANGE_OPTIONS.includes(parsed as RangeDays)
    ? (parsed as RangeDays)
    : DEFAULT_RANGE_DAYS;
}

export function buildRangeHref(basePath: string, days: RangeDays) {
  return days === DEFAULT_RANGE_DAYS ? basePath : `${basePath}?days=${days}`;
}

/** Cada sección del informe es una pestaña y vive en la URL, no en el navegador. */
export const ANALYTICS_TABS = [
  "visibilidad",
  "engagement",
  "contenido",
  "comunidad",
  "audiencia",
] as const;

export type AnalyticsTab = (typeof ANALYTICS_TABS)[number];
export const DEFAULT_ANALYTICS_TAB: AnalyticsTab = "visibilidad";

export function parseAnalyticsTab(value: string | string[] | undefined): AnalyticsTab {
  const raw = Array.isArray(value) ? value[0] : value;

  return ANALYTICS_TABS.includes(raw as AnalyticsTab) ? (raw as AnalyticsTab) : DEFAULT_ANALYTICS_TAB;
}

/** Período y pestaña conviven en la URL: cambiar uno nunca pierde el otro. */
export function buildAnalyticsHref(basePath: string, days: RangeDays, tab: AnalyticsTab) {
  const params = new URLSearchParams();
  if (days !== DEFAULT_RANGE_DAYS) params.set("days", String(days));
  if (tab !== DEFAULT_ANALYTICS_TAB) params.set("tab", tab);
  const query = params.toString();

  return query.length > 0 ? `${basePath}?${query}` : basePath;
}
