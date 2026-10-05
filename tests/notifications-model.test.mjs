import assert from "node:assert/strict";
import test from "node:test";
import { relativeTimeLabel, safeNotificationHref } from "../lib/notifications/model.ts";

const now = new Date("2026-10-04T15:00:00Z");
const ago = (ms) => new Date(now.getTime() - ms).toISOString();

test("cuándo pasó, dicho como lo diría una persona", () => {
  assert.equal(relativeTimeLabel(ago(20_000), now), "Recién");
  assert.equal(relativeTimeLabel(ago(60_000), now), "Hace 1 minuto");
  assert.equal(relativeTimeLabel(ago(10 * 60_000), now), "Hace 10 minutos");
  assert.equal(relativeTimeLabel(ago(2 * 3_600_000), now), "Hace 2 horas");
  assert.equal(relativeTimeLabel(ago(30 * 3_600_000), now), "Ayer");
  assert.equal(relativeTimeLabel(ago(3 * 86_400_000), now), "Hace 3 días");
  assert.match(relativeTimeLabel(ago(20 * 86_400_000), now), /set/);
});

test("una notificación nunca lleva fuera de la app", () => {
  assert.equal(safeNotificationHref("/content?tab=reels"), "/content?tab=reels");
  assert.equal(safeNotificationHref("//evil.example"), null);
  assert.equal(safeNotificationHref("https://evil.example"), null);
  assert.equal(safeNotificationHref("/x\"onmouseover"), null);
  assert.equal(safeNotificationHref(null), null);
});
