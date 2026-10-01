import { Clock3, RefreshCw } from "lucide-react";
import { AnalysisRequestButton, type AnalysisSubject } from "./analysis-request-button";

export function AnalysisInProgress() {
  return (
    <div className="flex items-start gap-3">
      <Clock3 aria-hidden className="mt-0.5 size-4 shrink-0 text-graphite" strokeWidth={1.75} />
      <p className="font-sans text-sm font-normal leading-6 text-graphite">
        Estamos analizando la pieza. El resultado aparece acá cuando termine.
      </p>
    </div>
  );
}

export function AnalysisFailed({
  subject,
  mediaId,
  reason,
  canRetry,
}: {
  subject: AnalysisSubject;
  mediaId: string;
  reason: string;
  canRetry: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <RefreshCw aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.75} />
      <div>
        <p className="font-sans text-sm font-normal leading-6 text-graphite">{reason}</p>
        {canRetry ? <div className="mt-3"><AnalysisRequestButton subject={subject} mediaId={mediaId} retry /></div> : null}
      </div>
    </div>
  );
}

export function AnalysisDate({ completedAt }: { completedAt: string }) {
  return (
    <p className="font-support text-xs text-muted">
      Analizado el {new Date(completedAt).toLocaleDateString("es-UY", { day: "numeric", month: "long" })}
    </p>
  );
}
