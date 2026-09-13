import { AppHeader } from "@/components/shell/app-header";

export default function AnalyticsLoading() {
  return (
    <>
      <AppHeader />
      <main
        className="mx-auto w-full max-w-[1240px] animate-pulse px-5 py-6 md:px-8 md:py-8 lg:px-10"
        aria-label="Cargando analíticas"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="h-6 w-32 rounded bg-control" />
            <div className="mt-2 h-4 w-56 rounded bg-control" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-40 rounded-control bg-control" />
            <div className="h-8 w-28 rounded-control bg-control" />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-card border border-mist">
          <div className="grid sm:grid-cols-3">
            {[0, 1, 2].map((metric) => (
              <div key={metric} className="border-t border-mist px-5 py-4 sm:border-l sm:border-t-0 sm:first:border-l-0">
                <div className="h-4 w-24 rounded bg-control" />
                <div className="mt-2 h-7 w-20 rounded bg-control" />
              </div>
            ))}
          </div>
          <div className="border-t border-mist p-5">
            <div className="h-56 rounded bg-control/60" />
          </div>
        </div>

        <div className="mt-4 h-40 rounded-card border border-mist bg-control/40" />
      </main>
    </>
  );
}
