import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <OnboardingFrame
      eyebrow="Recuperación segura"
      title="Volvé a entrar sin perder el hilo."
      description="Ingresá tu correo y te enviaremos el siguiente paso si corresponde."
      currentStep={1}
    >
      <ForgotPasswordForm />
    </OnboardingFrame>
  );
}
