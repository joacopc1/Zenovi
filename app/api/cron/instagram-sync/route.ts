import { timingSafeEqual } from "node:crypto";
import { syncStoredInstagramConnection } from "@/lib/meta/stored-sync";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: connections, error } = await admin
    .from("social_connections")
    .select("id")
    .eq("provider", "instagram")
    .in("status", ["connected", "account_resolved", "syncing"]);

  if (error) {
    return Response.json({ ok: false, error: "connections_unavailable" }, { status: 500 });
  }

  const results = await mapWithConcurrency(connections ?? [], 2, async (connection) => {
    const result = await syncStoredInstagramConnection(admin, connection.id);
    return { connectionId: connection.id, ...result };
  });
  const failed = results.filter((result) => !result.ok);

  return Response.json(
    {
      ok: failed.length === 0,
      attempted: results.length,
      succeeded: results.length - failed.length,
      failed: failed.map((result) => ({
        connectionId: result.connectionId,
        code: result.code,
      })),
    },
    { status: failed.length > 0 ? 500 : 200 },
  );
}

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");

  if (!secret || !authorization) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    results.push(...(await Promise.all(items.slice(index, index + concurrency).map(mapper))));
  }

  return results;
}
