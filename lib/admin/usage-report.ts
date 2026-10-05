/**
 * El uso de IA de cada workspace en un período, para decidir los límites de los planes con
 * datos: cuántos créditos gasta un creador por día y en qué. Puro, para poder probarlo.
 */

export type UsageEvent = { workspaceId: string; feature: string; credits: number; costUsd: number; createdAt: string };

export type UsageGroup = "chat" | "analysis" | "script" | "other";

export const USAGE_GROUP_LABELS: Record<UsageGroup, string> = {
  chat: "Director",
  analysis: "Análisis",
  script: "Guiones",
  other: "Otros",
};

const FEATURE_GROUPS: Record<string, UsageGroup> = {
  director_chat: "chat",
  director_title: "chat",
  reel_analysis: "analysis",
  story_analysis: "analysis",
  reel_script: "script",
};

export type WorkspaceUsage = {
  workspaceId: string;
  credits: number;
  costUsd: number;
  byGroup: Record<UsageGroup, number>;
  /** Días con algún uso: el promedio se saca sobre éstos, no sobre los del período. */
  activeDays: number;
  perActiveDay: number;
  /** El día que más gastó, para ver picos. */
  peakDay: number;
  lastUsedAt: string;
};

export function buildUsageReport(events: UsageEvent[], timeZone = "America/Montevideo") {
  const dayOf = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const byWorkspace = new Map<string, { usage: WorkspaceUsage; days: Map<string, number> }>();

  for (const event of events) {
    let entry = byWorkspace.get(event.workspaceId);
    if (!entry) {
      entry = {
        usage: {
          workspaceId: event.workspaceId,
          credits: 0,
          costUsd: 0,
          byGroup: { chat: 0, analysis: 0, script: 0, other: 0 },
          activeDays: 0,
          perActiveDay: 0,
          peakDay: 0,
          lastUsedAt: event.createdAt,
        },
        days: new Map(),
      };
      byWorkspace.set(event.workspaceId, entry);
    }
    const { usage, days } = entry;
    usage.credits += event.credits;
    usage.costUsd += event.costUsd;
    usage.byGroup[FEATURE_GROUPS[event.feature] ?? "other"] += event.credits;
    if (event.createdAt > usage.lastUsedAt) usage.lastUsedAt = event.createdAt;
    const day = dayOf.format(new Date(event.createdAt));
    days.set(day, (days.get(day) ?? 0) + event.credits);
  }

  const workspaces = [...byWorkspace.values()].map(({ usage, days }) => {
    usage.activeDays = days.size;
    usage.perActiveDay = days.size > 0 ? usage.credits / days.size : 0;
    usage.peakDay = Math.max(0, ...days.values());
    return usage;
  });
  workspaces.sort((a, b) => b.credits - a.credits);

  const totals = workspaces.reduce(
    (sum, usage) => ({ credits: sum.credits + usage.credits, costUsd: sum.costUsd + usage.costUsd }),
    { credits: 0, costUsd: 0 },
  );
  return { workspaces, totals };
}

/** Los mails con acceso a las vistas internas, de una variable de entorno separada por comas. */
export function parseAdminEmails(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.includes("@")),
  );
}
