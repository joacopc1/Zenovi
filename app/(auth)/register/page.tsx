import { RegisterFlow } from "@/components/auth/register-flow";

export default function RegisterPage() {
  return <RegisterFlow googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"} />;
}
