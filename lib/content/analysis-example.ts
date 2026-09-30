import { ANALYSIS_PIPELINE_VERSION, type ReelAnalysis } from "./analysis";

/**
 * Vista de desarrollo para revisar el análisis y el mapa sin consumir Gemini.
 *
 * Nunca se muestra en producción: la vista de detalle la usa únicamente con
 * `?ejemplo=1`. El contenido se basa en el Reel de prueba sobre Cash Collected y existe
 * sólo para validar jerarquía, densidad e interacciones antes de pedir otro análisis.
 */
export const EXAMPLE_ANALYSIS: ReelAnalysis = {
  pipelineVersion: ANALYSIS_PIPELINE_VERSION,
  completedAt: "2026-09-29T12:00:00Z",
  performance: {
    verdict: "La prueba concreta sostiene el interés, pero la respuesta del gancho llega tarde.",
    explanation:
      "La pieza abre una pregunta comercial relevante y consigue compartidos, pero demora en nombrar Cash Collected. El tramo comparativo vuelve tangible la idea y es el aprendizaje más transferible.",
    confidence: "medium",
    evidence: [
      { atMs: 0, quote: "Hay una métrica que te dice qué contenido está atrayendo compradores." },
      { atMs: 36_000, quote: "Una secuencia puede abrir 250 chats y dejar 0 dólares." },
    ],
  },
  findings: [
    {
      kind: "friction",
      title: "La revelación principal se posterga",
      insight:
        "El Reel promete una métrica distinta de las views, pero abre un paréntesis antes de nombrarla.",
      impact:
        "Quien busca una respuesta rápida puede abandonar antes de llegar al concepto central.",
      evidence: [
        { atMs: 0, quote: "Hay una métrica que te dice qué contenido está atrayendo compradores." },
        { atMs: 16_000, quote: "La métrica que realmente miramos es cuánto Cash Collected dejó una pieza." },
      ],
    },
    {
      kind: "strength",
      title: "El contraste convierte una idea abstracta en una decisión",
      insight:
        "Comparar chats con dinero cobrado permite entender por qué más interacción no siempre significa más negocio.",
      impact:
        "Es un recurso concreto que favorece guardados y compartidos porque el espectador puede trasladarlo a su cuenta.",
      evidence: [
        { atMs: 36_000, quote: "Una secuencia puede abrir 250 chats y dejar 0 dólares." },
        { atMs: 41_000, quote: "Otra puede abrir 40 conversaciones, cerrar 2 clientes y dejar 8000 dólares." },
      ],
    },
    {
      kind: "opportunity",
      title: "El CTA puede aparecer antes sin interrumpir la explicación",
      insight:
        "La invitación sólo llega al final, cuando buena parte de la audiencia ya pudo abandonar.",
      impact:
        "Una mención breve en el primer tercio permite capturar intención y luego continuar con la demostración.",
      evidence: [{ atMs: 76_000, quote: "Comentá SISTEMA y te lo paso antes de que lo borres." }],
    },
  ],
  attentionHypotheses: [
    {
      title: "La espera por la respuesta puede frenar la apertura",
      hypothesis:
        "El tiempo medio de visualización es compatible con una pérdida antes de que se nombre la métrica prometida. Sin una curva segundo a segundo, esto es una hipótesis y no una causa demostrada.",
      confidence: "medium",
      evidence: [
        { atMs: 4_000, quote: "Veo a muchos negocios que crean contenido pensando en llegar a más gente." },
        { atMs: 16_000, quote: "La métrica que realmente miramos es cuánto Cash Collected dejó una pieza." },
      ],
    },
  ],
  actionPlan: {
    keep: [
      {
        title: "Conservar contrastes comerciales verificables",
        fromMs: 36_000,
        toMs: 45_000,
        why: "Vuelven visible la diferencia entre atención y resultado de negocio.",
        how: "En próximos videos, enfrentá dos casos con una métrica comparable y una consecuencia concreta.",
        metricToWatch: "Guardados y compartidos sobre visualizaciones.",
        evidence: [{ atMs: 41_000, quote: "Cerrar 2 clientes y dejar 8000 dólares." }],
      },
    ],
    change: [
      {
        title: "Entregar la respuesta prometida antes del contexto",
        fromMs: 0,
        toMs: 16_000,
        why: "El valor central aparece después de una explicación que exige paciencia.",
        how: "Nombrá la métrica en la primera frase y usá el contexto para demostrar por qué importa.",
        metricToWatch: "Omisión antes de 3 segundos y tiempo medio visto.",
        evidence: [{ atMs: 16_000, quote: "La métrica que realmente miramos es cuánto Cash Collected dejó una pieza." }],
      },
    ],
    test: [
      {
        title: "Probar un CTA breve en el primer tercio",
        fromMs: 16_000,
        toMs: 24_000,
        why: "Esperar al cierre deja la acción fuera del alcance de quienes no terminan el Reel.",
        how: "Después de revelar la métrica, anticipá que al final mostrás cómo registrarla y continuá con la prueba.",
        metricToWatch: "Comentarios por cada 500 reproducciones.",
        evidence: [{ atMs: 76_000, quote: "Comentá SISTEMA y te lo paso." }],
      },
    ],
  },
  executionReview: [
    {
      dimension: "voice",
      kind: "strength",
      title: "Ritmo conversacional sostenido",
      observation: "La explicación mantiene energía y no cae en una lectura monótona.",
      impact: "Ayuda a sostener una pieza cargada de conceptos de negocio.",
      recommendation: "Conservá el ritmo, pero agregá una pausa breve antes de cada dato importante.",
      evidence: [{ atMs: 36_000, quote: "Porque una secuencia puede abrir 250 chats y dejar 0 dólares." }],
    },
    {
      dimension: "visual",
      kind: "opportunity",
      title: "La prueba merece mayor jerarquía visual",
      observation: "El contraste numérico es el momento más fuerte, pero compite con el resto del encuadre.",
      impact: "Destacarlo facilitaría comprender y recordar la comparación.",
      recommendation: "Mostrá cada resultado a pantalla completa durante uno o dos segundos.",
      evidence: [{ atMs: 41_000, quote: "40 conversaciones, cerrar 2 clientes y dejar 8000 dólares." }],
    },
  ],
  reversionIdeas: [
    {
      title: "Versión centrada en la métrica",
      change:
        "Abrir nombrando Cash Collected, mostrar el contraste de resultados y recortar la explicación intermedia.",
      why: "Permite comprobar si la demora, y no el tema, fue la principal fricción de la apertura.",
      evidence: [
        { atMs: 16_000, quote: "Cuánto Cash Collected dejó una pieza de contenido." },
        { atMs: 41_000, quote: "Cerrar 2 clientes y dejar 8000 dólares." },
      ],
    },
  ],
  reelMap: [
    {
      role: "hook",
      label: "Promesa",
      fromMs: 0,
      toMs: 4_000,
      visual: "Presentador a cámara con texto que contrapone compradores y views.",
      onScreenText: "La métrica que atrae compradores",
      finding: "Abre una brecha de curiosidad relevante, pero todavía no entrega la respuesta.",
      recommendation: "Nombrá la métrica dentro de esta misma apertura.",
    },
    {
      role: "context",
      label: "Problema",
      fromMs: 4_000,
      toMs: 16_000,
      visual: "Plano hablado estable mientras enumera formatos y tendencias.",
      onScreenText: "Más views no siempre son más ventas",
      finding: "El contexto explica el error habitual, aunque posterga el núcleo prometido.",
      recommendation: "Reducí este bloque a una sola frase después de revelar la respuesta.",
    },
    {
      role: "development",
      label: "Métrica",
      fromMs: 16_000,
      toMs: 36_000,
      visual: "Aparece la definición de Cash Collected y el sistema de atribución.",
      onScreenText: "Cash Collected por pieza",
      finding: "Acá comienza el valor nuevo que el gancho había prometido.",
      recommendation: "Usá esta definición como primera frase en próximos contenidos del tema.",
    },
    {
      role: "proof",
      label: "Contraste",
      fromMs: 36_000,
      toMs: 45_000,
      visual: "Comparación de dos resultados comerciales con cifras opuestas.",
      onScreenText: "250 chats = $0 / 40 chats = $8.000",
      finding: "Es el momento más concreto y memorable del argumento.",
      recommendation: "Conservá esta forma de prueba y dale más espacio visual.",
    },
    {
      role: "development",
      label: "Sistema",
      fromMs: 45_000,
      toMs: 76_000,
      visual: "Recorrido por las herramientas que conectan el CTA con el CRM.",
      onScreenText: "Manychat → Make → CRM → Cash Collected",
      finding: "Demuestra que el concepto es ejecutable, pero acumula varios nombres seguidos.",
      recommendation: "Dividí el flujo en tres pasos visuales y nombrá sólo la función de cada herramienta.",
    },
    {
      role: "cta",
      label: "Acción",
      fromMs: 76_000,
      toMs: 89_000,
      visual: "Regreso a cámara con una invitación directa a comentar.",
      onScreenText: "Comentá SISTEMA",
      finding: "La acción es específica, aunque aparece únicamente al final.",
      recommendation: "Anticipala después de revelar la métrica y repetila en el cierre.",
    },
  ],
  transcript: [
    { atMs: 0, quote: "Hay una métrica que te dice qué contenido está atrayendo compradores y no son las views." },
    { atMs: 4_000, quote: "Veo a muchos negocios que crean contenido pensando en llegar a más gente." },
    { atMs: 16_000, quote: "La métrica que realmente miramos es cuánto Cash Collected dejó una pieza de contenido." },
    { atMs: 36_000, quote: "Una secuencia puede abrir 250 chats y dejar 0 dólares." },
    { atMs: 41_000, quote: "Otra puede abrir 40 conversaciones, cerrar 2 clientes y dejar 8000 dólares." },
    { atMs: 76_000, quote: "Comentá SISTEMA y te lo paso antes de que lo borres." },
  ],
};
