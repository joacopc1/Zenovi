"use client";

import type { CadenceReading } from "@/lib/production/cadence";

const rhythmFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

/**
 * El semáforo de cadencia, debajo del tablero.
 *
 * Es una frase y nada más. Todo lo que se puede decir con palabras se dice con palabras:
 * un gráfico chiquito que hay que aprender a leer cuesta más que la línea que reemplaza,
 * y para ver los días uno por uno está el calendario.
 *
 * Una grilla de tarjetas no compromete a nadie; una frase que dice "venís publicando tres
 * por semana y para los próximos siete días tenés una" sí. Va abajo y no arriba porque al
 * kanban se entra a lo que se entra: nada puede interponerse entre el menú de vistas y el
 * tablero. La tira de días acompaña para ver los huecos sin abrir el calendario.
 *
 * Nunca reta ni pone metas que el creador no eligió: el ritmo con el que se compara es el
 * que él mismo viene sosteniendo, y mientras no haya historial suficiente para afirmarlo,
 * lo dice en vez de inventar un número.
 */
export function CadenceSignal({
  reading,
  instagramConnected,
}: {
  reading: CadenceReading;
  instagramConnected: boolean;
}) {
  return (
    <section
      aria-label="Ritmo de publicación"
      className="mt-8 rounded-card border border-mist bg-paper px-4 py-3"
    >
      {/* Dos renglones a propósito: arriba lo que pasó, abajo lo que viene. En un solo
          párrafo el corte cae donde alcanza el ancho y parte la frase al medio.

          Acá había una tira con los próximos siete días. Se sacó: arrancaba en el día de
          hoy y no en lunes, así que parecía una semana sin serlo, y marcaba con dos
          rellenos distintos "hoy" y "tiene piezas" sin decir en ningún lado cuál era
          cuál. La pestaña Calendario ya hace eso bien, con los días en su lugar y su
          referencia de colores, y está a un click. */}
      <div className="font-support text-[13px] leading-6 text-graphite">
        <p>
          {/* Sin cuenta conectada no es que falte historial: es que no hay de dónde
              leerlo. Decir "todavía no publicaste lo suficiente" sería afirmar algo sobre
              una cuenta que Zenovi nunca vio. */}
          {!instagramConnected ? (
            <>Conectá Instagram y Zenovi lee tu ritmo de publicación.</>
          ) : reading.rhythm === null ? (
            <>Todavía no publicaste lo suficiente como para leer tu ritmo.</>
          ) : (
            <strong className="font-semibold text-ink">
              Venís publicando {rhythmFormatter.format(reading.rhythm)} por semana.
            </strong>
          )}{" "}
          {instagramConnected ? <Published reading={reading} /> : null}
        </p>
        <p>
          <Planned planned={reading.planned} withoutScript={reading.withoutScript} />{" "}
          <Verdict missing={reading.missing} />
        </p>
      </div>

    </section>
  );
}

/**
 * Lo que ya salió. Sale de Instagram, no del tablero: si publicó algo sin anotarlo en
 * Zenovi, decirle que no hizo nada esta semana sería directamente falso.
 */
function Published({ reading }: { reading: CadenceReading }) {
  const { published, daysSinceLast } = reading;

  if (published > 0) {
    const when =
      daysSinceLast === 0 ? "hoy" : daysSinceLast === 1 ? "ayer" : `hace ${daysSinceLast} días`;

    return published === 1 ? (
      <>Esta semana ya salió una, {when}.</>
    ) : (
      <>
        Esta semana ya salieron {published}, la última {when}.
      </>
    );
  }

  if (daysSinceLast === null) return <>Esta semana no salió nada.</>;

  return <>Esta semana no salió nada: la última fue hace {daysSinceLast} días.</>;
}

function Verdict({ missing }: { missing: number | null }) {
  if (missing === null) return null;

  return missing > 0 ? (
    <span className="text-ink">
      Te {missing === 1 ? "falta" : "faltan"} {missing} para sostener el ritmo.
    </span>
  ) : (
    <span className="text-success">Vas al día.</span>
  );
}

function Planned({ planned, withoutScript }: { planned: number; withoutScript: number }) {
  if (planned === 0) return <>Para los próximos 7 días no tenés nada planificado.</>;

  return (
    <>
      Para los próximos 7 días tenés {planned} {planned === 1 ? "pieza" : "piezas"}
      {withoutScript > 0 ? (
        <>
          , {withoutScript === planned ? (planned === 1 ? "sin guion" : "todas sin guion") : `${withoutScript} sin guion`}.
        </>
      ) : (
        <>, con el guion listo.</>
      )}
    </>
  );
}
