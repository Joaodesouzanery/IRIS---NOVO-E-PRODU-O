import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remover "standalone" — Vercel gerencia isso automaticamente
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // Necessário para pdf-parse funcionar em API Routes
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
