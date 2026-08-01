"use server";

import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { driverSchema } from "./schema";
import type { JenisKelamin, JenisSim } from "@prisma/client";

const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

// Hasil action dgn error per kolom (revisi UAT #3.3):
// key = path Zod bergabung titik, mis. "sims.0.jenisSim" / "username".
export type DriverActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// REVISI UAT #3.1: menerima OBJEK payload langsung (bukan FormData) —
// array `sims` tiba utuh sebagai array, tanpa Object.fromEntries.
export async function saveDriver(input: unknown): Promise<DriverActionResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      error: "Periksa kembali kolom yang ditandai merah.",
      fieldErrors,
    };
  }

  const d = parsed.data;
  const profil = {
    jenisKelamin: d.jenisKelamin as JenisKelamin,
    tempatLahir: d.tempatLahir ?? null,
    tanggalLahir: d.tanggalLahir ?? null,
    alamat: d.alamat ?? null,
  };
  const simRows = d.sims.map((s) => ({
    noSim: s.noSim,
    jenisSim: s.jenisSim as JenisSim,
    masaBerlakuSim: s.masaBerlakuSim,
  }));

  try {
    if (d.id) {
      // EDIT — username terkunci (tidak ditulis ulang); password hanya jika diisi;
      // SIM replace-all dalam SATU nested write atomik.
      const pw = d.password?.trim();
      await prisma.user.update({
        where: { id: d.id, role: "DRIVER" },
        data: {
          nama: d.nama,
          telepon: d.telepon ?? null,
          ...(pw ? { passwordHash: await hash(pw, ARGON2_OPTS) } : {}),
          driverProfile: {
            upsert: {
              create: { ...profil, sims: { create: simRows } },
              update: { ...profil, sims: { deleteMany: {}, create: simRows } },
            },
          },
        },
      });
    } else {
      const passwordHash = await hash(d.password!.trim(), ARGON2_OPTS);
      await prisma.user.create({
        data: {
          nama: d.nama,
          username: d.username,
          passwordHash,
          role: "DRIVER",
          telepon: d.telepon ?? null,
          driverProfile: { create: { ...profil, sims: { create: simRows } } },
        },
      });
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return {
        error: "Username tersebut sudah dipakai.",
        fieldErrors: { username: "Username sudah dipakai — gunakan yang lain." },
      };
    }
    return { error: "Gagal menyimpan data driver. Coba lagi." };
  }

  revalidatePath("/driver");
  return { success: true };
}

// SOFT-DELETE: akun dinonaktifkan, BUKAN dihapus — riwayat & audit utuh.
export async function toggleDriverAktif(id: string, _fd: FormData) {
  await requireAdmin();
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u || u.role !== "DRIVER") return;
  await prisma.user.update({ where: { id }, data: { isActive: !u.isActive } });
  revalidatePath("/driver");
}
