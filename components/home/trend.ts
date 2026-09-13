export type TrendDirection = "up" | "down" | "flat" | "unavailable";

export type TrendComparison = {
  direction: TrendDirection;
  percentage: number | null;
};

export function calculateTrend(
  current: number,
  previous: number,
  available: boolean,
): TrendComparison {
  if (!available || previous === 0) {
    return { direction: "unavailable", percentage: null };
  }

  const percentage = ((current - previous) / previous) * 100;
  if (Math.abs(percentage) < 0.5) {
    return { direction: "flat", percentage: 0 };
  }

  return { direction: percentage > 0 ? "up" : "down", percentage };
}

export function getTrendColorClass(trend: TrendDirection) {
  if (trend === "up") return "text-success";
  if (trend === "down") return "text-danger";
  return trend === "unavailable" ? "text-muted" : "text-ink";
}
