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
