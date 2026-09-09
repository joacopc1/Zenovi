import "server-only";

import {
  getInstagramAccountInsights,
  getInstagramMedia,
  getInstagramMediaInsights,
} from "@/lib/meta/api";
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

  const [mediaResult, accountInsightsResult] = await Promise.all([
    getInstagramMedia(accessToken),
    getInstagramAccountInsights(providerAccountId, accessToken),
  ]);

  if (!mediaResult.ok) {
    await markSyncFailure(admin, connectionId, mediaResult.code);
    return { ok: false, code: mediaResult.code };
  }

  const syncedAt = new Date().toISOString();
  const mediaRows = mediaResult.data.map((media) => ({
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
  }));

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
  const mediaInsightRows: {
    instagram_media_id: string;
    metric: string;
    period: string;
    value: number;
    synced_at: string;
  }[] = [];

  const insightResults = await mapWithConcurrency(mediaResult.data, 5, async (media) => ({
    media,
    result: await getInstagramMediaInsights(media.id, accessToken),
  }));

  for (const { media, result } of insightResults) {
    const storedMediaId = mediaIdByProviderId.get(media.id);
    if (!storedMediaId || !result.ok) continue;

    for (const insight of result.data) {
      mediaInsightRows.push({
        instagram_media_id: storedMediaId,
        metric: insight.metric,
        period: insight.period,
        value: insight.value,
        synced_at: syncedAt,
      });
    }
  }

  if (mediaInsightRows.length > 0) {
    const { error } = await admin.from("instagram_media_insights").upsert(mediaInsightRows, {
      onConflict: "instagram_media_id,metric,period",
    });

    if (error) {
      await markSyncFailure(admin, connectionId, "media_insights_persistence_failed");
      return { ok: false, code: "media_insights_persistence_failed" };
    }
  }

  const accountInsightRows = accountInsightsResult.ok
    ? accountInsightsResult.data
        .filter((insight) => insight.endTime)
        .map((insight) => ({
          social_account_id: socialAccountId,
          metric: insight.metric,
          period: insight.period,
          value: insight.value,
          end_time: insight.endTime as string,
          synced_at: syncedAt,
        }))
    : [];

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

  const connectedAt = new Date().toISOString();
  const connected = await updateConnection(admin, connectionId, {
    status: "connected",
    connected_at: connectedAt,
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
    // The OAuth grant is still valid. Keep the connection retryable without
    // forcing the user through Instagram authorization again.
    status: "account_resolved",
    last_error_code: code,
    last_error_at: new Date().toISOString(),
  });
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    results.push(...(await Promise.all(items.slice(index, index + concurrency).map(mapper))));
  }

  return results;
}
