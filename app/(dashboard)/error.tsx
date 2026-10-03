"use client";

import { RouteError } from "@/components/states/route-error";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <RouteError
      title="No pudimos cargar tu panel"
      description="La sesión y la conexión con Instagram siguen activas. Volvé a intentar la consulta."
      error={error}
      retry={retry}
    />
  );
}
