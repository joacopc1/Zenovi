"use client";

import { useState } from "react";

const COLLAPSED_LENGTH = 110;

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
  const { title, description } = splitCaption(caption, formatLabel);
  const canExpand =
    description.length > COLLAPSED_LENGTH || description.split("\n").length > 2;

  return (
    <header>
      <h1 className="text-xl font-semibold tracking-[-0.02em]">{title}</h1>
      <p
        className={`font-support mt-1.5 whitespace-pre-line text-[14px] leading-5 text-graphite ${expanded ? "" : "line-clamp-2"}`}
      >
        {description}
      </p>
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="font-support mt-1 text-[13px] font-medium text-ink underline decoration-mist-strong underline-offset-4 hover:decoration-ink"
        >
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      ) : null}
      <p className="font-support mt-1.5 text-xs text-muted">Publicado el {publishedLabel}</p>
    </header>
  );
}

function splitCaption(caption: string | null, formatLabel: string) {
  const text = caption?.trim();

  if (!text) {
    return { title: formatLabel, description: "Sin descripción." };
  }

  const paragraphs = text.split(/\n+/).map((part) => part.trim()).filter(Boolean);
  const firstLineReadsAsTitle = paragraphs.length > 1 && paragraphs[0].length <= 120;

  return firstLineReadsAsTitle
    ? { title: paragraphs[0], description: paragraphs.slice(1).join("\n") }
    : { title: formatLabel, description: text };
}
