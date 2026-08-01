import { selisihHariWIB } from "@/lib/utils/date";

export type LevelAlert = "MERAH" | "KUNING" | "HIJAU";

export type AlertDokumen = {
  level: LevelAlert;
  label: string;
  sisaHari: number;
};

/**
 * Logika alert dokumen (Blueprint 4.2), dihitung real-time basis hari WIB:
 *  - lewat tempo    → MERAH  "Terlambat N hari"
 *  - sisa ≤ 7 hari  → MERAH  "N hari lagi"
 *  - sisa ≤ 14 hari → KUNING "N hari lagi"
 *  - selain itu     → HIJAU  "Aman"
 * Dipakai untuk: Pajak STNK, KIR, dan (bonus) masa berlaku SIM driver.
 */
export function statusDokumen(jatuhTempo: Date | string): AlertDokumen {
  const sisa = selisihHariWIB(jatuhTempo);
  if (sisa < 0) return { level: "MERAH", label: `Terlambat ${Math.abs(sisa)} hari`, sisaHari: sisa };
  if (sisa <= 7) return { level: "MERAH", label: `${sisa} hari lagi`, sisaHari: sisa };
  if (sisa <= 14) return { level: "KUNING", label: `${sisa} hari lagi`, sisaHari: sisa };
  return { level: "HIJAU", label: "Aman", sisaHari: sisa };
}
