"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "./actions";
import { BellIcon, DirectorIcon, SettingsIcon } from "./icons";
import { useShellIdentity } from "./shell-identity";
import { useDismissibleDetails } from "./use-dismissible-details";

export function HeaderActions() {
  return (
    <div className="ml-auto flex items-center gap-1.5">
      <button
        type="button"
        title="Director IA, próximamente"
        className="flex min-h-8 items-center gap-1.5 rounded-control border border-mist bg-paper px-2.5 text-[11px] font-medium text-ink hover:bg-canvas"
      >
        <DirectorIcon className="size-4" />
        <span className="hidden sm:inline">Director IA</span>
      </button>
      <NotificationMenu />
      <AccountMenu />
    </div>
  );
}

function NotificationMenu() {
  const detailsRef = useDismissibleDetails();

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="grid size-8 cursor-pointer list-none place-items-center rounded-control border border-mist bg-paper text-graphite hover:bg-canvas hover:text-ink [&::-webkit-details-marker]:hidden">
        <BellIcon className="size-4" />
        <span className="sr-only">Abrir notificaciones</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-card border border-mist bg-paper p-4 shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        <p className="text-xs font-semibold">Notificaciones</p>
        <p className="mt-3 text-[11px] leading-5 text-graphite">
          Todo al día. Las sincronizaciones y recomendaciones importantes aparecerán acá.
        </p>
      </div>
    </details>
  );
}

function AccountMenu() {
  const identity = useShellIdentity();
  const detailsRef = useDismissibleDetails();
  const username = identity.instagram?.username
    ? `@${identity.instagram.username}`
    : identity.displayName;
  const avatarUrl = identity.accountAvatarUrl;

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="grid size-9 cursor-pointer list-none place-items-center rounded-full hover:bg-canvas [&::-webkit-details-marker]:hidden">
        <UsageAvatar
          avatarUrl={avatarUrl}
          initials={identity.initials}
          label={`Abrir cuenta de ${username}`}
        />
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-card border border-mist bg-paper p-2 shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <UsageAvatar avatarUrl={avatarUrl} initials={identity.initials} />
          <span className="min-w-0">
            <strong className="block truncate text-xs font-semibold">{identity.displayName}</strong>
            <small className="block truncate text-[10px] text-muted">{username}</small>
          </span>
        </div>

        <div className="mx-2 my-1 border-t border-mist" />

        <div className="px-2 py-2">
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="font-medium text-graphite">Uso de IA</span>
            <span className="text-right text-muted">Sin consumo registrado</span>
          </div>
          <div className="mt-2 h-0.5 bg-control" />
        </div>

        <Link
          href="/settings"
          className="mt-1 flex min-h-9 items-center gap-2 rounded-control px-2 text-xs hover:bg-canvas"
        >
          <SettingsIcon className="size-4" />
          Ajustes
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-9 w-full rounded-control px-2 text-left text-xs text-graphite hover:bg-canvas hover:text-ink"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </details>
  );
}

function UsageAvatar({
  avatarUrl,
  initials,
  label,
}: {
  avatarUrl: string | null;
  initials: string;
  label?: string;
}) {
  return (
    <span
      className="relative grid size-8 place-items-center rounded-full border border-mist-strong bg-paper p-0.5"
      aria-label={label}
    >
      <span className="relative grid size-full place-items-center overflow-hidden rounded-full bg-control text-[9px] font-semibold">
        {initials}
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill sizes="28px" className="object-cover" unoptimized />
        ) : null}
      </span>
    </span>
  );
}
