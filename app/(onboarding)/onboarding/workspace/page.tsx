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
      title="Nombrá tu marca"
      description="Así la vas a identificar dentro de Zenovi."
      currentStep={1}
    >
      <WorkspaceForm />
    </OnboardingFrame>
  );
}
