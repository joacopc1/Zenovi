"use client";

import { RouteError } from "@/components/states/route-error";

export default function DashboardError({ retry }: { retry: () => void }) {
  return (
    <RouteError
      title="No pudimos cargar tu panel"
      description="La sesión y la conexión con Instagram siguen activas. Volvé a intentar la consulta."
      retry={retry}
    />
  );
}
