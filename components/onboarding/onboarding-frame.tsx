import type { ReactNode } from "react";

type OnboardingFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  currentStep: 1 | 2 | 3;
};

const progressWidth = {
  1: "w-1/3",
  2: "w-2/3",
  3: "w-full",
} as const;

export function OnboardingFrame({
  eyebrow,
  title,
  description,
  children,
  currentStep,
}: OnboardingFrameProps) {
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
            {eyebrow}
          </p>
          <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-[-0.045em]">
            {title}
          </h1>
          <p className="mt-3 max-w-[36ch] text-sm leading-6 text-graphite">
            {description}
          </p>
        </header>

        {children}

        <div className="mt-8 border-t border-mist pt-5" aria-label="Ruta de conexión">
          <ol className="grid grid-cols-3 gap-3 text-[11px] font-medium text-muted">
            <li className={currentStep === 1 ? "text-ink" : undefined}>01 Cuenta</li>
            <li className={currentStep === 2 ? "text-ink" : undefined}>02 Marcas</li>
            <li className={currentStep === 3 ? "text-ink" : undefined}>03 Insights</li>
          </ol>
          <div className="mt-2 h-px bg-mist">
            <div className={`h-px bg-ink ${progressWidth[currentStep]}`} />
          </div>
        </div>
      </section>
    </main>
  );
}
