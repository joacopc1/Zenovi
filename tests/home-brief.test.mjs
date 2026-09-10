import assert from "node:assert/strict";
import test from "node:test";

import { buildHomeBrief } from "../lib/insights/home-brief.ts";

const priority = {
  contentLabel: "Reel",
  dateLabel: "31 de agosto",
  views: 123,
  reach: 104,
  interactions: 2,
  reachMultiplier: 52,
  runnerUpReach: 2,
};

test("presenta una diferencia fuerte como señal inicial, no como patrón", () => {
  const brief = buildHomeBrief({ followers: 3, syncedMediaCount: 3, priority });

  assert.equal(brief.confidence, "initial");
  assert.equal(brief.title, "Hay una señal que vale la pena volver a probar.");
  assert.match(brief.signalTitle, /104 cuentas; la siguiente pieza, a 2/);
  assert.match(brief.signalDescription, /hipótesis útil, no un patrón consolidado/);
  assert.match(brief.nextAction, /medir si la ventaja se repite/);
});

test("no compara cuando hay menos de tres publicaciones", () => {
  const brief = buildHomeBrief({ followers: 3, syncedMediaCount: 2, priority });

  assert.equal(brief.confidence, "insufficient");
  assert.match(brief.title, /reuniendo una base/);
  assert.match(brief.description, /Necesitamos al menos 3/);
});

test("no convierte una diferencia relativa pequeña en una señal", () => {
  const brief = buildHomeBrief({
    followers: 500,
    syncedMediaCount: 6,
    priority: { ...priority, reach: 12, runnerUpReach: 1, reachMultiplier: 12 },
  });

  assert.equal(brief.confidence, "insufficient");
  assert.match(brief.description, /alcance absoluto todavía es bajo/);
});

test("explica cuando no hay separación entre las piezas", () => {
  const brief = buildHomeBrief({
    followers: 3,
    syncedMediaCount: 5,
    priority: { ...priority, reach: 80, runnerUpReach: 75, reachMultiplier: 80 / 75 },
  });

  assert.equal(brief.confidence, "insufficient");
  assert.equal(brief.title, "Las piezas están rindiendo de forma pareja.");
});
