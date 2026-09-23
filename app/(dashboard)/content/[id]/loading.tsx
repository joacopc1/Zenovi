import { AppHeader } from "@/components/shell/app-header";

export default function ContentDetailLoading() {
  return (
    <>
      <AppHeader />
      <main
        className="mx-auto w-full max-w-[1160px] animate-pulse px-5 py-6 md:px-8 md:py-8 lg:px-10"
        aria-label="Cargando la pieza"
      >
        <div className="h-4 w-40 rounded bg-control" />

        <div className="mt-5 grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:gap-8">
          <div className="w-full max-w-[270px] overflow-hidden rounded-card border border-mist">
            <div className="aspect-[9/16] bg-control/60" />
            <div className="border-t border-mist p-3">
              <div className="h-8 w-full rounded-control bg-control" />
            </div>
          </div>
          <div className="space-y-5">
            <div className="border-b border-mist pb-5">
              <div className="h-4 w-36 rounded bg-control" />
              <div className="mt-2 h-6 w-48 rounded bg-control" />
              <div className="mt-3 h-4 w-full rounded bg-control" />
              <div className="mt-2 h-4 w-3/4 rounded bg-control" />
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <div className="h-28 rounded-card border border-mist bg-control/40" />
              <div className="h-28 rounded-card border border-mist bg-control/40" />
              <div className="h-28 rounded-card border border-mist bg-control/40" />
              <div className="h-28 rounded-card border border-mist bg-control/40" />
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              <div className="h-64 rounded-card border border-mist bg-control/40" />
              <div className="h-64 rounded-card border border-mist bg-control/40" />
            </div>
          </div>
        </div>
        <div className="mt-6 space-y-6">
          <div className="h-80 rounded-card border border-mist bg-control/40" />
          <div className="h-64 rounded-card border border-mist bg-control/40" />
        </div>
      </main>
    </>
  );
}
