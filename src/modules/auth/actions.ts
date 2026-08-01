"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import {
  cekTerkunci,
  catatGagal,
  resetThrottle,
  formatSisa,
} from "@/lib/login-throttle";

export type LoginState = {
  error?: string;
  terkunci?: boolean; // true → tampilkan gaya "kuning" (tunggu), bukan merah
} | null;

// Ambil IP klien di belakang reverse proxy Caddy (X-Forwarded-For).
async function ambilIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return h.get("x-real-ip");
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Input tidak valid" };
  }

  const { username, password } = parsed.data;

  // ── Gerbang rate-limit: tolak lebih awal bila akun sedang terkunci ──
  const kunci = await cekTerkunci(username);
  if (kunci.terkunci) {
    return {
      error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${formatSisa(
        kunci.detikTersisa
      )}.`,
      terkunci: true,
    };
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard",
    });
    // Catatan: signIn sukses melempar redirect (ditangani di catch bawah),
    // jadi baris reset di bawah ini praktis tak tercapai — reset sukses
    // dilakukan di cabang redirect. Disimpan sebagai jaring pengaman.
    await resetThrottle(username);
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        // Password/username salah → naikkan hitungan throttle.
        const ip = await ambilIp();
        const stat = await catatGagal(username, ip);
        if (stat.terkunci) {
          return {
            error: `Terlalu banyak percobaan gagal. Akun dikunci sementara — coba lagi dalam ${formatSisa(
              stat.detikTersisa
            )}.`,
            terkunci: true,
          };
        }
        return { error: "Username atau password salah." };
      }
      return { error: "Terjadi kesalahan saat login. Coba lagi." };
    }
    // signIn melempar NEXT_REDIRECT saat SUKSES — bersihkan throttle dulu,
    // lalu teruskan redirect-nya ke Next.js.
    await resetThrottle(username);
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

// Logout varian PWA: TANPA redirect server — klien melakukan hard
// navigation (window.location) agar sesi bersih & pindah halaman
// seketika di WebView/standalone HP (revisi UAT #2.2).
export async function logoutTanpaRedirect() {
  await signOut({ redirect: false });
}
