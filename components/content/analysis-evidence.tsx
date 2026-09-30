"use client";

import { Play } from "lucide-react";
import { formatMoment, type AnalysisMoment } from "@/lib/content/analysis";
import { seekReel } from "@/lib/content/reel-seek";

export function AnalysisMomentLinks({ moments }: { moments: AnalysisMoment[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {moments.map((moment, index) => (
        <li key={`${moment.atMs}-${index}`}>
          <button
            type="button"
            onClick={() => seekReel(moment.atMs)}
            title={moment.quote}
            className="font-numeric inline-flex min-h-7 items-center gap-1.5 rounded-control bg-canvas px-2.5 text-[11px] font-medium text-ink/70 transition-colors hover:bg-ink/[0.08] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            aria-label={`Reproducir desde ${formatMoment(moment.atMs)}: ${moment.quote}`}
          >
            <Play aria-hidden className="size-2.5 fill-current" />
            Ver {formatMoment(moment.atMs)}
          </button>
        </li>
      ))}
    </ul>
  );
}
