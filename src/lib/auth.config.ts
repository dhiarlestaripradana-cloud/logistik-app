import type { NextAuthConfig } from "next-auth";

// -------------------------------------------------------------
//  Konfigurasi "edge-safe": TIDAK meng-import Prisma atau argon2.
//  Dipakai middleware (Edge runtime). Provider asli ada di auth.ts.
// -------------------------------------------------------------

// Semua rute area admin — WAJIB ditambah setiap kali modul baru punya halaman.
const ADMIN_PREFIXES = [
  "/dashboard",
  "/kendaraan",
  "/customer",
  "/driver",
  "/kas",
  "/operasional",
  "/perjalanan",
  "/surat-jalan-eksternal",
  "/master-bbm",
  "/verifikasi",
  "/laporan",
  "/print",
  "/api/pdf",
  "/api/export",
];

// Rute area driver (PWA).
const DRIVER_PREFIXES = ["/tugas", "/riwayat"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.nama = (user as { nama?: string }).nama;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SUPER_ADMIN" | "OPERASIONAL" | "DRIVER";
        session.user.nama = token.nama as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role;
      const isLoggedIn = !!auth?.user;

      const isAdminArea = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
      const isDriverArea = DRIVER_PREFIXES.some((p) => pathname.startsWith(p));
      const isLoginPage = pathname === "/login";

      // Beranda per role (Revisi Final #2: role OPERASIONAL).
      const home =
        role === "DRIVER" ? "/tugas"
        : role === "OPERASIONAL" ? "/operasional"
        : "/dashboard";

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL(home, request.nextUrl));
      }

      if (isAdminArea) {
        if (!isLoggedIn) return false;
        if (role === "DRIVER")
          return Response.redirect(new URL("/tugas", request.nextUrl));
        if (role === "OPERASIONAL") {
          // OPERASIONAL hanya boleh /operasional — menu lain terlarang.
          if (pathname.startsWith("/operasional")) return true;
          return Response.redirect(new URL("/operasional", request.nextUrl));
        }
        return true; // SUPER_ADMIN
      }

      if (isDriverArea) {
        if (!isLoggedIn) return false;
        if (role !== "DRIVER")
          return Response.redirect(new URL(home, request.nextUrl));
        return true;
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
