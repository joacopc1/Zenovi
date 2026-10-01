import { FileText, LoaderCircle } from "lucide-react";
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
  const hasDocument = state.status === "ready";

  return (
    <CollapsibleSection
      sectionId={`transcript-${mediaId}`}
      title="Transcripción"
      icon={<FileText aria-hidden className="size-4" strokeWidth={1.7} />}
      help={<HelpHint text="Acá tenés el guion completo del Reel para leerlo, copiarlo o editarlo. Zenovi marca el Hook, el desarrollo y el CTA para ubicar cada parte." />}
      collapsible={hasDocument}
      actions={state.status === "ready" ? (
          <TranscriptCopyButton transcript={state.script.transcript} />
        ) : state.status === "not_requested" && mediaAvailable ? (
          <ScriptRequestButton mediaId={mediaId} />
        ) : state.status === "queued" || state.status === "running" ? (
          <span className="font-support inline-flex min-h-9 items-center gap-2 px-2 text-[13px] font-medium text-graphite">
            <LoaderCircle aria-hidden className="size-4 animate-spin" strokeWidth={1.8} />
            Transcribiendo…
          </span>
        ) : state.status === "failed" && state.canRetry && mediaAvailable ? (
          <div className="flex items-center justify-end gap-3">
            <span className="font-support hidden max-w-[320px] truncate text-[11px] text-danger sm:block">
              {state.reason}
            </span>
            <ScriptRequestButton mediaId={mediaId} retry showError={false} />
          </div>
        ) : state.status === "failed" ? (
          <span className="font-support max-w-[360px] truncate px-2 text-[11px] text-danger">
            {state.reason}
          </span>
        ) : (
          <span className="font-support px-2 text-[13px] font-medium text-graphite">
            Video no disponible
          </span>
        )}
    >
      {hasDocument ? <ScriptDocument script={state.script} /> : null}
    </CollapsibleSection>
  );
}
