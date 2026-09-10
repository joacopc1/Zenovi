import { NextResponse, type NextRequest } from "next/server";
import { syncStoredInstagramConnection } from "@/lib/meta/stored-sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const redirectPath = await readRedirectPath(request);

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return redirectWithError(request, redirectPath, "workspace_unavailable");
  }

  const admin = createAdminClient();
  const { data: connection, error: connectionError } = await admin
    .from("social_connections")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("provider", "instagram")
    .maybeSingle();

  if (connectionError || !connection) {
    return redirectWithError(request, redirectPath, "connection_unavailable");
  }

  const syncResult = await syncStoredInstagramConnection(admin, connection.id);

  if (!syncResult.ok) {
    if (syncResult.code === "authorization_expired") {
      return redirectWithError(request, "/onboarding/instagram", syncResult.code);
    }

    return redirectWithError(request, redirectPath, "initial_sync_failed");
  }

  const destination = new URL(redirectPath, request.url);
  destination.searchParams.set(
    redirectPath === "/onboarding/instagram" ? "connected" : "sync",
    redirectPath === "/onboarding/instagram" ? "1" : "updated",
  );
  return NextResponse.redirect(destination, 303);
}

async function readRedirectPath(request: NextRequest) {
  try {
    const formData = await request.formData();
    return formData.get("redirectTo") === "/" ? "/" : "/onboarding/instagram";
  } catch {
    return "/onboarding/instagram";
  }
}

function redirectWithError(request: NextRequest, path: string, code: string) {
  const destination = new URL(path, request.url);
  destination.searchParams.set(path === "/" ? "sync" : "error", path === "/" ? "error" : code);
  return NextResponse.redirect(destination, 303);
}
