import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { getInstagramOAuthConfig } from "@/lib/meta/config";
import { readDeletionCode } from "@/lib/meta/signed-request";

export const metadata: Metadata = {
  title: "Estado del borrado de datos · Zenovi",
  robots: { index: false },
};

const dateFormatter = new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" });

/**
 * Página pública a la que Meta manda a quien pidió borrar sus datos.
 *
 * No necesita sesión ni base de datos: el código trae la fecha del pedido firmada, así
 * que sólo muestra un estado si el código es auténtico. El borrado es inmediato, por eso
 * un código válido siempre significa "completado".
 */
export default async function DataDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const { code } = await searchParams;
  const requestedAt =
    typeof code === "string" ? readDeletionCode(code, getInstagramOAuthConfig().appSecret) : null;

  return (
    <main className="min-h-dvh bg-paper px-5 py-12 text-ink">
      <section className="mx-auto w-full max-w-[440px]">
        <div className="mx-auto flex w-fit items-center gap-2.5">
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-[-0.025em]">Zenovi</span>
        </div>

        {requestedAt ? (
          <div className="mt-10 rounded-card border border-mist p-6">
            <p className="font-support text-xs font-medium text-success">Completado</p>
            <h1 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Tus datos de Instagram fueron borrados</h1>
            <p className="font-support mt-3 text-sm leading-6 text-graphite">
              Recibimos el pedido el {dateFormatter.format(requestedAt)} (UTC) y borramos todo lo que
              Zenovi guardaba de tu cuenta de Instagram: el perfil, tu contenido, sus métricas y el
              acceso a la cuenta.
            </p>
            <p className="font-support mt-4 border-t border-mist pt-4 text-xs leading-5 text-muted">
              Código de confirmación: <span className="break-all font-mono text-graphite">{code}</span>
            </p>
            <p className="font-support mt-3 text-xs leading-5 text-muted">
              Más detalles en nuestra{" "}
              <Link href="/privacy#eliminacion" className="text-graphite underline">política de privacidad</Link>.
            </p>
          </div>
        ) : (
          <div className="mt-10 rounded-card border border-mist p-6">
            <h1 className="text-xl font-semibold tracking-[-0.02em]">No encontramos ese pedido</h1>
            <p className="font-support mt-3 text-sm leading-6 text-graphite">
              El código de confirmación no es válido o está incompleto. Revisá que el enlace esté
              entero, tal como te lo mostró Instagram.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
