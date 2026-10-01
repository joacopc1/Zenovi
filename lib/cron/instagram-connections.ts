import "server-only";

import { timingSafeEqual } from "node:crypto";
import { mapWithConcurrency } from "@/lib/async/map-with-concurrency";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;
type ConnectionResult = { ok: true } | { ok: false; code: string };

/** Lo llama quien programe la tarea (hoy Supabase Cron, mañana Vercel): sólo con la clave compartida. */
export function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!secret || !authorization) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Corre una tarea sobre cada conexión de Instagram activa y resume el resultado como respuesta HTTP. */
export async function runForActiveConnections(
  admin: AdminClient,
  task: (connectionId: string) => Promise<ConnectionResult>,
) {
  const { data: connections, error } = await admin
    .from("social_connections")
    .select("id")
    .eq("provider", "instagram")
    .in("status", ["connected", "account_resolved", "syncing"]);

  if (error) {
    return Response.json({ ok: false, error: "connections_unavailable" }, { status: 500 });
  }

  const results = await mapWithConcurrency(connections ?? [], 2, async (connection) => ({
    connectionId: connection.id as string,
    ...(await task(connection.id as string)),
  }));
  const failed = results.flatMap((result) => (result.ok ? [] : [{ connectionId: result.connectionId, code: result.code }]));

  return Response.json(
    { ok: failed.length === 0, attempted: results.length, succeeded: results.length - failed.length, failed },
    { status: failed.length > 0 ? 500 : 200 },
  );
}
