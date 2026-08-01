import { z } from "zod";
import { optionalId } from "@/lib/utils/zod";

export const masterBbmSchema = z.object({
  id: optionalId,
  namaProduk: z
    .string()
    .trim()
    .min(2, "Nama produk BBM wajib diisi")
    .max(60, "Nama produk maksimal 60 karakter"),
  hargaPerLiter: z.coerce
    .number({ invalid_type_error: "Harga harus angka" })
    .positive("Harga per liter harus lebih dari 0"),
  isActive: z.coerce.boolean().default(true),
});

export type MasterBbmInput = z.infer<typeof masterBbmSchema>;
