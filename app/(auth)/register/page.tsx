import { AuthFrame } from "@/components/auth/auth-frame";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthFrame
      title="Creá tu cuenta"
      description="Completá tus datos para empezar."
      activeTab="register"
    >
      <RegisterForm
        googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"}
      />
    </AuthFrame>
  );
}
