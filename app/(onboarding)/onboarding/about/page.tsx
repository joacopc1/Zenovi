import { redirect } from "next/navigation";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { getAccountContext } from "@/lib/data/account-context";
import { AboutForm } from "./about-form";

export default async function AboutOnboardingPage() {
  const account = await getAccountContext();
  if (!account) redirect("/login");
  if (!account.workspace) redirect("/onboarding/workspace");

  return (
    <OnboardingFrame
      title="Contanos de vos"
      description="Dos preguntas rápidas para conocer a quién le hablamos."
      step="about"
    >
      <AboutForm />
    </OnboardingFrame>
  );
}
