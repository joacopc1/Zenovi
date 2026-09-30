import { Activity, UserPlus, UserRoundSearch } from "lucide-react";
import type { ContentLibraryItem } from "@/lib/content/library";
import { HelpHint } from "@/components/ui/help-hint";

const numberFormatter = new Intl.NumberFormat("es-UY");

const metrics = [
  {
    key: "follows",
    label: "Seguidores ganados",
    icon: UserPlus,
  },
  {
    key: "profileVisits",
    label: "Visitas al perfil",
    icon: UserRoundSearch,
  },
  {
    key: "profileActivity",
    label: "Actividad en el perfil",
    icon: Activity,
  },
] as const;

/** Acciones de crecimiento que Instagram atribuye directamente a un post del feed. */
export function PublicationGrowth({ item }: { item: ContentLibraryItem }) {
  const hasAnyMetric = metrics.some(({ key }) => item[key] !== null);

  return (
    <section
      className="rounded-card border border-mist bg-paper px-5 py-5"
      aria-labelledby="publication-growth-title"
    >
      <h2
        id="publication-growth-title"
        className="flex items-center gap-2 text-[14px] font-semibold text-ink"
      >
        <UserPlus aria-hidden="true" className="size-4 text-ink" strokeWidth={1.7} />
        Crecimiento desde este post
        <HelpHint text="Muestra las acciones que Instagram atribuye directamente a esta publicación. No estima ventas ni reparte el crecimiento de la cuenta por cercanía de fechas." />
      </h2>

      {hasAnyMetric ? (
        <dl className="mt-4 divide-y divide-mist border-y border-mist">
          {metrics.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex min-h-12 items-center justify-between gap-4 py-2.5">
              <dt className="font-support flex items-center gap-2 text-[13px] text-ink">
                <Icon aria-hidden="true" className="size-3.5 text-ink" strokeWidth={1.65} />
                {label}
              </dt>
              <dd className="font-numeric text-[16px] font-semibold tabular-nums text-ink">
                {formatMetric(item[key])}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="font-support mt-4 text-[13px] leading-5 text-muted">
          Instagram todavía no devolvió datos de crecimiento para esta publicación.
        </p>
      )}
    </section>
  );
}

function formatMetric(value: number | null) {
  return value === null ? "—" : numberFormatter.format(Math.round(value));
}
