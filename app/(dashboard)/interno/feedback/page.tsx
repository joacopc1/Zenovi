import { notFound } from "next/navigation";
import { AppHeader } from "@/components/shell/app-header";
import { isZenoviAdmin } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Feedback", robots: { index: false } };

/** Vista interna: lo que mandaron desde el botón "Feedback", lo más nuevo arriba. */
export default async function FeedbackPage() {
  if (!(await isZenoviAdmin())) notFound();
  const admin = createAdminClient();
  const { data } = await admin
    .from("feedback")
    .select("id, message, page, created_at, workspaces(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  const items = data ?? [];
  const date = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Montevideo" });

  return (
    <>
      <AppHeader />
      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:py-10">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Feedback</h1>
        <p className="font-support mt-2 text-sm text-graphite">Lo que mandaron desde el botón del header. Sólo lo ve el equipo de Zenovi.</p>
        <ul className="mt-6 space-y-3">
          {items.length === 0 ? <li className="font-support text-sm text-graphite">Todavía no llegó nada.</li> : null}
          {items.map((item) => {
            const workspace = Array.isArray(item.workspaces) ? item.workspaces[0] : item.workspaces;
            return (
              <li key={item.id} className="rounded-card border border-mist bg-paper p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink">{item.message}</p>
                <p className="font-support mt-2 text-xs text-muted">
                  {workspace?.name ?? "Sin marca"} · {item.page ?? "—"} · {date.format(new Date(item.created_at))}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
