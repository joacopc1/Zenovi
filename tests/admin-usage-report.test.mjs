import assert from "node:assert/strict";
import test from "node:test";
import { buildUsageReport, parseAdminEmails } from "../lib/admin/usage-report.ts";

const event = (workspaceId, feature, credits, createdAt) => ({ workspaceId, feature, credits, costUsd: credits / 100, createdAt });

test("el uso se suma por workspace, por tipo y por día activo", () => {
  const { workspaces, totals } = buildUsageReport([
    event("a", "director_chat", 4, "2026-10-01T15:00:00Z"),
    event("a", "director_title", 0.5, "2026-10-01T15:01:00Z"),
    event("a", "reel_analysis", 3, "2026-10-01T18:00:00Z"),
    event("a", "reel_script", 3, "2026-10-03T12:00:00Z"),
    event("b", "home_insight", 0.2, "2026-10-02T12:00:00Z"),
  ]);
  const [a, b] = workspaces;
  assert.equal(a.workspaceId, "a");
  assert.equal(a.credits, 10.5);
  assert.deepEqual(a.byGroup, { chat: 4.5, analysis: 3, script: 3, other: 0 });
  assert.equal(a.activeDays, 2);
  assert.equal(a.perActiveDay, 5.25);
  assert.equal(a.peakDay, 7.5);
  assert.equal(a.lastUsedAt, "2026-10-03T12:00:00Z");
  assert.equal(b.byGroup.other, 0.2);
  assert.equal(totals.credits, 10.7);
});

test("los días se cuentan en la hora de Montevideo", () => {
  // 01:00 UTC del 2 es todavía el 1 en Montevideo: es un solo día activo.
  const { workspaces } = buildUsageReport([
    event("a", "director_chat", 1, "2026-10-01T20:00:00Z"),
    event("a", "director_chat", 1, "2026-10-02T01:00:00Z"),
  ]);
  assert.equal(workspaces[0].activeDays, 1);
});

test("sólo cuentan los mails bien escritos de la lista de acceso", () => {
  assert.deepEqual([...parseAdminEmails(" Joaco@Mail.com, ,otro ,b@x.uy")], ["joaco@mail.com", "b@x.uy"]);
  assert.equal(parseAdminEmails(undefined).size, 0);
});
