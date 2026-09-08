import { LoginForm } from "@/components/auth/login-form";
import { AuthPage } from "@/components/auth/auth-page";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <AuthPage
      eyebrow="Tu dirección de contenido"
      title="Volvé a tus marcas y decisiones."
      description="Entrá para reunir rendimiento, audiencia y recomendaciones en un solo lugar."
    >
      <LoginForm initialError={error === "auth_callback"} />
    </AuthPage>
  );
}
