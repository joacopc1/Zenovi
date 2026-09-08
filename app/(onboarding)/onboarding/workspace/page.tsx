import { redirect } from "next/navigation";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { getAccountContext } from "@/lib/data/account-context";
import { WorkspaceForm } from "./workspace-form";

export default async function WorkspaceOnboardingPage() {
  const account = await getAccountContext();

  if (!account) {
    redirect("/login");
  }

  if (account.workspace) {
    redirect("/");
  }

  return (
    <OnboardingFrame
      eyebrow="Paso 2 · Tu marca"
      title="Nombrá tu espacio de trabajo."
      description="Este nombre identifica la marca cuyos contenidos, métricas y decisiones vas a reunir en Zenovi."
      currentStep={2}
    >
      <WorkspaceForm />
    </OnboardingFrame>
  );
}
