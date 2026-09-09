import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zenovi",
  description: "Dirección de marketing basada en tu contenido real.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={instrumentSans.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
