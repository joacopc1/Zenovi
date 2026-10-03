import Link from "next/link";
import { ContentCard } from "@/components/content/content-card";
import { ContentFilters } from "@/components/content/content-filters";
import { LibraryPagination } from "@/components/content/library-pagination";
import { ReelCard } from "@/components/content/reel-card";
import { StorySequenceCard } from "@/components/content/story-sequence-card";
import { SyncButton } from "@/components/home/sync-button";
import { SyncNotice } from "@/components/home/sync-notice";
import { InstagramConnectionNotice } from "@/components/states/instagram-connection-notice";
import { AppHeader } from "@/components/shell/app-header";
import {
  buildCohort,
  searchContentItems,
  sortContentItems,
  type ContentKind,
  type ContentSort,
  type ContentSortDirection,
  type RankedContentItem,
} from "@/lib/content/library";
import { paginate } from "@/lib/content/pagination";
import {
  buildStorySequences,
  parseStorySequenceSort,
  sequenceDayLabel,
  sortStorySequences,
  storyAgeLabel,
  type StorySequenceSort,
} from "@/lib/content/story-sequences";
import { getAccountContext } from "@/lib/data/account-context";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";
import { EmptyState } from "@/components/ui/empty-state";

type ContentSearchParams = {
  type?: string | string[];
  q?: string | string[];
  sort?: string | string[];
  dir?: string | string[];
  page?: string | string[];
  sync?: string | string[];
};

const kindTitles: Record<ContentKind, string> = {
  reel: "Reels",
  publication: "Posts",
  story: "Historias",
};

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<ContentSearchParams>;
}) {
  const account = await getAccountContext();
  const query = await searchParams;
  const library = account?.workspace
    ? await getInstagramContentLibrary(account.workspace.id)
    : null;
  const unhealthy =
    account?.instagram && account.instagram.status !== "connected"
      ? account.instagram.status
      : null;
  const selectedType = parseContentKind(firstValue(query.type));
  const isStories = selectedType === "story";
  // Las Historias se ordenan como secuencias y no tienen texto que buscar.
  const storySort = parseStorySequenceSort(firstValue(query.sort));
  const contentSort = parseContentSort(firstValue(query.sort));
  const selectedSort = isStories ? storySort : contentSort;
  const selectedDirection = parseSortDirection(firstValue(query.dir));
  const search = isStories ? "" : firstValue(query.q)?.trim() ?? "";
  const cohort = library ? buildCohort(library.items, selectedType) : [];
  // Buscar y ordenar abarcan todo; la página sólo recorta lo que se ve.
  const requestedPage = Number(firstValue(query.page) ?? 1);
  const listing = isStories
    ? listStorySequences(cohort, storySort, selectedDirection, requestedPage)
    : listContentItems(
        sortContentItems(searchContentItems(cohort, search), contentSort, selectedDirection),
        selectedType,
        requestedPage,
      );
  const { pagination } = listing;

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1240px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <SyncNotice
          key={firstValue(query.sync)}
          status={firstValue(query.sync)}
        />

        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">
            {kindTitles[selectedType]}
          </h1>
          {library ? <SyncButton redirectTo="/content" /> : null}
        </header>

        {unhealthy ? (
          <InstagramConnectionNotice status={unhealthy} redirectTo="/content" />
        ) : library ? (
          <>
            <ContentFilters
              kind={selectedType}
              search={search}
              sort={selectedSort}
              sortOptions={isStories ? STORY_SORT_OPTIONS : CONTENT_SORT_OPTIONS}
              direction={selectedDirection}
              resultCount={pagination.total}
              resultLabel={listing.resultLabel}
            />

            {listing.results ?? (
              <EmptyLibrary
                filtered={library.items.length > 0}
                selectedType={selectedType}
                showStoryPreview={process.env.NODE_ENV !== "production"}
              />
            )}

            <LibraryPagination
              state={{ kind: selectedType, sort: selectedSort, direction: selectedDirection, search }}
              page={pagination.page}
              totalPages={pagination.totalPages}
              from={pagination.from}
              to={pagination.to}
              total={pagination.total}
            />
          </>
        ) : (
          <DisconnectedLibrary />
        )}
      </main>
    </>
  );
}

