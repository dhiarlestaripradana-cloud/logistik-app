import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Middleware memakai konfigurasi edge-safe (tanpa Prisma/argon2).
// Callback authorized() di authConfig menentukan akses per rute.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Jalankan di semua rute KECUALI aset statis, gambar, & endpoint auth API.
  // Aset PWA (sw.js, manifest, ikon) & uploads bebas middleware.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|uploads|sw.js|manifest.webmanifest|icon-192.png|icon-512.png).*)",
  ],
};
