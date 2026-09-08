import { redirect } from "next/navigation";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?error=auth_callback");
  }

  return (
    <OnboardingFrame
      eyebrow="Nueva credencial"
      title="Elegí una contraseña nueva."
      description="Usá una contraseña larga y distinta de las que empleás en otros servicios."
      currentStep={1}
    >
      <UpdatePasswordForm />
    </OnboardingFrame>
  );
}