/** Una Historia sola no cuenta nada: se lee la secuencia del día completa. */
function listStorySequences(
  items: RankedContentItem[],
  sort: StorySequenceSort,
  direction: ContentSortDirection,
  requestedPage: number,
) {
  const pagination = paginate(sortStorySequences(buildStorySequences(items), sort, direction), requestedPage);

  return {
    pagination,
    resultLabel: "secuencia",
    results: pagination.total > 0 ? (
      <section aria-label="Secuencias de Historias" className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pagination.pageItems.map((sequence, index) => (
          <StorySequenceCard
            key={sequence.id}
            sequence={sequence}
            dayLabel={sequenceDayLabel(sequence.startedAt)}
            ageLabels={sequence.stories.map((story) => storyAgeLabel(story.postedAt))}
            priority={pagination.page === 1 && index < 4}
          />
        ))}
      </section>
    ) : null,
  };
}

function listContentItems(items: RankedContentItem[], kind: ContentKind, requestedPage: number) {
  const pagination = paginate(items, requestedPage);
  const isReel = kind === "reel";

  return {
    pagination,
    resultLabel: "pieza",
    results: pagination.total > 0 ? (
      <section
        aria-label="Piezas de contenido"
        className={`mt-5 grid gap-4 ${isReel ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3"}`}
      >
        {pagination.pageItems.map((item, index) => (
          isReel ? (
            <ReelCard key={item.id} item={item} priority={pagination.page === 1 && index < 4} />
          ) : (
            <ContentCard key={item.id} item={item} priority={pagination.page === 1 && index < 3} />
          )
        ))}
      </section>
    ) : null,
  };
}

function EmptyLibrary({
  filtered,
  selectedType,
  showStoryPreview,
}: {
  filtered: boolean;
  selectedType: ContentKind;
  showStoryPreview: boolean;
}) {
  const isStories = selectedType === "story";
  return (
    <section className="mt-5 flex rounded-card border border-mist py-6">
      <EmptyState
        illustration={filtered ? "chart" : "spotlight"}
        title={isStories ? "Todavía no hay Historias disponibles" : filtered ? "No encontramos coincidencias" : "Todavía no hay contenido sincronizado"}
        description={
          isStories
            ? "Zenovi muestra las Historias que captura desde que su sincronización está activa."
            : filtered
              ? "Probá otro texto, formato u orden para volver a ver piezas."
              : "Actualizá la cuenta para traer tus posts desde Instagram."
        }
        action={
          isStories && showStoryPreview ? (
            <Link
              href="/content/story-preview"
              className="font-support inline-flex min-h-9 items-center rounded-control border border-mist bg-paper px-4 text-[13px] font-semibold text-ink transition-colors hover:border-mist-strong hover:bg-canvas"
            >
              Ver ejemplo de una secuencia
            </Link>
          ) : undefined
        }
      />
    </section>
  );
}

function DisconnectedLibrary() {
  return (
    <section className="mt-8 max-w-xl rounded-card border border-mist p-6">
      <h2 className="text-lg font-semibold">Conectá Instagram para reunir tu contenido</h2>
      <p className="mt-2 text-sm leading-6 text-graphite">
        Zenovi necesita una cuenta profesional para mostrar cada pieza junto con sus métricas oficiales.
      </p>
      <Link href="/onboarding/instagram" className="mt-5 inline-flex min-h-9 items-center rounded-control bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85">
        Conectar Instagram
      </Link>
    </section>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseContentKind(value: string | undefined): ContentKind {
  return value === "story" || value === "publication" ? value : "reel";
}

const CONTENT_SORT_OPTIONS: { value: ContentSort; label: string }[] = [
  { value: "recent", label: "Fecha" },
  { value: "views", label: "Visualizaciones" },
  { value: "reach", label: "Alcance" },
  { value: "interactions", label: "Interacciones" },
  { value: "likes", label: "Me gusta" },
  { value: "comments", label: "Comentarios" },
  { value: "saves", label: "Guardados" },
  { value: "shares", label: "Compartidos" },
  { value: "multiplier", label: "Multiplicador" },
];

const STORY_SORT_OPTIONS: { value: StorySequenceSort; label: string }[] = [
  { value: "recent", label: "Fecha" },
  { value: "completion", label: "Completaron" },
  { value: "replies", label: "Respuestas" },
  { value: "reach", label: "Personas" },
  { value: "stories", label: "Cantidad de Historias" },
];

const sortValues: ContentSort[] = [
  "views",
  "reach",
  "interactions",
  "likes",
  "comments",
  "saves",
  "shares",
  "multiplier",
];

function parseContentSort(value: string | undefined): ContentSort {
  return sortValues.includes(value as ContentSort) ? (value as ContentSort) : "recent";
}

function parseSortDirection(value: string | undefined): ContentSortDirection {
  return value === "asc" ? "asc" : "desc";
}
