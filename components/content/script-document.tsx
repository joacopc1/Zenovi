"use client";

import { useMemo, useState } from "react";
import { Check, Clock3, Copy } from "lucide-react";
import { formatMoment } from "@/lib/content/analysis";
import { seekReel } from "@/lib/content/reel-seek";
import type { ReelScript, ScriptRole } from "@/lib/content/script";

const roleLabels: Record<ScriptRole, string> = {
  hook: "Hook",
  development: "Desarrollo",
  cta: "CTA",
};

const roleClasses: Record<ScriptRole, string> = {
  hook: "border-warning/40 bg-warning/15 text-warning",
  development: "border-mist-strong bg-ink/[0.06] text-ink/80",
  cta: "border-danger/35 bg-danger/[0.12] text-danger",
};

export function TranscriptCopyButton({ transcript }: { transcript: ReelScript["transcript"] }) {
  const [copied, setCopied] = useState(false);
  const cleanText = useMemo(
    () => transcript.map((line) => line.quote).join(" "),
    [transcript],
  );

  async function copy() {
    await navigator.clipboard.writeText(cleanText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Transcripción copiada" : "Copiar transcripción"}
      aria-label={copied ? "Transcripción copiada" : "Copiar transcripción"}
      className="inline-flex size-8 items-center justify-center rounded-control border border-mist bg-paper text-graphite transition-colors hover:border-mist-strong hover:bg-canvas hover:text-ink"
    >
      {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
    </button>
  );
}

export function ScriptDocument({ script }: { script: ReelScript }) {
  return (
    <ol className="divide-y divide-mist">
      {script.segments.map((segment, index) => {
        const lines = transcriptForSegment(script, index);
        return (
          <li
            key={`${segment.role}-${segment.fromMs}-${index}`}
            className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[104px_minmax(0,1fr)]"
          >
            <div className="flex items-center gap-2 sm:block">
              <span
                className={`font-support inline-flex rounded-[6px] border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${roleClasses[segment.role]}`}
              >
                {roleLabels[segment.role]}
              </span>
              <button
                type="button"
                onClick={() => seekReel(segment.fromMs)}
                className="font-numeric mt-0 flex items-center gap-1 text-[11px] font-medium text-ink/75 transition-colors hover:text-ink sm:mt-2"
                aria-label={`Reproducir desde ${formatMoment(segment.fromMs)}`}
              >
                <Clock3 aria-hidden className="size-3" strokeWidth={1.7} />
                {formatMoment(segment.fromMs)}
              </button>
            </div>

            <p className="font-sans text-[14px] font-normal leading-6 text-ink/85">
              {lines.length > 0
                ? lines.map((line) => line.quote).join(" ")
                : "No hay voz transcripta en este tramo."}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function transcriptForSegment(script: ReelScript, index: number) {
  const segment = script.segments[index];
  const isLast = index === script.segments.length - 1;
  return script.transcript.filter(
    (line) =>
      line.atMs >= segment.fromMs &&
      (line.atMs < segment.toMs || (isLast && line.atMs <= segment.toMs)),
  );
}
