import Link from "next/link";
import { ContentCard } from "@/components/content/content-card";
import { ContentFilters } from "@/components/content/content-filters";
import { LibraryPagination } from "@/components/content/library-pagination";
import { ReelCard } from "@/components/content/reel-card";
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
} from "@/lib/content/library";
import { paginate } from "@/lib/content/pagination";
import { getAccountContext } from "@/lib/data/account-context";
import { getInstagramContentLibrary } from "@/lib/data/instagram-content";

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
  publication: "Publicaciones",
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
  const selectedSort = parseContentSort(firstValue(query.sort));
  const selectedDirection = parseSortDirection(firstValue(query.dir));
  const search = firstValue(query.q)?.trim() ?? "";
  const cohort = library ? buildCohort(library.items, selectedType) : [];
  const visibleItems = sortContentItems(
    searchContentItems(cohort, search),
    selectedSort,
    selectedDirection,
  );
  // Buscar y ordenar abarcan todo; la página sólo recorta lo que se ve.
  const pagination = paginate(visibleItems, Number(firstValue(query.page) ?? 1));

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1240px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <SyncNotice
          key={firstValue(query.sync)}
          status={firstValue(query.sync)}
        />

        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.02em]">
              {kindTitles[selectedType]}
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              {library
                ? `Biblioteca de @${library.username} · ${library.items.length} piezas sincronizadas`
                : "Tu biblioteca de Instagram"}
            </p>
          </div>
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
              direction={selectedDirection}
              resultCount={visibleItems.length}
            />

            {visibleItems.length > 0 ? (
              <section
                aria-label="Piezas de contenido"
                className={`mt-5 grid gap-4 ${selectedType === "reel" ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-3"}`}
              >
                {pagination.pageItems.map((item, index) => (
                  selectedType === "reel" ? (
                    <ReelCard key={item.id} item={item} priority={pagination.page === 1 && index < 4} />
                  ) : (
                    <ContentCard key={item.id} item={item} priority={pagination.page === 1 && index < 3} />
                  )
                ))}
              </section>
            ) : (
              <EmptyLibrary filtered={library.items.length > 0} selectedType={selectedType} />
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

function EmptyLibrary({ filtered, selectedType }: { filtered: boolean; selectedType: ContentKind }) {
  const isStories = selectedType === "story";
  return (
    <section className="mt-5 rounded-card border border-mist px-6 py-14 text-center">
      <h2 className="text-base font-semibold">
        {isStories ? "Todavía no hay Historias disponibles" : filtered ? "No encontramos coincidencias" : "Todavía no hay contenido sincronizado"}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-graphite">
        {isStories
          ? "Zenovi sólo mostrará Historias capturadas después de habilitar su sincronización; no promete recuperar el archivo histórico privado."
          : filtered
            ? "Probá otro texto, formato u orden para volver a ver piezas."
            : "Actualizá la cuenta para traer las publicaciones disponibles desde Instagram."}
      </p>
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
