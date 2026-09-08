import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center py-10">
      <section className="w-[calc(100vw-2.5rem)] min-w-0 max-w-[440px] rounded-panel border border-mist bg-paper p-6 sm:w-[calc(100vw-4rem)] sm:p-8">
        <header className="mb-8">
          <div className="mb-8 flex items-center gap-2.5" aria-label="Zenovi">
            <span className="grid size-8 place-items-center rounded-control bg-ink text-sm font-bold text-paper">
              Z
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">Zenovi</span>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Tu dirección de contenido
          </p>
          <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.045em]">
            Volvé a tus marcas y decisiones.
          </h1>
          <p className="mt-3 max-w-[36ch] text-sm leading-6 text-graphite">
            Entrá para reunir rendimiento, audiencia y recomendaciones en un solo lugar.
          </p>
        </header>

        <LoginForm initialError={error === "auth_callback"} />

        <div className="mt-8 border-t border-mist pt-5" aria-label="Ruta de conexión">
          <ol className="grid grid-cols-3 gap-3 text-[11px] font-medium text-muted">
            <li className="text-ink">01 Cuenta</li>
            <li>02 Marcas</li>
            <li>03 Insights</li>
          </ol>
          <div className="mt-2 h-px bg-mist">
            <div className="h-px w-1/3 bg-ink" />
          </div>
        </div>
      </section>
    </main>
  );
}
