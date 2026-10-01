import assert from "node:assert/strict";
import test from "node:test";
import { parseMediaInsightResponse } from "../lib/meta/media-insight-response.ts";

test("lee los insights numéricos comunes", () => {
  assert.deepEqual(
    parseMediaInsightResponse({
      data: [{ name: "views", period: "lifetime", values: [{ value: 42 }] }],
    }),
    [{ metric: "views", period: "lifetime", value: 42, endTime: null }],
  );
});

test("separa las acciones de navegación cuando Meta devuelve un objeto", () => {
  assert.deepEqual(
    parseMediaInsightResponse({
      data: [{
        name: "navigation",
        period: "lifetime",
        values: [{ value: { tap_forward: 8, tap_back: 2, tap_exit: 3, swipe_forward: 1 } }],
      }],
    }),
    [
      { metric: "navigation.tap_forward", period: "lifetime", value: 8, endTime: null },
      { metric: "navigation.tap_back", period: "lifetime", value: 2, endTime: null },
      { metric: "navigation.tap_exit", period: "lifetime", value: 3, endTime: null },
      { metric: "navigation.swipe_forward", period: "lifetime", value: 1, endTime: null },
    ],
  );
});

test("separa las acciones de navegación cuando Meta devuelve breakdowns", () => {
  assert.deepEqual(
    parseMediaInsightResponse({
      data: [{
        name: "navigation",
        period: "lifetime",
        total_value: {
          breakdowns: [{
            dimension_keys: ["story_navigation_action_type"],
            results: [
              { dimension_values: ["TAP_FORWARD"], value: 5 },
              { dimension_values: ["TAP_EXIT"], value: 2 },
            ],
          }],
        },
      }],
    }),
    [
      { metric: "navigation.tap_forward", period: "lifetime", value: 5, endTime: null },
      { metric: "navigation.tap_exit", period: "lifetime", value: 2, endTime: null },
    ],
  );
});

test("rechaza una respuesta sin lista de datos", () => {
  assert.equal(parseMediaInsightResponse({ error: "no" }), null);
});
