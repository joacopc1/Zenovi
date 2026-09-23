export type MediaInsightSnapshotSource = {
  instagram_media_id: string;
  metric: string;
  period: string;
  value: number;
};

export type MediaInsightSnapshotRow = {
  instagram_media_id: string;
  metric: string;
  value: number;
  observed_on: string;
  synced_at: string;
};

/**
 * Convierte los acumulados lifetime recién obtenidos en la foto diaria de cada pieza.
 * La fecha se fija en UTC para que el cron y una sincronización manual del mismo día
 * actualicen el mismo punto en lugar de crear dos observaciones.
 */
export function buildMediaInsightSnapshotRows(
  insights: readonly MediaInsightSnapshotSource[],
  syncedAt: string,
): MediaInsightSnapshotRow[] {
  const observedOn = syncedAt.slice(0, 10);

  return insights
    .filter((insight) => insight.period === "lifetime")
    .map(({ instagram_media_id, metric, value }) => ({
      instagram_media_id,
      metric,
      value,
      observed_on: observedOn,
      synced_at: syncedAt,
    }));
}
