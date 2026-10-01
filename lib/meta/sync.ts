import "server-only";

import { mapWithConcurrency } from "@/lib/async/map-with-concurrency";
import {
  ACCOUNT_CURRENT_TOTAL_PERIOD,
  ACCOUNT_PREVIOUS_TOTAL_PERIOD,
} from "@/lib/data/account-metric-summaries";
import {
  getInstagramAccountProfile,
  getInstagramAccountInsights,
  getInstagramDailyTotals,
  getInstagramMedia,
  getInstagramMediaInsights,
  getInstagramStories,
  getInstagramFollowerDemographics,
  getInstagramPeriodInsights,
  type InstagramMedia,
} from "@/lib/meta/api";
import {
  breakdownMetricKey,
  buildPeriodWindows,
  periodKey,
} from "@/lib/data/period-breakdowns";
import {
  DEMOGRAPHICS_METRIC,
  DEMOGRAPHICS_PERIOD,
  demographicMetricKey,
} from "@/lib/data/follower-demographics";
import {
  BACKFILL_METRICS,
  endOfDay,
  planDailyBackfill,
} from "@/lib/meta/daily-backfill";
import { planMediaInsightRefresh } from "@/lib/meta/media-sync-plan";
import { buildMediaInsightSnapshotRows } from "@/lib/meta/media-insight-snapshots";
import { requiresReauthorization } from "@/lib/meta/meta-error";
import { archiveStories } from "@/lib/meta/story-archive";
import { ACCOUNT_INSIGHT_LOOKBACK_DAYS } from "@/lib/meta/insight-periods";
import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

type SyncInstagramInput = {
  admin: AdminClient;
  connectionId: string;
  socialAccountId: string;
  providerAccountId: string;
  accessToken: string;
};

type SyncInstagramResult =
  | { ok: true; mediaCount: number; mediaInsightCount: number; accountInsightCount: number }
  | { ok: false; code: string };

