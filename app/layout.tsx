import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const instrumentSans = localFont({
  variable: "--font-instrument",
  display: "swap",
  src: [
    { path: "../assets/fonts/instrument-sans/InstrumentSans-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/instrument-sans/InstrumentSans-Medium.ttf", weight: "500" },
    { path: "../assets/fonts/instrument-sans/InstrumentSans-SemiBold.ttf", weight: "600" },
    { path: "../assets/fonts/instrument-sans/InstrumentSans-Bold.ttf", weight: "700" },
  ],
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
