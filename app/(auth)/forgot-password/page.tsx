import { AuthPage } from "@/components/auth/auth-page";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthPage
      eyebrow="Recuperación segura"
      title="Volvé a entrar sin perder el hilo."
      description="Ingresá tu correo y te enviaremos el siguiente paso si corresponde."
    >
      <ForgotPasswordForm />
    </AuthPage>
  );
}
