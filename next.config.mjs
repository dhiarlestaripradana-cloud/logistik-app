import withSerwistInit from "@serwist/next";

// Service worker HANYA aktif di production build — saat `npm run dev`
// dimatikan agar hot-reload tidak diganggu cache.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // wajib untuk image Docker ramping
  serverExternalPackages: ["@node-rs/argon2", "@prisma/client", "puppeteer"],
  experimental: {
    serverActions: {
      // Laporan driver membawa beberapa foto (masing2 < 300KB hasil kompresi
      // klien) — default 1MB terlalu sempit.
      bodySizeLimit: "10mb",
    },
  },
};

export default withSerwist(nextConfig);
