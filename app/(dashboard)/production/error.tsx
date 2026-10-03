"use client";

import { RouteError } from "@/components/states/route-error";

export default function ProductionError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <RouteError
      title="No pudimos cargar la producción"
      description="Tus ideas y tus guiones siguen guardados. Volvé a intentar la consulta sin perder tu sesión."
      error={error}
      retry={retry}
    />
  );
}
