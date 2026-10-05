import assert from "node:assert/strict";
import test from "node:test";
import { creditBalance, creditPeriodStart, usageCostUsd, usdToCredits } from "../lib/credits/pricing.ts";

test("una respuesta típica del Director cuesta unos cuatro créditos", () => {
  const usd = usageCostUsd("claude-sonnet-5-5", {
    inputTokens: 12_000,
    cacheReadTokens: 8_000,
    cacheWriteTokens: 0,
    outputTokens: 1_800,
  });
  assert.ok(Math.abs(usd - 0.0436) < 1e-9);
  assert.equal(usdToCredits(usd), 4.36);
});

test("un modelo sin precio cargado falla en vez de salir gratis", () => {
  assert.throws(() => usageCostUsd("anthropic/otro", { inputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokens: 1 }), /missing_model_price/);
});

test("el saldo se cuenta por mes y no baja de cero", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  assert.equal(creditPeriodStart(now), "2026-10-01T00:00:00.000Z");
  const balance = creditBalance(1800, now, 1500);
  assert.equal(balance.remaining, 0);
  assert.equal(balance.usedShare, 1);
  assert.equal(balance.resetsAt, "2026-11-01T00:00:00.000Z");
  assert.equal(creditBalance(375, now, 1500).usedShare, 0.25);
});

test("sin Instagram, o con un Instagram que ya tuvo su prueba, no hay créditos", () => {
  const now = new Date("2026-10-15T12:00:00Z");
  for (const locked of ["no_instagram", "trial_used"]) {
    const balance = creditBalance(0, now, 1500, locked);
    assert.equal(balance.locked, locked);
    assert.equal(balance.total, 0);
    assert.equal(balance.remaining, 0);
    assert.equal(balance.usedShare, 0);
  }
  assert.equal(creditBalance(100, now, 1500).locked, null);
  assert.equal(creditBalance(100, now, 1500).remaining, 1400);
});
