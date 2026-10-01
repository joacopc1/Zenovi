import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/shell/app-header";
import { storyAnalysisBlocker } from "@/lib/content/analysis-readiness";
import type { StoryAnalysisState } from "@/lib/content/story-analysis";
import type { StorySequence } from "@/lib/content/story-sequences";
import { StoryAnalysisSection } from "./story-analysis-section";
import { StorySequenceSection } from "./story-sequence-section";

/**
 * El detalle de una Historia es el de su secuencia: lo primero que se ve es la tira.
 * Lo usan la página real y el ejemplo de desarrollo, para que nunca se separen.
 */
export function StoryDetail({
  sequence,
  sequences,
  activeStoryId,
  analysisState,
  notice,
  readOnly = false,
  previewHrefBase,
}: {
  sequence: StorySequence;
  sequences: readonly StorySequence[];
  activeStoryId: string;
  analysisState: StoryAnalysisState;
  /** Un aviso arriba de la secuencia; sólo lo usa el ejemplo. */
  notice?: ReactNode;
  readOnly?: boolean;
  previewHrefBase?: string;
}) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1160px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <Link
          href="/content?type=story"
          className="font-support inline-flex min-h-8 items-center gap-2 text-[13px] text-graphite hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="size-3.5" strokeWidth={1.7} />
          Volver a Historias
        </Link>
        {notice}

        <div className="mt-5 space-y-6">
          <StorySequenceSection
            sequence={sequence}
            sequences={sequences}
            activeStoryId={activeStoryId}
            previewHrefBase={previewHrefBase}
          />
          <StoryAnalysisSection
            state={analysisState}
            mediaId={activeStoryId}
            slideCount={sequence.stories.length}
            blockedReason={storyAnalysisBlocker(sequence)}
            readOnly={readOnly}
          />
        </div>
      </main>
    </>
  );
}
