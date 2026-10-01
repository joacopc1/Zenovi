"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteDirectorChat, renameDirectorChat } from "@/app/(dashboard)/director/actions";
import { CollapseSidebarIcon } from "@/components/shell/icons";
import { HoverLabel } from "@/components/ui/hover-label";
import type { DirectorChatSummary } from "@/lib/data/director-chats";

/** Los chats a la derecha: a la izquierda ya está la barra lateral de la app. */
export function ChatList({
  chats,
  activeChatId,
  onClose,
}: {
  chats: DirectorChatSummary[];
  activeChatId: string | null;
  onClose: () => void;
}) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-mist bg-paper lg:flex" aria-label="Tus chats">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Ocultar chats"
            className="group/tip relative grid size-7 place-items-center rounded-control text-graphite hover:bg-ink/[0.045] hover:text-ink"
          >
            <CollapseSidebarIcon className="size-4 -scale-x-100" />
            <HoverLabel>Ocultar chats</HoverLabel>
          </button>
          <h2 className="text-[13px] font-semibold text-ink">Chats</h2>
        </div>
        <Link
          href="/director"
          className="flex min-h-8 items-center gap-1.5 rounded-control border border-mist px-2.5 text-[12px] font-medium text-ink hover:bg-canvas"
        >
          <Plus aria-hidden="true" className="size-3.5" strokeWidth={1.7} />
          Nuevo
        </Link>
      </div>
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {chats.length === 0 ? (
          <p className="font-support px-2 py-3 text-[12px] leading-5 text-muted">
            Tus conversaciones con el Director van a quedar acá.
          </p>
        ) : (
          chats.map((chat) => <ChatRow key={chat.id} chat={chat} active={chat.id === activeChatId} />)
        )}
      </nav>
    </aside>
  );
}

function ChatRow({ chat, active }: { chat: DirectorChatSummary; active: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "rename" | "confirmDelete">("view");
  const [draft, setDraft] = useState(chat.title ?? "");
  const [pending, startTransition] = useTransition();
  const title = chat.title ?? "Chat nuevo";

  if (mode === "rename") {
    return (
      <form
        className="flex items-center gap-1 rounded-control bg-canvas px-2 py-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            await renameDirectorChat(chat.id, draft);
            setMode("view");
          });
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={120}
          aria-label="Nuevo nombre del chat"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none"
        />
        <IconButton label="Guardar nombre" type="submit" disabled={pending}><Check className="size-3.5" strokeWidth={1.7} /></IconButton>
        <IconButton label="Cancelar" onClick={() => setMode("view")}><X className="size-3.5" strokeWidth={1.7} /></IconButton>
      </form>
    );
  }

  if (mode === "confirmDelete") {
    return (
      <div className="flex items-center gap-2 rounded-control bg-canvas px-2 py-2 text-[12px]">
        <span className="min-w-0 flex-1 truncate text-graphite">¿Borrar este chat?</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteDirectorChat(chat.id);
              if (active) router.push("/director");
            })
          }
          className="font-medium text-danger hover:underline"
        >
          Borrar
        </button>
        <button type="button" onClick={() => setMode("view")} className="text-graphite hover:text-ink">
          No
        </button>
      </div>
    );
  }

  return (
    <div className={`group/chat relative flex items-center rounded-control ${active ? "bg-canvas" : "hover:bg-canvas/70"}`}>
      <Link
        href={`/director/${chat.id}`}
        aria-current={active ? "page" : undefined}
        className={`min-w-0 flex-1 truncate px-2.5 py-2 text-[13px] ${active ? "font-medium text-ink" : "text-graphite"}`}
      >
        {title}
      </Link>
      <div className="flex shrink-0 items-center pr-1 opacity-0 transition-opacity group-hover/chat:opacity-100 focus-within:opacity-100">
        <IconButton label={`Renombrar ${title}`} onClick={() => setMode("rename")}><Pencil className="size-3.5" strokeWidth={1.7} /></IconButton>
        <IconButton label={`Borrar ${title}`} onClick={() => setMode("confirmDelete")}><Trash2 className="size-3.5" strokeWidth={1.7} /></IconButton>
      </div>
    </div>
  );
}

function IconButton({
  label,
  children,
  ...props
}: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      className="group/tip relative grid size-7 place-items-center rounded-control text-graphite hover:bg-paper hover:text-ink disabled:opacity-50"
      {...props}
    >
      {children}
      <HoverLabel>{label}</HoverLabel>
    </button>
  );
}
