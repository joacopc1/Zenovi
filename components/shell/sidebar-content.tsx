"use client";

import { ProfileSwitcher } from "./profile-switcher";
import { SidebarNav } from "./sidebar-nav";
import { useShellIdentity } from "./shell-identity";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const identity = useShellIdentity();

  return (
    <>
      <ProfileSwitcher identity={identity} />

      <SidebarNav onNavigate={onNavigate} />

      <div className="mt-auto text-xs">
        <div className="border-t border-ink/[0.07] px-2.5 py-3">
          <div className="flex justify-between">
            <span>Créditos</span>
            <span className="text-muted">72%</span>
          </div>
          <div className="mt-2 h-0.5 bg-mist-strong">
            <span className="block h-full w-[72%] bg-ink" />
          </div>
        </div>
        <div className="grid w-full grid-cols-[30px_1fr] items-center gap-2 p-1.5 text-left">
          <span className="grid size-[30px] place-items-center rounded-full bg-mist-strong text-[10px] font-semibold">
            {identity.initials}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-[11px]">{identity.displayName}</strong>
            <small className="text-[9px] text-muted">Propietario</small>
          </span>
        </div>
      </div>
    </>
  );
}
