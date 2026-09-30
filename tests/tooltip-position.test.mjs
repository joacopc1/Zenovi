import assert from "node:assert/strict";
import test from "node:test";

import { placeTooltip } from "../lib/ui/tooltip-position.ts";

const trigger = { left: 400, right: 414, top: 300, bottom: 314 };
const tooltip = { width: 240, height: 80 };
const viewport = { width: 1200, height: 800 };

test("abre debajo del icono cuando hay espacio", () => {
  assert.deepEqual(placeTooltip(trigger, tooltip, viewport), {
    left: 287,
    top: 322,
    side: "bottom",
  });
});

test("se acomoda arriba cuando no entra debajo", () => {
  assert.deepEqual(
    placeTooltip({ left: 400, right: 414, top: 740, bottom: 754 }, tooltip, viewport),
    { left: 287, top: 652, side: "top" },
  );
});

test("no se sale por los costados de la ventana", () => {
  assert.equal(
    placeTooltip({ left: 4, right: 18, top: 300, bottom: 314 }, tooltip, viewport).left,
    12,
  );
});
