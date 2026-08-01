import { z } from "zod";

export const KATEGORI_PENGIRIM = ["SALES", "OJOL", "EKSPEDISI"] as const;

export const KATEGORI_LABEL: Record<string, string> = {
  SALES: "Canvas Sales",
  OJOL: "Ojek Online (Gojek/Grab)",
  EKSPEDISI: "Ekspedisi / Sewa Truk Luar",
};

// CATATAN DESAIN: schema ini SENGAJA tidak punya field uang apa pun.
// SJ Eksternal murni dokumen pengantar barang — kasbon/uang jalan/satpam/gudang
// adalah wilayah Perjalanan internal dan tidak boleh bocor ke sini.
export const sjEksternalSchema = z.object({
  tanggal: z.coerce.date({
    errorMap: () => ({ message: "Tanggal wajib diisi" }),
  }),
  kategoriPengirim: z.enum(KATEGORI_PENGIRIM, {
    errorMap: () => ({ message: "Kategori pengirim wajib dipilih" }),
  }),
  namaPengirim: z
    .string()
    .trim()
    .min(2, "Nama/plat pengirim wajib diisi")
    .max(120, "Nama pengirim maksimal 120 karakter"),
  customerId: z.string().uuid({ message: "Customer tujuan wajib dipilih" }),
  keteranganBarang: z
    .string()
    .trim()
    .min(3, "Keterangan barang wajib diisi")
    .max(2000, "Keterangan barang terlalu panjang"),
});

export type SjEksternalInput = z.infer<typeof sjEksternalSchema>;
