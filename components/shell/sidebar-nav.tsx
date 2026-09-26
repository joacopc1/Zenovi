"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ChartNoAxesCombined,
  ChevronRight,
  Clapperboard,
  Kanban,
  Fingerprint,
  House,
  MessageSquareText,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavChild = { href: string; label: string; type: "reel" | "publication" | "story" };
type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  children?: NavChild[];
};
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  { label: "Decidir", items: [
    { href: "/director", label: "Director", icon: MessageSquareText },
    { href: "/production", label: "Producción", icon: Kanban },
  ]},
  { label: "Observar", items: [
    { href: "/analytics", label: "Analíticas", icon: ChartNoAxesCombined },
    {
      href: "/content",
      label: "Contenido",
      icon: Clapperboard,
      children: [
        { href: "/content", label: "Reels", type: "reel" },
        { href: "/content?type=publication", label: "Posts", type: "publication" },
        { href: "/content?type=story", label: "Historias", type: "story" },
      ],
    },
  ]},
  { label: "Setup", items: [
    { href: "/brand", label: "ADN de marca", icon: Fingerprint },
    { href: "/settings", label: "Ajustes", icon: Settings },
  ]},
];

const homeItem: NavItem = { href: "/", label: "Inicio", icon: House, exact: true };

const expandedItemClass =
  "font-support flex min-h-8 items-center gap-2.5 rounded-navigation px-2.5 text-[13px] leading-5 font-normal text-ink transition-colors hover:bg-ink/[0.035]";
const collapsedItemClass =
  "flex min-h-8 items-center justify-center rounded-navigation px-1 text-ink transition-colors hover:bg-ink/[0.035]";

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
  const active = (item: NavItem) => item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const selectedContentType = parseContentType(searchParams.get("type"));

  return (
    <nav aria-label="Navegación principal" className="mt-3">
      <NavigationLink
        item={homeItem}
        collapsed={collapsed}
        selected={active(homeItem)}
        onNavigate={onNavigate}
      />

      <div className="mt-2.5 space-y-2.5">
        {groups.map((group) => (
          <section key={group.label}>
            <p
              className={collapsed
                ? "sr-only"
                : "font-support mb-0.5 px-2.5 text-xs leading-4 font-normal tracking-[0.025em] text-muted"}
            >
              {group.label}
            </p>
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
                        aria-controls="content-navigation-children"
                        className={`${expandedItemClass} w-full`}
                      >
                        <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                        <span className="block flex-1 text-left">{item.label}</span>
                        <ChevronRight
                          aria-hidden="true"
                          className={`size-3.5 text-muted transition-transform duration-200 motion-reduce:transition-none ${showChildren ? "rotate-90" : ""}`}
                          strokeWidth={1.5}
                        />
                      </button>
                      <div
                        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none ${showChildren ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                        aria-hidden={!showChildren}
                        inert={!showChildren}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <div id="content-navigation-children" className="ml-[18px] mt-0.5 space-y-0.5 border-l border-mist pl-[13px]">
                            {item.children.map((child) => {
                              const childSelected = selected && selectedContentType === child.type;
                              return (
                                <Link
                                  key={child.type}
                                  href={child.href}
                                  onClick={onNavigate}
                                  aria-current={childSelected ? "page" : undefined}
                                  className={`font-support flex min-h-7 items-center rounded-control px-2.5 text-[13px] leading-5 font-normal transition-colors ${childSelected ? "bg-ink/[0.065] text-ink" : "text-ink hover:bg-ink/[0.035]"}`}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <NavigationLink
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    selected={selected}
                    onNavigate={() => {
                      if (item.children) setContentOpen(true);
                      onNavigate?.();
                    }}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}

function NavigationLink({
  item,
  collapsed,
  selected,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  selected: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      aria-current={selected ? "page" : undefined}
      className={`${collapsed ? collapsedItemClass : expandedItemClass} ${selected ? "bg-ink/[0.065] hover:bg-ink/[0.065]" : ""}`}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
      <span className={collapsed ? "sr-only" : "block"}>{item.label}</span>
    </Link>
  );
}

function parseContentType(value: string | null): NavChild["type"] {
  return value === "publication" || value === "story" ? value : "reel";
}
