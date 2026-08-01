import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import { loginSchema } from "@/lib/validations/auth";

// -------------------------------------------------------------
//  Instance Auth.js v5 utama (Node runtime).
//  - Driver TIDAK bisa self-register: akun hanya dibuat Super Admin.
//  - Password diverifikasi dengan argon2 (hash disimpan di users.password_hash).
// -------------------------------------------------------------

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validasi bentuk input dulu
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { username },
        });

        // User tidak ada / nonaktif → tolak (pesan generik demi keamanan)
        if (!user || !user.isActive) return null;

        const valid = await verify(user.passwordHash, password);
        if (!valid) return null;

        // Objek ini menjadi `user` di callback jwt()
        return {
          id: user.id,
          nama: user.nama,
          role: user.role,
          // NextAuth mengharuskan ada 'name'/'email'; pakai username sebagai name
          name: user.nama,
        };
      },
    }),
  ],
});
