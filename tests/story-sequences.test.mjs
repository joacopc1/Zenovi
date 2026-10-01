import assert from "node:assert/strict";
import test from "node:test";
import { buildStorySequences, compareWithOwnSequences, lossPerStory, sequenceDayLabel, sortStorySequences, storyAgeLabel, storyReachChange, storyRetention } from "../lib/content/story-sequences.ts";

test("agrupa las Historias por día local", () => {
  const sequences = buildStorySequences([
    story("a", "2026-09-30T10:00:00Z", 100),
    story("b", "2026-09-30T22:20:00Z", 80),
    story("c", "2026-10-01T15:00:00Z", 50),
  ]);

  assert.deepEqual(sequences.map((sequence) => sequence.stories.map(({ id }) => id)), [
    ["c"],
    ["a", "b"],
  ]);
});

test("respeta el día de Uruguay y no corta una secuencia a medianoche UTC", () => {
  const [sequence] = buildStorySequences([
    story("a", "2026-10-01T01:30:00Z", 100),
    story("b", "2026-10-01T02:30:00Z", 80),
  ]);

  assert.deepEqual(sequence.stories.map(({ id }) => id), ["a", "b"]);
});

test("mide la caída en personas alcanzadas, no en views que se repiten", () => {
  assert.equal(storyReachChange(story("a", "2026-09-30T10:00:00Z", 100), story("b", "2026-09-30T10:05:00Z", 65)), -0.35);
});

test("no inventa cambio cuando falta la base", () => {
  assert.equal(storyReachChange(story("a", "2026-09-30T10:00:00Z", null), story("b", "2026-09-30T10:05:00Z", 65)), null);
});

test("una Historia sola no inventa una comparación contra sí misma", () => {
  const [sequence] = buildStorySequences([story("a", "2026-09-30T10:00:00Z", 100)]);
  assert.equal(sequence.completionRate, null);
});

test("completaron: personas en la última sobre personas en la primera", () => {
  const [sequence] = buildStorySequences([
    { ...story("a", "2026-09-30T10:00:00Z", 100), views: 140 },
    story("b", "2026-09-30T10:05:00Z", 90),
    { ...story("c", "2026-09-30T10:09:00Z", 70), views: 95 },
  ]);

  assert.equal(sequence.completionRate, 0.7);
});

test("no inventa el porcentaje que completó sin personas en la primera", () => {
  const [sequence] = buildStorySequences([
    story("a", "2026-09-30T10:00:00Z", null),
    story("b", "2026-09-30T10:05:00Z", 80),
  ]);

  assert.equal(sequence.completionRate, null);
});

test("suma respuestas, visitas al perfil y seguidores disponibles de la secuencia", () => {
  const [sequence] = buildStorySequences([
    { ...story("a", "2026-09-30T10:00:00Z", 100), replies: 2, profileVisits: 5, follows: null },
    { ...story("b", "2026-09-30T10:05:00Z", 80), replies: 1, profileVisits: 3, follows: 1 },
  ]);

  assert.equal(sequence.totalReplies, 3);
  assert.equal(sequence.totalProfileVisits, 8);
  assert.equal(sequence.totalFollows, 1);
});

test("compara lo que completó contra la mediana de sus propias secuencias", () => {
  const sequences = buildStorySequences([
    ...day("2026-09-27", 100, 50),
    ...day("2026-09-28", 100, 60),
    ...day("2026-09-29", 100, 70),
    ...day("2026-09-30", 100, 80),
  ]);
  const latest = sequences[0];

  const comparison = compareWithOwnSequences(sequences, latest.id, "completion");
  assert.equal(comparison.current, 0.8);
  assert.ok(Math.abs(comparison.median - 0.65) < 1e-9);
  assert.equal(comparison.sampleSize, 4);
  assert.deepEqual(comparison.recent.map(({ value }) => value), [0.5, 0.6, 0.7, 0.8]);
});

test("compara respuestas por cada 100 personas que empezaron, no en cantidad", () => {
  const sequences = buildStorySequences([
    ...day("2026-09-28", 100, 80, { replies: 5 }),
    ...day("2026-09-29", 200, 160, { replies: 10 }),
    ...day("2026-09-30", 400, 320, { replies: 40 }),
  ]);

  const comparison = compareWithOwnSequences(sequences, sequences[0].id, "replies");
  assert.equal(comparison.current, 10);
  assert.equal(comparison.median, 5);
  assert.equal(comparison.sampleSize, 3);
});

test("sin tres secuencias medidas no inventa lo habitual", () => {
  const sequences = buildStorySequences([
    ...day("2026-09-29", 100, 70),
    ...day("2026-09-30", 100, 80),
  ]);

  assert.equal(compareWithOwnSequences(sequences, sequences[0].id, "completion"), null);
});

