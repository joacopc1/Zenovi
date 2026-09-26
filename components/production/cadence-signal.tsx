"use client";

import { CALENDAR_WEEKDAYS } from "@/lib/production/calendar";
import type { CadenceReading } from "@/lib/production/cadence";

const rhythmFormatter = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });

/**
 * El semáforo de cadencia, debajo del tablero.
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
      className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-card border border-mist bg-paper px-4 py-3 sm:flex-nowrap"
    >
      {/* Dos renglones a propósito: arriba lo que pasó, abajo lo que viene. En un solo
          párrafo el corte cae donde alcanza el ancho y parte la frase al medio. El texto
          se achica y envuelve, pero la tira nunca baja: es lo que se mira de un vistazo, y
          si salta abajo deja de leerse como una semana. */}
      <div className="font-support min-w-0 flex-1 text-[13px] leading-6 text-graphite">
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

      <ol className="flex shrink-0 items-start gap-1">
        {reading.days.map((day) => (
          <li key={day.iso} className="w-8 text-center">
            <span
              className={`font-support block text-[10px] ${day.isToday ? "font-semibold text-ink" : "text-muted"}`}
            >
              {CALENDAR_WEEKDAYS[day.weekday]}
            </span>
            <span
              title={`${day.planned} ${day.planned === 1 ? "pieza planificada" : "piezas planificadas"}`}
              className={`font-numeric mt-1 grid h-7 place-items-center rounded-control text-[12px] ${
                day.planned > 0
                  ? "bg-ink font-semibold text-paper"
                  : day.isToday
                    ? "border border-mist-strong text-ink"
                    : "border border-dashed border-mist text-muted"
              }`}
            >
              {day.planned > 1 ? `${day.day}·${day.planned}` : day.day}
            </span>
          </li>
        ))}
      </ol>
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
