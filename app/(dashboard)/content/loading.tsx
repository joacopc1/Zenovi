import { AppHeader } from "@/components/shell/app-header";

export default function ContentLoading() {
  return (
    <>
      <AppHeader />
      <main
        className="mx-auto w-full max-w-[1240px] animate-pulse px-5 py-6 md:px-8 md:py-8 lg:px-10"
        aria-label="Cargando contenido"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="h-6 w-28 rounded bg-control" />
            <div className="mt-2 h-4 w-64 rounded bg-control" />
          </div>
          <div className="h-8 w-28 rounded-control bg-control" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="h-9 w-full max-w-xs rounded-control bg-control" />
          <div className="h-9 w-40 rounded-control bg-control" />
          <div className="h-9 w-32 rounded-control bg-control" />
        </div>

        {/* Misma proporción y densidad que la grilla de Reels, para que no salte al cargar. */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((card) => (
            <div key={card} className="overflow-hidden rounded-card border border-mist">
              <div className="aspect-[9/16] bg-control/60" />
              <div className="px-3 py-3">
                <div className="h-5 w-20 rounded bg-control" />
                <div className="mt-3 h-4 w-full rounded bg-control" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
