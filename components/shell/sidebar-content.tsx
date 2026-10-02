"use client";

import { HoverLabel } from "@/components/ui/hover-label";
import { ProfileSwitcher } from "./profile-switcher";
import { SidebarNav } from "./sidebar-nav";
import { useShellIdentity } from "./shell-identity";
import { BoltIcon, CollapseSidebarIcon } from "./icons";

export function SidebarContent({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const identity = useShellIdentity();

  return (
    <>
      <div className={`flex h-8 items-center ${collapsed ? "justify-center" : "justify-between px-1"}`}>
        <strong
          className={`text-[18px] font-semibold tracking-[-0.045em] ${collapsed ? "sr-only" : "block"}`}
        >
          Zenovi
        </strong>
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="group/tip relative grid size-7 place-items-center rounded-control text-ink hover:bg-ink/[0.045]"
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          >
            <CollapseSidebarIcon className={`size-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            <HoverLabel side={collapsed ? "right" : "bottom"}>{collapsed ? "Expandir" : "Colapsar"}</HoverLabel>
          </button>
        ) : null}
      </div>

      <div className="mt-2">
        <ProfileSwitcher identity={identity} collapsed={collapsed} />
      </div>

      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />

      {/* El cartel va afuera del botón: el botón recorta lo que sobresale. */}
      <div className="group/tip relative mt-auto">
      <button
        type="button"
        disabled
        aria-label="Upgrade, próximamente"
        className={`relative flex min-h-10 w-full items-center overflow-hidden rounded-navigation border border-mist-strong text-ink disabled:opacity-100 ${collapsed ? "justify-center px-1" : "justify-between px-2.5"}`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0,transparent_8px,var(--color-mist-strong)_8px,var(--color-mist-strong)_11px)] [mask-image:linear-gradient(to_right,transparent_0%,black_78%)]"
        />
        <span className="relative z-10 flex items-center gap-2">
          <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-ink text-paper">
            <BoltIcon className="size-2.5" />
          </span>
          <span className={collapsed ? "sr-only" : "text-[11px] font-semibold"}>Upgrade</span>
        </span>
        <span className={collapsed ? "sr-only" : "relative z-10 text-[9px] text-graphite"}>Próximamente</span>
      </button>
      {collapsed ? <HoverLabel side="right">Upgrade · Próximamente</HoverLabel> : null}
      </div>
    </>
  );
}
