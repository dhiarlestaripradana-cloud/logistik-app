import { z } from "zod";
import { optionalDate, optionalId, optionalStr } from "@/lib/utils/zod";

export const JENIS_BBM = [
  "SOLAR",
  "DEXLITE",
  "PERTAMINA_DEX",
  "PERTALITE",
  "PERTAMAX",
  "PERTAMAX_TURBO",
  "LAINNYA",
] as const;

export const STATUS_KENDARAAN = [
  "TERSEDIA",
  "DALAM_PERJALANAN",
  "PERLU_SERVIS",
  "DALAM_SERVIS",
  "NONAKTIF",
] as const;

export const kendaraanSchema = z.object({
  id: optionalId,
  nomorPolisi: z
    .string()
    .trim()
    .min(3, "Nomor polisi minimal 3 karakter")
    .max(15, "Nomor polisi maksimal 15 karakter")
    .transform((v) => v.toUpperCase()),
  merk: z.string().trim().min(1, "Merk wajib diisi").max(50),
  tipe: z.string().trim().min(1, "Tipe wajib diisi").max(50),
  jenisBbm: z.enum(JENIS_BBM, {
    errorMap: () => ({ message: "Jenis BBM wajib dipilih" }),
  }),
  tahun: z.coerce
    .number({ invalid_type_error: "Tahun harus angka" })
    .int()
    .min(1980, "Tahun tidak valid")
    .max(2100, "Tahun tidak valid"),
  tanggalPembelian: z.coerce.date({
    errorMap: () => ({ message: "Tanggal pembelian wajib diisi" }),
  }),
  odometerSaatIni: z.coerce
    .number({ invalid_type_error: "Odometer harus angka" })
    .int()
    .min(0, "Odometer tidak boleh negatif"),
  intervalServisKm: z.coerce
    .number({ invalid_type_error: "Interval servis harus angka" })
    .int()
    .positive("Interval servis harus lebih dari 0"),
  kmServisTerakhir: z.coerce
    .number({ invalid_type_error: "KM servis terakhir harus angka" })
    .int()
    .min(0, "KM servis terakhir tidak boleh negatif"),
  standarKmPerLiter: z.coerce
    .number({ invalid_type_error: "Standar KM/liter harus angka" })
    .min(0, "Standar KM/liter tidak boleh negatif"),
  pajakBerlakuSampai: z.coerce.date({
    errorMap: () => ({ message: "Tanggal jatuh tempo pajak wajib diisi" }),
  }),
  // KIR opsional — motor / mobil non-angkutan-barang tidak punya KIR.
  kirBerlakuSampai: optionalDate,
  status: z.enum(STATUS_KENDARAAN).optional(),
  catatan: optionalStr(1000),
});

export type KendaraanInput = z.infer<typeof kendaraanSchema>;
