import { z } from "zod";

// Satu sumber kebenaran validasi login — dipakai di form (klien) & Server Action.
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Username wajib diisi" })
    .max(50, { message: "Username terlalu panjang" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
