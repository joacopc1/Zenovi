import Link from "next/link";
import { Fragment } from "react";
import { ArrowRight, Eye, LogOut, MessageCircle, UsersRound, type LucideIcon } from "lucide-react";
import { HelpHint } from "@/components/ui/help-hint";
import type { StorySequence } from "@/lib/content/story-sequences";
import { storyReachChange } from "@/lib/content/story-sequences";
import { ContentThumbnail } from "./content-thumbnail";
import { StoryStrip } from "./story-strip";
import { formatCompact } from "@/lib/format/numbers";
import { StorySequenceResults } from "./story-sequence-results";

const dateFormatter = new Intl.DateTimeFormat("es-UY", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Montevideo",
});
const timeFormatter = new Intl.DateTimeFormat("es-UY", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Montevideo",
});

export function StorySequenceSection({
  sequence,
  sequences,
  activeStoryId,
  previewHrefBase,
}: {
  sequence: StorySequence;
  /** Todas las secuencias de la cuenta: contra ellas se compara esta. */
  sequences: readonly StorySequence[];
  activeStoryId: string;
  previewHrefBase?: string;
}) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-card border border-mist bg-paper" aria-labelledby="story-sequence-title">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 id="story-sequence-title" className="text-[16px] font-semibold tracking-[-0.01em]">
              Secuencia del {dateFormatter.format(new Date(sequence.startedAt))}
            </h2>
            <HelpHint text="Las Historias que publicaste ese día, en orden. El porcentaje entre una y otra es cuánta gente se perdió." />
          </div>
          <span className="font-support text-[13px] text-graphite">
            {sequence.stories.length} {sequence.stories.length === 1 ? "Historia" : "Historias"}
          </span>
        </header>

        <StoryStrip style={stripColumns(sequence.stories.length)}>
          {sequence.stories.map((story, index) => {
            const previous = sequence.stories[index - 1];
            const change = previous ? storyReachChange(previous, story) : null;
            const active = story.id === activeStoryId;

            return (
              <Fragment key={story.id}>
                {previous ? (
                  <div className="font-support row-start-1 flex flex-col items-center gap-2 self-center pt-6 text-[10px] font-semibold">
                    <div className="flex w-full items-center" aria-hidden="true">
                      <span className="h-px flex-1 bg-mist" />
                      <span className="grid size-7 shrink-0 place-items-center rounded-full border border-mist bg-paper text-graphite">
                        <ArrowRight className="size-3.5" strokeWidth={1.8} />
                      </span>
                      <span className="h-px flex-1 bg-mist" />
                    </div>
                    <span className={`text-center ${storyChangeTone(change)}`}>{describeStoryTransition(change)}</span>
                  </div>
                ) : null}

                <article
                  className={`row-span-2 grid snap-start grid-rows-subgrid rounded-control border bg-paper p-2.5 ${active ? "border-mist-strong" : "border-mist"}`}
                >
                  <Link
                    href={previewHrefBase ? `${previewHrefBase}${encodeURIComponent(story.id)}` : `/content/${story.id}?type=story`}
                    aria-current={active ? "page" : undefined}
                    aria-label={`Ver Historia ${index + 1}`}
                  >
                    <div className="relative overflow-hidden rounded-[8px] bg-canvas">
                      <ContentThumbnail item={story} interactive />
                      <span
                        className={`font-numeric absolute left-2 top-2 flex h-5 items-center gap-1.5 rounded-full px-2 text-[10px] ${active ? "bg-white text-ink" : "bg-black/65 text-white"}`}
                      >
                        <span className="font-semibold">{index + 1}</span>
                        <span className="opacity-80">{timeFormatter.format(new Date(story.postedAt))}</span>
                      </span>
                      <span className="font-numeric absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent pb-2.5 pt-6 text-[12px] font-medium text-white">
                        <Eye aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                        {formatCompact(story.views)}
                        <span className="sr-only">views</span>
                      </span>
                    </div>
                  </Link>

                  <div className="font-support mt-3 space-y-2 text-[12px] text-graphite">
                    <StoryStat icon={UsersRound} label="Personas" value={story.reach} />
                    <StoryStat icon={MessageCircle} label="Respuestas" value={story.replies} />
                    <StoryStat icon={LogOut} label="Salieron" value={story.storyExits} />
                  </div>
                </article>
              </Fragment>
            );
          })}
        </StoryStrip>
      </section>
      <StorySequenceResults sequence={sequence} sequences={sequences} />
    </div>
  );
}

const CONNECTOR_WIDTH = 56;

/** Entran cuatro Historias a lo ancho; desde la quinta la fila se recorre con las flechas. */
function stripColumns(count: number) {
  const card = `max(200px, calc((100% - ${3 * CONNECTOR_WIDTH}px) / 4))`;
  return { gridTemplateColumns: Array.from({ length: count }, () => card).join(` ${CONNECTOR_WIDTH}px `) };
}

function StoryStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | null }) {
  return (
    <p className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-1.5">
        <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.6} />
        <span className="truncate">{label}</span>
      </span>
      <strong className="font-numeric font-medium text-ink">{formatCompact(value)}</strong>
    </p>
  );
}

/** Un cambio menor a medio punto se lee como estable, igual que en el resto de Zenovi. */
const STABLE_THRESHOLD = 0.005;

function describeStoryTransition(value: number | null) {
  if (value === null) return "Sin dato";
  if (Math.abs(value) < STABLE_THRESHOLD) return "Se mantuvo";
  const percentage = Math.abs(value * 100).toLocaleString("es-UY", { maximumFractionDigits: 1 });
  return `${value > 0 ? "Subió" : "Bajó"} ${percentage}%`;
}

function storyChangeTone(value: number | null) {
  if (value === null || Math.abs(value) < STABLE_THRESHOLD) return "text-muted";
  return value > 0 ? "text-success" : "text-danger";
}
