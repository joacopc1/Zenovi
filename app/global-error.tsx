"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Lo que se rompe por encima de todo (el layout raíz): se avisa y se ofrece recargar. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
        <div style={{ textAlign: "center", maxWidth: 360, padding: 24 }}>
          <h1 style={{ fontSize: 20, margin: 0 }}>Algo no cargó</h1>
          <p style={{ color: "#66666b", fontSize: 14, lineHeight: "20px" }}>Ya nos llegó el aviso. Probá recargar la página.</p>
          <button type="button" onClick={() => window.location.reload()} style={{ marginTop: 8, padding: "10px 16px", borderRadius: 10, border: 0, background: "#000", color: "#fff", fontSize: 14 }}>
            Recargar
          </button>
        </div>
      </body>
    </html>
  );
}
