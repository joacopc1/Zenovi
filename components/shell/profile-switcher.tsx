"use client";

import Image from "next/image";
import { CheckIcon, PlusIcon, SwitcherIcon } from "./icons";
import type { ShellIdentity } from "./shell-identity";
import { useDismissibleDetails } from "./use-dismissible-details";

export function ProfileSwitcher({
   identity,
  collapsed = false,
}: {
  identity: ShellIdentity;
  collapsed?: boolean;
}) {
  const detailsRef = useDismissibleDetails();
  // Sin Instagram no hay perfil activo: mostrar el nombre de la persona hacía creer que
  // había una cuenta conectada. Se dice que falta, con el punto rojo de estado.
  const connected = Boolean(identity.instagram?.username);
  const profileName = connected ? `@${identity.instagram?.username}` : "Instagram sin conectar";
  const avatarUrl = identity.instagram?.profilePictureUrl ?? null;
  const profileInitials = getProfileInitials(identity);

  return (
    <details ref={detailsRef} className="group relative">
      <summary
        aria-label={`Cambiar perfil de Instagram. Perfil actual: ${profileName}`}
        className={`min-h-9 w-full cursor-pointer list-none items-center rounded-control border border-mist bg-transparent text-left hover:border-mist-strong [&::-webkit-details-marker]:hidden ${collapsed ? "flex justify-center p-1" : "grid grid-cols-[24px_1fr_14px] gap-2 px-2 py-1.5"}`}
      >
        {connected ? <ProfileAvatar initials={profileInitials} avatarUrl={avatarUrl} /> : <DisconnectedAvatar />}
        <span className={collapsed ? "sr-only" : "min-w-0"}>
          <strong className="block truncate text-xs font-medium">{profileName}</strong>
        </span>
        <SwitcherIcon className={collapsed ? "hidden" : "size-3 text-graphite"} />
      </summary>

      <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-card border border-mist bg-paper p-2 shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        <div className="grid grid-cols-[28px_1fr_16px] items-center gap-2 rounded-control px-2 py-1.5">
          {connected ? <ProfileAvatar initials={profileInitials} avatarUrl={avatarUrl} /> : <DisconnectedAvatar />}
          <span className="min-w-0">
            <strong className="block truncate text-xs font-medium">{profileName}</strong>
            <small className="block truncate text-[10px] text-muted">
              {connected ? "Perfil activo" : "Conectalo desde el inicio"}
            </small>
          </span>
          {connected ? <CheckIcon className="size-3.5 text-ink" /> : <span />}
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

function getProfileInitials(identity: ShellIdentity) {
  const username = identity.instagram?.username?.trim();
  return username?.slice(0, 2).toLocaleUpperCase("es") || identity.initials;
}

/** Un círculo vacío con el punto rojo de estado: todavía no hay perfil que mostrar. */
function DisconnectedAvatar() {
  return (
    <span className="relative grid size-6 place-items-center rounded-full border border-dashed border-mist-strong">
      <span aria-hidden="true" className="size-2 rounded-full bg-danger" />
    </span>
  );
}

function ProfileAvatar({ initials, avatarUrl }: { initials: string; avatarUrl: string | null }) {
  return (
    <span className="relative grid size-6 place-items-center overflow-hidden rounded-full bg-mist-strong text-[9px] font-semibold text-ink">
      {initials}
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt=""
          fill
          sizes="24px"
          className="object-cover"
          unoptimized
        />
      ) : null}
    </span>
  );
}
