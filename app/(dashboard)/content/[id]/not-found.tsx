import Link from "next/link";
import { AppHeader } from "@/components/shell/app-header";

export default function ContentDetailNotFound() {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1240px] px-5 py-12 md:px-8 lg:px-10">
        <section className="max-w-xl rounded-card border border-mist p-6">
          <h1 className="text-lg font-semibold">Esta pieza ya no está en tu biblioteca</h1>
          <p className="mt-2 text-sm leading-6 text-graphite">
            Puede que se haya borrado en Instagram o que todavía no entre en la última
            sincronización. Zenovi conserva sólo lo que la cuenta devuelve hoy.
          </p>
          <Link
            href="/content"
            className="mt-5 inline-flex min-h-9 items-center rounded-control bg-ink px-4 text-sm font-medium text-paper hover:bg-ink/85"
          >
            Volver a Contenido
          </Link>
        </section>
      </main>
    </>
  );
}
