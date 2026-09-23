"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Award, Check, Fingerprint, MessageSquare, Package, Plus, Target, UserRound, X } from "lucide-react";
import { saveBrandDna, type SaveBrandDnaState } from "@/app/(dashboard)/brand/actions";
import {
  emptyAudience,
  emptyOffer,
  isOfferKind,
  measureBrandDna,
  OFFER_KINDS,
  type AudienceDraft,
  type BrandDnaDimensionId,
  type BrandDnaDraft,
  type BrandDnaFieldErrors,
  type OfferDraft,
  type OfferKind,
} from "@/lib/brand/dna";
import { StringList, TextArea, TextField } from "./brand-form-controls";

const initialState: SaveBrandDnaState = { status: "idle" };

const OFFER_KIND_LABELS: Record<OfferKind, string> = {
  service: "Servicio",
  infoproduct: "Infoproducto",
  program: "Programa",
  other: "Otro",
};

type DimensionMeta = {
  id: BrandDnaDimensionId;
  label: string;
  icon: ReactNode;
};

const DIMENSIONS: DimensionMeta[] = [
  {
    id: "identidad",
    label: "Identidad",
    icon: <Fingerprint size={15} strokeWidth={1.75} />,
  },
  {
    id: "voz",
    label: "Voz",
    icon: <MessageSquare size={15} strokeWidth={1.75} />,
  },
  {
    id: "diferenciacion",
    label: "Diferenciación",
    icon: <Award size={15} strokeWidth={1.75} />,
  },
  {
    id: "objetivo",
    label: "Objetivo",
    icon: <Target size={15} strokeWidth={1.75} />,
  },
  {
    id: "ofertas",
    label: "Producto",
    icon: <Package size={15} strokeWidth={1.75} />,
  },
  {
    id: "cliente",
    label: "Avatar",
    icon: <UserRound size={15} strokeWidth={1.75} />,
  },
];

