"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import type { ActionState } from "@/lib/action-state";
import { customerSchema } from "./schema";

export async function saveCustomer(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const parsed = customerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.customer.update({ where: { id }, data });
    } else {
      await prisma.customer.create({ data });
    }
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") {
      return { error: "Kode customer tersebut sudah dipakai." };
    }
    return { error: "Gagal menyimpan data customer." };
  }

  revalidatePath("/customer");
  return { success: true };
}

// Soft-delete (Blueprint 2.3): riwayat trip milik customer lama tetap utuh.
export async function toggleCustomerAktif(id: string, _fd: FormData) {
  await requireAdmin();
  const c = await prisma.customer.findUnique({ where: { id } });
  if (!c) return;
  await prisma.customer.update({
    where: { id },
    data: { isActive: !c.isActive },
  });
  revalidatePath("/customer");
}
