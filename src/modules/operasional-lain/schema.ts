import { z } from "zod";

export const operasionalSchema = z.object({
  tanggal: z.coerce.date({
    errorMap: () => ({ message: "Tanggal wajib diisi" }),
  }),
  keterangan: z
    .string()
    .trim()
    .min(3, "Keterangan minimal 3 karakter (mis. 'Beli ATK: kertas A4')"),
  penerima: z
    .string()
    .trim()
    .min(1, "Penerima dana wajib diisi (vendor/toko/petugas)")
    .max(100),
  jumlah: z.coerce
    .number({ invalid_type_error: "Jumlah (Qty) harus angka" })
    .positive("Jumlah (Qty) harus lebih dari 0"),
  hargaSatuan: z.coerce
    .number({ invalid_type_error: "Harga satuan harus angka" })
    .positive("Harga satuan harus lebih dari 0"),
});

export const modalMasukSchema = z.object({
  tanggal: z.coerce.date({
    errorMap: () => ({ message: "Tanggal wajib diisi" }),
  }),
  nominal: z.coerce
    .number({ invalid_type_error: "Nominal harus angka" })
    .positive("Nominal harus lebih dari 0"),
  pemberi: z
    .string()
    .trim()
    .min(1, "Pemberi dana wajib diisi (mis. nama pemilik/investor)")
    .max(100),
  keterangan: z.string().trim().min(3, "Keterangan minimal 3 karakter"),
});
