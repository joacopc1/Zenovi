import assert from "node:assert/strict";
import test from "node:test";
import { buildMediaInsightSnapshotRows } from "../lib/meta/media-insight-snapshots.ts";

test("fecha en UTC y conserva sólo acumulados lifetime", () => {
  const rows = buildMediaInsightSnapshotRows(
    [
      { instagram_media_id: "media-1", metric: "views", period: "lifetime", value: 124, synced_at: "viejo" },
      { instagram_media_id: "media-1", metric: "reach", period: "day", value: 12, synced_at: "viejo" },
    ],
    "2026-09-19T23:45:00.000Z",
  );

  assert.deepEqual(rows, [
    {
      instagram_media_id: "media-1",
      metric: "views",
      value: 124,
      observed_on: "2026-09-19",
      synced_at: "2026-09-19T23:45:00.000Z",
    },
  ]);
});
