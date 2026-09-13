"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { BrandIcon, CalendarIcon, ChartIcon, ContentIcon, DirectorIcon, HomeIcon, SettingsIcon, VaultIcon } from "./icons";

type NavChild = { href: string; label: string; type: "reel" | "publication" | "story" };
type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  exact?: boolean;
  children?: NavChild[];
};
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Observar", items: [
    { href: "/analytics", label: "Analíticas", icon: ChartIcon },
    {
      href: "/content",
      label: "Contenido",
      icon: ContentIcon,
      children: [
        { href: "/content", label: "Reels", type: "reel" },
        { href: "/content?type=publication", label: "Posts", type: "publication" },
        { href: "/content?type=story", label: "Historias", type: "story" },
      ],
    },
  ]},
  { label: "Decidir", items: [{ href: "/director", label: "Director", icon: DirectorIcon }] },
  { label: "Crear", items: [
    { href: "/vault", label: "Baúl", icon: VaultIcon },
    { href: "/calendar", label: "Calendario", icon: CalendarIcon },
  ]},
  { label: "Setup", items: [
    { href: "/brand", label: "ADN de marca", icon: BrandIcon },
    { href: "/settings", label: "Ajustes", icon: SettingsIcon },
  ]},
];

const homeItem: NavItem = { href: "/", label: "Inicio", icon: HomeIcon, exact: true };

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [contentOpen, setContentOpen] = useState(pathname.startsWith("/content"));
  const active = (item: NavItem) => item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const selectedContentType = parseContentType(searchParams.get("type"));
  const Home = homeItem.icon;

  return (
    <nav aria-label="Navegación principal" className="mt-4">
      <Link href={homeItem.href} title={collapsed ? homeItem.label : undefined} onClick={onNavigate} aria-current={active(homeItem) ? "page" : undefined} className={`flex min-h-9 items-center rounded-navigation text-sm leading-5 font-normal text-ink transition-colors ${collapsed ? "justify-center px-1" : "gap-2.5 px-2.5"} ${active(homeItem) ? "bg-ink/[0.065]" : "hover:bg-ink/[0.035]"}`}>
        <Home className="size-[17px] shrink-0" />
        <span className={collapsed ? "sr-only" : "block"}>{homeItem.label}</span>
      </Link>

      <div className="mt-3 space-y-3">
        {groups.map((group) => (
          <section key={group.label}>
            <p className={collapsed ? "sr-only" : "mb-0.5 px-2.5 text-xs leading-4 font-medium tracking-[0.04em] text-muted"}>{group.label}</p>
            <div className="relative space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const selected = active(item);
                const showChildren = Boolean(item.children && contentOpen);

                if (item.children && !collapsed) {
                  return (
                    <div key={item.href}>
                      <button
                        type="button"
                        onClick={() => setContentOpen((current) => !current)}
                        aria-expanded={showChildren}
                        className="flex min-h-9 w-full items-center gap-2.5 rounded-navigation px-2.5 text-sm leading-5 font-normal text-ink transition-colors hover:bg-ink/[0.035]"
                      >
                        <Icon className="size-[17px] shrink-0" />
                        <span className="block flex-1 text-left">{item.label}</span>
                        <ChevronIcon className={`size-3.5 text-muted transition-transform ${showChildren ? "rotate-180" : ""}`} />
                      </button>
                      {showChildren ? (
                        <div className="ml-[18px] mt-0.5 space-y-0.5 border-l border-mist pl-[17px]">
                          {item.children.map((child) => {
                            const childSelected = selected && selectedContentType === child.type;
                            return (
                              <Link
                                key={child.type}
                                href={child.href}
                                onClick={onNavigate}
                                aria-current={childSelected ? "page" : undefined}
                                className={`flex min-h-8 items-center rounded-control px-2.5 text-[13px] font-normal transition-colors ${childSelected ? "bg-ink/[0.065] text-ink" : "text-ink hover:bg-ink/[0.035]"}`}
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined} onClick={() => { if (item.children) setContentOpen(true); onNavigate?.(); }} aria-current={selected ? "page" : undefined} className={`flex min-h-9 items-center rounded-navigation text-sm leading-5 font-normal text-ink transition-colors ${collapsed ? "justify-center px-1" : "gap-2.5 px-2.5"} ${selected ? "bg-ink/[0.065]" : "hover:bg-ink/[0.035]"}`}>
                    <Icon className="size-[17px] shrink-0" />
                    <span className={collapsed ? "sr-only" : "block"}>{item.label}</span>
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

function parseContentType(value: string | null): NavChild["type"] {
  return value === "publication" || value === "story" ? value : "reel";
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true">
      <path d="m4.5 6 3.5 3.5L11.5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
