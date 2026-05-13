/** @type {import('next').NextConfig} */
const nextConfig = {
  // Konfigurasi webpack untuk mendukung file MDX
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],

  // Konfigurasi gambar dari sumber eksternal (jika diperlukan)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Header CORS untuk API routes (jika ada)
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },

  // Konfigurasi lingkungan (URL backend)
  // Set NEXT_PUBLIC_BACKEND_URL dan NEXT_PUBLIC_WS_URL di Vercel Environment Variables
  // untuk mengarah ke backend yang di-deploy (misalnya di Railway/Render)
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
    NEXT_PUBLIC_WS_URL     : process.env.NEXT_PUBLIC_WS_URL      || "ws://localhost:8000",
  },
};

module.exports = nextConfig;
