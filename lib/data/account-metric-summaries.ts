export const ACCOUNT_CURRENT_TOTAL_PERIOD = "day_total_current_7d";
export const ACCOUNT_PREVIOUS_TOTAL_PERIOD = "day_total_previous_7d";

export type StoredAccountInsight = {
  metric: string;
  period: string;
  value: number | string;
  synced_at: string;
};

export type AccountMetricSummary = {
  metric: string;
  current: number;
  previous: number | null;
};

export function buildAccountMetricSummaries(rows: StoredAccountInsight[]) {
  const currentRows = rows
    .filter((row) => row.period === ACCOUNT_CURRENT_TOTAL_PERIOD)
    .sort((a, b) => b.synced_at.localeCompare(a.synced_at));
  const previousRows = rows.filter((row) => row.period === ACCOUNT_PREVIOUS_TOTAL_PERIOD);
  const latestCurrentByMetric = new Map<string, StoredAccountInsight>();

  for (const row of currentRows) {
    if (!latestCurrentByMetric.has(row.metric)) latestCurrentByMetric.set(row.metric, row);
  }

  return [...latestCurrentByMetric.values()].map((current) => {
    const previous = previousRows.find(
      (row) => row.metric === current.metric && row.synced_at === current.synced_at,
    );

    return {
      metric: current.metric,
      current: toNonNegativeNumber(current.value),
      previous: previous ? toNonNegativeNumber(previous.value) : null,
    } satisfies AccountMetricSummary;
  });
}

function toNonNegativeNumber(value: number | string) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
