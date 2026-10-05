import "server-only";

import { buildUsageReport, type UsageEvent } from "@/lib/admin/usage-report";
import { readEmbeddedRow } from "@/lib/data/embedded-row";
import { createAdminClient } from "@/lib/supabase/admin";

export const USAGE_REPORT_DAYS = 30;
/** Un techo para la lectura: en la beta sobra, y evita traer de más si algo se dispara. */
const MAX_EVENTS = 50_000;

/** El uso de IA de todos los workspaces en los últimos 30 días. Sólo para el equipo. */
export async function getUsageReport() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - USAGE_REPORT_DAYS * 86_400_000).toISOString();
  const { data, error } = await admin
    .from("ai_usage_events")
    .select("workspace_id, feature, credits, cost_usd, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_EVENTS);
  if (error) throw new Error(`usage_report_failed:${error.code}`);

  const events: UsageEvent[] = (data ?? []).map((row) => ({
    workspaceId: row.workspace_id,
    feature: row.feature,
    credits: Number(row.credits),
    costUsd: Number(row.cost_usd),
    createdAt: row.created_at,
  }));
  const report = buildUsageReport(events);

  const ids = report.workspaces.map((usage) => usage.workspaceId);
  const names = new Map<string, { name: string; instagram: string | null }>();
  if (ids.length > 0) {
    const { data: workspaces } = await admin
      .from("workspaces")
      .select("id, name, social_connections(social_accounts(username))")
      .in("id", ids);
    for (const workspace of workspaces ?? []) {
      const connection = readEmbeddedRow<{ social_accounts: unknown }>(workspace.social_connections);
      const account = readEmbeddedRow<{ username: string | null }>(connection?.social_accounts);
      names.set(workspace.id, { name: workspace.name, instagram: account?.username ?? null });
    }
  }

  return {
    ...report,
    workspaces: report.workspaces.map((usage) => ({ ...usage, ...(names.get(usage.workspaceId) ?? { name: "Workspace borrado", instagram: null }) })),
    truncated: events.length >= MAX_EVENTS,
  };
}
