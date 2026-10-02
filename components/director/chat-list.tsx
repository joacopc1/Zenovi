"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, Ellipsis, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteDirectorChat, renameDirectorChat } from "@/app/(dashboard)/director/actions";
import { CollapseSidebarIcon } from "@/components/shell/icons";
import { HoverLabel } from "@/components/ui/hover-label";
import type { DirectorChatSummary } from "@/lib/data/director-chats";

/** Los chats a la derecha (a la izquierda ya está la barra lateral), como la lista de ChatGPT. */
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
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Ocultar chats"
          className="group/tip relative grid size-8 place-items-center rounded-control text-graphite hover:bg-ink/[0.045] hover:text-ink"
        >
          <CollapseSidebarIcon className="size-4 -scale-x-100" />
          <HoverLabel>Ocultar chats</HoverLabel>
        </button>
        <Link
          href="/director"
          className="flex min-h-8 items-center gap-1.5 rounded-control border border-mist px-2.5 text-[12px] font-medium text-ink hover:bg-canvas"
        >
          <Plus aria-hidden="true" className="size-3.5" strokeWidth={1.7} />
          Nuevo
        </Link>
      </div>
      <p className="px-5 pb-1.5 pt-2 text-[12px] font-medium text-muted">Recientes</p>
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {chats.length === 0 ? (
          <p className="px-3 py-2 text-[13px] leading-5 text-muted">Tus conversaciones con el Director van a quedar acá.</p>
        ) : (
          chats.map((chat) => <ChatRow key={chat.id} chat={chat} active={chat.id === activeChatId} />)
        )}
      </nav>
    </aside>
  );
}

function ChatRow({ chat, active }: { chat: DirectorChatSummary; active: boolean }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(chat.title ?? "");
  const [pending, startTransition] = useTransition();
  const title = chat.title ?? "Chat nuevo";

  if (renaming) {
    return (
      <form
        className="flex items-center gap-1 rounded-lg bg-ink/[0.06] px-2 py-1"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            await renameDirectorChat(chat.id, draft);
            setRenaming(false);
          });
        }}
      >
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Escape" && setRenaming(false)}
          maxLength={120}
          aria-label="Nuevo nombre del chat"
          className="min-w-0 flex-1 bg-transparent py-1 text-[14px] text-ink outline-none"
        />
        <RowButton label="Guardar nombre" type="submit" disabled={pending}><Check className="size-4" strokeWidth={1.75} /></RowButton>
        <RowButton label="Cancelar" onClick={() => setRenaming(false)}><X className="size-4" strokeWidth={1.75} /></RowButton>
      </form>
    );
  }

  return (
    <div className={`group/chat relative flex items-center rounded-lg ${active ? "bg-ink/[0.06]" : "hover:bg-ink/[0.04]"}`}>
      <Link
        href={`/director/${chat.id}`}
        aria-current={active ? "page" : undefined}
        className="min-w-0 flex-1 truncate px-3 py-2 text-[14px] text-ink"
      >
        {title}
      </Link>
      <div className={`pr-1 ${menuOpen ? "opacity-100" : "opacity-0 group-hover/chat:opacity-100 focus-within:opacity-100"}`}>
        <RowButton label={`Opciones de ${title}`} onClick={() => setMenuOpen((open) => !open)}>
          <Ellipsis className="size-4" strokeWidth={1.75} />
        </RowButton>
      </div>
      {menuOpen ? (
        <ChatMenu
          onClose={() => setMenuOpen(false)}
          onRename={() => {
            setMenuOpen(false);
            setDraft(chat.title ?? "");
            setRenaming(true);
          }}
          onDelete={() =>
            startTransition(async () => {
              await deleteDirectorChat(chat.id);
              setMenuOpen(false);
              if (active) router.push("/director");
            })
          }
          deleting={pending}
        />
      ) : null}
    </div>
  );
}

/** Menú flotante de un chat; borrar pide una segunda confirmación ahí mismo. */
function ChatMenu({
  onClose,
  onRename,
  onDelete,
  deleting,
}: {
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onClose();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-1 top-full z-50 mt-1 w-48 rounded-xl border border-mist bg-paper p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
    >
      {confirming ? (
        <div className="px-2 py-1.5">
          <p className="text-[13px] text-ink">¿Eliminar este chat?</p>
          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              disabled={deleting}
              onClick={onDelete}
              className="rounded-lg bg-danger px-2.5 py-1 text-[12px] font-medium text-paper hover:bg-danger/90"
            >
              Eliminar
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-2.5 py-1 text-[12px] text-graphite hover:bg-ink/[0.045]">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <MenuItem onClick={onRename} icon={<Pencil className="size-4" strokeWidth={1.75} />}>Renombrar</MenuItem>
          <MenuItem onClick={() => setConfirming(true)} icon={<Trash2 className="size-4" strokeWidth={1.75} />} danger>
            Eliminar
          </MenuItem>
        </>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  icon,
  danger = false,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-ink/[0.045] ${danger ? "text-danger" : "text-ink"}`}
    >
      {icon}
      {children}
    </button>
  );
}

function RowButton({
  label,
  children,
  ...props
}: { label: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      className="grid size-7 place-items-center rounded-control text-graphite hover:text-ink disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}
