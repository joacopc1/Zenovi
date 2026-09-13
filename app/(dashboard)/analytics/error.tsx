"use client";

import { RouteError } from "@/components/states/route-error";

export default function AnalyticsError({ retry }: { retry: () => void }) {
  return (
    <RouteError
      title="No pudimos cargar tus analíticas"
      description="La cuenta sigue conectada y no se perdió ninguna sincronización. Volvé a intentar la consulta."
      retry={retry}
    />
  );
}
