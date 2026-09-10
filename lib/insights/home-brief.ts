export type HomeBriefConfidence = "insufficient" | "initial" | "moderate";

export type HomeBriefInput = {
  followers: number;
  syncedMediaCount: number;
  priority: {
    contentLabel: string;
    dateLabel: string;
    views: number;
    reach: number;
    interactions: number;
    reachMultiplier: number | null;
    runnerUpReach: number;
  };
};

export type HomeBrief = {
  confidence: HomeBriefConfidence;
  title: string;
  description: string;
  signalLabel: string;
  signalTitle: string;
  signalDescription: string;
  nextAction: string;
};

const MINIMUM_COMPARABLE_POSTS = 3;
const MINIMUM_STANDOUT_MULTIPLIER = 2;
const MINIMUM_NOTABLE_MULTIPLIER = 1.25;

export function buildHomeBrief(input: HomeBriefInput): HomeBrief {
  const { priority, syncedMediaCount } = input;
  const content = priority.contentLabel;
  const contentLowercase = content.toLocaleLowerCase("es");
  const signalLabel = `${content} del ${priority.dateLabel}`;
  const evidence = `${formatNumber(priority.views)} reproducciones, ${formatNumber(priority.reach)} de alcance y ${formatNumber(priority.interactions)} interacciones`;

  if (syncedMediaCount < MINIMUM_COMPARABLE_POSTS) {
    return {
      confidence: "insufficient",
      title: "Todavía estamos reuniendo una base para comparar.",
      description: `Hay ${formatPostCount(syncedMediaCount)} sincronizada${syncedMediaCount === 1 ? "" : "s"}. Necesitamos al menos ${MINIMUM_COMPARABLE_POSTS} para separar una señal real de un resultado aislado.`,
      signalLabel: `Dato disponible · ${signalLabel}`,
      signalTitle: `Este ${contentLowercase} llegó a ${formatNumber(priority.reach)} cuentas.`,
      signalDescription: `Registró ${evidence}. Por ahora es un dato descriptivo, no una comparación suficiente.`,
      nextAction: "Publicar más piezas antes de elegir un formato para repetir.",
    };
  }

  const minimumUsefulReach = Math.max(20, input.followers * 2);
  if (priority.reach < minimumUsefulReach) {
    return {
      confidence: "insufficient",
      title: "Todavía no hay una señal suficientemente clara.",
      description: `Ya podemos comparar ${formatPostCount(syncedMediaCount)}, pero el alcance absoluto todavía es bajo para tomar una decisión con confianza.`,
      signalLabel: `Dato disponible · ${signalLabel}`,
      signalTitle: `La pieza con más alcance llegó a ${formatNumber(priority.reach)} cuentas.`,
      signalDescription: `Registró ${evidence}. Conviene reunir más respuesta antes de atribuirle una ventaja al formato.`,
      nextAction: "Seguir publicando y revisar de nuevo cuando haya más alcance.",
    };
  }

  if (
    priority.reachMultiplier !== null &&
    priority.reachMultiplier >= MINIMUM_STANDOUT_MULTIPLIER
  ) {
    return {
      confidence: "initial",
      title: "Hay una señal que vale la pena volver a probar.",
      description: `El ${content} se separó del resto, pero ${formatPostCount(syncedMediaCount)} todavía ${syncedMediaCount === 1 ? "es" : "son"} una muestra pequeña.`,
      signalLabel: `Señal inicial · ${signalLabel}`,
      signalTitle: `El ${content} llegó a ${formatNumber(priority.reach)} cuentas; la siguiente pieza, a ${formatNumber(priority.runnerUpReach)}.`,
      signalDescription: `Registró ${evidence}. Es una hipótesis útil, no un patrón consolidado.`,
      nextAction: `Probar otro ${contentLowercase} con una idea similar y medir si la ventaja se repite.`,
    };
  }

  if (
    priority.reachMultiplier !== null &&
    priority.reachMultiplier >= MINIMUM_NOTABLE_MULTIPLIER
  ) {
    return {
      confidence: "moderate",
      title: "Aparece una diferencia, aunque todavía es leve.",
      description: `Este ${contentLowercase} quedó por encima de las demás piezas sincronizadas, sin una separación suficiente para hablar de un patrón.`,
      signalLabel: `Señal a validar · ${signalLabel}`,
      signalTitle: `El ${content} llegó a ${formatNumber(priority.reach)} cuentas; la siguiente pieza, a ${formatNumber(priority.runnerUpReach)}.`,
      signalDescription: `Registró ${evidence}. La diferencia merece una prueba más antes de orientar el contenido.`,
      nextAction: `Repetir una variable de este ${contentLowercase} y comparar el próximo resultado.`,
    };
  }

  return {
    confidence: "insufficient",
    title: "Las piezas están rindiendo de forma pareja.",
    description: `Entre ${formatPostCount(syncedMediaCount)} no aparece una diferencia suficiente para priorizar un formato.`,
    signalLabel: `Mejor resultado actual · ${signalLabel}`,
    signalTitle: `La pieza con más alcance llegó a ${formatNumber(priority.reach)} cuentas.`,
    signalDescription: `Registró ${evidence}. La distancia frente a la siguiente pieza es demasiado corta para considerarla una señal.`,
    nextAction: "Probar una variación más marcada de tema, apertura o formato.",
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(value);
}

function formatPostCount(value: number) {
  return `${formatNumber(value)} ${value === 1 ? "publicación" : "publicaciones"}`;
}
