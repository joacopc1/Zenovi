"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function CollapsibleSection({
  sectionId,
  title,
  icon,
  help,
  actions,
  children,
  footer,
  collapsible = true,
}: {
  sectionId: string;
  title: string;
  icon: ReactNode;
  help?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const titleId = `${sectionId}-title`;
  const contentId = `${sectionId}-content`;
  const expanded = collapsible && open;
  const toggle = () => setOpen((current) => !current);

  return (
    <section className="rounded-card border border-mist bg-paper" aria-labelledby={titleId}>
      <header className={`relative flex items-center ${expanded ? "border-b border-mist" : ""}`}>
        {collapsible ? (
          <>
            <button
              type="button"
              aria-label={open ? `Cerrar ${title}` : `Abrir ${title}`}
              aria-expanded={open}
              aria-controls={contentId}
              onClick={toggle}
              className="absolute inset-0 z-0 cursor-pointer rounded-card focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
            />
            <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-2 px-5 py-4">
              <h2 id={titleId} className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                {icon}
                {title}
              </h2>
              {help ? <span className="pointer-events-auto">{help}</span> : null}
            </div>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2 px-5 py-4">
            <h2 id={titleId} className="flex items-center gap-2 text-[15px] font-semibold text-ink">
              {icon}
              {title}
            </h2>
            {help}
          </div>
        )}
        <div
          className={`relative z-10 flex shrink-0 items-center gap-2 pr-3 ${collapsible ? "pointer-events-none" : ""}`}
        >
          {actions ? <div className={collapsible ? "pointer-events-auto" : undefined}>{actions}</div> : null}
          {collapsible ? (
            <button
              type="button"
              aria-label={open ? `Cerrar ${title}` : `Abrir ${title}`}
              aria-expanded={open}
              aria-controls={contentId}
              onClick={toggle}
              className="pointer-events-auto grid size-9 place-items-center rounded-control text-graphite transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
            >
              <ChevronDown
                aria-hidden
                className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
                strokeWidth={1.7}
              />
            </button>
          ) : null}
        </div>
      </header>
      {expanded ? (
        <div id={contentId}>
          <div className="px-5 py-5">{children}</div>
          {footer ? <div className="border-t border-mist px-5 py-3">{footer}</div> : null}
        </div>
      ) : null}
    </section>
  );
}
