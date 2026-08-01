import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/id";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("id");

// -------------------------------------------------------------
//  Sentral penanganan waktu WIB (Asia/Jakarta, UTC+7).
//  Catatan owner: driver bisa input laporan tengah malam — kita
//  hitung "hari ini" berdasarkan tanggal WIB, BUKAN UTC server,
//  agar tidak ada pergeseran hari.
// -------------------------------------------------------------

export const TZ_WIB = "Asia/Jakarta";

/** Waktu sekarang di zona WIB. */
export function nowWIB() {
  return dayjs().tz(TZ_WIB);
}

/** Awal hari (00:00) WIB untuk tanggal tertentu — dasar semua perhitungan selisih hari. */
export function startOfDayWIB(date?: Date | string) {
  return (date ? dayjs(date) : dayjs()).tz(TZ_WIB).startOf("day");
}

/**
 * Selisih hari kalender WIB antara `target` dan hari ini.
 * Positif = target di masa depan (mis. jatuh tempo 14 hari lagi).
 * Negatif = target sudah lewat (mis. pajak telat 3 hari).
 */
export function selisihHariWIB(target: Date | string): number {
  return startOfDayWIB(target).diff(startOfDayWIB(), "day");
}

/** Umur kendaraan (derived, tidak disimpan) — Blueprint 4.1. */
export function umurKendaraan(tanggalPembelian: Date | string): {
  tahun: number;
  bulan: number;
  label: string;
} {
  const beli = startOfDayWIB(tanggalPembelian);
  const kini = startOfDayWIB();
  const totalBulan = kini.diff(beli, "month");
  const tahun = Math.floor(totalBulan / 12);
  const bulan = totalBulan % 12;
  return { tahun, bulan, label: `${tahun} tahun ${bulan} bulan` };
}

/** Format tanggal Indonesia, mis. "11 Juli 2026". */
export function formatTanggalID(date: Date | string): string {
  return dayjs(date).tz(TZ_WIB).format("D MMMM YYYY");
}

/** Format rupiah, mis. 463000 → "Rp 463.000". */
export function formatRupiah(nominal: number | string): string {
  const n = typeof nominal === "string" ? parseFloat(nominal) : nominal;
  return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));
}
