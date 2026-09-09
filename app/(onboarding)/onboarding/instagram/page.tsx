import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OnboardingFrame } from "@/components/onboarding/onboarding-frame";
import { PreflightConfirmation } from "@/components/onboarding/preflight-confirmation";
import { getAccountContext } from "@/lib/data/account-context";
import { isInstagramOAuthConfigured } from "@/lib/meta/config";

export const metadata: Metadata = {
  title: "Conectar Instagram | Zenovi",
};

const oauthErrors: Record<string, string> = {
  workspace_unavailable: "No pudimos verificar tu marca. Intentá nuevamente.",
  attempt_unavailable: "No pudimos iniciar una autorización segura. Intentá nuevamente.",
  connection_unavailable: "No pudimos preparar la conexión de Instagram. Intentá nuevamente.",
  configuration_unavailable: "La conexión de Instagram todavía no está disponible.",
  invalid_callback: "La respuesta de Instagram no fue válida. Iniciá la conexión nuevamente.",
  invalid_or_expired_attempt:
    "La autorización venció o ya fue utilizada. Iniciá la conexión nuevamente.",
  authorization_denied: "No se concedió el acceso. Podés intentarlo nuevamente cuando quieras.",
  token_exchange_failed: "Instagram no pudo completar la autorización. Intentá nuevamente.",
  incompatible_account: "La cuenta elegida debe ser de Creador o Empresa.",
  account_lookup_failed: "No pudimos verificar la cuenta elegida. Intentá nuevamente.",
  account_unavailable: "No pudimos guardar la cuenta elegida. Revisá si ya está conectada.",
};

export default async function InstagramOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; connected?: string | string[] }>;
}) {
  const account = await getAccountContext();
  const query = await searchParams;
  const errorCode = typeof query.error === "string" ? query.error : undefined;
  const connectionCompleted = query.connected === "1";

  if (!account) {
    redirect("/login");
  }

  if (!account.workspace) {
    redirect("/onboarding/workspace");
  }

  return (
    <OnboardingFrame
      title={connectionCompleted ? "Instagram conectado" : "Conectá tu Instagram"}
      description={
        connectionCompleted
          ? "La cuenta quedó lista para empezar a reunir contenido y métricas."
          : "Elegí la cuenta profesional que querés analizar."
      }
      currentStep={2}
    >
      {connectionCompleted ? (
        <ConnectionComplete />
      ) : (
        <>
          <section className="border-y border-mist py-4">
            <h2 className="text-sm font-semibold text-ink">Antes de continuar</h2>
            <ul className="mt-3 space-y-3">
              <Requirement title="Cuenta profesional">
                Debe ser de Creador o Empresa; las cuentas personales no son compatibles.
              </Requirement>
              <Requirement title="Acceso para administrarla">
                Meta te pedirá elegir una cuenta sobre la que tengas control.
              </Requirement>
            </ul>
          </section>

          <details className="border-b border-mist py-4 text-sm">
            <summary className="cursor-pointer font-medium text-ink">
              Qué acceso solicita Zenovi
            </summary>
            <div className="mt-3 space-y-3 text-xs leading-5 text-graphite">
              <p>
                Lee el perfil, el contenido disponible y las métricas oficiales necesarias para el
                análisis.
              </p>
              <p>
                No accede a tu contraseña, no publica contenido y no lee mensajes directos.
              </p>
            </div>
          </details>

          <PreflightConfirmation
            oauthAvailable={isInstagramOAuthConfigured()}
            errorMessage={
              errorCode
                ? oauthErrors[errorCode] ?? "No pudimos iniciar la conexión."
                : undefined
            }
          />

          <Link
            href="/"
            className="mt-4 block text-center text-xs font-medium text-muted hover:text-ink"
          >
            Hacerlo más tarde
          </Link>
        </>
      )}
    </OnboardingFrame>
  );
}

function Requirement({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[16px_1fr] gap-2.5">
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="mt-0.5 size-4 text-ink"
        fill="none"
      >
        <path
          d="m3.25 8 3 3 6.5-6.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div>
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-graphite">{children}</p>
      </div>
    </li>
  );
}

function ConnectionComplete() {
  return (
    <div className="border-y border-mist py-5 text-center">
      <p className="text-sm text-graphite">
        La primera sincronización puede tardar unos minutos.
      </p>
      <Link
        href="/"
        className="mt-5 grid h-12 w-full place-items-center rounded-[12px] bg-ink px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
