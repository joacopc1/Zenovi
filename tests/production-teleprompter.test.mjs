import assert from "node:assert/strict";
import test from "node:test";
import {
  SCROLL_SPEEDS,
  SPOKEN_WORDS_PER_MINUTE,
  countWords,
  formatSpokenDuration,
  teleprompterWordsPerMinute,
} from "../lib/production/teleprompter.ts";

test("countWords no cuenta espacios de más ni saltos de línea", () => {
  assert.equal(countWords("  hola   mundo \n\n  otra  vez "), 4);
  assert.equal(countWords("   "), 0);
  assert.equal(countWords(""), 0);
});

test("traduce la velocidad a palabras por minuto", () => {
  // 300 palabras que recorren 2000px a 50px/s tardan 40s → 450 pal/min.
  assert.equal(teleprompterWordsPerMinute("palabra ".repeat(300), 2000, 50), 450);
});

test("el doble de velocidad es el doble de palabras por minuto", () => {
  const texto = "palabra ".repeat(200);
  const lento = teleprompterWordsPerMinute(texto, 3000, 30);
  const rapido = teleprompterWordsPerMinute(texto, 3000, 60);

  assert.equal(rapido, lento * 2);
});

test("sin nada que recorrer no inventa un ritmo", () => {
  // Un guion corto entra entero en pantalla: ahí la velocidad no gobierna nada.
  assert.equal(teleprompterWordsPerMinute("hola mundo", 0, 50), null);
  assert.equal(teleprompterWordsPerMinute("hola mundo", -10, 50), null);
});

test("sin texto ni velocidad no devuelve un número", () => {
  assert.equal(teleprompterWordsPerMinute("   ", 1000, 50), null);
  assert.equal(teleprompterWordsPerMinute("hola mundo", 1000, 0), null);
});

test("las velocidades van de menor a mayor y cubren un rango usable", () => {
  const speeds = [...SCROLL_SPEEDS];

  assert.deepEqual(speeds, [...speeds].sort((a, b) => a - b));
  assert.equal(new Set(speeds).size, speeds.length);
  // Un guion normal a ritmo de habla cae dentro del rango por los dos extremos.
  const texto = "palabra ".repeat(250);
  const lenta = teleprompterWordsPerMinute(texto, 3500, speeds[0]);
  const rapida = teleprompterWordsPerMinute(texto, 3500, speeds[speeds.length - 1]);

  assert.ok(lenta < 100, `la más lenta debería bajar de 100 pal/min, dio ${lenta}`);
  assert.ok(rapida > 200, `la más rápida debería pasar de 200 pal/min, dio ${rapida}`);
});

test("estima cuánto dura un guion hablado", () => {
  // 145 palabras es un minuto de habla; la mitad, medio minuto.
  assert.equal(formatSpokenDuration(SPOKEN_WORDS_PER_MINUTE), "1:00");
  assert.equal(formatSpokenDuration(Math.round(SPOKEN_WORDS_PER_MINUTE / 2)), "0:30");
  assert.equal(formatSpokenDuration(0), "0:00");
});

test("un guion largo se lee en minutos y segundos", () => {
  assert.equal(formatSpokenDuration(SPOKEN_WORDS_PER_MINUTE * 2 + 24), "2:10");
});