export function BrandDnaForm({ initial }: { initial: BrandDnaDraft }) {
  const [draft, setDraft] = useState<BrandDnaDraft>(initial);
  const [active, setActive] = useState<BrandDnaDimensionId>("identidad");
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<SaveBrandDnaState>(initialState);
  const [pending, startTransition] = useTransition();
  const [pendingLeave, setPendingLeave] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const update = <K extends keyof BrandDnaDraft>(key: K, value: BrandDnaDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  function reset() {
    setDraft(initial);
    setDirty(false);
    setState(initialState);
  }

  function submit() {
    startTransition(async () => {
      const result = await saveBrandDna(initialState, draft);
      setState(result);
      if (result.status === "saved") setDirty(false);
    });
  }

  useEffect(() => {
    if (!dirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    // Navegación interna (sidebar, breadcrumb): los clicks en <a> con href interno
    // pasan por el router sin disparar beforeunload, así que se interceptan acá.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("//") || href.startsWith("#")) return;
      if (anchor.getAttribute("target") === "_blank") return;

      event.preventDefault();
      event.stopPropagation();
      setPendingLeave(href);
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  useEffect(() => {
    if (pendingLeave) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [pendingLeave]);

  function confirmLeave() {
    const href = pendingLeave;
    setPendingLeave(null);
    setDirty(false);
    if (href) router.push(href);
  }

  const completeness = measureBrandDna(draft);
  const dimension = DIMENSIONS.find((item) => item.id === active) ?? DIMENSIONS[0];

  return (
    <form action={submit} className="mt-6" aria-describedby="brand-dna-feedback">
      <div className="flex items-end justify-between gap-6 border-b border-mist">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Secciones del ADN de marca">
          {DIMENSIONS.map((item) => {
            const selected = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                aria-current={selected ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-medium transition-colors ${
                  selected
                    ? "border-ink text-ink"
                    : "border-transparent text-graphite hover:text-ink"
                }`}
              >
                <span aria-hidden="true" className="flex">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="shrink-0 pb-2.5">
          <CompletionBadge percent={completeness.percent} />
        </div>
      </div>

      <section className="pt-6">
        <h2 className="sr-only">{dimension.label}</h2>
        <div className="space-y-4">
          {active === "identidad" ? <IdentidadFields draft={draft} update={update} /> : null}
          {active === "voz" ? <VozFields draft={draft} update={update} /> : null}
          {active === "diferenciacion" ? <DiferenciacionFields draft={draft} update={update} /> : null}
          {active === "objetivo" ? <ObjetivoFields draft={draft} update={update} /> : null}
          {active === "ofertas" ? <OfertasFields draft={draft} update={update} errors={state.errors ?? {}} /> : null}
          {active === "cliente" ? <ClienteFields draft={draft} update={update} errors={state.errors ?? {}} /> : null}
        </div>
      </section>

      <div className="mt-8 flex items-center justify-end gap-3 pt-4">
        <p id="brand-dna-feedback" className="text-sm text-muted" aria-live="polite">
          {state.status === "error" && state.message ? (
            <span className="text-danger">{state.message}</span>
          ) : state.status === "saved" && !dirty ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
              Guardado
            </span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={reset}
          disabled={!dirty || pending}
          className="h-9 rounded-control px-4 text-sm font-medium text-graphite transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!dirty || pending}
          className={`h-9 rounded-control px-4 text-sm font-semibold transition-colors ${
            dirty
              ? "bg-ink text-paper hover:opacity-90"
              : "bg-control text-muted"
          } disabled:cursor-not-allowed`}
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setPendingLeave(null)}
        className="m-auto w-[min(24rem,calc(100%-2rem))] rounded-card border border-mist bg-paper p-6 text-ink shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop:bg-ink/25"
        aria-label="Cambios sin guardar"
      >
        <h2 className="text-base font-semibold tracking-[-0.01em]">Cambios sin guardar</h2>
        <p className="mt-2 text-sm leading-6 text-graphite">
          Si salís, perdés lo que cambiaste.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setPendingLeave(null)}
            className="h-9 rounded-control px-4 text-sm font-medium text-graphite transition-colors hover:text-ink"
          >
            Quedarme
          </button>
          <button
            type="button"
            onClick={confirmLeave}
            className="h-9 rounded-control bg-ink px-4 text-sm font-semibold text-paper transition-opacity hover:opacity-90"
          >
            Salir sin guardar
          </button>
        </div>
      </dialog>
    </form>
  );
}

function CompletionBadge({ percent }: { percent: number }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const filled = (percent / 100) * circumference;

  return (
    <span
      className="inline-flex items-center gap-2"
      title={`ADN de marca completado: ${percent}%`}
    >
      <svg viewBox="0 0 24 24" className="size-5 -rotate-90" aria-hidden="true">
        <circle cx="12" cy="12" r={radius} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="3" />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="#1d1d1f"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          className="transition-[stroke-dasharray] duration-500 ease-out"
        />
      </svg>
      <span className="font-numeric text-[13px] font-medium text-ink">{percent}%</span>
    </span>
  );
}

type Updater = <K extends keyof BrandDnaDraft>(key: K, value: BrandDnaDraft[K]) => void;

function IdentidadFields({ draft, update }: { draft: BrandDnaDraft; update: Updater }) {
  return (
    <>
      <TextArea
        label="Descripción de la marca"
        value={draft.description}
        onChange={(value) => update("description", value)}
        placeholder="Ej. Ayudo a coaches a llenar su agenda con contenido que convierte."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nicho"
          value={draft.niche}
          onChange={(value) => update("niche", value)}
          placeholder="Ej. Coaching de negocios para emprendedoras"
          maxLength={300}
        />
        <TextField
          label="Posicionamiento"
          value={draft.positioning}
          onChange={(value) => update("positioning", value)}
          placeholder="Ej. Estrategia + implementación, no solo teoría"
          maxLength={300}
        />
      </div>
    </>
  );
}

function VozFields({ draft, update }: { draft: BrandDnaDraft; update: Updater }) {
  return (
    <>
      <TextArea
        label="Tono de voz"
        value={draft.tone}
        onChange={(value) => update("tone", value)}
        placeholder="Ej. Cercano, directo, con humor seco. Hablo de 'vos'."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StringList
          label="Palabras propias"
          value={draft.ownWords}
          onChange={(value) => update("ownWords", value)}
        />
        <StringList
          label="Palabras evitadas"
          value={draft.avoidedWords}
          onChange={(value) => update("avoidedWords", value)}
        />
      </div>
    </>
  );
}

function DiferenciacionFields({ draft, update }: { draft: BrandDnaDraft; update: Updater }) {
  return (
    <>
      <TextArea
        label="Mecanismo"
        value={draft.mechanism}
        onChange={(value) => update("mechanism", value)}
        placeholder="Ej. Método de 4 fases para convertir seguidores en clientes."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <StringList
          label="Diferenciadores"
          value={draft.differentiators}
          onChange={(value) => update("differentiators", value)}
        />
        <StringList
          label="Promesas permitidas"
          value={draft.allowedPromises}
          onChange={(value) => update("allowedPromises", value)}
        />
      </div>
      <StringList
        label="Prueba y autoridad"
        value={draft.proof}
        onChange={(value) => update("proof", value)}
      />
    </>
  );
}

function ObjetivoFields({ draft, update }: { draft: BrandDnaDraft; update: Updater }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Objetivo actual"
          value={draft.objective}
          onChange={(value) => update("objective", value)}
          placeholder="Ej. Llenar la próxima cohorte de mi programa"
          maxLength={300}
        />
        <TextField
          label="CTA principal"
          value={draft.primaryCta}
          onChange={(value) => update("primaryCta", value)}
          placeholder="Ej. Agendá una llamada de diagnóstico"
          maxLength={300}
        />
      </div>
      <StringList
        label="Canales de conversión"
        value={draft.conversionChannels}
        onChange={(value) => update("conversionChannels", value)}
      />
    </>
  );
}

function OfertasFields({
  draft,
  update,
  errors,
}: {
  draft: BrandDnaDraft;
  update: Updater;
  errors: BrandDnaFieldErrors;
}) {
  return (
    <>
      {draft.offers.length === 0 ? (
        <EmptyList onAdd={() => update("offers", [emptyOffer()])} label="Agregar producto" />
      ) : (
        <div className="space-y-3">
          {draft.offers.map((offer, index) => (
            <OfferEditor
              key={index}
              offer={offer}
              onChange={(next) =>
                update("offers", draft.offers.map((current, currentIndex) => currentIndex === index ? next : current))
              }
              onRemove={() =>
                update("offers", draft.offers.filter((_, currentIndex) => currentIndex !== index))
              }
            />
          ))}
          <AddButton onClick={() => update("offers", [...draft.offers, emptyOffer()])} label="Agregar producto" />
        </div>
      )}
      {errors.offers ? <p className="text-xs text-danger" role="alert">{errors.offers}</p> : null}
    </>
  );
}

function ClienteFields({
  draft,
  update,
  errors,
}: {
  draft: BrandDnaDraft;
  update: Updater;
  errors: BrandDnaFieldErrors;
}) {
  return (
    <>
      {draft.audience.length === 0 ? (
        <EmptyList onAdd={() => update("audience", [emptyAudience()])} label="Agregar avatar" />
      ) : (
        <div className="space-y-3">
          {draft.audience.map((segment, index) => (
            <AudienceEditor
              key={index}
              segment={segment}
              onChange={(next) =>
                update("audience", draft.audience.map((current, currentIndex) => currentIndex === index ? next : current))
              }
              onRemove={() =>
                update("audience", draft.audience.filter((_, currentIndex) => currentIndex !== index))
              }
            />
          ))}
          <AddButton onClick={() => update("audience", [...draft.audience, emptyAudience()])} label="Agregar avatar" />
        </div>
      )}
      {errors.audience ? <p className="text-xs text-danger" role="alert">{errors.audience}</p> : null}
    </>
  );
}

function EmptyList({ onAdd, label }: { onAdd: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex w-full items-center justify-center gap-2 rounded-card border border-dashed border-mist-strong px-4 py-6 text-sm font-medium text-graphite transition-colors hover:border-ink/40 hover:text-ink"
    >
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      {label}
    </button>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-control border border-mist-strong px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/[0.03]"
    >
      <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
      {label}
    </button>
  );
}

function OfferEditor({
  offer,
  onChange,
  onRemove,
}: {
  offer: OfferDraft;
  onChange: (next: OfferDraft) => void;
  onRemove: () => void;
}) {
  const update = <K extends keyof OfferDraft>(key: K, value: OfferDraft[K]) =>
    onChange({ ...offer, [key]: value });

  return (
    <div className="rounded-card border border-mist bg-paper p-4">
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-muted">
          <input
            type="checkbox"
            checked={offer.isPrimary}
            onChange={(event) => update("isPrimary", event.target.checked)}
            className="size-4 rounded border-mist-strong accent-ink"
          />
          Producto principal
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted transition-colors hover:text-ink"
          aria-label="Quitar oferta"
        >
          <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Nombre"
            value={offer.name}
            onChange={(value) => update("name", value)}
            placeholder="Ej. Mentoring 1:1 de 90 días"
            maxLength={300}
          />
          <label className="block space-y-1.5">
            <span className="block text-sm font-medium text-ink">Tipo</span>
            <select
              className="w-full rounded-control border border-mist-strong bg-paper px-3 py-2 text-sm text-ink focus:border-graphite focus:outline-none"
              value={offer.kind}
              onChange={(event) => {
                const value = event.target.value;
                if (isOfferKind(value)) update("kind", value);
              }}
            >
              {OFFER_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {OFFER_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TextArea
          label="Descripción"
          value={offer.description}
          onChange={(value) => update("description", value)}
          placeholder="Qué incluye y para quién es."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Precio"
            value={offer.priceCents === null ? "" : String(offer.priceCents / 100)}
            onChange={(value) => {
              const parsed = Number.parseFloat(value);
              update("priceCents", Number.isFinite(parsed) ? Math.round(parsed * 100) : null);
            }}
            placeholder="Ej. 2500"
          />
          <TextField
            label="Moneda"
            value={offer.currency}
            onChange={(value) => update("currency", value.toUpperCase())}
            placeholder="USD"
            maxLength={8}
          />
        </div>
        <TextField
          label="Modalidad"
          value={offer.modality}
          onChange={(value) => update("modality", value)}
          placeholder="Ej. Online, sesiones quincenales"
          maxLength={300}
        />
      </div>
    </div>
  );
}

function AudienceEditor({
  segment,
  onChange,
  onRemove,
}: {
  segment: AudienceDraft;
  onChange: (next: AudienceDraft) => void;
  onRemove: () => void;
}) {
  const update = <K extends keyof AudienceDraft>(key: K, value: AudienceDraft[K]) =>
    onChange({ ...segment, [key]: value });

  return (
    <div className="rounded-card border border-mist bg-paper p-4">
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-muted">
          <input
            type="checkbox"
            checked={segment.isPrimary}
            onChange={(event) => update("isPrimary", event.target.checked)}
            className="size-4 rounded border-mist-strong accent-ink"
          />
          Avatar principal
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted transition-colors hover:text-ink"
          aria-label="Quitar avatar"
        >
          <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-3">
        <TextField
          label="Nombre del avatar"
          value={segment.name}
          onChange={(value) => update("name", value)}
          placeholder="Ej. Coaches con menos de 2 años de experiencia"
          maxLength={300}
        />
        <TextArea
          label="Descripción"
          value={segment.description}
          onChange={(value) => update("description", value)}
          placeholder="Quién es, en qué etapa está, qué hace hoy."
        />
        <StringList
          label="Dolores"
          value={segment.pains}
          onChange={(value) => update("pains", value)}
        />
        <StringList
          label="Deseos"
          value={segment.desires}
          onChange={(value) => update("desires", value)}
        />
        <StringList
          label="Objeciones"
          value={segment.objections}
          onChange={(value) => update("objections", value)}
        />
      </div>
    </div>
  );
}
