"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type KategoriKas } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { generateNomor } from "@/lib/utils/nomor";
import { formatRupiah } from "@/lib/utils/date";
import { pesanErrorPrisma } from "@/lib/prisma-error";
import { kasManualSchema } from "./schema";

class KasError extends Error {}
const toMoney = (n: number) => Math.round(n * 100) / 100;

// Hasil action dengan error per kolom — pola yang sama dengan form Driver/SIM.
export type KasActionResult = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// =====================================================================
//  INPUT KAS MANUAL (MASUK / KELUAR) — pure in/out, 6 field.
//  Menerima OBJEK payload langsung (bukan FormData) agar tidak ada lagi
//  celah serialisasi form → server, persis pola form Driver.
//  `kategori` TIDAK divalidasi dari klien; di-inject server tepat sebelum
//  disimpan ke Prisma: MASUK → MODAL_MASUK, KELUAR → LAIN_LAIN.
// =====================================================================
export async function catatKasManual(input: unknown): Promise<KasActionResult> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const parsed = kasManualSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Periksa kembali kolom yang ditandai merah.", fieldErrors };
  }

  const { tanggal, tipe, nominal, pemberi, penerima, keterangan } = parsed.data;
  const nom = toMoney(nominal);
  // Injeksi kategori otomatis — dilakukan SETELAH validasi, tepat sebelum simpan.
  const kategori: KategoriKas = tipe === "MASUK" ? "MODAL_MASUK" : "LAIN_LAIN";

  try {
    await prisma.$transaction(
      async (tx) => {
        const last = await tx.arusKas.findFirst({
          orderBy: { createdAt: "desc" },
          select: { saldoSesudah: true },
        });
        const saldo = last ? Number(last.saldoSesudah) : 0;

        if (tipe === "KELUAR" && saldo < nom) {
          throw new KasError(
            `Saldo kas tidak mencukupi. Saldo saat ini ${formatRupiah(saldo)}, ` +
              `pengeluaran ${formatRupiah(nom)}.`
          );
        }

        const nomorRef = await generateNomor(tx, "KAS");
        const saldoBaru = tipe === "MASUK" ? saldo + nom : saldo - nom;

        await tx.arusKas.create({
          data: {
            nomorRef,
            tanggal,
            tipe,
            kategori,
            nominal: nom,
            keterangan,
            pemberi,
            penerima,
            saldoSesudah: toMoney(saldoBaru),
            dibuatOleh: session.user.id,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof KasError) return { error: e.message };
    return { error: pesanErrorPrisma(e, "mencatat transaksi kas") };
  }

  revalidatePath("/kas");
  revalidatePath("/operasional");
  revalidatePath("/dashboard");
  return { success: true };
}
