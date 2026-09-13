import Link from "next/link";
import { SyncButton } from "@/components/home/sync-button";
import type { InstagramConnectionStatus } from "@/lib/meta/connection-state";

type Tone = "warning" | "danger" | "neutral";

type Notice = {
  tone: Tone;
  label: string;
  title: string;
  description: string;
  action: "reconnect" | "sync" | "none";
};

/**
 * Qué mostrar cuando la cuenta está vinculada pero no sana.
 *
 * `connected` y la ausencia de conexión no aparecen acá: la primera deja pasar el
 * contenido real y la segunda la resuelve cada pantalla con su propio texto.
 */
const notices: Partial<Record<InstagramConnectionStatus, Notice>> = {
  action_required: {
    tone: "warning",
    label: "Requiere acción",
    title: "Instagram necesita que vuelvas a autorizar la conexión",
    description:
      "El permiso caducó o fue revocado desde Instagram. Tus datos sincronizados siguen guardados y vuelven a verse apenas reconectes: no se pierde nada.",
    action: "reconnect",
  },
  failed: {
    tone: "danger",
    label: "Error",
    title: "La última sincronización no pudo completarse",
    description:
      "Instagram rechazó la conexión. Reconectar la cuenta suele resolverlo; si vuelve a fallar, puede que el permiso de estadísticas se haya desactivado del lado de Instagram.",
    action: "reconnect",
  },
  syncing: {
    tone: "neutral",
    label: "Sincronizando",
    title: "Estamos trayendo tus datos de Instagram",
    description:
      "La primera sincronización recorre hasta 90 días de historia, así que puede demorar un momento. Podés seguir usando el resto de Zenovi mientras tanto.",
    action: "none",
  },
  initial_sync_queued: {
    tone: "neutral",
    label: "En cola",
    title: "La sincronización está por empezar",
    description:
      "La cuenta quedó vinculada y su primera carga de datos está encolada. Si pasa mucho tiempo sin avanzar, lanzala a mano.",
    action: "sync",
  },
  account_resolved: {
    tone: "neutral",
    label: "Casi listo",
    title: "Falta traer los datos de la cuenta",
    description:
      "Identificamos tu cuenta profesional pero todavía no trajimos sus estadísticas.",
    action: "sync",
  },
};

const toneClasses: Record<Tone, string> = {
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-graphite",
};

export function InstagramConnectionNotice({
  status,
  redirectTo,
}: {
  status: InstagramConnectionStatus;
  redirectTo: string;
}) {
  // Los pasos intermedios del OAuth comparten el mismo mensaje: quedó a mitad.
  const notice = notices[status] ?? {
    tone: "warning" as const,
    label: "Conexión incompleta",
    title: "La conexión con Instagram quedó a mitad de camino",
    description:
      "El proceso de autorización no llegó a terminar. Volvé a empezarlo para completar la vinculación.",
    action: "reconnect" as const,
  };

  return (
    <section className="mt-8 max-w-xl rounded-card border border-mist p-6">
      <p className={`text-xs font-semibold ${toneClasses[notice.tone]}`}>{notice.label}</p>
      <h2 className="mt-1.5 text-lg font-semibold">{notice.title}</h2>
      <p className="mt-2 text-sm leading-6 text-graphite">{notice.description}</p>

      {notice.action === "reconnect" ? (
        <Link
          href="/onboarding/instagram"
          className="mt-5 inline-flex min-h-9 items-center rounded-control bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85"
        >
          Reconectar Instagram
        </Link>
      ) : null}

      {notice.action === "sync" ? (
        <div className="mt-5">
          <SyncButton redirectTo={redirectTo} />
        </div>
      ) : null}
    </section>
  );
}
