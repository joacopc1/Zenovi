"use client";

import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { sendFeedback } from "./feedback-actions";
import { useDismissibleDetails } from "./use-dismissible-details";

/** El botón "Feedback" del header: un cuadro para contarnos algo sin salir de la pantalla. */
export function FeedbackMenu() {
  const detailsRef = useDismissibleDetails();
  const pathname = usePathname();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await sendFeedback(message, pathname);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("");
      setSent(true);
    });
  }

  return (
    <details ref={detailsRef} className="group relative" onToggle={(event) => !event.currentTarget.open && setSent(false)}>
      <summary className="flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-control border border-mist bg-paper px-2.5 text-[11px] font-medium text-ink hover:bg-canvas [&::-webkit-details-marker]:hidden">
        Feedback
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-card border border-mist bg-paper p-3 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        {sent ? (
          <div className="px-1 py-3 text-center">
            <p className="text-sm font-semibold text-ink">¡Gracias!</p>
            <p className="font-support mt-1 text-[13px] text-graphite">Lo leemos todo. Si hace falta, te escribimos.</p>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label htmlFor="feedback-message" className="text-[13px] font-semibold text-ink">
              ¿Qué mejorarías?
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              rows={4}
              className="font-support mt-2 w-full resize-none rounded-control border border-mist-strong bg-paper px-3 py-2 text-[13px] leading-5 text-ink outline-none placeholder:text-muted focus:border-ink"
            />
            {error ? <p className="mt-1 text-[12px] text-danger">{error}</p> : null}
            <div className="mt-2 flex justify-end">
              <button type="submit" disabled={pending || message.trim().length === 0} className="inline-flex min-h-8 items-center rounded-control bg-ink px-3 text-[12px] font-semibold text-white hover:bg-ink/85 disabled:opacity-40">
                {pending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </details>
  );
}
