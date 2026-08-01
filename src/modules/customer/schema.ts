import { z } from "zod";
import { optionalId, optionalStr } from "@/lib/utils/zod";

export const customerSchema = z.object({
  id: optionalId,
  kodeCustomer: z
    .string()
    .trim()
    .min(2, "Kode customer minimal 2 karakter")
    .max(30, "Kode customer maksimal 30 karakter")
    .transform((v) => v.toUpperCase()),
  nama: z.string().trim().min(1, "Nama customer wajib diisi").max(150),
  alamat: z.string().trim().min(1, "Alamat wajib diisi"),
  wilayah: z.string().trim().min(1, "Wilayah wajib diisi").max(100),
  sales: optionalStr(100),
  pic: optionalStr(100),
  telepon: optionalStr(20),
  defaultUangSatpam: z.coerce
    .number({ invalid_type_error: "Uang satpam harus angka" })
    .min(0, "Uang satpam tidak boleh negatif"),
  defaultUangGudang: z.coerce
    .number({ invalid_type_error: "Uang gudang harus angka" })
    .min(0, "Uang gudang tidak boleh negatif"),
});

export type CustomerInput = z.infer<typeof customerSchema>;
