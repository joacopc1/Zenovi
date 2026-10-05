import assert from "node:assert/strict";
import test from "node:test";
import { PLANS, RECOMMENDED_PLAN, planById } from "../lib/billing/plans.ts";

test("cada plan da más que el anterior", () => {
  for (let index = 1; index < PLANS.length; index += 1) {
    const previous = PLANS.at(index - 1);
    const plan = PLANS.at(index);
    assert.ok(plan.monthlyCredits > previous.monthlyCredits, `${plan.name} tiene menos créditos que ${previous.name}`);
    assert.ok(plan.competitors >= previous.competitors);
    assert.ok(plan.instagramAccounts >= previous.instagramAccounts);
  }
});

test("el plan recomendado existe", () => {
  assert.equal(planById(RECOMMENDED_PLAN).name, "Growth");
});
