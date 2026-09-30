export type MediaViewSnapshot = {
  observedOn: string;
  value: number;
};

export type MediaViewPoint = {
  date: string;
  label: string;
  views: number | null;
};

const labelFormatter = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * Cómo le está yendo a la pieza en el tiempo, no sólo su curva.
 *
 * Una pieza vieja deja de sumar visualizaciones y su curva pasa a ser una línea de ceros
 * —que es cierta y no dice nada—: peor todavía, se lee como fracaso cuando la pieza pudo
 * haber tenido miles. Por eso además de los puntos se informa si todavía se mueve y en
 * cuánto quedó, que es lo que permite contar el caso en palabras en vez de graficar nada.
 */
export type MediaViewEvolution = {
  points: MediaViewPoint[];
  /** El acumulado en la última medición; `null` si nunca se midió. */
  total: number | null;
  /** Si sumó visualizaciones en algún día medido. */
  growing: boolean;
  /** El último día en que sumó algo; `null` si nunca lo hizo. */
  lastGrowthOn: string | null;
  /** Días medidos seguidos sin sumar nada al final de la serie. */
  flatDays: number;
};

/**
 * Deriva visualizaciones nuevas por día a partir de snapshots acumulados.
 * El primer punto no tiene base. Si falta un día o el acumulado retrocede, se deja
 * un hueco: repartir la diferencia o convertirla en cero inventaría precisión.
 */
export function buildMediaViewEvolution(
  snapshots: readonly MediaViewSnapshot[],
): MediaViewPoint[] {
  const ordered = [...snapshots].sort((left, right) =>
    left.observedOn.localeCompare(right.observedOn),
  );

  return ordered.map((snapshot, index) => {
    const previous = ordered[index - 1];
    const consecutive = previous
      ? daysBetween(previous.observedOn, snapshot.observedOn) === 1
      : false;
    const views =
      previous && consecutive && snapshot.value >= previous.value
        ? snapshot.value - previous.value
        : null;

    return {
      date: snapshot.observedOn,
      label: labelFormatter.format(new Date(`${snapshot.observedOn}T00:00:00Z`)),
      views,
    };
  });
}

function daysBetween(from: string, to: string) {
  const dayMs = 24 * 60 * 60 * 1000;
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / dayMs;
}

/** La lectura completa: los puntos, el acumulado y si la pieza todavía se mueve. */
export function readMediaViewEvolution(
  snapshots: readonly MediaViewSnapshot[],
): MediaViewEvolution {
  const points = buildMediaViewEvolution(snapshots);
  const ordered = [...snapshots].sort((left, right) =>
    left.observedOn.localeCompare(right.observedOn),
  );

  const conMovimiento = points.filter((point) => point.views !== null && point.views > 0);
  let flatDays = 0;
  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (points[index].views !== 0) break;
    flatDays += 1;
  }

  return {
    points,
    total: ordered.at(-1)?.value ?? null,
    growing: conMovimiento.length > 0,
    lastGrowthOn: conMovimiento.at(-1)?.date ?? null,
    flatDays,
  };
}

/** Una línea necesita al menos dos crecimientos diarios atribuibles para contar evolución. */
export function hasChartableViewEvolution(evolution: MediaViewEvolution) {
  return evolution.points.filter((point) => point.views !== null && point.views > 0).length >= 2;
}
