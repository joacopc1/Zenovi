import { redirect } from "next/navigation";
import { AuthFrame } from "@/components/auth/auth-frame";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login?error=auth_callback");
  }

  return (
    <AuthFrame
      title="Elegí una contraseña nueva."
      description="Usá una contraseña larga y distinta de las que empleás en otros servicios."
    >
      <UpdatePasswordForm />
    </AuthFrame>
  );
}
