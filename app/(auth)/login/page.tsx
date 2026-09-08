import { LoginForm } from "@/components/auth/login-form";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <OnboardingFrame
      eyebrow="Tu dirección de contenido"
      title="Volvé a tus marcas y decisiones."
      description="Entrá para reunir rendimiento, audiencia y recomendaciones en un solo lugar."
      currentStep={1}
    >
      <LoginForm
        initialError={error === "auth_callback"}
        googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"}
      />
    </OnboardingFrame>
  );
}
