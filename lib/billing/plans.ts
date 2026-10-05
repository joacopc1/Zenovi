/**
 * Los tres planes de Zenovi y sus límites, en un solo lugar: cambiar 500 créditos por 600
 * es cambiar un número acá. Los precios se definen con el equipo (ver "Planes y precios de
 * Zenovi"); hasta entonces quedan vacíos y ningún plan se cobra. Todavía no se usan para
 * dar créditos: la beta sigue con `BETA_MONTHLY_CREDITS`.
 */

export type PlanId = "starter" | "growth" | "studio";

export type Plan = {
  id: PlanId;
  name: string;
  /** Lo que se cobra por mes, en dólares; null hasta definirlo. */
  priceUsd: number | null;
  monthlyCredits: number;
  /** Cuentas de la competencia que se analizan (la función todavía no existe). */
  competitors: number;
  instagramAccounts: number;
  /** Conectar otras redes además de Instagram (YouTube, TikTok); la función todavía no existe. */
  otherNetworks: boolean;
  /** Carpetas del Director con su propio contexto (la función todavía no existe). */
  directorProjects: boolean;
};

export const PLANS: readonly Plan[] = [
  { id: "starter", name: "Starter", priceUsd: null, monthlyCredits: 500, competitors: 1, instagramAccounts: 1, otherNetworks: false, directorProjects: false },
  { id: "growth", name: "Growth", priceUsd: null, monthlyCredits: 1500, competitors: 3, instagramAccounts: 1, otherNetworks: false, directorProjects: false },
  { id: "studio", name: "Studio", priceUsd: null, monthlyCredits: 4000, competitors: 5, instagramAccounts: 3, otherNetworks: true, directorProjects: true },
];

/** El plan que tienen hoy todos los workspaces, mientras no se cobra. */
export const BETA_PLAN_NAME = "Gratis";

/** El plan que se recomienda en la pantalla de planes. */
export const RECOMMENDED_PLAN: PlanId = "growth";

/** La prueba gratis: un tope de créditos para toda la prueba, una sola vez por Instagram y por mail. */
export const TRIAL = { credits: 300, days: null as number | null };

export function planById(id: PlanId) {
  return PLANS.find((plan) => plan.id === id)!;
}
