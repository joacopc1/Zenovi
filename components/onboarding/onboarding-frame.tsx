import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { ONBOARDING_STEPS, onboardingStepNumber, type OnboardingStepId } from "@/lib/onboarding/steps";

type OnboardingFrameProps = {
  title: string;
  description: string;
  children: ReactNode;
  step: OnboardingStepId;
};

export function OnboardingFrame({
  title,
  description,
  children,
  step,
}: OnboardingFrameProps) {
  const currentStep = onboardingStepNumber(step);
  const total = ONBOARDING_STEPS.length;
  return (
    // Pocas cosas en pantalla: van al centro (un poco arriba del medio, donde se ve centrado).
    <main className="flex min-h-dvh flex-col justify-center bg-white px-5 py-12 text-ink">
      <section className="mx-auto -mt-[8vh] w-full max-w-[400px]">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2.5" aria-label="Zenovi">
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-[-0.025em]">Zenovi</span>
        </Link>

        <header className="mt-9 text-center sm:mt-10">
          <p className="text-xs font-medium text-muted">Paso {currentStep} de {total}</p>
          <h1 className="mt-2 text-[clamp(1.5rem,1.15rem+1.1vw,1.875rem)] font-semibold leading-tight tracking-[-0.04em]">
            {title}
          </h1>
          <p className="mx-auto mt-1.5 max-w-[36ch] text-sm leading-5 text-muted">
            {description}
          </p>
        </header>

        <div className="mt-5">{children}</div>

        <div className="mt-6 flex gap-2" aria-label={`Paso ${currentStep} de ${total}`}>
          {ONBOARDING_STEPS.map((item, index) => (
            <span key={item.id} className={`h-0.5 flex-1 transition-colors ${index < currentStep ? "bg-ink" : "bg-mist"}`} />
          ))}
        </div>
      </section>
    </main>
  );
}
