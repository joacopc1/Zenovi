import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAnalyticsHref,
  parseAnalyticsTab,
} from "../lib/analytics/range.ts";

test("la pestaña y el período viajan juntos en la URL", () => {
  assert.equal(buildAnalyticsHref("/analytics", 30, "visibilidad"), "/analytics");
  assert.equal(buildAnalyticsHref("/analytics", 7, "comunidad"), "/analytics?days=7&tab=comunidad");
  assert.equal(buildAnalyticsHref("/analytics", 30, "contenido"), "/analytics?tab=contenido");
});

test("una pestaña desconocida cae en la primera", () => {
  assert.equal(parseAnalyticsTab("comunidad"), "comunidad");
  assert.equal(parseAnalyticsTab("../otra"), "visibilidad");
  assert.equal(parseAnalyticsTab(undefined), "visibilidad");
});