export async function syncInstagramConnection({
  admin,
  connectionId,
  socialAccountId,
  providerAccountId,
  accessToken,
}: SyncInstagramInput): Promise<SyncInstagramResult> {
  if (!(await updateConnection(admin, connectionId, { status: "syncing" }))) {
    return { ok: false, code: "sync_state_unavailable" };
  }

  const [profileResult, mediaResult, storiesResult, accountInsightsResult] = await Promise.all([
    getInstagramAccountProfile(accessToken),
    getInstagramMedia(accessToken),
    getInstagramStories(accessToken),
    getInstagramAccountInsights(providerAccountId, accessToken),
  ]);

  if (!mediaResult.ok) {
    await markSyncFailure(admin, connectionId, mediaResult.code);
    return { ok: false, code: mediaResult.code };
  }

  if (!profileResult.ok) {
    await markSyncFailure(admin, connectionId, profileResult.code);
    return { ok: false, code: profileResult.code };
  }

  if (profileResult.data.id !== providerAccountId) {
    await markSyncFailure(admin, connectionId, "account_mismatch");
    return { ok: false, code: "account_mismatch" };
  }

  if (!storiesResult.ok) {
    // Una restricción puntual de Stories no vuelve inútiles las publicaciones, los
    // Reels ni los insights de cuenta que ya llegaron correctamente.
    console.warn(
      JSON.stringify({ event: "instagram_sync", warning: "stories_unavailable", code: storiesResult.code }),
    );
  }

  const syncedMedia = mergeMedia(
    mediaResult.data,
    storiesResult.ok ? storiesResult.data : [],
  );

  const { data: refreshedAccount, error: profileError } = await admin
    .from("social_accounts")
    .update({
      // Las cuentas conectadas antes de guardar este id lo completan en su próxima sincronización.
      professional_account_id: profileResult.data.professionalAccountId,
      username: profileResult.data.username,
      account_type: profileResult.data.accountType,
      profile_picture_url: profileResult.data.profilePictureUrl,
      followers_count: profileResult.data.followersCount,
      follows_count: profileResult.data.followsCount,
      media_count: profileResult.data.mediaCount,
    })
    .eq("id", socialAccountId)
    .eq("provider_account_id", providerAccountId)
    .select("id")
    .maybeSingle();

  if (profileError || !refreshedAccount) {
    await markSyncFailure(admin, connectionId, "profile_persistence_failed");
    return { ok: false, code: "profile_persistence_failed" };
  }

  const syncedAt = new Date().toISOString();
  const mediaRows = syncedMedia.map((media) => toMediaRow(media, socialAccountId, syncedAt));

  let storedMedia: { id: string; provider_media_id: string }[] = [];

  if (mediaRows.length > 0) {
    const { data, error } = await admin
      .from("instagram_media")
      .upsert(mediaRows, { onConflict: "social_account_id,provider_media_id" })
      .select("id, provider_media_id");

    if (error || !data) {
      await markSyncFailure(admin, connectionId, "media_persistence_failed");
      return { ok: false, code: "media_persistence_failed" };
    }

    storedMedia = data;
  }

  const mediaIdByProviderId = new Map(
    storedMedia.map((media) => [media.provider_media_id, media.id]),
  );

  const carouselRows = syncedMedia.flatMap((media) => {
    const parentId = mediaIdByProviderId.get(media.id);
    if (!parentId || media.mediaType !== "CAROUSEL_ALBUM" || media.children.length === 0) {
      return [];
    }

    return media.children.map((child, position) => ({
      instagram_media_id: parentId,
      provider_media_id: child.id,
      position,
      media_type: child.mediaType,
      media_url: child.mediaUrl,
      thumbnail_url: child.thumbnailUrl,
      synced_at: syncedAt,
    }));
  });

  if (carouselRows.length > 0) {
    const { error: childrenError } = await admin
      .from("instagram_media_children")
      .upsert(carouselRows, { onConflict: "instagram_media_id,position" });

    if (childrenError) {
      // Las métricas y la biblioteca siguen siendo válidas aunque falle este extra.
      // No se deja caer una sincronización completa por el visor del carrusel.
      console.warn(
        JSON.stringify({ event: "instagram_sync", warning: "carousel_media_failed" }),
      );
    }
  }

  await archiveStories(
    admin,
    socialAccountId,
    syncedMedia.flatMap((media) => {
      const storedMediaId = mediaIdByProviderId.get(media.id);
      return media.mediaProductType === "STORY" && storedMediaId
        ? [{ storedMediaId, mediaUrl: media.mediaUrl, thumbnailUrl: media.thumbnailUrl }]
        : [];
    }),
  );


  // Qué piezas ya tienen estadísticas: las viejas con datos no se vuelven a pedir.
  const { data: coverage, error: coverageError } = await admin
    .from("instagram_media")
    .select("id, instagram_media_insights(count)")
    .eq("social_account_id", socialAccountId)
    .order("posted_at", { ascending: false })
    .limit(1000);
  const withInsights = new Set(
    (coverage ?? [])
      .filter((item) => (item.instagram_media_insights as { count: number }[])[0]?.count > 0)
      .map((item) => item.id as string),
  );

  const plannedIds = new Set(
    planMediaInsightRefresh({
      media: syncedMedia.flatMap((media) => {
        const storedMediaId = mediaIdByProviderId.get(media.id);
        return storedMediaId
          ? [{
              id: storedMediaId,
              postedAt: media.timestamp,
              // Si no se pudo consultar, se asume que ya tienen datos: evita repedir toda la historia.
              hasInsights: coverageError ? true : withInsights.has(storedMediaId),
            }]
          : [];
      }),
      now: new Date(),
    }),
  );
  const mediaToRefresh = syncedMedia.filter((media) =>
    plannedIds.has(mediaIdByProviderId.get(media.id) ?? ""),
  );

  const mediaInsightRows = await fetchMediaInsightRows(mediaToRefresh, mediaIdByProviderId, accessToken, syncedAt);
  if (!(await saveMediaInsights(admin, mediaInsightRows, syncedAt))) {
    await markSyncFailure(admin, connectionId, "media_insights_persistence_failed");
    return { ok: false, code: "media_insights_persistence_failed" };
  }

  const dailyAccountInsightRows = accountInsightsResult.ok
    ? accountInsightsResult.data.daily
        .flatMap((insight) =>
          insight.endTime
            ? [{
                social_account_id: socialAccountId,
                metric: insight.metric,
                period: insight.period,
                value: insight.value,
                end_time: insight.endTime,
                synced_at: syncedAt,
              }]
            : [],
        )
    : [];

  const accountSummaryRows = accountInsightsResult.ok
    ? accountInsightsResult.data.summaries.flatMap((summary) => [
        {
          social_account_id: socialAccountId,
          metric: summary.metric,
          period: ACCOUNT_CURRENT_TOTAL_PERIOD,
          value: summary.currentValue,
          end_time: summary.currentEnd,
          synced_at: syncedAt,
        },
        ...(summary.previousValue === null
          ? []
          : [{
              social_account_id: socialAccountId,
              metric: summary.metric,
              period: ACCOUNT_PREVIOUS_TOTAL_PERIOD,
              value: summary.previousValue,
              end_time: summary.previousEnd,
              synced_at: syncedAt,
            }]),
      ])
    : [];
  // Meta no guarda historia de seguidores: si no tomamos una foto por día, el número
  // de ayer se pierde para siempre. Esta fila es la única memoria de esa evolución.
  const followerRows =
    profileResult.data.followersCount === null
      ? []
      : [{
          social_account_id: socialAccountId,
          metric: "follower_count",
          period: "day",
          value: profileResult.data.followersCount,
          end_time: endOfDay(new Date()),
          synced_at: syncedAt,
        }];

  const accountInsightRows = [
    ...dailyAccountInsightRows,
    ...accountSummaryRows,
    ...followerRows,
  ];

  if (accountInsightRows.length > 0) {
    const { error } = await admin.from("instagram_account_insights").upsert(
      accountInsightRows,
      { onConflict: "social_account_id,metric,period,end_time" },
    );

    if (error) {
      await markSyncFailure(admin, connectionId, "account_insights_persistence_failed");
      return { ok: false, code: "account_insights_persistence_failed" };
    }
  }

  await storePeriodInsights({
    admin,
    socialAccountId,
    providerAccountId,
    accessToken,
    syncedAt,
  });

  await storeFollowerDemographics({
    admin,
    socialAccountId,
    providerAccountId,
    accessToken,
    syncedAt,
  });

  await backfillDailyTotals({
    admin,
    socialAccountId,
    providerAccountId,
    accessToken,
    syncedAt,
  });

  const connected = await updateConnection(admin, connectionId, {
    status: "connected",
    last_error_code: null,
    last_error_at: null,
  });

  if (!connected) {
    return { ok: false, code: "connection_finalize_failed" };
  }

  return {
    ok: true,
    mediaCount: mediaRows.length,
    mediaInsightCount: mediaInsightRows.length,
    accountInsightCount: accountInsightRows.length,
  };
}

