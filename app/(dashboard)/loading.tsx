import { AppHeader } from "@/components/shell/app-header";

export default function DashboardLoading() {
  return (
    <>
      <AppHeader />
      <main
        className="mx-auto w-full max-w-[1240px] animate-pulse px-5 py-6 md:px-8 md:py-8 lg:px-10"
        aria-label="Cargando el panel"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="h-6 w-36 rounded bg-control" />
            <div className="mt-2 h-4 w-60 rounded bg-control" />
          </div>
          <div className="h-8 w-28 rounded-control bg-control" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((metric) => (
            <div key={metric} className="rounded-card border border-mist p-5">
              <div className="h-4 w-24 rounded bg-control" />
              <div className="mt-3 h-8 w-28 rounded bg-control" />
              <div className="mt-4 h-12 rounded bg-control/60" />
            </div>
          ))}
        </div>

        <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="h-80 rounded-card border border-mist bg-control/40" />
          <div className="h-56 rounded-card border border-mist bg-control/40" />
        </div>
      </main>
    </>
  );
}
