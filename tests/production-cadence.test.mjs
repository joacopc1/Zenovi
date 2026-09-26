import assert from "node:assert/strict";
import test from "node:test";
import {
  MIN_POSTS_FOR_RHYTHM,
  RHYTHM_WEEKS,
  readCadence,
  upcomingDays,
  weeklyRhythm,
} from "../lib/production/cadence.ts";

// Un jueves, para que el arranque de semana no quede alineado por casualidad.
const AHORA = new Date(2026, 8, 24, 10, 0, 0);
const haceDias = (days) => new Date(AHORA.getTime() - days * 86_400_000).toISOString();
const enDias = (days) => {
  const date = new Date(AHORA.getFullYear(), AHORA.getMonth(), AHORA.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const pieza = (overrides = {}) => ({
  targetDate: null,
  status: "idea",
  hook: "",
  development: "",
  ...overrides,
});

test("el ritmo sale de lo que realmente se publicó", () => {
  // 24 publicaciones en 8 semanas = 3 por semana.
  const posted = Array.from({ length: 24 }, (_, index) => haceDias(index * 2));

  assert.equal(weeklyRhythm(posted, AHORA), 3);
});

test("no afirma un ritmo con casi nada de historial", () => {
  const posted = Array.from({ length: MIN_POSTS_FOR_RHYTHM - 1 }, (_, index) => haceDias(index * 3));

  assert.equal(weeklyRhythm(posted, AHORA), null);
});

test("lo de hace más de ocho semanas no cuenta", () => {
  const viejas = Array.from({ length: 20 }, (_, index) => haceDias(RHYTHM_WEEKS * 7 + 1 + index));

  assert.equal(weeklyRhythm(viejas, AHORA), null);
});

test("una fecha futura o rota no infla el ritmo", () => {
  const posted = [
    ...Array.from({ length: 8 }, (_, index) => haceDias(index * 5)),
    new Date(AHORA.getTime() + 86_400_000).toISOString(),
    "no-es-una-fecha",
  ];

  assert.equal(weeklyRhythm(posted, AHORA), 1);
});

test("los próximos días arrancan hoy y son siete", () => {
  const days = upcomingDays([], AHORA);

  assert.equal(days.length, 7);
  assert.equal(days[0].iso, enDias(0));
  assert.equal(days[0].isToday, true);
  assert.equal(days[6].iso, enDias(6));
  assert.equal(days.filter((day) => day.isToday).length, 1);
});

test("la semana empieza el lunes", () => {
  // El 24 de septiembre de 2026 es jueves: cuarto día de la semana, índice 3.
  assert.equal(upcomingDays([], AHORA)[0].weekday, 3);
});

test("cada día sabe cuántas piezas le caen", () => {
  const days = upcomingDays(
    [
      pieza({ targetDate: enDias(0) }),
      pieza({ targetDate: enDias(2) }),
      pieza({ targetDate: enDias(2) }),
      pieza({ targetDate: null }),
      pieza({ targetDate: enDias(40) }),
    ],
    AHORA,
  );

  assert.equal(days[0].planned, 1);
  assert.equal(days[1].planned, 0);
  assert.equal(days[2].planned, 2);
  assert.equal(days.reduce((total, day) => total + day.planned, 0), 3);
});

test("dice cuántas faltan para igualar el propio ritmo", () => {
  const posted = Array.from({ length: 24 }, (_, index) => haceDias(index * 2)); // 3 por semana
  const reading = readCadence([pieza({ targetDate: enDias(1) })], posted, AHORA);

  assert.equal(reading.rhythm, 3);
  assert.equal(reading.planned, 1);
  assert.equal(reading.missing, 2);
});

test("no faltan piezas cuando hay más planificadas que el ritmo", () => {
  const posted = Array.from({ length: 8 }, (_, index) => haceDias(index * 5)); // 1 por semana
  const reading = readCadence(
    [pieza({ targetDate: enDias(1) }), pieza({ targetDate: enDias(3) })],
    posted,
    AHORA,
  );

  assert.equal(reading.missing, 0);
});

test("sin ritmo conocido no dice cuántas faltan", () => {
  const reading = readCadence([pieza({ targetDate: enDias(1) })], [], AHORA);

  assert.equal(reading.rhythm, null);
  assert.equal(reading.missing, null);
  assert.equal(reading.planned, 1);
});

test("cuenta cuáles de las planificadas no tienen guion", () => {
  const reading = readCadence(
    [
      pieza({ targetDate: enDias(1), hook: "Nadie te dice esto" }),
      pieza({ targetDate: enDias(2), development: "Tres partes" }),
      pieza({ targetDate: enDias(3) }),
      pieza({ targetDate: enDias(4), hook: "   " }),
    ],
    [],
    AHORA,
  );

  assert.equal(reading.planned, 4);
  assert.equal(reading.withoutScript, 2);
});

test("una pieza ya publicada no cuenta como planificada", () => {
  // Salió el martes: contarla haría parecer que falta menos de lo que falta.
  const reading = readCadence(
    [
      pieza({ targetDate: enDias(1), status: "publicada", hook: "ya salió" }),
      pieza({ targetDate: enDias(2) }),
    ],
    [],
    AHORA,
  );

  assert.equal(reading.planned, 1);
  assert.equal(reading.days[1].planned, 0);
  assert.equal(reading.days[2].planned, 1);
});
