"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleUser, CreditCard, Database, Link2, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/settings", label: "Cuenta", icon: CircleUser },
  { href: "/settings/billing", label: "Facturación", icon: CreditCard },
  { href: "/settings/integrations", label: "Integraciones", icon: Link2 },
  { href: "/settings/data", label: "Datos", icon: Database },
];

/** Las pestañas de Ajustes, centradas y con una línea bajo la activa (como LeadsRover). */
export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de ajustes" className="-mx-5 overflow-x-auto px-5">
      <ul className="mx-auto flex w-max gap-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-1.5 px-3 pb-2.5 pt-1 text-[15px] ${active ? "font-medium text-ink" : "text-graphite hover:text-ink"}`}
              >
                <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
                {label}
                {active ? <span aria-hidden="true" className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-ink" /> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
