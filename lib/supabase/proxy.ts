import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

const PUBLIC_PATHS = [
  "/api/integrations/instagram/data-deletion",
  "/data-deletion",
  "/privacy",
  "/terms",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  // Keep this immediately after client creation so refresh-token rotation stays in sync.
  const { data } = await supabase.auth.getClaims();
  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isCronRoute = request.nextUrl.pathname.startsWith("/api/cron/");
  // Rutas que Meta y cualquier persona tienen que alcanzar sin sesión: el callback de
  // borrado se autentica con la firma de Meta, la página de estado con su código, y los
  // textos legales tienen que poder leerse antes de crear una cuenta.
  const isPublicRoute = PUBLIC_PATHS.includes(request.nextUrl.pathname);
  const isGuestRoute = ["/login", "/register", "/forgot-password"].includes(
    request.nextUrl.pathname,
  );

  if (!data?.claims && !isAuthRoute && !isCronRoute && !isGuestRoute && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (data?.claims && isGuestRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}
