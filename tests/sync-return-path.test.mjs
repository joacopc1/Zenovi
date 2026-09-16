import assert from "node:assert/strict";
import test from "node:test";
import { ONBOARDING_PATH, resolveSyncReturnPath as resolveWithRanges } from "../lib/meta/sync-return-path.ts";

const TABS = ["visibilidad", "engagement", "contenido", "comunidad", "audiencia"];
const resolveSyncReturnPath = (raw) => resolveWithRanges(raw, [7, 30, 90], TABS);

test("vuelve a cada pantalla que puede lanzar una sincronización", () => {
  assert.equal(resolveSyncReturnPath("/"), "/");
  assert.equal(resolveSyncReturnPath("/analytics"), "/analytics");
  assert.equal(resolveSyncReturnPath("/content"), "/content");
});

test("Analíticas conserva el período elegido", () => {
  assert.equal(resolveSyncReturnPath("/analytics?days=7"), "/analytics?days=7");
  assert.equal(resolveSyncReturnPath("/analytics?days=90"), "/analytics?days=90");
});

test("descarta períodos inventados y parámetros ajenos", () => {
  assert.equal(resolveSyncReturnPath("/analytics?days=13"), "/analytics");
  assert.equal(resolveSyncReturnPath("/content?next=https://evil.test"), "/content");
});

test("nunca redirige fuera de Zenovi", () => {
  for (const hostile of ["//evil.test", "/\\evil.test", "https://evil.test/analytics", "evil.test"]) {
    assert.equal(resolveSyncReturnPath(hostile), ONBOARDING_PATH, hostile);
  }
});

test("rutas desconocidas o valores vacíos vuelven al onboarding", () => {
  assert.equal(resolveSyncReturnPath("/settings"), ONBOARDING_PATH);
  assert.equal(resolveSyncReturnPath(null), ONBOARDING_PATH);
  assert.equal(resolveSyncReturnPath(""), ONBOARDING_PATH);
});

test("Analíticas también vuelve a la pestaña que estaba abierta", () => {
  assert.equal(resolveSyncReturnPath("/analytics?tab=comunidad"), "/analytics?tab=comunidad");
  assert.equal(
    resolveSyncReturnPath("/analytics?days=7&tab=engagement"),
    "/analytics?days=7&tab=engagement",
  );
});

test("descarta una pestaña inventada sin perder el período", () => {
  assert.equal(resolveSyncReturnPath("/analytics?days=7&tab=../otra"), "/analytics?days=7");
});
