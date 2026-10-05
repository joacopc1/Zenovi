"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Coins, Megaphone, RefreshCw, ScanSearch, Sparkles, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTimeLabel, type AppNotification, type NotificationKind } from "@/lib/notifications/model";
import { BellIcon } from "./icons";
import { markNotificationsRead } from "./notification-actions";
import { useShellIdentity } from "./shell-identity";
import { useDismissibleDetails } from "./use-dismissible-details";

const KIND_ICONS: Record<NotificationKind, LucideIcon> = {
  update: Sparkles,
  news: Megaphone,
  sync: RefreshCw,
  analysis: ScanSearch,
  credits: Coins,
};

/**
 * La bandeja del header, como el "Notification Inbox Popover" de 21st.dev que eligió
 * Joaco: la campana con el número sin leer, pestañas Todas / Sin leer, "Marcar todo como
 * leído" y la lista con ícono, negrita y punto en lo nuevo. Abrir una la marca como leída.
 */
export function NotificationMenu() {
  const detailsRef = useDismissibleDetails();
  const { notifications: initial } = useShellIdentity();
  const [notifications, setNotifications] = useState(initial);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [, startTransition] = useTransition();
  const unreadCount = notifications.filter((item) => item.unread).length;
  const shown = tab === "unread" ? notifications.filter((item) => item.unread) : notifications;
  const now = new Date();

  function markRead(ids: string[]) {
    if (ids.length === 0) return;
    setNotifications((current) => current.map((item) => (ids.includes(item.id) ? { ...item, unread: false } : item)));
    startTransition(() => markNotificationsRead(ids));
  }

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="relative grid size-8 cursor-pointer list-none place-items-center rounded-control border border-mist bg-paper text-graphite hover:bg-canvas hover:text-ink [&::-webkit-details-marker]:hidden">
        <BellIcon className="size-4" />
        <span className="sr-only">Abrir notificaciones{unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}</span>
        {unreadCount > 0 ? (
          <span aria-hidden="true" className="absolute -top-2 left-full flex h-5 min-w-5 -translate-x-1/2 items-center justify-center rounded-full bg-ink px-1 font-numeric text-[11px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </summary>

      <div className="absolute right-0 top-full z-50 mt-2 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-card border border-mist bg-paper shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between border-b border-mist px-3 py-2">
          <div role="tablist" aria-label="Notificaciones" className="inline-flex h-9 items-center gap-1">
            <TabButton active={tab === "all"} onClick={() => setTab("all")}>Todas</TabButton>
            <TabButton active={tab === "unread"} onClick={() => setTab("unread")}>
              Sin leer
              {unreadCount > 0 ? <span className="ml-1 rounded-full bg-ink px-1.5 font-numeric text-[11px] font-semibold text-white">{unreadCount}</span> : null}
            </TabButton>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markRead(notifications.filter((item) => item.unread).map((item) => item.id))}
              className="text-xs font-medium text-graphite hover:text-ink hover:underline"
            >
              Marcar todo como leído
            </button>
          ) : null}
        </div>

        <div role="tabpanel" className="max-h-80 overflow-y-auto">
          {shown.length === 0 ? (
            <EmptyState
              illustration="caught-up"
              title={tab === "unread" ? "Leíste todo" : "Todavía no hay notificaciones"}
              description="Acá vas a ver las novedades de Zenovi y lo que pase con tu cuenta."
              className="py-8"
            />
          ) : (
            shown.map((item) => <NotificationRow key={item.id} item={item} now={now} onOpen={() => markRead([item.id])} />)
          )}
        </div>
      </div>
    </details>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors ${active ? "bg-canvas text-ink" : "text-graphite hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

function NotificationRow({ item, now, onOpen }: { item: AppNotification; now: Date; onOpen: () => void }) {
  const Icon = KIND_ICONS[item.kind];
  const content = (
    <>
      <span className="mt-0.5 text-graphite">
        <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className={`block text-sm leading-5 ${item.unread ? "font-semibold text-ink" : "text-ink/80"}`}>{item.title}</span>
        {item.body ? <span className="block text-[13px] leading-5 text-graphite">{item.body}</span> : null}
        <span suppressHydrationWarning className="block text-xs text-muted">{relativeTimeLabel(item.createdAt, now)}</span>
      </span>
      {item.unread ? <span aria-label="Sin leer" className="mt-1.5 inline-block size-2 shrink-0 rounded-full bg-ink" /> : null}
    </>
  );
  const className = "flex w-full items-start gap-3 border-b border-mist px-3 py-3 text-left last:border-b-0 hover:bg-canvas";
  return item.href ? (
    <Link href={item.href} onClick={onOpen} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onOpen} className={className}>
      {content}
    </button>
  );
}
