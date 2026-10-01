import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
