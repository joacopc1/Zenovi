import { jsonSchema, tool } from "ai";
import { CONTENT_FORMATS, type ContentFormat } from "@/lib/production/content";

export type ProposedIdea = {
  /** "guion" cuando el guion ya está escrito en la respuesta: la tarjeta es sólo el botón. */
  tipo?: "idea" | "guion";
  titulo: string;
  formato: ContentFormat;
  tipo_de_contenido?: string;
  gancho?: string;
  desarrollo?: string;
  cta?: string;
  porque: string;
};

/**
 * El Director propone una idea como tarjeta; no guarda nada. La guarda el creador con un
 * clic, y la acción del servidor relee la idea del mensaje guardado: ninguna herramienta
 * del modelo escribe en la base.
 */
export const proposeIdeaTool = tool({
  description:
    "Deja una idea o un guion listo para que el creador lo guarde en Producción con un clic. Con tipo idea, la tarjeta muestra la idea entera (no la repitas en el texto); como mucho tres por respuesta. Con tipo guion, el guion ya está escrito en tu respuesta y la tarjeta es sólo el botón para guardarlo: pasá el guion completo en gancho, desarrollo y cta.",
  inputSchema: jsonSchema<ProposedIdea>({
    type: "object",
    properties: {
      tipo: { type: "string", enum: ["idea", "guion"], description: "idea (la tarjeta la muestra) o guion (ya está en el texto; la tarjeta es sólo el botón)" },
      titulo: { type: "string", maxLength: 200, description: "Título corto y concreto de la pieza" },
      formato: { type: "string", enum: [...CONTENT_FORMATS], description: "reel, story o publication (post/carrusel)" },
      tipo_de_contenido: { type: "string", maxLength: 120, description: "Para qué sirve, con las palabras del creador si las conocés (atracción, autoridad, venta…)" },
      gancho: { type: "string", maxLength: 2000, description: "Lo que se dice o se ve en los primeros segundos" },
      desarrollo: { type: "string", maxLength: 8000, description: "El cuerpo, si ya está pensado" },
      cta: { type: "string", maxLength: 1000, description: "La acción que se pide al final" },
      porque: { type: "string", maxLength: 600, description: "Por qué es una buena idea para esta cuenta, en una o dos frases" },
    },
    required: ["titulo", "formato", "porque"],
    additionalProperties: false,
  }),
  execute: async () => ({ propuesta: true }),
});
