"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "./actions";
import { Bot, LogOut, User } from "lucide-react";
import { FeedbackMenu } from "./feedback-menu";
import { NotificationMenu } from "./notification-menu";
import { useShellIdentity } from "./shell-identity";
import { useDismissibleDetails } from "./use-dismissible-details";
import { BETA_PLAN_NAME } from "@/lib/billing/plans";
import { CREDIT_LOCK_MESSAGES } from "@/lib/credits/pricing";

export function HeaderActions() {
  return (
    <div className="ml-auto flex items-center gap-1.5">
      <FeedbackMenu />
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
          usedShare={identity.credits.usedShare}
          label={identity.credits.locked ? `Abrir cuenta de ${username}` : `Abrir cuenta de ${username}. Usaste ${formatShare(identity.credits.usedShare)} de tus créditos del mes`}
        />
      </summary>
      {/* Al pasar el mouse, cuánto se usó; con el menú abierto ya se ve el detalle. */}
      <span className="pointer-events-none absolute right-0 top-full z-40 mt-2 whitespace-nowrap rounded-lg bg-paper/90 px-2.5 py-1.5 text-[11px] text-ink opacity-0 ring ring-ink/10 backdrop-blur-lg transition-opacity duration-75 group-open:hidden peer-hover:opacity-100">
        {identity.credits.locked ? (
          "Todavía sin créditos"
        ) : (
          <>
            Usaste <strong className="font-semibold">{formatShare(identity.credits.usedShare)}</strong> de tus créditos
          </>
        )}
      </span>
      <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-card border border-mist bg-paper p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <CreditSummary />

        <div className="mt-1.5 rounded-xl border border-mist px-3 py-2.5">
          <p className="text-[11px] text-muted">Marca activa</p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-ink">{identity.workspaceName}</p>
          <p className="truncate text-[11px] text-graphite">{username} · Plan {BETA_PLAN_NAME}</p>
        </div>

        <nav aria-label="Cuenta" className="mt-1.5 border-t border-mist pt-1.5">
          <MenuLink href="/settings">Ajustes</MenuLink>
          <MenuLink href="/settings/billing">Facturación</MenuLink>
          <MenuLink href="/settings/integrations">Integraciones</MenuLink>
          <MenuLink href="/brand">ADN de marca</MenuLink>
        </nav>
        <div className="mt-1.5 border-t border-mist pt-1.5">
          <MenuLink href="/terms">Términos</MenuLink>
          <MenuLink href="/privacy">Privacidad</MenuLink>
        </div>
        <form action={signOut} className="mt-1.5 border-t border-mist pt-1.5">
          <button type="submit" className="flex min-h-8 w-full items-center gap-2 rounded-control px-2.5 text-left text-[13px] text-ink hover:bg-canvas">
            <LogOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </details>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-8 items-center rounded-control px-2.5 text-[13px] text-ink hover:bg-canvas">
      {children}
    </Link>
  );
}

/** El saldo arriba del menú, como el "Balance" de ElevenLabs, con el acceso a mejorar el plan. */
function CreditSummary() {
  const { credits } = useShellIdentity();
  return (
    <div className="rounded-xl border border-mist px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
          <UsageRing usedShare={credits.usedShare} />
          Créditos
        </span>
        <Link href="/settings/billing" className="rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-white hover:bg-ink/85">
          Mejorar
        </Link>
      </div>
      {credits.locked ? (
        <p className="mt-2 text-[11px] leading-4 text-graphite">{CREDIT_LOCK_MESSAGES[credits.locked]}</p>
      ) : (
        <dl className="mt-2.5 space-y-1 text-[12px]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-graphite">Del mes</dt>
            <dd className="font-numeric tabular-nums text-ink">{formatCredits(credits.total)} créditos</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-graphite">Te quedan</dt>
            <dd className="font-numeric font-semibold tabular-nums text-ink">{formatCredits(credits.remaining)}</dd>
          </div>
          <p className="font-support pt-0.5 text-[10px] text-muted">Se renuevan el {resetFormatter.format(new Date(credits.resetsAt))}</p>
        </dl>
      )}
    </div>
  );
}

/** Un circulito que se llena con lo usado del mes. */
function UsageRing({ usedShare }: { usedShare: number }) {
  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 16 16" className="size-4 -rotate-90" aria-hidden="true">
      <circle cx="8" cy="8" r={radius} fill="none" strokeWidth="2" className="stroke-control" />
      <circle cx="8" cy="8" r={radius} fill="none" strokeWidth="2" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - usedShare)} className={usageTone(usedShare).ring} />
    </svg>
  );
}

/** Un anillo alrededor del avatar que se llena con el uso del mes, como el de contexto de un editor. */
function UsageAvatar({
  avatarUrl,
  usedShare = 0,
  label,
}: {
  avatarUrl: string | null;
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
        {avatarUrl ? null : <User aria-hidden="true" className="size-4 text-graphite" strokeWidth={1.75} />}
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
