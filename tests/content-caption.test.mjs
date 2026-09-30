import assert from "node:assert/strict";
import test from "node:test";
import {
  captionPreview,
  splitDisplayCaption,
} from "../lib/content/caption-display.ts";

test("oculta hashtags sin borrar el resto del caption", () => {
  const caption = `Una etapa difícil no apaga el fuego.\n\n#Emprendedores #MarcaPersonal`;

  assert.deepEqual(splitDisplayCaption(caption, "Reel"), {
    title: "Reel",
    description: "Una etapa difícil no apaga el fuego.",
  });
});

test("conserva título y descripción, pero no el bloque de hashtags", () => {
  const caption = `Tus dudas son ladronas.\n\nNo permitas que una etapa difícil te frene.\n\n#NegociosDigitales`;

  assert.deepEqual(splitDisplayCaption(caption, "Reel"), {
    title: "Tus dudas son ladronas.",
    description: "No permitas que una etapa difícil te frene.",
  });
});

test("el preview también limpia hashtags y conserva texto útil", () => {
  assert.equal(captionPreview("Idea clara #Marketing para crecer #Ventas"), "Idea clara para crecer");
  assert.equal(captionPreview("#SoloHashtags #Reels", "Reel sin texto"), "Reel sin texto");
});

test("un caption vacío usa el nombre del formato", () => {
  assert.deepEqual(splitDisplayCaption(null, "Reel"), {
    title: "Reel",
    description: "Sin descripción.",
  });
});
