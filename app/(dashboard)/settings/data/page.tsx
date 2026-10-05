import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight } from "lucide-react";
import { LEGAL_CONTACT } from "@/components/legal/legal-document";
import { DisconnectInstagram } from "@/components/settings/disconnect-instagram";
import { SettingsCard } from "@/components/settings/settings-card";
import { getAccountContext } from "@/lib/data/account-context";

export const metadata = { title: "Datos · Ajustes" };

const STORED: { title: string; detail: string }[] = [
  { title: "Tu cuenta", detail: "tu nombre, tu mail y tu foto de perfil, para que puedas entrar y te reconozcamos." },
  { title: "Tu marca", detail: "el nombre y el ADN que completás, para que el Director te conozca." },
  { title: "Instagram", detail: "tu perfil, tus publicaciones e Historias y sus métricas, para mostrarte cómo te va." },
  { title: "Producción", detail: "tus ideas, guiones y lo que planificás." },
  { title: "Director", detail: "tus chats y los análisis que pediste, para que puedas volver a verlos." },
];

export default async function DataSettingsPage() {
  const account = await getAccountContext();
  const username = account?.instagram?.username ? `@${account.instagram.username}` : null;

  return (
    <>
      <SettingsCard title="Tus datos" description="Esto es lo que Zenovi guarda de tu cuenta, y para qué.">
        <ul className="font-support space-y-2 text-[13px] leading-6 text-graphite">
          {STORED.map(({ title, detail }) => (
            <li key={title} className="flex gap-2.5">
              <span aria-hidden="true" className="mt-[11px] size-1 shrink-0 rounded-full bg-graphite" />
              <span>
                <span className="font-medium text-ink">{title}:</span> {detail}
              </span>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard title="Privacidad" description="Tus datos nunca se venden ni se usan para publicidad.">
        <div className="flex flex-wrap gap-2">
          <Link href="/privacy" className="inline-flex min-h-9 items-center gap-1 rounded-control border border-mist px-3 text-[13px] font-medium text-ink hover:bg-canvas">
            Política de privacidad
            <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
          </Link>
          <a href={`mailto:${LEGAL_CONTACT.email}`} className="inline-flex min-h-9 items-center rounded-control border border-mist px-3 text-[13px] font-medium text-ink hover:bg-canvas">
            Escribinos
          </a>
        </div>
      </SettingsCard>

      <div id="desconectar">
        <Suspense>
          <DisconnectInstagram username={username} />
        </Suspense>
      </div>
    </>
  );
}
