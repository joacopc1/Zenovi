import { MobileNavigation } from "./mobile-navigation";

export function AppHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-ink/[0.07] px-5 md:px-7">
      <div className="flex items-center gap-2">
        <MobileNavigation />
        <strong className="text-sm font-semibold">{title}</strong>
      </div>
      <div className="flex items-center gap-3"><span className="hidden text-[11px] text-muted sm:inline">Datos ilustrativos</span><button className="min-h-8 rounded-control bg-ink px-3.5 text-[11px] font-semibold text-white hover:bg-ink/85">Preguntar al Director</button></div>
    </header>
  );
}
