import assert from "node:assert/strict";
import test from "node:test";
import { buildChecklist } from "../lib/onboarding/checklist.ts";
import { isRoleOption, nextOnboardingPath, onboardingStepNumber } from "../lib/onboarding/steps.ts";

test("el onboarding va marca → sobre vos → Instagram → Inicio, sin pedir el ADN", () => {
  assert.equal(nextOnboardingPath("workspace"), "/onboarding/about");
  assert.equal(nextOnboardingPath("about"), "/onboarding/instagram");
  assert.equal(nextOnboardingPath("instagram"), "/");
  assert.equal(onboardingStepNumber("instagram"), 3);
});

test("sólo se guardan respuestas de la lista", () => {
  assert.equal(isRoleOption("coach"), true);
  assert.equal(isRoleOption("<script>"), false);
});

test("cada primer paso se marca solo con lo que la persona ya hizo", () => {
  const items = buildChecklist({ instagramConnected: true, brandDnaPercent: 49, analyzedReel: false, askedDirector: true, savedIdea: false });
  assert.deepEqual(items.filter((item) => item.done).map((item) => item.id), ["instagram", "director"]);
  // Con la mitad del ADN, el Director ya conoce la marca.
  assert.equal(buildChecklist({ instagramConnected: false, brandDnaPercent: 50, analyzedReel: false, askedDirector: false, savedIdea: false }).find((item) => item.id === "brand").done, true);
});
