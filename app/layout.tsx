import type { Metadata } from "next";
import "@fontsource-variable/instrument-sans/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zenovi",
  description: "Dirección de marketing basada en tu contenido real.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
