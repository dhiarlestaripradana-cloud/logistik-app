import { prisma } from "@/lib/db";

// =====================================================================
//  RATE-LIMIT LOGIN (anti brute-force) — berbasis database.
//
//  Kebijakan penguncian PROGRESIF per-username:
//    gagal < 5     → belum dikunci, hanya dihitung
//    gagal ke-5    → kunci 5 menit
//    gagal ke-6    → kunci 15 menit
//    gagal ke-7    → kunci 30 menit
//    gagal ke-8+   → kunci 60 menit (batas atas)
//
//  Kenapa per-username (bukan per-IP sebagai andalan): registrasi hanya
//  oleh Super Admin, jadi hanya ada ~16 username sah. Menebak username acak
//  tidak berguna. IP tetap DICATAT untuk audit, tapi pengunci utamanya
//  adalah username. (Kalau kelak perlu, cap per-IP bisa ditambah.)
//
//  PRINSIP FAIL-OPEN: jika tabel throttle sendiri bermasalah, JANGAN kunci
//  semua orang — biarkan proses login normal berjalan (yang tetap butuh
//  password benar). Keamanan inti tidak bergantung pada tabel ini.
// =====================================================================

const MAKS_GAGAL = 5; // ambang mulai mengunci

// Durasi kunci (menit) berdasarkan jumlah gagal beruntun.
function menitKunci(gagalCount: number): number {
  if (gagalCount < MAKS_GAGAL) return 0;
  const tingkat = gagalCount - MAKS_GAGAL; // 0,1,2,3...
  const tangga = [5, 15, 30, 60];
  return tangga[Math.min(tingkat, tangga.length - 1)];
}

const normalisasi = (username: string) => username.trim().toLowerCase().slice(0, 60);

export type StatusKunci =
  | { terkunci: false }
  | { terkunci: true; detikTersisa: number; sampai: Date };

// Dipanggil SEBELUM verifikasi password. Kalau terkunci → tolak lebih awal.
export async function cekTerkunci(username: string): Promise<StatusKunci> {
  try {
    const rec = await prisma.loginThrottle.findUnique({
      where: { identifier: normalisasi(username) },
    });
    if (!rec?.terkunciSampai) return { terkunci: false };

    const sisaMs = rec.terkunciSampai.getTime() - Date.now();
    if (sisaMs <= 0) return { terkunci: false };

    return {
      terkunci: true,
      detikTersisa: Math.ceil(sisaMs / 1000),
      sampai: rec.terkunciSampai,
    };
  } catch {
    // Fail-open: infra throttle bermasalah tidak boleh memblokir semua login.
    return { terkunci: false };
  }
}

// Dipanggil saat password SALAH. Menaikkan hitungan & (bila perlu) mengunci.
// Mengembalikan status kunci terbaru agar pesan ke user langsung akurat.
export async function catatGagal(
  username: string,
  ip?: string | null
): Promise<StatusKunci> {
  try {
    const identifier = normalisasi(username);
    const rec = await prisma.loginThrottle.findUnique({ where: { identifier } });

    // Kalau kunci sebelumnya sudah lewat, hitungan diteruskan (bukan direset)
    // supaya percobaan berulang tetap naik tingkat penguncian.
    const gagalBaru = (rec?.gagalCount ?? 0) + 1;
    const menit = menitKunci(gagalBaru);
    const terkunciSampai =
      menit > 0 ? new Date(Date.now() + menit * 60_000) : null;

    await prisma.loginThrottle.upsert({
      where: { identifier },
      create: {
        identifier,
        gagalCount: gagalBaru,
        terkunciSampai,
        lastIp: ip ?? null,
      },
      update: {
        gagalCount: gagalBaru,
        terkunciSampai,
        lastIp: ip ?? null,
      },
    });

    if (terkunciSampai) {
      return {
        terkunci: true,
        detikTersisa: menit * 60,
        sampai: terkunciSampai,
      };
    }
    return { terkunci: false };
  } catch {
    return { terkunci: false };
  }
}

// Dipanggil saat login SUKSES → bersihkan jejak percobaan gagal user ini.
export async function resetThrottle(username: string): Promise<void> {
  try {
    await prisma.loginThrottle.deleteMany({
      where: { identifier: normalisasi(username) },
    });
  } catch {
    /* abaikan — bukan kegagalan kritis */
  }
}

// Format sisa waktu jadi teks ramah untuk pesan ke user.
export function formatSisa(detik: number): string {
  const menit = Math.ceil(detik / 60);
  if (menit >= 60) {
    const jam = Math.floor(menit / 60);
    const sisaMenit = menit % 60;
    return sisaMenit > 0 ? `${jam} jam ${sisaMenit} menit` : `${jam} jam`;
  }
  return `${menit} menit`;
}
