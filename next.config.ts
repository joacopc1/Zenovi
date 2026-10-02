import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const supabase = "https://*.supabase.co";
const instagramMedia = "https://*.cdninstagram.com https://*.fbcdn.net https://platform-lookaside.fbsbx.com";

/**
 * Qué puede cargar la página. Sin nonces (todas las páginas serían dinámicas): los scripts
 * sólo vienen del propio sitio. Las imágenes y videos, de Instagram y del Storage propio; las
 * conexiones, a Supabase. Nadie puede meter Zenovi en un iframe ni mandar un formulario afuera.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Cloudflare Turnstile: el CAPTCHA del login carga su script y su recuadro desde ahí.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "frame-src https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: ${instagramMedia} ${supabase}`,
  `media-src 'self' blob: ${instagramMedia} ${supabase}`,
  "font-src 'self'",
  `connect-src 'self' ${supabase} wss://*.supabase.co`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Zenovi no usa cámara, micrófono ni ubicación: ningún script puede pedirlos.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Las guías del Director se leen del disco al responder: tienen que viajar con la ruta.
  outputFileTracingIncludes: {
    "/api/director/chat": ["./lib/director/guides/**/*.md"],
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com", pathname: "/**" },
      { protocol: "https", hostname: "**.fbcdn.net", pathname: "/**" },
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com", pathname: "/**" },
      // Copias propias de las Historias vencidas: URLs firmadas del bucket privado.
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/sign/instagram-story-archive/**",
      },
    ],
  },
};

export default nextConfig;
