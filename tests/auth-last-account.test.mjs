import assert from "node:assert/strict";
import test from "node:test";
import { readLastAccount } from "../lib/auth/last-account.ts";

test("el login sólo saluda con un usuario de Instagram válido", () => {
  assert.equal(readLastAccount("elcostarrica"), "elcostarrica");
  assert.equal(readLastAccount("@el.costa_rica"), "el.costa_rica");
  assert.equal(readLastAccount("<script>"), null);
  assert.equal(readLastAccount(undefined), null);
  assert.equal(readLastAccount("x".repeat(31)), null);
});
