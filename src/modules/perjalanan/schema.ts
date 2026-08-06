import { z } from "zod";
import { optionalId, optionalStr } from "@/lib/utils/zod";

export const MAKS_TUJUAN = 100;

// Satu baris tujuan pada repeater multi-drop.
export const tujuanRowSchema = z.object({
  customerId: z
    .string()
    .uuid({ message: "Customer wajib dipilih di setiap baris tujuan" }),
  uangSatpam: z.coerce
    .number({ invalid_type_error: "Uang satpam harus angka" })
    .min(0, "Uang satpam tidak boleh negatif"),
  uangGudang: z.coerce
    .number({ invalid_type_error: "Uang gudang harus angka" })
    .min(0, "Uang gudang tidak boleh negatif"),
});

export type TujuanRowInput = z.infer<typeof tujuanRowSchema>;

// Repeater dikirim sebagai satu hidden input JSON (pola sama dgn multi-SIM).
const tujuanField = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return [];
  try {
    return JSON.parse(v);
  } catch {
    return "JSON_RUSAK";
  }
}, z
  .array(tujuanRowSchema)
  .min(1, "Minimal harus ada 1 customer tujuan")
  .max(MAKS_TUJUAN, `Maksimal ${MAKS_TUJUAN} titik drop per Surat Jalan`));

export const suratJalanSchema = z
  .object({
    id: optionalId, // terisi = edit DRAFT
    kendaraanId: z.string().uuid({ message: "Armada wajib dipilih" }),
    driverId: z.string().uuid({ message: "Driver wajib dipilih" }),
    tanggalBerangkat: z.coerce.date({
      errorMap: () => ({ message: "Tanggal berangkat wajib diisi" }),
    }),
    // kmAwal TIDAK diterima dari klien — diturunkan server dari
    // kendaraan.odometerSaatIni (anti-typo & anti-manipulasi DevTools).
    uangJalan: z.coerce
      .number({ invalid_type_error: "Uang jalan harus angka" })
      .min(0, "Uang jalan tidak boleh negatif"),
    catatan: optionalStr(1000),
    // Checkbox konfirmasi memakai armada PERLU_SERVIS untuk rute dekat.
    overrideServis: z.preprocess((v) => v === "1" || v === "on", z.boolean()),
    // intent TIDAK lagi dibaca dari FormData (bug React 19: name/value tombol
    // submit tak ter-serialize pada function action) — kini argumen bind server action.
    tujuan: tujuanField,
  })
  .superRefine((val, ctx) => {
    const ids = val.tujuan.map((t) => t.customerId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tujuan"],
        message: "Customer yang sama muncul lebih dari satu kali di daftar tujuan",
      });
    }
  });

export type SuratJalanInput = z.infer<typeof suratJalanSchema>;