"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, LoaderCircle, RefreshCw } from "lucide-react";
import {
  requestReelScript,
  type RequestScriptResult,
} from "@/app/(dashboard)/content/[id]/actions";
import { ACTION_CREDITS } from "@/lib/credits/pricing";
import { CreditCost } from "./credit-cost";

export function ScriptRequestButton({
  mediaId,
  retry = false,
  showError = true,
}: {
  mediaId: string;
  retry?: boolean;
  showError?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RequestScriptResult>({ status: "idle" });
  const Icon = pending ? LoaderCircle : retry ? RefreshCw : FileText;

  function requestScript() {
    setResult({ status: "idle" });
    startTransition(async () => {
      const next = await requestReelScript(mediaId);
      setResult(next);
      router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={requestScript}
        className="inline-flex min-h-9 items-center gap-2 rounded-control bg-ink px-4 text-sm font-semibold text-paper transition-colors hover:bg-ink/85 disabled:cursor-wait disabled:bg-ink/55"
      >
        <Icon size={15} strokeWidth={2} aria-hidden className={pending ? "animate-spin" : ""} />
        {pending ? "Transcribiendo…" : retry ? "Volver a intentar" : "Generar transcripción"}
        {pending ? null : <CreditCost credits={ACTION_CREDITS.reel_script} tone="onDark" />}
      </button>
      {showError && result.status === "error" && result.message ? (
        <p className="font-support mt-2 text-xs text-danger" role="alert">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
