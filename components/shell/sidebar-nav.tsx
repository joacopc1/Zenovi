"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { BrandIcon, CalendarIcon, ChartIcon, ContentIcon, DirectorIcon, HomeIcon, VaultIcon } from "./icons";

type NavItem = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Observar", items: [
    { href: "/", label: "Inicio", icon: HomeIcon, exact: true },
    { href: "/analytics", label: "Analíticas", icon: ChartIcon },
    { href: "/content", label: "Contenido", icon: ContentIcon },
  ]},
  { label: "Decidir", items: [{ href: "/director", label: "Director", icon: DirectorIcon }] },
  { label: "Crear", items: [
    { href: "/vault", label: "Baúl", icon: VaultIcon },
    { href: "/calendar", label: "Calendario", icon: CalendarIcon },
  ]},
];

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (item: NavItem) => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav aria-label="Navegación principal" className="mt-7 space-y-5">
      {groups.map((group) => (
        <section key={group.label}>
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{group.label}</p>
          <div className="relative space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const selected = active(item);
              return (
                <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={selected ? "page" : undefined} className={`relative flex min-h-9 items-center gap-2.5 rounded-control px-2.5 text-[13px] transition-colors ${selected ? "bg-ink/[0.065] font-semibold text-ink" : "text-graphite hover:bg-ink/[0.035] hover:text-ink"}`}>
                  {selected ? <span className="absolute -left-[17px] size-[7px] rounded-full bg-ink ring-2 ring-canvas" /> : null}
                  <Icon className="size-[17px] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
      <Link href="/brand" onClick={onNavigate} className="flex min-h-9 items-center gap-2.5 rounded-control px-2.5 text-[13px] text-graphite transition-colors hover:bg-ink/[0.035] hover:text-ink"><BrandIcon className="size-[17px]"/><span>ADN de marca</span></Link>
    </nav>
  );
}
