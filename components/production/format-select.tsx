"use client";

import { Check } from "lucide-react";
import { useDismissibleDetails } from "@/components/shell/use-dismissible-details";
import { CONTENT_FORMATS, type ContentFormat } from "@/lib/production/content";

const FORMAT_LABELS: Record<ContentFormat, string> = {
  reel: "Reel",
  story: "Story",
  post: "Post",
};

export function FormatSelect({
  value,
  onChange,
}: {
  value: ContentFormat;
  onChange: (value: ContentFormat) => void;
}) {
  const detailsRef = useDismissibleDetails();

  return (
    <details ref={detailsRef} className="relative">
      <summary
        aria-label={`Formato: ${FORMAT_LABELS[value]}`}
        className="flex min-h-[38px] w-full cursor-pointer list-none items-center justify-between rounded-control border border-mist-strong bg-paper px-3 text-sm text-ink [&::-webkit-details-marker]:hidden"
      >
        {FORMAT_LABELS[value]}
        <ChevronIcon className="size-3.5 text-muted" />
      </summary>

      <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-card border border-mist bg-paper p-1 shadow-[0_12px_32px_rgba(0,0,0,0.10)]">
        {CONTENT_FORMATS.map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => {
              onChange(format);
              detailsRef.current?.removeAttribute("open");
            }}
            className={`flex min-h-8 w-full items-center justify-between rounded-control px-2.5 text-[13px] transition-colors ${
              format === value ? "bg-ink/[0.065] text-ink" : "text-graphite hover:bg-canvas hover:text-ink"
            }`}
          >
            {FORMAT_LABELS[format]}
            {format === value ? <Check size={14} strokeWidth={1.75} className="text-ink" /> : null}
          </button>
        ))}
      </div>
    </details>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m6 9.5 6 5.5 6-5.5" />
    </svg>
  );
}
