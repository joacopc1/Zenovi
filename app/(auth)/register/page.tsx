import { AuthPage } from "@/components/auth/auth-page";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthPage
      eyebrow="Tu espacio de trabajo"
      title="Creá una base clara para decidir."
      description="Empezá con tu cuenta. Después conectamos tus marcas y sus datos oficiales."
    >
      <RegisterForm />
    </AuthPage>
  );
}
