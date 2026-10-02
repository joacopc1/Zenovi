import { AsyncLocalStorage } from "node:async_hooks";
import { hasModelPrice, usageCostUsd, type TokenUsage } from "./pricing.ts";

type Meter = { costUsd: number; unpriced: Set<string> };

const meters = new AsyncLocalStorage<Meter>();

/**
 * Mide lo que gasta en IA todo lo que corre adentro, sin pasar el uso de mano en mano: un
 * análisis llama a Gemini, a veces a Claude de respaldo y reintenta, y cada llamada anota
 * lo suyo con addMeteredUsage. Si la operación falla, lo medido se descarta junto con ella.
 */
export async function meterAiUsage<T>(run: () => Promise<T>) {
  const meter: Meter = { costUsd: 0, unpriced: new Set() };
  const value = await meters.run(meter, run);
  if (meter.unpriced.size > 0) {
    // El costo medido queda corto: hay que cargar el precio de ese modelo en pricing.ts.
    console.warn(JSON.stringify({ event: "credits", warning: "unpriced_models", models: [...meter.unpriced] }));
  }
  return { value, costUsd: meter.costUsd, unpricedModels: [...meter.unpriced] };
}

/** Anota una llamada. Fuera de meterAiUsage no hace nada: quien no mide, no paga por medir. */
export function addMeteredUsage(model: string, usage: TokenUsage) {
  const meter = meters.getStore();
  if (!meter) return;
  // Un modelo sin precio cargado (un respaldo nuevo) no corta el análisis: queda avisado.
  if (!hasModelPrice(model)) {
    meter.unpriced.add(model);
    return;
  }
  meter.costUsd += usageCostUsd(model, usage);
}
