import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PreflightConfirmation } from "@/components/onboarding/preflight-confirmation";
import { getAccountContext } from "@/lib/data/account-context";

export const metadata: Metadata = {
  title: "Conectar Instagram | Zenovi",
};

const requestedAccess = [
  "Perfil e identificadores de tu cuenta profesional.",
  "Reels, publicaciones y Stories disponibles para la cuenta.",
  "Métricas oficiales de la cuenta y de cada contenido disponible.",
];

const excludedAccess = [
  "Mensajes directos y conversaciones.",
  "Publicar contenido en tu nombre.",
  "Administrar comentarios o acceder a tu contraseña.",
];

export default async function InstagramOnboardingPage() {
  const account = await getAccountContext();

  if (!account) {
    redirect("/login");
  }

  if (!account.workspace) {
    redirect("/onboarding/workspace");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col px-5 md:px-10">
      <header className="flex h-16 items-center justify-between border-b border-ink/[0.07]">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Volver al inicio de Zenovi">
          <span className="grid size-8 place-items-center rounded-[9px] bg-ink text-xs font-bold text-white">
            Z
          </span>
          <strong className="text-sm font-semibold">Zenovi</strong>
        </Link>
        <Link href="/" className="text-xs font-semibold text-graphite hover:text-ink">
          Volver al inicio
        </Link>
      </header>

      <div className="grid flex-1 gap-12 py-10 md:py-16 lg:grid-cols-[1.15fr_.85fr] lg:gap-20">
        <section className="max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Conexión · Paso 1 de 3
          </p>
          <h1 className="mt-3 text-[clamp(2.35rem,5vw,4rem)] font-bold leading-[0.98] tracking-[-0.05em]">
            Prepará tu cuenta antes de conectar.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-6 text-graphite">
            Zenovi utiliza la conexión oficial de Meta. Antes de autorizar, comprobá que Instagram
            pueda compartir los datos que necesitamos para analizar tu contenido.
          </p>

          <div className="mt-10 border-y border-mist">
            <Requirement number="01" title="Tu cuenta es profesional">
              Debe estar configurada como cuenta de Creador o Empresa. Las cuentas personales no
              son compatibles con esta conexión.
            </Requirement>
            <Requirement number="02" title="Tenés acceso para administrarla">
              Durante la autorización, Meta te pedirá elegir una cuenta sobre la que tengas control.
            </Requirement>
            <Requirement number="03" title="El contenido activa tu primer panorama">
              No bloquea la conexión, pero si ya publicaste Reels, publicaciones o Stories, Zenovi
              podrá empezar con evidencia real.
            </Requirement>
          </div>

          <PreflightConfirmation />
        </section>

        <aside className="space-y-5 lg:pt-7">
          <AccessPanel title="Zenovi solicitará acceso a" items={requestedAccess} />
          <AccessPanel title="Zenovi no solicitará" items={excludedAccess} muted />

          <section className="rounded-card border border-mist p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-muted">
              Después de autorizar
            </p>
            <ol className="mt-5 space-y-5">
              <ProcessStep number="1" text="Verificamos que la cuenta sea compatible." />
              <ProcessStep number="2" text="Iniciamos la primera sincronización de contenido y métricas." />
              <ProcessStep number="3" text="Te llevamos a tu panorama con el estado de la sincronización." />
            </ol>
          </section>

          <p className="px-1 text-[11px] leading-5 text-muted">
            Podrás revocar el acceso desde Zenovi o desde la configuración de Meta. Desconectar no
            publica, elimina ni modifica contenido en Instagram.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Requirement({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-mist py-5 last:border-b-0 sm:grid-cols-[36px_1fr]">
      <span className="text-[10px] font-semibold tabular-nums text-muted">{number}</span>
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1.5 text-[13px] leading-5 text-graphite">{children}</p>
      </div>
    </div>
  );
}

function AccessPanel({ title, items, muted = false }: { title: string; items: string[]; muted?: boolean }) {
  return (
    <section className={`rounded-card border p-6 ${muted ? "border-mist bg-canvas/55" : "border-mist-strong"}`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="grid grid-cols-[8px_1fr] gap-3 text-[12px] leading-5 text-graphite">
            <span className={`mt-[7px] size-1.5 rounded-full ${muted ? "bg-muted" : "bg-ink"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProcessStep({ number, text }: { number: string; text: string }) {
  return (
    <li className="grid grid-cols-[24px_1fr] gap-3 text-[12px] leading-5 text-graphite">
      <span className="grid size-6 place-items-center rounded-full border border-mist-strong text-[10px] font-semibold text-ink">
        {number}
      </span>
      <span>{text}</span>
    </li>
  );
}
