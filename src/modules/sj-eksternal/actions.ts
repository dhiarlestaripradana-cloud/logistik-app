"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { pesanErrorPrisma } from "@/lib/prisma-error";
import { requireAdmin } from "@/lib/auth-guard";
import type { ActionState } from "@/lib/action-state";
import { generateNomor } from "@/lib/utils/nomor";
import { sjEksternalSchema } from "./schema";

// =====================================================================
//  SJ EKSTERNAL — dokumen pengantar armada luar.
//  TIDAK ADA satu pun sentuhan ke ArusKas, Dana Pending, atau kendaraan
//  internal. Nomor memakai counter terpisah "SJ-EXT" agar deret nomor
//  Surat Jalan internal tidak terganggu.
// =====================================================================

export async function buatSjEksternal(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const parsed = sjEksternalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const d = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const nomorSj = await generateNomor(tx, "SJ-EXT");
      await tx.suratJalanEksternal.create({
        data: {
          nomorSj,
          tanggal: d.tanggal,
          kategoriPengirim: d.kategoriPengirim,
          namaPengirim: d.namaPengirim,
          customerId: d.customerId,
          keteranganBarang: d.keteranganBarang,
          status: "DIBAWA",
          dibuatOleh: session.user.id,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (e) {
    return { error: pesanErrorPrisma(e, "membuat Surat Jalan Eksternal") };
  }

  revalidatePath("/surat-jalan-eksternal");
  return { success: true };
}

// Tandai dokumen sudah kembali ke kantor (ACC) — DIBAWA → DIKEMBALIKAN.
export async function tandaiKembali(id: string): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const hasil = await prisma.suratJalanEksternal.updateMany({
    where: { id, status: "DIBAWA" }, // guard: hanya dari DIBAWA (idempoten)
    data: { status: "DIKEMBALIKAN", dikembalikanAt: new Date() },
  });
  if (hasil.count === 0) {
    return { error: "Dokumen tidak ditemukan atau sudah ditandai kembali." };
  }

  revalidatePath("/surat-jalan-eksternal");
  return { success: true };
}