test("lo habitual sale de las últimas diez secuencias, no de toda la historia", () => {
  const old = Array.from({ length: 5 }, (_, index) => day(`2026-08-0${index + 1}`, 100, 20)).flat();
  const recent = Array.from({ length: 10 }, (_, index) => day(`2026-09-${String(index + 10)}`, 100, 70)).flat();
  const sequences = buildStorySequences([...old, ...recent]);

  const comparison = compareWithOwnSequences(sequences, sequences[0].id, "completion");
  assert.equal(comparison.sampleSize, 10);
  assert.ok(Math.abs(comparison.median - 0.7) < 1e-9);
});

test("la curva de abandono parte de 100 % y no inventa puntos sin dato", () => {
  const [sequence] = buildStorySequences([
    story("a", "2026-09-30T10:00:00Z", 200),
    story("b", "2026-09-30T10:05:00Z", 150),
    story("c", "2026-09-30T10:09:00Z", null),
    story("d", "2026-09-30T10:12:00Z", 100),
  ]);

  assert.deepEqual(storyRetention(sequence), [1, 0.75, null, 0.5]);
});

test("la pérdida por Historia permite comparar secuencias de distinto largo", () => {
  const [short] = buildStorySequences([
    story("a", "2026-09-30T10:00:00Z", 100),
    story("b", "2026-09-30T10:05:00Z", 81),
  ]);
  const [long] = buildStorySequences([
    story("c", "2026-10-01T10:00:00Z", 100),
    story("d", "2026-10-01T10:05:00Z", 90),
    story("e", "2026-10-01T10:09:00Z", 81),
  ]);

  assert.ok(Math.abs(lossPerStory(short) - 0.19) < 1e-9);
  assert.ok(Math.abs(lossPerStory(long) - 0.1) < 1e-9);
  assert.equal(lossPerStory(buildStorySequences([story("f", "2026-10-02T10:00:00Z", 100)])[0]), null);
});

test("dice Hoy y Ayer por día de calendario de Uruguay, y la fecha desde anteayer", () => {
  const now = new Date("2026-10-01T15:00:00Z"); // 12:00 en Uruguay
  assert.equal(sequenceDayLabel("2026-10-01T12:00:00Z", now), "Hoy");
  // 23:30 del 30 de setiembre en Uruguay: menos de 24 h atrás, pero es Ayer.
  assert.equal(sequenceDayLabel("2026-10-01T02:30:00Z", now), "Ayer");
  assert.equal(sequenceDayLabel("2026-09-29T15:00:00Z", now), "29 de setiembre");
  assert.equal(sequenceDayLabel("2025-12-20T15:00:00Z", now), "20 de diciembre de 2025");
});

test("la antigüedad de una Historia se dice como en Instagram", () => {
  const now = new Date("2026-10-01T15:00:00Z");
  assert.equal(storyAgeLabel("2026-10-01T14:59:40Z", now), "Hace 1 min");
  assert.equal(storyAgeLabel("2026-10-01T14:20:00Z", now), "Hace 40 min");
  assert.equal(storyAgeLabel("2026-10-01T12:00:00Z", now), "Hace 3 h");
  assert.equal(storyAgeLabel("2026-09-30T12:00:00Z", now), "Ayer");
  assert.equal(storyAgeLabel("2026-09-28T12:00:00Z", now), "28 de setiembre");
});

test("ordena secuencias por lo que completaron y deja al final las que no tienen el dato", () => {
  const sequences = buildStorySequences([
    ...day("2026-09-28", 100, 50),
    ...day("2026-09-29", 100, 80),
    story("solo", "2026-09-30T15:00:00Z", 100),
  ]);

  const byCompletion = (direction) =>
    sortStorySequences(sequences, "completion", direction).map((sequence) => sequence.completionRate);
  assert.deepEqual(byCompletion("desc"), [0.8, 0.5, null]);
  assert.deepEqual(byCompletion("asc"), [0.5, 0.8, null]);
});

function day(date, startReach, endReach, last = {}) {
  return [
    story(`${date}-a`, `${date}T15:00:00Z`, startReach),
    { ...story(`${date}-b`, `${date}T15:05:00Z`, endReach), ...last },
  ];
}

function story(id, postedAt, reach) {
  return {
    id,
    kind: "story",
    comparisonFormat: "story",
    formatLabel: "Historia",
    mediaType: "IMAGE",
    caption: null,
    thumbnailUrl: null,
    mediaUrl: null,
    mediaWidth: null,
    mediaHeight: null,
    slides: [],
    durationMs: null,
    permalink: null,
    postedAt,
    dateLabel: "30 sept 2026",
    relativeDateLabel: "Hoy",
    likes: null,
    comments: null,
    views: reach,
    reach,
    interactions: null,
    saves: null,
    shares: null,
    follows: null,
    profileVisits: null,
    profileActivity: null,
    averageWatchTimeMs: null,
    totalWatchTimeMs: null,
    skipRate: null,
    replies: null,
    storyForwardTaps: null,
    storyBackTaps: null,
    storyExits: null,
    storyNextSwipes: null,
    multiplier: null,
  };
}
