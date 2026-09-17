import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";

export const LEGAL_UPDATED_AT = "16 de septiembre de 2026";

export const LEGAL_CONTACT = {
  email: "scaleupbrandplus@gmail.com",
  phone: "+598 94 108 832",
};

/**
 * Marco común de los textos legales: públicos, legibles y con índice.
 *
 * Son páginas que leen revisores de Meta y usuarios antes de conectar su cuenta, así
 * que priorizan la lectura larga: columna angosta, cuerpo a 15px con interlineado
 * amplio, y cada sección con su ancla para poder enlazarla directo.
 */
export function LegalDocument({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: ReactNode;
  sections: { id: string; title: string; content: ReactNode }[];
}) {
  return (
    <main className="min-h-dvh bg-paper px-5 py-12 text-ink">
      <article className="mx-auto w-full max-w-[720px]">
        <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="Zenovi">
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-[-0.025em]">Zenovi</span>
        </Link>

        <header className="mt-10 border-b border-mist pb-8">
          <h1 className="text-[clamp(1.75rem,1.3rem+1.4vw,2.25rem)] font-semibold leading-tight tracking-[-0.03em]">
            {title}
          </h1>
          <p className="font-support mt-2 text-sm text-muted">Última actualización: {LEGAL_UPDATED_AT}</p>
          <div className="font-support mt-5 space-y-4 text-[15px] leading-7 text-graphite">{intro}</div>
        </header>

        <nav aria-label="Contenido" className="mt-8">
          <ol className="font-support grid gap-1.5 text-sm sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-graphite hover:text-ink">
                  {index + 1}. {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-10">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <h2 className="text-lg font-semibold tracking-[-0.01em]">
                {index + 1}. {section.title}
              </h2>
              <div className="font-support mt-3 space-y-4 text-[15px] leading-7 text-graphite [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