export function toMediaRow(media: InstagramMedia, socialAccountId: string, syncedAt: string) {
  return {
    social_account_id: socialAccountId,
    provider_media_id: media.id,
    caption: media.caption,
    media_type: media.mediaType,
    media_product_type: media.mediaProductType,
    media_url: media.mediaUrl,
    thumbnail_url: media.thumbnailUrl,
    permalink: media.permalink,
    posted_at: media.timestamp,
    like_count: media.likeCount,
    comments_count: media.commentsCount,
    synced_at: syncedAt,
  };
}

export type MediaInsightRow = {
  instagram_media_id: string;
  metric: string;
  period: string;
  value: number;
  synced_at: string;
};

/** Pide las métricas de cada pieza a Meta; una que falla se saltea y se reintenta en otra corrida. */
export async function fetchMediaInsightRows(
  media: readonly InstagramMedia[],
  storedIdByProviderId: ReadonlyMap<string, string>,
  accessToken: string,
  syncedAt: string,
): Promise<MediaInsightRow[]> {
  const results = await mapWithConcurrency([...media], 5, async (item) => ({
    item,
    result: await getInstagramMediaInsights(item.id, accessToken, item.mediaProductType),
  }));

  return results.flatMap(({ item, result }) => {
    const storedMediaId = storedIdByProviderId.get(item.id);
    if (!storedMediaId || !result.ok) return [];
    return result.data.map((insight) => ({
      instagram_media_id: storedMediaId,
      metric: insight.metric,
      period: insight.period,
      value: insight.value,
      synced_at: syncedAt,
    }));
  });
}

/**
 * Guarda el valor vigente y la foto del día. Si fallan las métricas, la corrida falla; las
 * fotos diarias son un extra para la curva de evolución y se reintentan en la próxima.
 */
export async function saveMediaInsights(admin: AdminClient, rows: MediaInsightRow[], syncedAt: string) {
  if (rows.length === 0) return true;

  const [{ error: insightsError }, { error: snapshotsError }] = await Promise.all([
    admin.from("instagram_media_insights").upsert(rows, {
      onConflict: "instagram_media_id,metric,period",
    }),
    admin.from("instagram_media_insight_snapshots").upsert(buildMediaInsightSnapshotRows(rows, syncedAt), {
      onConflict: "instagram_media_id,metric,observed_on",
    }),
  ]);

  if (snapshotsError) {
    console.warn(JSON.stringify({ event: "instagram_sync", warning: "media_insight_snapshots_failed" }));
  }
  return !insightsError;
}

function mergeMedia<T extends { id: string }>(regular: T[], stories: T[]) {
  const byId = new Map(regular.map((item) => [item.id, item]));
  for (const story of stories) byId.set(story.id, story);
  return [...byId.values()];
}

async function updateConnection(
  admin: AdminClient,
  connectionId: string,
  values: Record<string, string | null>,
) {
  const { error } = await admin.from("social_connections").update(values).eq("id", connectionId);
  return !error;
}

async function markSyncFailure(admin: AdminClient, connectionId: string, code: string) {
  return updateConnection(admin, connectionId, {
    // Un acceso revocado sólo se resuelve volviendo a autorizar: la conexión pasa a
    // pedir acción, que es lo que hace aparecer el aviso para reconectar. Cualquier
    // otra falla deja el permiso intacto y la conexión lista para reintentar.
    status: requiresReauthorization(code) ? "action_required" : "account_resolved",
    last_error_code: code,
    last_error_at: new Date().toISOString(),
  });
}

