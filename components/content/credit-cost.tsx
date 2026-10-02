import { Coins } from "lucide-react";

/**
 * El precio de una acción como sufijo del botón, al estilo de Leonardo o ElevenLabs: una
 * moneda y el número, sin la palabra. Quien lee con lector de pantalla oye "3 créditos".
 */
export function CreditCost({ credits, tone }: { credits: number; tone: "onDark" | "onLight" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[12px] font-semibold tabular-nums ${
        tone === "onDark" ? "bg-paper/15 text-paper" : "bg-ink/[0.06] text-ink"
      }`}
    >
      <Coins aria-hidden="true" className="size-3" strokeWidth={2} />
      {credits}
      <span className="sr-only"> créditos</span>
    </span>
  );
}
