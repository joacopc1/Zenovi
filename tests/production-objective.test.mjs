import assert from "node:assert/strict";
import test from "node:test";
import {
  CONTENT_OBJECTIVES,
  DEFAULT_OBJECTIVE,
  OBJECTIVE_COPY,
  isContentObjective,
  objectiveMetric,
  objectiveMetricLabel,
} from "../lib/production/objective.ts";

test("cada objetivo se mide con una métrica distinta", () => {
  const metrics = CONTENT_OBJECTIVES.map((objective) => objectiveMetric(objective));

  assert.equal(new Set(metrics).size, CONTENT_OBJECTIVES.length);
});

test("sin objetivo se juzga por visualizaciones, como antes de que existiera el campo", () => {
  assert.equal(objectiveMetric(null), "views");
  assert.equal(objectiveMetricLabel(null), "visualizaciones");
  assert.equal(DEFAULT_OBJECTIVE, "vistas");
});

test("el objetivo de guardados se mide por guardados", () => {
  // Una pieza hecha para que la guarden, con muchas vistas y ningún guardado, no funcionó.
  assert.equal(objectiveMetric("guardado"), "saves");
  assert.equal(objectiveMetricLabel("guardado"), "guardados");
});

test("todos los objetivos tienen su texto", () => {
  for (const objective of CONTENT_OBJECTIVES) {
    assert.ok(OBJECTIVE_COPY[objective].label.length > 0, objective);
    assert.ok(OBJECTIVE_COPY[objective].hint.length > 0, objective);
    assert.ok(OBJECTIVE_COPY[objective].metricLabel.length > 0, objective);
  }
});

test("isContentObjective rechaza lo que no conoce", () => {
  assert.equal(isContentObjective("guardado"), true);
  assert.equal(isContentObjective("ventas"), false);
  assert.equal(isContentObjective(null), false);
  assert.equal(isContentObjective(7), false);
});
