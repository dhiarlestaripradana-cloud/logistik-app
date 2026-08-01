"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import type { ActionState } from "@/lib/action-state";
import { kendaraanSchema } from "./schema";

export async function saveKendaraan(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const parsed = kendaraanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { id, kirBerlakuSampai, ...rest } = parsed.data;
  // undefined dari form kosong HARUS jadi null eksplisit — kalau tidak,
  // Prisma mengabaikan field ini saat update dan KIR lama tak bisa dihapus.
  const data = { ...rest, kirBerlakuSampai: kirBerlakuSampai ?? null };

  try {
    if (id) {
      await prisma.kendaraan.update({ where: { id }, data });
    } else {
      await prisma.kendaraan.create({ data });
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "Nomor polisi tersebut sudah terdaftar." };
    }
    return { error: "Gagal menyimpan data kendaraan." };
  }

  revalidatePath("/kendaraan");
  return { success: true };
}

// Soft-delete: kendaraan tidak pernah dihapus (riwayat trip harus utuh) —
// hanya dinonaktifkan agar tidak bisa dipilih di Surat Jalan.
export async function toggleKendaraanAktif(id: string, _fd: FormData) {
  await requireAdmin();
  const k = await prisma.kendaraan.findUnique({ where: { id } });
  if (!k) return;
  await prisma.kendaraan.update({
    where: { id },
    data: { status: k.status === "NONAKTIF" ? "TERSEDIA" : "NONAKTIF" },
  });
  revalidatePath("/kendaraan");
}
