import assert from "node:assert/strict";
import test from "node:test";
import {
  emptyAudience,
  emptyOffer,
  isOfferKind,
  measureBrandDna,
  sanitizeBrandDna,
} from "../lib/brand/dna.ts";

test("sanitizeBrandDna normaliza textos y listas", () => {
  const result = sanitizeBrandDna({
    description: "  Una marca.  ",
    niche: " Coaching ",
    positioning: "",
    tone: "",
    ownWords: ["  cercano ", "", "directo", "cercano"],
    avoidedWords: [],
    differentiators: [],
    mechanism: "",
    allowedPromises: [],
    proof: [],
    objective: "",
    primaryCta: "",
    conversionChannels: [],
    offers: [],
    audience: [],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.description, "Una marca.");
  assert.equal(result.value.niche, "Coaching");
  assert.deepEqual(result.value.ownWords, ["cercano", "directo", "cercano"]);
});

test("sanitizeBrandDna descarta ofertas sin nombre", () => {
  const result = sanitizeBrandDna({
    description: "",
    niche: "",
    positioning: "",
    tone: "",
    ownWords: [],
    avoidedWords: [],
    differentiators: [],
    mechanism: "",
    allowedPromises: [],
    proof: [],
    objective: "",
    primaryCta: "",
    conversionChannels: [],
    offers: [{ name: "   ", kind: "service" }, { name: "Mentoring", kind: "service" }],
    audience: [],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.offers.length, 1);
  assert.equal(result.value.offers[0].name, "Mentoring");
});

test("sanitizeBrandDna rechaza demasiadas ofertas", () => {
  const offers = Array.from({ length: 15 }, (_, index) => ({
    ...emptyOffer(),
    name: `Oferta ${index}`,
  }));

  const result = sanitizeBrandDna({
    description: "",
    niche: "",
    positioning: "",
    tone: "",
    ownWords: [],
    avoidedWords: [],
    differentiators: [],
    mechanism: "",
    allowedPromises: [],
    proof: [],
    objective: "",
    primaryCta: "",
    conversionChannels: [],
    offers,
    audience: [],
  });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.offers);
});

test("sanitizeBrandDna normaliza precio y moneda", () => {
  const result = sanitizeBrandDna({
    description: "",
    niche: "",
    positioning: "",
    tone: "",
    ownWords: [],
    avoidedWords: [],
    differentiators: [],
    mechanism: "",
    allowedPromises: [],
    proof: [],
    objective: "",
    primaryCta: "",
    conversionChannels: [],
    offers: [
      { name: "Curso", kind: "infoproduct", priceCents: 1999.4, currency: "usd", isPrimary: true },
    ],
    audience: [],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.offers[0].priceCents, 1999);
  assert.equal(result.value.offers[0].currency, "USD");
  assert.equal(result.value.offers[0].isPrimary, true);
});

test("sanitizeBrandDna descarta precios inválidos", () => {
  const result = sanitizeBrandDna({
    description: "",
    niche: "",
    positioning: "",
    tone: "",
    ownWords: [],
    avoidedWords: [],
    differentiators: [],
    mechanism: "",
    allowedPromises: [],
    proof: [],
    objective: "",
    primaryCta: "",
    conversionChannels: [],
    offers: [{ name: "Curso", priceCents: -50 }],
    audience: [],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.offers[0].priceCents, null);
});

test("sanitizeBrandDna descarta audiencia sin nombre", () => {
  const result = sanitizeBrandDna({
    description: "",
    niche: "",
    positioning: "",
    tone: "",
    ownWords: [],
    avoidedWords: [],
    differentiators: [],
    mechanism: "",
    allowedPromises: [],
    proof: [],
    objective: "",
    primaryCta: "",
    conversionChannels: [],
    offers: [],
    audience: [{ name: "", pains: ["miedo"] }, { name: "Coaches", pains: ["miedo"] }],
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.audience.length, 1);
  assert.deepEqual(result.value.audience[0].pains, ["miedo"]);
});

test("sanitizeBrandDna tolera entrada malformada", () => {
  const result = sanitizeBrandDna(null);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value.offers, []);
  assert.deepEqual(result.value.audience, []);
});

test("isOfferKind distingue valores válidos", () => {
  assert.equal(isOfferKind("service"), true);
  assert.equal(isOfferKind("program"), true);
  assert.equal(isOfferKind("plan"), false);
  assert.equal(isOfferKind(null), false);
});

test("emptyOffer y emptyAudience parten limpios", () => {
  assert.deepEqual(emptyOffer(), {
    name: "",
    kind: "service",
    description: "",
    priceCents: null,
    currency: "USD",
    modality: "",
    isPrimary: false,
  });
  assert.equal(emptyAudience().isPrimary, false);
  assert.deepEqual(emptyAudience().pains, []);
});

test("measureBrandDna cuenta campos completados por dimensión", () => {
  const result = measureBrandDna({
    description: "Marca",
    niche: "",
    positioning: "",
    tone: "",
    ownWords: [],
    avoidedWords: [],
    differentiators: [],
    mechanism: "",
    allowedPromises: [],
    proof: [],
    objective: "",
    primaryCta: "",
    conversionChannels: [],
    offers: [{ ...emptyOffer(), name: "Mentoring" }],
    audience: [],
  });

  const identidad = result.dimensions.find((d) => d.id === "identidad");
  const ofertas = result.dimensions.find((d) => d.id === "ofertas");

  assert.equal(identidad.completed, 1);
  assert.equal(identidad.total, 3);
  assert.equal(ofertas.completed, 1);
  assert.equal(ofertas.total, 1);
  assert.equal(result.completed, 2);
  assert.equal(result.total, 15);
  assert.equal(result.percent, Math.round((2 / 15) * 100));
});

test("measureBrandDna da cero con ADN vacío", () => {
  const result = measureBrandDna({
    description: "",
    niche: "",
    positioning: "",
    tone: "",
    ownWords: [],
    avoidedWords: [],
    differentiators: [],
    mechanism: "",
    allowedPromises: [],
    proof: [],
    objective: "",
    primaryCta: "",
    conversionChannels: [],
    offers: [],
    audience: [],
  });

  assert.equal(result.completed, 0);
  assert.equal(result.percent, 0);
});

test("measureBrandDna llega a cien con todo completo", () => {
  const result = measureBrandDna({
    description: "a",
    niche: "a",
    positioning: "a",
    tone: "a",
    ownWords: ["a"],
    avoidedWords: ["a"],
    differentiators: ["a"],
    mechanism: "a",
    allowedPromises: ["a"],
    proof: ["a"],
    objective: "a",
    primaryCta: "a",
    conversionChannels: ["a"],
    offers: [{ ...emptyOffer(), name: "a" }],
    audience: [{ ...emptyAudience(), name: "a" }],
  });

  assert.equal(result.completed, result.total);
  assert.equal(result.percent, 100);
});
