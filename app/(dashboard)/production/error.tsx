"use client";

import { RouteError } from "@/components/states/route-error";

export default function ProductionError({ retry }: { retry: () => void }) {
  return (
    <RouteError
      title="No pudimos cargar la producción"
      description="Tus ideas y tus guiones siguen guardados. Volvé a intentar la consulta sin perder tu sesión."
      retry={retry}
    />
  );
}
