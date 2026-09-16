/**
 * Quiénes son los seguidores de la cuenta: edad, género, país y ciudad.
 *
 * Meta entrega esto como `follower_demographics`, una foto del momento y no una serie,
 * así que se guarda en `instagram_account_insights` con `period = "lifetime"` y la
 * dimensión dentro de `metric`, igual que los repartos de período. Cada sincronización
 * reemplaza la foto anterior: no tiene sentido acumular fotos de una lista que Meta
 * recorta a sus 45 valores más grandes.
 *
 * Comprobado contra una cuenta real de 28.996 seguidores: edad devuelve 7 tramos,
 * género 3 valores (M, F y U), y país y ciudad los 45 del tope.
 */
export const DEMOGRAPHICS_METRIC = "follower_demographics";
export const DEMOGRAPHICS_PERIOD = "lifetime";
export const DEMOGRAPHIC_DIMENSIONS = ["age", "gender", "country", "city"] as const;

export type DemographicDimension = (typeof DEMOGRAPHIC_DIMENSIONS)[number];

export type DemographicSlice = { key: string; label: string; value: number; share: number };
export type FollowerDemographics = Record<DemographicDimension, DemographicSlice[]>;

/** Misma convención que los repartos de período: `{métrica}.{dimensión}.{valor}`. */
export function demographicMetricKey(dimension: DemographicDimension, value: string) {
  return `${DEMOGRAPHICS_METRIC}.${dimension}.${value}`;
}

/** Los tramos de edad se leen en orden natural, no por tamaño. */
const AGE_ORDER = ["13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

const GENDER_LABELS: Record<string, string> = {
  F: "Mujeres",
  M: "Hombres",
  U: "Sin especificar",
};

const countryNames = safeDisplayNames();

export function buildFollowerDemographics(
  rows: readonly { metric: string; value: number | string }[],
): FollowerDemographics | null {
  const byDimension = new Map<DemographicDimension, { key: string; value: number }[]>();

  for (const row of rows) {
    const parsed = parseMetric(row.metric);
    if (parsed === null) continue;

    const value = Number(row.value);
    if (!Number.isFinite(value) || value <= 0) continue;

    const entries = byDimension.get(parsed.dimension) ?? [];
    entries.push({ key: parsed.value, value });
    byDimension.set(parsed.dimension, entries);
  }

  if (byDimension.size === 0) return null;

  const result = {} as FollowerDemographics;
  for (const dimension of DEMOGRAPHIC_DIMENSIONS) {
    result[dimension] = toSlices(dimension, byDimension.get(dimension) ?? []);
  }

  return result;
}

function toSlices(
  dimension: DemographicDimension,
  entries: { key: string; value: number }[],
): DemographicSlice[] {
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  if (total === 0) return [];

  const ordered =
    dimension === "age"
      ? [...entries].sort((left, right) => AGE_ORDER.indexOf(left.key) - AGE_ORDER.indexOf(right.key))
      : [...entries].sort((left, right) => right.value - left.value);

  return ordered.map((entry) => ({
    key: entry.key,
    label: labelFor(dimension, entry.key),
    value: entry.value,
    share: entry.value / total,
  }));
}

function labelFor(dimension: DemographicDimension, key: string) {
  if (dimension === "gender") return GENDER_LABELS[key] ?? key;
  // Meta devuelve el país como código ISO; la ciudad ya viene con su nombre.
  if (dimension === "country") return countryNames?.of(key) ?? key;
  return key;
}

/** `metric` es `follower_demographics.{dimensión}.{valor}`; el valor puede traer puntos. */
function parseMetric(metric: string): { dimension: DemographicDimension; value: string } | null {
  const prefix = `${DEMOGRAPHICS_METRIC}.`;
  if (!metric.startsWith(prefix)) return null;

  const rest = metric.slice(prefix.length);
  const separator = rest.indexOf(".");
  if (separator === -1) return null;

  const dimension = rest.slice(0, separator);
  const value = rest.slice(separator + 1);
  if (!isDimension(dimension) || value.length === 0) return null;

  return { dimension, value };
}

function isDimension(value: string): value is DemographicDimension {
  return DEMOGRAPHIC_DIMENSIONS.includes(value as DemographicDimension);
}

/** `Intl.DisplayNames` no existe en todos los runtimes; sin él se muestra el código. */
function safeDisplayNames() {
  try {
    return new Intl.DisplayNames(["es"], { type: "region" });
  } catch {
    return null;
  }
}
