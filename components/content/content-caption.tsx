"use client";

import { useState } from "react";
import { splitDisplayCaption } from "@/lib/content/caption-display";

const COLLAPSED_LENGTH = 105;

export function ContentCaption({
  caption,
  publishedLabel,
  formatLabel,
}: {
  caption: string | null;
  publishedLabel: string;
  formatLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { title, description } = splitDisplayCaption(caption, formatLabel);
  const canExpand =
    description.length > COLLAPSED_LENGTH || description.split("\n").length > 2;
  const visibleDescription =
    !expanded && canExpand ? truncateAtWord(description, COLLAPSED_LENGTH) : description;
  const inlineTail = canExpand ? splitInlineTail(visibleDescription) : null;

  return (
    <header>
      <h1 className="text-xl font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="font-support mt-1.5 whitespace-pre-line text-[14px] leading-5 text-graphite">
        {inlineTail ? (
          <>
            {inlineTail.lead ? `${inlineTail.lead} ` : null}
            <span className="whitespace-nowrap">
              {inlineTail.tail}{!expanded ? "…" : ""}{" "}
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                className="font-support text-[13px] font-medium text-muted transition-colors hover:text-graphite"
              >
                {expanded ? "Ver menos" : "Ver más"}
              </button>
            </span>
          </>
        ) : (
          visibleDescription
        )}
      </p>
      <p className="font-support mt-1.5 text-xs text-muted">Publicado el {publishedLabel}</p>
    </header>
  );
}

function truncateAtWord(text: string, maximum: number) {
  if (text.length <= maximum) return text;
  const candidate = text.slice(0, maximum + 1).replace(/\s+\S*$/u, "").trimEnd();
  return candidate || text.slice(0, maximum).trimEnd();
}

function splitInlineTail(text: string) {
  const match = text.match(/^([\s\S]*)\s+(\S+)$/u);
  return match
    ? { lead: match[1].trimEnd(), tail: match[2] }
    : { lead: "", tail: text };
}
