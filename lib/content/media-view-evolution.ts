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
