"use client";

import Image from "next/image";
import { CheckIcon, PlusIcon, SwitcherIcon } from "./icons";
import type { ShellIdentity } from "./shell-identity";

export function ProfileSwitcher({ identity }: { identity: ShellIdentity }) {
  const username = identity.instagram?.username
    ? `@${identity.instagram.username}`
    : "Marca personal";
  const avatarUrl = identity.instagram?.profilePictureUrl ?? null;

  return (
    <details className="group relative">
      <summary className="grid min-h-12 w-full cursor-pointer list-none grid-cols-[34px_1fr_18px] items-center gap-2.5 rounded-navigation p-1.5 text-left hover:bg-ink/[0.04] [&::-webkit-details-marker]:hidden">
        <ProfileAvatar initials={identity.initials} avatarUrl={avatarUrl} />
        <span className="min-w-0">
          <strong className="block truncate text-sm font-semibold">{identity.displayName}</strong>
          <small className="block truncate text-[10px] text-muted">{username}</small>
        </span>
        <SwitcherIcon className="size-4 text-graphite" />
      </summary>

      <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-card border border-mist bg-paper p-2 shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        <div className="grid grid-cols-[34px_1fr_18px] items-center gap-2.5 rounded-control px-2 py-2">
          <ProfileAvatar initials={identity.initials} avatarUrl={avatarUrl} />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-semibold">{identity.displayName}</strong>
            <small className="block truncate text-[11px] text-muted">{username}</small>
          </span>
          <CheckIcon className="size-4 text-ink" />
        </div>

        <div className="my-1 border-t border-mist" />

        <div aria-disabled="true" className="grid grid-cols-[34px_1fr] items-center gap-2.5 rounded-control px-2 py-2 text-left">
          <span className="grid size-[34px] place-items-center rounded-full border border-mist text-graphite">
            <PlusIcon className="size-4" />
          </span>
          <span>
            <span className="block text-sm text-ink">Añadir perfil</span>
            <small className="block text-[11px] text-muted">Próximamente</small>
          </span>
        </div>
      </div>
    </details>
  );
}

function ProfileAvatar({ initials, avatarUrl }: { initials: string; avatarUrl: string | null }) {
  return (
    <span className="relative grid size-[34px] place-items-center overflow-hidden rounded-full bg-mist-strong text-xs font-semibold text-ink">
      {initials}
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          sizes="34px"
          className="object-cover"
          unoptimized
        />
      ) : null}
    </span>
  );
}
