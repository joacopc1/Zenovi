import { NextResponse, type NextRequest } from "next/server";
import { isSameOriginRequest } from "@/lib/http/same-origin";
import { deleteInstagramConnections } from "@/lib/meta/delete-connection";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SETTINGS_PATH = "/settings";

/**
 * Desconecta Instagram y borra todos sus datos del workspace de quien lo pide.
 *
 * Es destructivo, así que sólo acepta pedidos del propio sitio —un formulario de otro
 * dominio no puede disparar el borrado con la sesión de la persona— y sólo del dueño
 * del workspace.
 */
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return new Response("Origen no permitido.", { status: 403 });
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("created_by", authData.user.id)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return redirectToSettings(request, "error");
  }

  const admin = createAdminClient();
  const { data: connections, error: connectionsError } = await admin
    .from("social_connections")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("provider", "instagram");

  if (connectionsError) {
    return redirectToSettings(request, "error");
  }

  const result = await deleteInstagramConnections(
    admin,
    (connections ?? []).map((connection) => connection.id),
  );

  return redirectToSettings(request, result.ok ? "done" : "error");
}

function redirectToSettings(request: NextRequest, status: "done" | "error") {
  const url = new URL(SETTINGS_PATH, request.url);
  url.searchParams.set("disconnect", status);
  return NextResponse.redirect(url, 303);
}
