"use client";

import { RouteError } from "@/components/states/route-error";

export default function ContentDetailError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <RouteError
      title="No pudimos cargar esta pieza"
      description="Las métricas de este post no llegaron. La biblioteca y la conexión siguen intactas."
      error={error}
      retry={retry}
    />
  );
}
