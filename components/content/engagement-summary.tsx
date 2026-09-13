import type { ComponentType, SVGProps } from "react";
import type { ContentLibraryItem } from "@/lib/content/library";
import { CommentIcon, LikeIcon, SaveIcon, ShareIcon, ViewsIcon } from "./metric-icons";

const numberFormatter = new Intl.NumberFormat("es-UY", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const secondaryMetrics: {
  key: "likes" | "comments" | "saves" | "shares";
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { key: "likes", label: "Me gusta", icon: LikeIcon },
  { key: "saves", label: "Guardados", icon: SaveIcon },
  { key: "comments", label: "Comentarios", icon: CommentIcon },
  { key: "shares", label: "Compartidos", icon: ShareIcon },
];

export function EngagementSummary({ item }: { item: ContentLibraryItem }) {
  return (
    <dl className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5 text-ink">
        <ViewsIcon className="size-[17px] shrink-0" />
        <dd className="truncate text-[19px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
          {formatMetric(item.views)}
        </dd>
        <dt className="sr-only">Vistas</dt>
      </div>

      <div className="flex shrink-0 items-center gap-2 text-graphite">
        {secondaryMetrics.map(({ key, label, icon: Icon }) => (
          <div key={key} title={label} className="flex items-center gap-0.5">
            <Icon className="size-3 shrink-0" />
            <dd className="text-[11px] leading-none tabular-nums">{formatMetric(item[key])}</dd>
            <dt className="sr-only">{label}</dt>
          </div>
        ))}
      </div>
    </dl>
  );
}

function formatMetric(value: number | null) {
  return value === null ? "—" : numberFormatter.format(value);
}
