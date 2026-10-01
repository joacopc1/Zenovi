import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryDetail } from "@/components/content/story-detail";
import {
  STORY_PREVIEW_ANALYSIS,
  STORY_PREVIEW_ITEMS,
  STORY_PREVIEW_SEQUENCE,
  STORY_PREVIEW_SEQUENCES,
} from "@/lib/content/story-preview";

export const metadata: Metadata = {
  title: "Ejemplo de Historias · Zenovi",
  robots: { index: false, follow: false },
};

export default async function StoryPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ slide?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const query = await searchParams;
  const requestedId = Array.isArray(query.slide) ? query.slide[0] : query.slide;
  const item = STORY_PREVIEW_ITEMS.find((story) => story.id === requestedId) ?? STORY_PREVIEW_ITEMS[0];

  return (
    <StoryDetail
      sequence={STORY_PREVIEW_SEQUENCE}
      sequences={STORY_PREVIEW_SEQUENCES}
      activeStoryId={item.id}
      analysisState={{ status: "ready", analysis: STORY_PREVIEW_ANALYSIS }}
      readOnly
      previewHrefBase="/content/story-preview?slide="
      notice={
        <p className="font-support mt-3 inline-flex items-center gap-2 rounded-full border border-mist px-3 py-1 text-[12px] text-graphite">
          Ejemplo con datos ficticios · sólo en desarrollo
        </p>
      }
    />
  );
}
