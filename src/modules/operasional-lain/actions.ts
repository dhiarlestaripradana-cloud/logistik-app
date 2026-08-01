"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { pesanErrorPrisma } from "@/lib/prisma-error";
import { requireAdmin, requireKantor } from "@/lib/auth-guard";
import type { ActionState } from "@/lib/action-state";
import { generateNomor } from "@/lib/utils/nomor";
import { formatRupiah } from "@/lib/utils/date";
import { modalMasukSchema, operasionalSchema } from "./schema";

// Error bisnis yang pesannya aman ditampilkan ke user.
class KasError extends Error {}

// Pembulatan uang 2 desimal — hindari artefak floating point.
const toMoney = (n: number) => Math.round(n * 100) / 100;

// =====================================================================
//  AUTOMATION LOGIC (instruksi owner + kontrak di schema.prisma):
//  1) totalHarga dihitung SERVER-SIDE (jangan pernah percaya klien)
//  2) $transaction Serializable:
//     - baca saldo terakhir (append-only ledger → baris terbaru)
//     - tolak jika saldo tidak mencukupi
//     - generate nomor KAS/YYYY/MM/#### via DocumentCounter (atomik)
//     - INSERT ArusKas (KELUAR, OPERASIONAL_LAIN, saldoSesudah baru)
//     - INSERT OperasionalLain tertaut arusKasId
//  Semua sukses atau semua batal — saldo mustahil terpotong tanpa jejak.
// =====================================================================
export async function catatPengeluaranOperasional(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let session;
  try {
    session = await requireKantor();
  } catch {
    return { error: "Akses ditolak." };
  }

  const parsed = operasionalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { tanggal, keterangan, penerima, jumlah, hargaSatuan } = parsed.data;
  const totalHarga = toMoney(jumlah * hargaSatuan); // (1) server-side

  try {
    await prisma.$transaction(
      async (tx) => {
        const last = await tx.arusKas.findFirst({
          orderBy: { createdAt: "desc" },
          select: { saldoSesudah: true },
        });
        const saldo = last ? Number(last.saldoSesudah) : 0;

        if (saldo < totalHarga) {
          throw new KasError(
            `Saldo kas tidak mencukupi. Saldo saat ini ${formatRupiah(saldo)}, ` +
              `pengeluaran ${formatRupiah(totalHarga)}. Catat pemasukan modal terlebih dahulu.`
          );
        }

        const nomorRef = await generateNomor(tx, "KAS");

        const kas = await tx.arusKas.create({
          data: {
            nomorRef,
            tanggal,
            tipe: "KELUAR",
            kategori: "OPERASIONAL_LAIN",
            nominal: totalHarga,
            keterangan,
            pemberi: "Kas Perusahaan",
            penerima,
            saldoSesudah: toMoney(saldo - totalHarga),
            dibuatOleh: session.user.id,
          },
        });

        await tx.operasionalLain.create({
          data: {
            tanggal,
            userId: session.user.id,
            keterangan,
            jumlah,
            hargaSatuan,
            totalHarga,
            arusKasId: kas.id,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof KasError) return { error: e.message };
    return { error: pesanErrorPrisma(e, "mencatat pengeluaran") };
  }

  revalidatePath("/operasional");
  return { success: true };
}

// Pemasukan modal kas (MASUK / MODAL_MASUK) — dibutuhkan agar pengeluaran
// pertama bisa diuji; form lengkap Buku Kas menyusul di Sprint 4.
export async function catatModalMasuk(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const parsed = modalMasukSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { tanggal, nominal, pemberi, keterangan } = parsed.data;

  try {
    await prisma.$transaction(
      async (tx) => {
        const last = await tx.arusKas.findFirst({
          orderBy: { createdAt: "desc" },
          select: { saldoSesudah: true },
        });
        const saldo = last ? Number(last.saldoSesudah) : 0;
        const nomorRef = await generateNomor(tx, "KAS");

        await tx.arusKas.create({
          data: {
            nomorRef,
            tanggal,
            tipe: "MASUK",
            kategori: "MODAL_MASUK",
            nominal: toMoney(nominal),
            keterangan,
            pemberi,
            penerima: "Kas Perusahaan",
            saldoSesudah: toMoney(saldo + nominal),
            dibuatOleh: session.user.id,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    return { error: pesanErrorPrisma(e, "mencatat pemasukan modal") };
  }

  revalidatePath("/operasional");
  return { success: true };
}
