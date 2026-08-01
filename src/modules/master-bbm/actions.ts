"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import type { ActionState } from "@/lib/action-state";
import { masterBbmSchema } from "./schema";

export async function saveMasterBbm(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const raw = Object.fromEntries(formData);
  const parsed = masterBbmSchema.safeParse({
    ...raw,
    isActive: raw.isActive === "1" || raw.isActive === "true",
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.masterBbm.update({ where: { id }, data });
    } else {
      await prisma.masterBbm.create({ data });
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "Nama produk BBM tersebut sudah terdaftar." };
    }
    return { error: "Gagal menyimpan data BBM." };
  }

  revalidatePath("/master-bbm");
  return { success: true };
}

// Nonaktifkan, JANGAN hapus — laporan BBM lama tetap bisa ditelusuri.
export async function toggleMasterBbmAktif(id: string, _fd: FormData) {
  await requireAdmin();
  const b = await prisma.masterBbm.findUnique({ where: { id } });
  if (!b) return;
  await prisma.masterBbm.update({
    where: { id },
    data: { isActive: !b.isActive },
  });
  revalidatePath("/master-bbm");
}