/**
 * Completa la serie diaria de las métricas que Meta no entrega como histórico.
 *
 * Es deliberadamente best-effort: si falla, no marca la sincronización como fallida.
 * Lo demás ya se guardó y estos días se vuelven a intentar en la próxima corrida.
 */
async function backfillDailyTotals({
  admin,
  socialAccountId,
  providerAccountId,
  accessToken,
  syncedAt,
}: {
  admin: AdminClient;
  socialAccountId: string;
  providerAccountId: string;
  accessToken: string;
  syncedAt: string;
}) {
  const now = new Date();
  // Acotado al período: la historia nunca se borra, y sin este límite la consulta
  // superaría el tope de filas de Supabase y haría creer que faltan días ya guardados.
  const boundary = new Date(
    now.getTime() - (ACCOUNT_INSIGHT_LOOKBACK_DAYS + 2) * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: stored, error } = await admin
    .from("instagram_account_insights")
    .select("metric, end_time")
    .eq("social_account_id", socialAccountId)
    .eq("period", "day")
    .in("metric", BACKFILL_METRICS)
    .gte("end_time", boundary);

  if (error) return;

  const knownEndTimesByMetric = new Map<string, string[]>();
  for (const row of stored ?? []) {
    const endTimes = knownEndTimesByMetric.get(row.metric) ?? [];
    endTimes.push(row.end_time);
    knownEndTimesByMetric.set(row.metric, endTimes);
  }

  const plan = planDailyBackfill({
    knownEndTimesByMetric,
    now,
    lookbackDays: ACCOUNT_INSIGHT_LOOKBACK_DAYS,
  });

  if (plan.length === 0) return;

  const totals = await getInstagramDailyTotals(providerAccountId, accessToken, plan);

  if (totals.length === 0) return;

  await admin.from("instagram_account_insights").upsert(
    totals.map((entry) => ({
      social_account_id: socialAccountId,
      metric: entry.metric,
      period: "day",
      value: entry.value,
      end_time: entry.endTime,
      synced_at: syncedAt,
    })),
    { onConflict: "social_account_id,metric,period,end_time" },
  );
}

/**
 * Guarda los totales de 7, 30 y 90 días que sólo Meta puede calcular. Best-effort, como
 * el backfill: si falla, el resto de la sincronización ya quedó guardado.
 */
async function storePeriodInsights({
  admin,
  socialAccountId,
  providerAccountId,
  accessToken,
  syncedAt,
}: {
  admin: AdminClient;
  socialAccountId: string;
  providerAccountId: string;
  accessToken: string;
  syncedAt: string;
}) {
  const insights = await getInstagramPeriodInsights(
    providerAccountId,
    accessToken,
    buildPeriodWindows(new Date()),
  );

  if (insights.length === 0) return;

  await admin.from("instagram_account_insights").upsert(
    insights.map((insight) => ({
      social_account_id: socialAccountId,
      metric:
        insight.dimension && insight.dimensionValue
          ? breakdownMetricKey(insight.metric, insight.dimension, insight.dimensionValue)
          : insight.metric,
      period: periodKey(insight.windowDays),
      value: insight.value,
      end_time: insight.end,
      synced_at: syncedAt,
    })),
    { onConflict: "social_account_id,metric,period,end_time" },
  );
}

/**
 * Guarda la foto demográfica de los seguidores, reemplazando la anterior.
 *
 * Se borra antes de insertar porque Meta recorta país y ciudad a sus 45 valores más
 * grandes: un país que sale del recorte quedaría guardado para siempre, inflando una
 * lista que ya no lo incluye. Si Meta no devuelve nada —cuentas con menos de 100
 * seguidores— no se borra lo que ya había.
 */
async function storeFollowerDemographics({
  admin,
  socialAccountId,
  providerAccountId,
  accessToken,
  syncedAt,
}: {
  admin: AdminClient;
  socialAccountId: string;
  providerAccountId: string;
  accessToken: string;
  syncedAt: string;
}) {
  const demographics = await getInstagramFollowerDemographics(providerAccountId, accessToken);
  if (demographics.length === 0) return;

  await admin
    .from("instagram_account_insights")
    .delete()
    .eq("social_account_id", socialAccountId)
    .eq("period", DEMOGRAPHICS_PERIOD)
    .like("metric", `${DEMOGRAPHICS_METRIC}.%`);

  await admin.from("instagram_account_insights").insert(
    demographics.map((entry) => ({
      social_account_id: socialAccountId,
      metric: demographicMetricKey(entry.dimension, entry.value),
      period: DEMOGRAPHICS_PERIOD,
      value: entry.count,
      end_time: syncedAt,
      synced_at: syncedAt,
    })),
  );
}
