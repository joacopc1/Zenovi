import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <OnboardingFrame
      eyebrow="Tu espacio de trabajo"
      title="Creá una base clara para decidir."
      description="Empezá con tu cuenta. Después conectamos tus marcas y sus datos oficiales."
      currentStep={1}
    >
      <RegisterForm />
    </OnboardingFrame>
  );
}
