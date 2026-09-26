import { AppHeader } from "@/components/shell/app-header";

/**
 * El esqueleto del tablero: mismas cuatro columnas, mismo alto y mismo menú de vistas que
 * la pantalla real, para que al terminar de cargar nada salte de lugar.
 */
export default function ProductionLoading() {
  return (
    <>
      <AppHeader />
      <main
        className="mx-auto w-full max-w-[1240px] animate-pulse px-5 py-6 md:px-8 md:py-8 lg:px-10"
        aria-label="Cargando producción"
      >
        <div className="h-6 w-32 rounded bg-control" />

        <div className="mt-6 flex items-end justify-between gap-4 border-b border-mist pb-2.5">
          <div className="flex gap-6">
            <div className="h-4 w-16 rounded bg-control" />
            <div className="h-4 w-20 rounded bg-control" />
          </div>
          <div className="h-9 w-28 rounded-control bg-control" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((column) => (
            <div key={column} className="rounded-card border border-mist p-3">
              <div className="mb-3 flex items-center gap-2">
                <div className="size-2.5 rounded-full bg-control" />
                <div className="h-4 w-24 rounded bg-control" />
              </div>
              <div className="flex h-[26rem] flex-col gap-2">
                {[0, 1].map((card) => (
                  <div key={card} className="rounded-card border border-mist p-3">
                    <div className="h-4 w-3/4 rounded bg-control" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-control" />
                    <div className="mt-3 h-6 w-full rounded bg-control/60" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
