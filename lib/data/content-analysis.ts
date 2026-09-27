import "server-only";

import { readAnalysisState, type AnalysisState } from "@/lib/content/analysis";
import { createClient } from "@/lib/supabase/server";

type AnalysisRow = {
  status: string;
  result: unknown;
  failure_reason: string | null;
  can_retry: boolean;
  started_at: string | null;
};

/**
 * El análisis de una pieza, si alguien lo pidió alguna vez.
 *
 * Devuelve el estado tal como lo dibuja la pantalla, no la fila cruda: quien la use no
 * tiene por qué saber que "no pedido" en la base es la ausencia de una fila.
 *
 * Lo lee con la sesión de quien mira, así que RLS ya garantiza que sea de su workspace.
 */
export async function getContentAnalysis(mediaId: string): Promise<AnalysisState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_analyses")
    .select("status, result, failure_reason, can_retry, started_at")
    .eq("instagram_media_id", mediaId)
    .maybeSingle();

  // El análisis es una sección de la pantalla, no la pantalla. Si su lectura falla —la
  // tabla todavía no existe, la política cambió— el resto de la pieza tiene que seguir
  // viéndose: las métricas, el video y el benchmark no dependen de esto. Se devuelve un
  // fallo visible, con su motivo, en vez de tirar abajo la página entera.
  if (error) {
    console.warn(
      JSON.stringify({ event: "content_analysis", warning: "read_failed", code: error.code }),
    );

    return {
      status: "failed",
      reason: "No pudimos leer el análisis de esta pieza.",
      canRetry: true,
    };
  }

  const row = data as AnalysisRow | null;

  return readAnalysisState(
    row === null
      ? null
      : {
          status: row.status,
          result: row.result,
          failureReason: row.failure_reason,
          canRetry: row.can_retry,
          startedAt: row.started_at,
        },
  );
}
