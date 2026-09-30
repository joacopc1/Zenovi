"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import {
  requestReelAnalysis,
  type RequestAnalysisResult,
} from "@/app/(dashboard)/content/[id]/actions";

export function AnalysisRequestButton({
  mediaId,
  retry = false,
  refresh = false,
}: {
  mediaId: string;
  retry?: boolean;
  refresh?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RequestAnalysisResult>({ status: "idle" });
  const Icon = pending ? LoaderCircle : retry || refresh ? RefreshCw : Sparkles;

  function requestAnalysis() {
    setResult({ status: "idle" });
    startTransition(async () => {
      const next = await requestReelAnalysis(mediaId, refresh);
      setResult(next);
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={requestAnalysis}
        className={`inline-flex min-h-9 items-center gap-2 rounded-control px-4 text-sm font-semibold transition-colors disabled:cursor-wait ${
          refresh
            ? "border border-mist bg-paper text-ink hover:border-mist-strong hover:bg-canvas disabled:text-muted"
            : "bg-ink text-paper hover:bg-ink/85 disabled:bg-ink/55"
        }`}
      >
        <Icon size={15} strokeWidth={2} aria-hidden className={pending ? "animate-spin" : ""} />
        {pending
          ? refresh ? "Actualizando…" : "Analizando…"
          : retry
            ? "Volver a intentar"
            : refresh
              ? "Actualizar análisis"
              : "Analizar este Reel"}
      </button>
      {result.status === "error" && result.message ? (
        <p className="font-support mt-2 text-xs text-danger" role="alert">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
