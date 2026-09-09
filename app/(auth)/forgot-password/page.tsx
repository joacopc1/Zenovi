import { AuthFrame } from "@/components/auth/auth-frame";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthFrame
      title="Recuperá tu acceso"
      description="Ingresá tu correo y te enviaremos el siguiente paso si corresponde."
    >
      <ForgotPasswordForm />
    </AuthFrame>
  );
}
