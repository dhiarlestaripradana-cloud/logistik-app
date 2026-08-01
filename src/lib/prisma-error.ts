import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------
//  Penerjemah error Prisma → pesan yang BISA DITINDAKLANJUTI admin.
//  Pelajaran dari bug kas manual: catch generik yang menelan error
//  ("Coba lagi") membuat akar masalah mustahil didiagnosis dari layar.
//  Sekarang: SELALU di-log ke terminal server + kode error ikut tampil.
// ---------------------------------------------------------------
export function pesanErrorPrisma(e: unknown, aksi: string): string {
  console.error(`[ERROR] Gagal ${aksi}:`, e);

  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case "P2002":
        return "Data dengan penanda unik tersebut sudah ada. Periksa kembali isian Anda.";
      case "P2003":
        return (
          "Sesi Anda menunjuk akun yang sudah tidak ada di database " +
          "(biasanya setelah database di-reset). Silakan keluar lalu login ulang."
        );
      case "P2025":
        return "Data terkait tidak ditemukan. Muat ulang halaman lalu coba lagi.";
      default:
        return `Gagal ${aksi} (kode ${e.code}). Detail tercatat di log server.`;
    }
  }
  if (e instanceof Prisma.PrismaClientValidationError) {
    return `Gagal ${aksi}: data tidak sesuai skema database. Detail di log server.`;
  }
  const pesan = e instanceof Error ? e.message : String(e);
  return `Gagal ${aksi}: ${pesan.slice(0, 160)}`;
}
