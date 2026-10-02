import { cookies } from "next/headers";
import { LoginForm } from "@/components/auth/login-form";
import {
  AuthFrame,
  InstagramAccountContext,
} from "@/components/auth/auth-frame";
import { LAST_ACCOUNT_COOKIE, readLastAccount } from "@/lib/auth/last-account";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const lastAccount = readLastAccount((await cookies()).get(LAST_ACCOUNT_COOKIE)?.value);

  return (
    <AuthFrame
      title="Bienvenido de nuevo"
      description={lastAccount ? "Iniciá sesión para continuar con" : "Iniciá sesión en tu cuenta."}
      activeTab="login"
      accountContext={lastAccount ? <InstagramAccountContext username={lastAccount} /> : undefined}
    >
      <LoginForm
        initialError={error === "auth_callback"}
        googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"}
      />
    </AuthFrame>
  );
}
