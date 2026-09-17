import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";

export const LEGAL_UPDATED_AT = "16 de septiembre de 2026";

export const LEGAL_CONTACT = {
  email: "scaleupbrandplus@gmail.com",
  phone: "+598 94 108 832",
};

/** Los documentos del panel, en el orden en que aparecen en la columna. */
const LEGAL_DOCUMENTS = [
  { id: "terms", title: "Términos y condiciones", href: "/terms" },
  { id: "privacy", title: "Política de privacidad", href: "/privacy" },
] as const;

export type LegalDocumentId = (typeof LEGAL_DOCUMENTS)[number]["id"];

/**
 * Panel de términos y políticas: una columna con todos los documentos y el texto al lado.
 *
 * Los textos legales se leen salteado —alguien busca cómo borrar sus datos, no lee de
 * corrido—, así que el documento activo despliega su índice en la columna y cada sección
 * tiene su ancla. La columna queda fija al bajar en pantallas anchas y pasa arriba del
 * texto en el celular.
 */
export function LegalDocument({
  documentId,
  title,
  intro,
  sections,
}: {
  documentId: LegalDocumentId;
  title: string;
  intro: ReactNode;
  sections: { id: string; title: string; content: ReactNode }[];
}) {
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="border-b border-mist">
        <div className="mx-auto flex h-16 w-full max-w-[1160px] items-center justify-between px-5 md:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Zenovi">
            <BrandMark />
            <span className="text-[17px] font-semibold tracking-[-0.025em]">Zenovi</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-9 items-center rounded-control bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1160px] gap-10 px-5 py-10 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16 lg:py-16">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <p className="font-support text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Términos y políticas
          </p>

          <nav aria-label="Documentos legales" className="mt-4">
            <ul className="space-y-1">
              {LEGAL_DOCUMENTS.map((document) => {
                const active = document.id === documentId;

                return (
                  <li key={document.id}>
                    <Link
                      href={document.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between rounded-control px-3.5 py-2.5 text-[15px] transition-colors ${
                        active ? "bg-control font-medium text-ink" : "text-graphite hover:bg-control/60 hover:text-ink"
                      }`}
                    >
                      {document.title}
                      {active ? null : <ChevronRight size={15} strokeWidth={1.75} aria-hidden className="text-muted" />}
                    </Link>

                    {active ? (
                      <ol className="font-support mb-2 ml-3.5 mt-2 space-y-1.5 border-l border-mist pl-3.5">
                        {sections.map((section, index) => (
                          <li key={section.id}>
                            <a
                              href={`#${section.id}`}
                              className="block text-[13px] leading-5 text-muted hover:text-ink"
                            >
                              {index + 1}. {section.title}
                            </a>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main>
          <header className="border-b border-mist pb-8">
            <h1 className="text-[clamp(1.875rem,1.35rem+1.6vw,2.625rem)] font-semibold leading-tight tracking-[-0.035em]">
              {title}
            </h1>
            <div className="font-support mt-4 max-w-[68ch] space-y-4 text-[15px] leading-7 text-graphite">{intro}</div>
            <p className="font-support mt-4 text-xs text-muted">Última actualización: {LEGAL_UPDATED_AT}</p>
          </header>

          <div className="max-w-[68ch]">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-8 border-b border-mist py-10 last:border-b-0">
                <h2 className="text-xl font-semibold tracking-[-0.02em]">
                  {index + 1}. {section.title}
                </h2>
                <div className="font-support mt-4 space-y-4 text-[15px] leading-7 text-graphite [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
