import { z } from "zod";

export const TIPE_KAS = ["MASUK", "KELUAR"] as const;

// PENYEDERHANAAN (permintaan manajemen): form kas manual kini MURNI
// 6 field — tanggal, tipe, pemberi, penerima, nominal, keterangan.
// Kolom `kategori` di DB tetap ada (dibutuhkan entri OTOMATIS settlement &
// operasional), tapi untuk input manual diisi server secara diam-diam:
//   MASUK  → MODAL_MASUK   |   KELUAR → LAIN_LAIN
// Admin tidak perlu memikirkannya; otomatisasi kasbon tidak terganggu.

export const kasManualSchema = z.object({
  tanggal: z.coerce.date({
    errorMap: () => ({ message: "Tanggal wajib diisi" }),
  }),
  tipe: z.enum(TIPE_KAS, {
    errorMap: () => ({ message: "Tipe (Masuk/Keluar) wajib dipilih" }),
  }),
  nominal: z.coerce
    .number({ invalid_type_error: "Nominal harus angka" })
    .positive("Nominal harus lebih dari 0"),
  pemberi: z
    .string()
    .trim()
    .min(1, "Pemberi dana wajib diisi")
    .max(100, "Pemberi maksimal 100 karakter"),
  penerima: z
    .string()
    .trim()
    .min(1, "Penerima dana wajib diisi")
    .max(100, "Penerima maksimal 100 karakter"),
  keterangan: z.string().trim().min(3, "Keterangan minimal 3 karakter"),
});

export type KasManualInput = z.infer<typeof kasManualSchema>;
