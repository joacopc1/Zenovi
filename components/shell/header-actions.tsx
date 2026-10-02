"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "./actions";
import { Bot } from "lucide-react";
import { BellIcon, SettingsIcon } from "./icons";
import { useShellIdentity } from "./shell-identity";
import { useDismissibleDetails } from "./use-dismissible-details";

export function HeaderActions() {
  return (
    <div className="ml-auto flex items-center gap-1.5">
      <Link
        href="/director"
        aria-label="Director IA"
        className="flex min-h-8 items-center gap-1.5 rounded-control border border-mist bg-paper px-2.5 text-[11px] font-medium text-ink hover:bg-canvas"
      >
        <Bot aria-hidden="true" className="size-4" strokeWidth={1.75} />
        <span className="hidden sm:inline">Director IA</span>
      </Link>
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
      <summary className="peer grid size-9 cursor-pointer list-none place-items-center rounded-full [&::-webkit-details-marker]:hidden">
        <UsageAvatar
          avatarUrl={avatarUrl}
          initials={identity.initials}
          usedShare={identity.credits.usedShare}
          label={`Abrir cuenta de ${username}. Usaste ${formatShare(identity.credits.usedShare)} de tus créditos del mes`}
        />
      </summary>
      {/* Al pasar el mouse, cuánto se usó; con el menú abierto ya se ve el detalle. */}
      <span className="pointer-events-none absolute right-0 top-full z-40 mt-2 whitespace-nowrap rounded-lg bg-paper/90 px-2.5 py-1.5 text-[11px] text-ink opacity-0 ring ring-ink/10 backdrop-blur-lg transition-opacity duration-75 group-open:hidden peer-hover:opacity-100">
        Usaste <strong className="font-semibold">{formatShare(identity.credits.usedShare)}</strong> de tus créditos
      </span>
      <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-card border border-mist bg-paper p-2 shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <UsageAvatar avatarUrl={avatarUrl} initials={identity.initials} />
          <span className="min-w-0">
            <strong className="block truncate text-xs font-semibold">{identity.displayName}</strong>
            <small className="block truncate text-[10px] text-muted">{username}</small>
          </span>
        </div>

        <div className="mx-2 my-1 border-t border-mist" />

        <CreditSummary />

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

function CreditSummary() {
  const { credits } = useShellIdentity();
  return (
    <div className="px-2 py-2">
      <p className="text-xs font-semibold text-ink">Créditos</p>
      <dl className="mt-2 space-y-1 text-[11px]">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-graphite">Del mes</dt>
          <dd className="font-numeric tabular-nums text-ink">{formatCredits(credits.total)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-graphite">Te quedan</dt>
          <dd className="font-numeric font-semibold tabular-nums text-ink">{formatCredits(credits.remaining)}</dd>
        </div>
      </dl>
      <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-control">
        <div className={`h-full rounded-full ${usageTone(credits.usedShare).bar}`} style={{ width: `${credits.usedShare * 100}%` }} />
      </div>
      <p className="mt-1.5 text-[10px] text-muted">Se renuevan el {resetFormatter.format(new Date(credits.resetsAt))}</p>
    </div>
  );
}

/** Un anillo alrededor del avatar que se llena con el uso del mes, como el de contexto de un editor. */
function UsageAvatar({
  avatarUrl,
  initials,
  usedShare = 0,
  label,
}: {
  avatarUrl: string | null;
  initials: string;
  usedShare?: number;
  label?: string;
}) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className="relative grid size-9 place-items-center" aria-label={label}>
      <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="2.5" className="stroke-control" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - usedShare)}
          className={`transition-[stroke-dashoffset] duration-500 ${usageTone(usedShare).ring}`}
        />
      </svg>
      <span className="relative grid size-[26px] place-items-center overflow-hidden rounded-full bg-control text-[9px] font-semibold">
        {initials}
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill sizes="26px" className="object-cover" unoptimized />
        ) : null}
      </span>
    </span>
  );
}

const resetFormatter = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "long", timeZone: "UTC" });
const creditFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });

function formatCredits(value: number) {
  return creditFormatter.format(value);
}

function formatShare(share: number) {
  return `${Math.round(share * 100)} %`;
}

/** Negro mientras sobra; naranja desde el 80 % para avisar con tiempo; rojo al agotarse. */
function usageTone(share: number) {
  if (share >= 1) return { ring: "stroke-danger", bar: "bg-danger" };
  if (share >= 0.8) return { ring: "stroke-warning", bar: "bg-warning" };
  return { ring: "stroke-ink", bar: "bg-ink" };
}
