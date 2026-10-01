export type ParsedMediaInsight = {
  metric: string;
  period: string;
  value: number;
  endTime: string | null;
};

/**
 * Normaliza las dos formas que usa Meta para los insights de una pieza.
 *
 * La mayoría llega como un número. `navigation` de Stories puede llegar como un
 * objeto o como un breakdown; en ambos casos se conserva cada acción bajo una
 * clave estable (`navigation.tap_forward`, por ejemplo) para reutilizar la tabla
 * existente de insights sin crear un segundo sistema de métricas.
 */
export function parseMediaInsightResponse(payload: unknown): ParsedMediaInsight[] | null {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return null;

  const insights: ParsedMediaInsight[] = [];

  for (const item of payload.data) {
    if (!isRecord(item)) continue;

    const metric = readNonEmptyString(item.name);
    const period = readNonEmptyString(item.period) ?? "lifetime";
    if (!metric) continue;

    if (Array.isArray(item.values)) {
      for (const point of item.values) {
        if (!isRecord(point)) continue;
        appendMetricValues(
          insights,
          metric,
          period,
          point.value,
          readNonEmptyString(point.end_time),
        );
      }
    }

    if (isRecord(item.total_value)) {
      appendMetricValues(insights, metric, period, item.total_value.value, null);
      appendBreakdowns(insights, metric, period, item.total_value.breakdowns);
    }
  }

  return insights;
}

function appendMetricValues(
  output: ParsedMediaInsight[],
  metric: string,
  period: string,
  rawValue: unknown,
  endTime: string | null,
) {
  const numericValue = readNonNegativeNumber(rawValue);
  if (numericValue !== null) {
    output.push({ metric, period, value: numericValue, endTime });
    return;
  }

  if (!isRecord(rawValue)) return;

  for (const [key, value] of Object.entries(rawValue)) {
    const nestedValue = readNonNegativeNumber(value);
    if (nestedValue === null) continue;
    output.push({
      metric: `${metric}.${normalizeDimension(key)}`,
      period,
      value: nestedValue,
      endTime,
    });
  }
}

function appendBreakdowns(
  output: ParsedMediaInsight[],
  metric: string,
  period: string,
  rawBreakdowns: unknown,
) {
  if (!Array.isArray(rawBreakdowns)) return;

  for (const breakdown of rawBreakdowns) {
    if (!isRecord(breakdown) || !Array.isArray(breakdown.results)) continue;

    for (const result of breakdown.results) {
      if (!isRecord(result)) continue;
      const value = readNonNegativeNumber(result.value);
      const dimension = Array.isArray(result.dimension_values)
        ? result.dimension_values.at(-1)
        : null;
      if (value === null || typeof dimension !== "string" || dimension.length === 0) continue;

      output.push({
        metric: `${metric}.${normalizeDimension(dimension)}`,
        period,
        value,
        endTime: null,
      });
    }
  }
}

function normalizeDimension(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function readNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNonNegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
