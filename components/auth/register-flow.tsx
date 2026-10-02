"use client";

import { useState } from "react";
import { AuthFrame } from "./auth-frame";
import { EmailCodeForm } from "./email-code-form";
import { RegisterForm } from "./register-form";

/**
 * Crear la cuenta y confirmar el correo. En el paso del código ya no hay nada que elegir:
 * se van las pestañas de iniciar sesión y crear cuenta, y el título dice qué hacer ahora.
 */
export function RegisterFlow({ googleEnabled }: { googleEnabled: boolean }) {
  const [confirmationEmail, setConfirmationEmail] = useState("");

  if (confirmationEmail) {
    return (
      <AuthFrame title="Revisá tu correo">
        <EmailCodeForm email={confirmationEmail} onBack={() => setConfirmationEmail("")} />
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Creá tu cuenta" description="Completá tus datos para empezar." activeTab="register">
      <RegisterForm googleEnabled={googleEnabled} onConfirmationSent={setConfirmationEmail} />
    </AuthFrame>
  );
}
