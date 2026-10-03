"use client";

import { RouteError } from "@/components/states/route-error";

export default function ContentError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <RouteError
      title="No pudimos cargar el contenido"
      description="La cuenta sigue conectada. Volvé a intentar la consulta sin perder tu sesión."
      error={error}
      retry={retry}
    />
  );
}
