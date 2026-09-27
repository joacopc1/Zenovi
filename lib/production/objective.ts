/**
 * Para qué se hizo una pieza, y con qué se sabe si funcionó.
 *
 * Sin esto, "rindió ×1,8" siempre significa lo mismo: tuvo más visualizaciones que tu
 * mediana. Pero un Reel que hiciste para que la gente lo guarde y tuvo muchas vistas y
 * ningún guardado no funcionó, y la app lo estaba felicitando igual. El objetivo no es una
 * etiqueta más: es contra qué número se juzga la pieza.
 *
 * Sólo existen objetivos que Zenovi puede medir de verdad. "Que me escriban por privado"
 * sería el más útil para un infoproducto y no está, porque Instagram no entrega mensajes
 * por pieza: ofrecerlo sería prometer un veredicto que después no se puede dar.
 */

export const CONTENT_OBJECTIVES = ["vistas", "interaccion", "guardado", "compartido"] as const;
export type ContentObjective = (typeof CONTENT_OBJECTIVES)[number];

/** La métrica que decide si la pieza cumplió lo que se propuso. */
const OBJECTIVE_METRICS = {
  vistas: "views",
  interaccion: "interactions",
  guardado: "saves",
  compartido: "shares",
} as const;

export type ObjectiveMetric = (typeof OBJECTIVE_METRICS)[ContentObjective];

/** Cómo se llama el objetivo, y qué promete, en el idioma del creador. */
export const OBJECTIVE_COPY: Record<
  ContentObjective,
  { label: string; hint: string; metricLabel: string }
> = {
  vistas: {
    label: "Que la vea mucha gente",
    hint: "Se juzga por visualizaciones.",
    metricLabel: "visualizaciones",
  },
  interaccion: {
    label: "Que reaccionen y comenten",
    hint: "Se juzga por interacciones.",
    metricLabel: "interacciones",
  },
  guardado: {
    label: "Que la guarden para después",
    hint: "Se juzga por guardados.",
    metricLabel: "guardados",
  },
  compartido: {
    label: "Que la compartan",
    hint: "Se juzga por compartidos.",
    metricLabel: "compartidos",
  },
};

/** El objetivo por defecto mientras el creador no elija uno. */
export const DEFAULT_OBJECTIVE: ContentObjective = "vistas";

export function isContentObjective(value: unknown): value is ContentObjective {
  return typeof value === "string" && CONTENT_OBJECTIVES.includes(value as ContentObjective);
}

/** Contra qué métrica se compara una pieza con este objetivo. */
export function objectiveMetric(objective: ContentObjective | null): ObjectiveMetric {
  return OBJECTIVE_METRICS[objective ?? DEFAULT_OBJECTIVE];
}

/** Cómo se nombra esa métrica al explicar el veredicto. */
export function objectiveMetricLabel(objective: ContentObjective | null): string {
  return OBJECTIVE_COPY[objective ?? DEFAULT_OBJECTIVE].metricLabel;
}
