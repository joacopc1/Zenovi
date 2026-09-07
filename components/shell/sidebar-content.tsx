import Link from "next/link";
import { SidebarNav } from "./sidebar-nav";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <button
        className="grid w-full grid-cols-[34px_1fr_auto] items-center gap-2.5 rounded-control p-1.5 text-left hover:bg-ink/[0.04]"
        aria-label="Cambiar workspace"
      >
        <span className="grid size-[34px] place-items-center rounded-[9px] bg-ink text-sm font-bold text-white">
          Z
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm">Zenovi</strong>
          <small className="block truncate text-[10px] text-muted">Marca personal</small>
        </span>
        <span className="text-xs leading-[0.75] text-muted">
          ⌃
          <br />⌄
        </span>
      </button>

      <SidebarNav onNavigate={onNavigate} />

      <div className="mt-auto text-xs">
        <Link
          href="/onboarding/instagram"
          onClick={onNavigate}
          className="block border-t border-ink/[0.07] px-2.5 py-3 hover:bg-ink/[0.025]"
        >
          <div className="flex justify-between gap-3">
            <span>Instagram</span>
            <span className="font-semibold text-warning">Configurar →</span>
          </div>
        </Link>
        <div className="border-t border-ink/[0.07] px-2.5 py-3">
          <div className="flex justify-between">
            <span>Créditos</span>
            <span className="text-muted">72%</span>
          </div>
          <div className="mt-2 h-0.5 bg-mist-strong">
            <span className="block h-full w-[72%] bg-ink" />
          </div>
        </div>
        <button className="grid w-full grid-cols-[30px_1fr_auto] items-center gap-2 rounded-control p-1.5 text-left hover:bg-ink/[0.04]">
          <span className="grid size-[30px] place-items-center rounded-full bg-mist-strong text-[10px] font-semibold">
            JP
          </span>
          <span>
            <strong className="block text-[11px]">Joaco Piñeyro</strong>
            <small className="text-[9px] text-muted">Propietario</small>
          </span>
          <span>···</span>
        </button>
      </div>
    </>
  );
}
