"use client";

import { RouteError } from "@/components/states/route-error";

export default function ContentDetailError({ retry }: { retry: () => void }) {
  return (
    <RouteError
      title="No pudimos cargar esta pieza"
      description="Las métricas de esta publicación no llegaron. La biblioteca y la conexión siguen intactas."
      retry={retry}
    />
  );
}
