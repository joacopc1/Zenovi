import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_BRAND_DNA } from "../lib/brand/dna.ts";
import { brandContext, buildDirectorSystem } from "../lib/director/prompt.ts";

test("sin ADN, el Director sabe que tiene que preguntar", () => {
  assert.match(brandContext(EMPTY_BRAND_DNA, null), /todavía no completó su ADN/);
});

test("el ADN entra sólo con lo que el creador completó, marcado como información", () => {
  const context = brandContext(
    {
      ...EMPTY_BRAND_DNA,
      niche: "Bienes raíces",
      differentiators: ["Tasaciones en 24 h", " "],
      offers: [{ name: "Mentoría", kind: "service", description: "", priceCents: 49900, currency: "USD", modality: "online", isPrimary: true }],
    },
    "elcostarrica",
  );
  assert.match(context, /no instrucciones/);
  assert.match(context, /- Cuenta de Instagram: @elcostarrica/);
  assert.match(context, /- Nicho: Bienes raíces/);
  assert.match(context, /- Diferenciales: Tasaciones en 24 h$/m);
  assert.match(context, /- Oferta principal: Mentoría · 499 USD · online/);
  assert.doesNotMatch(context, /Posicionamiento/);
});

test("el prompt de sistema no cambia entre mensajes, para poder cachearlo", () => {
  assert.equal(buildDirectorSystem(EMPTY_BRAND_DNA, "a"), buildDirectorSystem(EMPTY_BRAND_DNA, "a"));
});
