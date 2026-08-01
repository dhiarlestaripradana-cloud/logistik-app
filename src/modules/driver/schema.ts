import { z } from "zod";
import { optionalDate, optionalId, optionalStr } from "@/lib/utils/zod";

export const JENIS_KELAMIN = ["LAKI_LAKI", "PEREMPUAN"] as const;
export const JENIS_SIM = ["A", "B1", "B1_UMUM", "B2", "B2_UMUM", "C"] as const;

// Satu baris SIM — pesan error per kolom (revisi UAT #3.3).
export const simRowSchema = z.object({
  noSim: z
    .string()
    .trim()
    .min(5, "Nomor SIM minimal 5 karakter")
    .max(30, "Nomor SIM maksimal 30 karakter"),
  jenisSim: z.enum(JENIS_SIM, {
    errorMap: () => ({ message: "Jenis SIM wajib dipilih" }),
  }),
  masaBerlakuSim: z.coerce.date({
    errorMap: () => ({ message: "Masa berlaku SIM wajib diisi" }),
  }),
});

// REVISI UAT #3.1: form driver TIDAK lagi mengirim FormData.
// Klien mengirim OBJEK JSON langsung ke Server Action, sehingga `sims`
// tiba sebagai array JavaScript asli — tanpa trik serialisasi apa pun.
export const driverSchema = z
  .object({
    id: optionalId,
    // ---- Akun login ----
    nama: z.string().trim().min(1, "Nama driver wajib diisi").max(100),
    username: z
      .string()
      .trim()
      .min(4, "Username minimal 4 karakter")
      .max(50, "Username maksimal 50 karakter")
      .regex(/^[a-z0-9._-]+$/i, "Username hanya boleh huruf, angka, titik, strip, underscore")
      .transform((v) => v.toLowerCase()),
    password: z.string().optional(),
    telepon: optionalStr(20),
    // ---- Biodata ----
    jenisKelamin: z.enum(JENIS_KELAMIN, {
      errorMap: () => ({ message: "Jenis kelamin wajib dipilih" }),
    }),
    tempatLahir: optionalStr(100),
    tanggalLahir: optionalDate,
    alamat: optionalStr(1000),
    // ---- Data SIM: array murni ----
    sims: z.array(simRowSchema).max(6, "Maksimal 6 SIM per driver"),
  })
  .superRefine((val, ctx) => {
    const pw = val.password?.trim() ?? "";
    if (!val.id && pw.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password minimal 6 karakter",
      });
    }
    if (val.id && pw.length > 0 && pw.length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: "Password baru minimal 6 karakter",
      });
    }
    // Jenis SIM ganda: tandai TEPAT di baris duplikatnya (bukan error umum).
    const terlihat = new Map<string, number>();
    val.sims.forEach((s, i) => {
      if (terlihat.has(s.jenisSim)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sims", i, "jenisSim"],
          message: `Jenis SIM ${s.jenisSim.replaceAll("_", " ")} sudah dipakai di baris ${terlihat.get(s.jenisSim)! + 1}`,
        });
      } else {
        terlihat.set(s.jenisSim, i);
      }
    });
  });

// Bentuk payload mentah dari klien (semua string dari input HTML).
export type DriverPayload = {
  id?: string;
  nama: string;
  username: string;
  password?: string;
  telepon?: string;
  jenisKelamin: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  alamat?: string;
  sims: Array<{ noSim: string; jenisSim: string; masaBerlakuSim: string }>;
};
