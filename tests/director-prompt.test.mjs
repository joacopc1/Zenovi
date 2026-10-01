import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_BRAND_DNA } from "../lib/brand/dna.ts";
import { brandContext, buildDirectorSystem, guidesIndex } from "../lib/director/prompt.ts";
import { DIRECTOR_GUIDES } from "../lib/director/guides/index.ts";
import { existsSync } from "node:fs";

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

test("sin guías, el prompt no menciona la herramienta", () => {
  assert.equal(guidesIndex([]), "");
});

test("con guías, el Director ve cuándo usar cada una y debe consultarlas sin comando", () => {
  const index = guidesIndex([{ slug: "guiones", title: "Cómo escribir guiones", useWhen: "cuando pidan un guion" }]);
  assert.match(index, /consultar_guia/);
  assert.match(index, /aunque el creador no haya usado un comando/);
  assert.match(index, /- guiones: Cómo escribir guiones\. Usala cuando pidan un guion\./);
});

test("cada guía registrada tiene un nombre seguro y su archivo existe", () => {
  for (const guide of DIRECTOR_GUIDES) {
    // Sólo letras, números y guiones: un nombre no puede apuntar fuera de la carpeta.
    assert.match(guide.slug, /^[a-z0-9-]+$/);
    assert.ok(existsSync(`lib/director/guides/${guide.slug}.md`), `falta lib/director/guides/${guide.slug}.md`);
  }
});
