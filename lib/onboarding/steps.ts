/**
 * El onboarding, en orden: corto, para llegar rápido a ver la app. Las preguntas se
 * responden con un toque y se pueden saltear; el ADN se completa después, desde los
 * primeros pasos del Inicio, y no acá.
 */
export const ONBOARDING_STEPS = [
  { id: "workspace", path: "/onboarding/workspace" },
  { id: "about", path: "/onboarding/about" },
  { id: "instagram", path: "/onboarding/instagram" },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]["id"];

export function onboardingStepNumber(id: OnboardingStepId) {
  return ONBOARDING_STEPS.findIndex((step) => step.id === id) + 1;
}

export function nextOnboardingPath(id: OnboardingStepId) {
  const index = ONBOARDING_STEPS.findIndex((step) => step.id === id);
  return ONBOARDING_STEPS[index + 1]?.path ?? "/";
}

/** Se responden con un toque: opciones cortas y una salida para lo que no entra. */
export const ROLE_OPTIONS = [
  { id: "creator", label: "Creador/a de contenido" },
  { id: "coach", label: "Coach o consultor/a" },
  { id: "founder", label: "Emprendedor/a con producto" },
  { id: "professional", label: "Profesional independiente" },
  { id: "agency", label: "Agencia o community manager" },
  { id: "other", label: "Otra cosa" },
] as const;

export const SOURCE_OPTIONS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "referral", label: "Me lo recomendaron" },
  { id: "search", label: "Google" },
  { id: "other", label: "Otro" },
] as const;

export function isRoleOption(value: unknown): value is (typeof ROLE_OPTIONS)[number]["id"] {
  return ROLE_OPTIONS.some((option) => option.id === value);
}

export function isSourceOption(value: unknown): value is (typeof SOURCE_OPTIONS)[number]["id"] {
  return SOURCE_OPTIONS.some((option) => option.id === value);
}
