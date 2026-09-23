import { Bookmark, Heart, MessageCircle, Send, Waypoints, type LucideIcon } from "lucide-react";
import type { ContentLibraryItem } from "@/lib/content/library";

const numberFormatter = new Intl.NumberFormat("es-UY");
const percentFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

const definitions: {
  key: "likes" | "comments" | "saves" | "shares";
  label: string;
  icon: LucideIcon;
}[] = [
  { key: "likes", label: "Me gusta", icon: Heart },
  { key: "comments", label: "Comentarios", icon: MessageCircle },
  { key: "saves", label: "Guardados", icon: Bookmark },
  { key: "shares", label: "Compartidos", icon: Send },
];

export function EngagementBreakdown({ item }: { item: ContentLibraryItem }) {
  const entries = definitions.map((definition) => ({
    ...definition,
    value: item[definition.key],
    rate: percentageOf(item[definition.key], item.views),
  }));
  const maxRate = Math.max(0, ...entries.map((entry) => entry.rate ?? 0));

  return (
    <section className="rounded-card border border-mist bg-paper px-5 py-5" aria-labelledby="engagement-breakdown-title">
      <h2 id="engagement-breakdown-title" className="flex items-center gap-2 text-[14px] font-semibold text-ink">
        <Waypoints aria-hidden="true" className="size-4 text-ink" strokeWidth={1.7} />
        Acciones de la audiencia
      </h2>

      <dl className="mt-4 space-y-3.5">
        {entries.map(({ key, label, icon: Icon, value, rate }) => (
          <div key={key}>
            <div className="font-support flex items-center justify-between gap-3 text-[13px]">
              <dt className="flex items-center gap-2 text-ink">
                <Icon aria-hidden="true" className="size-3.5 text-ink" strokeWidth={1.65} />
                {label}
              </dt>
              <dd className="font-numeric flex items-baseline gap-2 tabular-nums">
                <span className="font-semibold text-ink">{formatCount(value)}</span>
                <span className="text-[11px] text-muted">{formatRate(rate)}</span>
              </dd>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-control" aria-hidden="true">
              <div
                className="h-full rounded-full bg-ink transition-[width] duration-500"
                style={{ width: `${relativeWidth(rate, maxRate)}%` }}
              />
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}

function percentageOf(value: number | null, total: number | null) {
  if (value === null || total === null || total <= 0) return null;
  return (value / total) * 100;
}

function relativeWidth(rate: number | null, maxRate: number) {
  if (rate === null || maxRate <= 0) return 0;
  return Math.max(2, (rate / maxRate) * 100);
}

function formatCount(value: number | null) {
  return value === null ? "—" : numberFormatter.format(Math.round(value));
}

function formatRate(value: number | null) {
  return value === null ? "Sin dato" : `${percentFormatter.format(value)}% de views`;
}
