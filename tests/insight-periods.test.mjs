import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCOUNT_COMPARISON_DAYS,
  ACCOUNT_INSIGHT_LOOKBACK_DAYS,
  MAX_INSIGHT_WINDOW_DAYS,
  buildAccountInsightWindows,
} from "../lib/meta/insight-periods.ts";

const DAY_IN_SECONDS = 24 * 60 * 60;
const now = new Date("2026-09-11T20:00:00Z");

test("construye ventanas contiguas para comparar los últimos siete días", () => {
  const windows = buildAccountInsightWindows(now);

  assert.equal(windows.current.until - windows.current.since, ACCOUNT_COMPARISON_DAYS * DAY_IN_SECONDS);
  assert.equal(windows.previous.until - windows.previous.since, ACCOUNT_COMPARISON_DAYS * DAY_IN_SECONDS);
  assert.equal(windows.previous.until, windows.current.since);
});

test("pide la serie diaria hasta el techo de retención de Meta", () => {
  const windows = buildAccountInsightWindows(now);

  assert.equal(ACCOUNT_INSIGHT_LOOKBACK_DAYS, 90);
  assert.equal(windows.daily.until - windows.daily.since, ACCOUNT_INSIGHT_LOOKBACK_DAYS * DAY_IN_SECONDS);
  assert.equal(windows.daily.end, windows.current.end);
});

test("parte la serie diaria en tramos que no exceden el máximo por consulta", () => {
  const { dailyChunks } = buildAccountInsightWindows(now);

  assert.ok(dailyChunks.length > 1, "90 días no entran en un solo tramo de 30");
  for (const chunk of dailyChunks) {
    assert.ok(chunk.until - chunk.since <= MAX_INSIGHT_WINDOW_DAYS * DAY_IN_SECONDS);
  }
});

test("los tramos cubren la ventana completa sin huecos ni superposición", () => {
  const { daily, dailyChunks } = buildAccountInsightWindows(now);

  assert.equal(dailyChunks[0].since, daily.since);
  assert.equal(dailyChunks[dailyChunks.length - 1].until, daily.until);

  for (let index = 1; index < dailyChunks.length; index += 1) {
    assert.equal(
      dailyChunks[index].since,
      dailyChunks[index - 1].until,
      "cada tramo empieza donde termina el anterior",
    );
  }
});
