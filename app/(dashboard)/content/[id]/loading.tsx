import { AppHeader } from "@/components/shell/app-header";

export default function ContentDetailLoading() {
  return (
    <>
      <AppHeader />
      <main
        className="mx-auto w-full max-w-[1120px] animate-pulse px-5 py-6 md:px-8 md:py-8 lg:px-10"
        aria-label="Cargando la pieza"
      >
        <div className="h-4 w-40 rounded bg-control" />

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="h-4 w-40 rounded bg-control" />
            <div className="mt-2 h-6 w-80 max-w-full rounded bg-control" />
            <div className="mt-3 h-5 w-64 max-w-full rounded bg-control" />
          </div>
          <div className="h-9 w-40 rounded-control bg-control" />
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="aspect-[9/16] self-start rounded-card border border-mist bg-control/60" />
          <div className="space-y-5">
            <div className="h-72 rounded-card border border-mist bg-control/40" />
            <div className="h-28 rounded-card border border-mist bg-control/40" />
          </div>
        </div>
      </main>
    </>
  );
}
