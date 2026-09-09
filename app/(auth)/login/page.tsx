import { LoginForm } from "@/components/auth/login-form";
import {
  AuthFrame,
  InstagramAccountContext,
} from "@/components/auth/auth-frame";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <AuthFrame
      title="Bienvenido de nuevo"
      description="Iniciá sesión para continuar con"
      activeTab="login"
      accountContext={<InstagramAccountContext username="usuario" />}
    >
      <LoginForm
        initialError={error === "auth_callback"}
        googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"}
      />
    </AuthFrame>
  );
}
