import type { ContentLibraryItem } from "@/lib/content/library";

export type ContentBenchmarkKey = "views" | "engagement" | "saves" | "shares";
export type PerformanceSignal = "up" | "down" | "right";

export type ContentBenchmark = {
  current: number;
  median: number;
  multiplier: number | null;
  sampleSize: number;
};

const MIN_BENCHMARK_SAMPLE = 3;
const PERFORMANCE_SIGNAL_BAND = { low: 0.8, high: 1.2 } as const;

/** Fuera de esta banda la diferencia deja de ser ruido y pasa a ser señal. */
export function getPerformanceSignal(multiplier: number | null): PerformanceSignal {
  if (multiplier !== null && multiplier >= PERFORMANCE_SIGNAL_BAND.high) return "up";
  if (multiplier !== null && multiplier <= PERFORMANCE_SIGNAL_BAND.low) return "down";
  return "right";
}

/**
 * Cómo se lee un multiplicador en una frase. Vive junto a la banda que lo clasifica
 * para que el texto y el umbral no puedan discrepar.
 */
export function getPerformanceVerdict(multiplier: number | null): string {
  const signal = getPerformanceSignal(multiplier);
  if (signal === "up") return "Rindió por encima de";
  if (signal === "down") return "Rindió por debajo de";
  return "Rindió en línea con";
}

export function getEngagementRate(
  interactions: number | null,
  views: number | null,
) {
  return ratioAsPercentage(interactions, views);
}

export function getWatchRetentionPercentage(
  averageWatchTimeMs: number | null,
  durationSeconds: number | null,
) {
  if (averageWatchTimeMs === null) return null;
  return ratioAsPercentage(averageWatchTimeMs / 1000, durationSeconds);
}

export function getContentBenchmark(
  cohort: ContentLibraryItem[],
  itemId: string,
  key: ContentBenchmarkKey,
): ContentBenchmark | null {
  const measured = cohort.flatMap((item) => {
    const value = readBenchmarkValue(item, key);
    return value === null ? [] : [{ id: item.id, value }];
  });

  if (measured.length < MIN_BENCHMARK_SAMPLE) return null;

  const current = measured.find((entry) => entry.id === itemId)?.value ?? null;
  if (current === null) return null;

  const values = measured.map((entry) => entry.value).sort((left, right) => left - right);
  const middle = Math.floor(values.length / 2);
  const median =
    values.length % 2 === 0
      ? (values[middle - 1] + values[middle]) / 2
      : values[middle];

  return {
    current,
    median,
    multiplier: median > 0 ? current / median : null,
    sampleSize: values.length,
  };
}

function readBenchmarkValue(item: ContentLibraryItem, key: ContentBenchmarkKey) {
  if (key === "views") return item.views;
  if (key === "engagement") return getEngagementRate(item.interactions, item.views);
  if (key === "saves") return ratioAsPercentage(item.saves, item.views);
  return ratioAsPercentage(item.shares, item.views);
}

function ratioAsPercentage(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return (numerator / denominator) * 100;
}
