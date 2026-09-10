"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { BrandIcon, CalendarIcon, ChartIcon, ContentIcon, DirectorIcon, HomeIcon, VaultIcon } from "./icons";

type NavItem = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Observar", items: [
    { href: "/analytics", label: "Analíticas", icon: ChartIcon },
    { href: "/content", label: "Contenido", icon: ContentIcon },
  ]},
  { label: "Decidir", items: [{ href: "/director", label: "Director", icon: DirectorIcon }] },
  { label: "Crear", items: [
    { href: "/vault", label: "Baúl", icon: VaultIcon },
    { href: "/calendar", label: "Calendario", icon: CalendarIcon },
    { href: "/brand", label: "ADN de marca", icon: BrandIcon },
  ]},
];

const homeItem: NavItem = { href: "/", label: "Inicio", icon: HomeIcon, exact: true };

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (item: NavItem) => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Home = homeItem.icon;

  return (
    <nav aria-label="Navegación principal" className="mt-7">
      <Link href={homeItem.href} onClick={onNavigate} aria-current={active(homeItem) ? "page" : undefined} className={`flex min-h-9 items-center gap-2.5 rounded-navigation px-2.5 text-sm leading-5 font-normal text-ink transition-colors ${active(homeItem) ? "bg-ink/[0.065]" : "hover:bg-ink/[0.035]"}`}>
        <Home className="size-[17px] shrink-0" />
        <span>{homeItem.label}</span>
      </Link>

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <section key={group.label}>
            <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{group.label}</p>
            <div className="relative space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const selected = active(item);
                return (
                  <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={selected ? "page" : undefined} className={`flex min-h-9 items-center gap-2.5 rounded-navigation px-2.5 text-sm leading-5 font-normal text-ink transition-colors ${selected ? "bg-ink/[0.065]" : "hover:bg-ink/[0.035]"}`}>
                    <Icon className="size-[17px] shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}
