import { Clock3, FileText, RefreshCw } from "lucide-react";
import { CollapsibleSection } from "@/components/content/collapsible-section";
import { ScriptDocument, TranscriptCopyButton } from "@/components/content/script-document";
import { ScriptRequestButton } from "@/components/content/script-request-button";
import { HelpHint } from "@/components/ui/help-hint";
import type { ScriptState } from "@/lib/content/script";

export function ScriptSection({
  state,
  mediaId,
  mediaAvailable,
}: {
  state: ScriptState;
  mediaId: string;
  mediaAvailable: boolean;
}) {
  const hasContent = state.status !== "not_requested" || !mediaAvailable;

  return (
    <CollapsibleSection
      sectionId={`transcript-${mediaId}`}
      title="Transcripción"
      icon={<FileText aria-hidden className="size-4" strokeWidth={1.7} />}
      help={<HelpHint text="Acá tenés el guion completo del Reel para leerlo, copiarlo o editarlo. Zenovi marca el Hook, el desarrollo y el CTA para ubicar cada parte." />}
      collapsible={hasContent}
      actions={state.status === "ready" ? (
          <TranscriptCopyButton transcript={state.script.transcript} />
        ) : state.status === "not_requested" && mediaAvailable ? (
          <ScriptRequestButton mediaId={mediaId} />
        ) : null}
    >
      {hasContent ? (
        <>
          {state.status === "not_requested" ? <Unavailable /> : null}
          {state.status === "queued" || state.status === "running" ? <InProgress /> : null}
          {state.status === "failed" ? (
            <Failed
              mediaId={mediaId}
              reason={state.reason}
              canRetry={state.canRetry && mediaAvailable}
            />
          ) : null}
          {state.status === "ready" ? <ScriptDocument script={state.script} /> : null}
        </>
      ) : null}
    </CollapsibleSection>
  );
}

function Unavailable() {
  return (
    <p className="font-sans text-[13px] font-normal text-graphite">
      Esperando que Instagram vuelva a entregar el video.
    </p>
  );
}

function InProgress() {
  return (
    <div className="flex items-start gap-3">
      <Clock3 aria-hidden className="mt-0.5 size-4 shrink-0 text-graphite" strokeWidth={1.7} />
      <p className="font-sans text-sm font-normal leading-6 text-graphite">
        Estamos transcribiendo el Reel. El texto aparecerá acá cuando termine.
      </p>
    </div>
  );
}

function Failed({ mediaId, reason, canRetry }: { mediaId: string; reason: string; canRetry: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <RefreshCw aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.7} />
      <div>
        <p className="font-sans text-sm font-normal leading-6 text-graphite">{reason}</p>
        {canRetry ? <div className="mt-3"><ScriptRequestButton mediaId={mediaId} retry /></div> : null}
      </div>
    </div>
  );
}
