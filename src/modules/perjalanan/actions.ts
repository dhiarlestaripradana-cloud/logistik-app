"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { pesanErrorPrisma } from "@/lib/prisma-error";
import { requireAdmin } from "@/lib/auth-guard";
import type { ActionState } from "@/lib/action-state";
import { generateNomor } from "@/lib/utils/nomor";
import { suratJalanSchema } from "./schema";

class TripError extends Error {}
const toMoney = (n: number) => Math.round(n * 100) / 100;

// Status armada setelah dilepas dari trip (batal / nanti: settle) —
// dihitung ulang dari aturan servis, karena status sebelumnya tidak disimpan.
function statusArmadaSetelahLepas(k: {
  kmServisTerakhir: number;
  intervalServisKm: number;
  odometerSaatIni: number;
}): "TERSEDIA" | "PERLU_SERVIS" {
  const sisa = k.kmServisTerakhir + k.intervalServisKm - k.odometerSaatIni;
  return sisa <= 100 ? "PERLU_SERVIS" : "TERSEDIA";
}

// Guard kelayakan tugas — dipanggil DI DALAM transaksi saat menerbitkan.
async function pastikanLayakTerbit(
  tx: Prisma.TransactionClient,
  args: {
    kendaraanId: string;
    driverId: string;
    overrideServis: boolean;
    kecualiTripId?: string;
  }
) {
  const k = await tx.kendaraan.findUnique({ where: { id: args.kendaraanId } });
  if (!k) throw new TripError("Armada tidak ditemukan.");
  if (k.status === "NONAKTIF" || k.status === "DALAM_SERVIS")
    throw new TripError(`Armada ${k.nomorPolisi} berstatus ${k.status.replaceAll("_", " ")} — tidak dapat ditugaskan.`);
  if (k.status === "DALAM_PERJALANAN")
    throw new TripError(`Armada ${k.nomorPolisi} sedang dalam perjalanan lain.`);
  // Soft-block Blueprint 3: PERLU_SERVIS boleh jalan HANYA dengan override sadar.
  if (k.status === "PERLU_SERVIS" && !args.overrideServis)
    throw new TripError(
      `Armada ${k.nomorPolisi} berstatus PERLU SERVIS. Centang konfirmasi ` +
        `"tetap tugaskan untuk rute dekat" jika ingin memaksakan.`
    );

  const d = await tx.user.findUnique({ where: { id: args.driverId } });
  if (!d || d.role !== "DRIVER" || !d.isActive)
    throw new TripError("Driver tidak valid atau sudah nonaktif.");

  const sibuk = await tx.perjalanan.count({
    where: {
      driverId: args.driverId,
      status: { in: ["DITUGASKAN", "BERJALAN"] },
      ...(args.kecualiTripId ? { id: { not: args.kecualiTripId } } : {}),
    },
  });
  if (sibuk > 0)
    throw new TripError(`Driver ${d.nama} masih memiliki tugas aktif lain.`);

  return { kendaraan: k, driver: d };
}

// =====================================================================
//  SIMPAN SURAT JALAN (create baru / edit DRAFT) — intent: draft | terbitkan
//  - Nomor SJ digenerate ATOMIK saat create (draft pun bernomor; trip batal
//    tetap menyimpan nomornya → tidak ada nomor "hilang" saat audit).
//  - intent=terbitkan → status DITUGASKAN + armada DALAM_PERJALANAN.
//    TANPA entri ArusKas — uang jalan hanya masuk Dana Pending (2-Step, 4.5).
// =====================================================================
// Fungsi inti — TIDAK diekspor. intent datang sebagai argumen fungsi,
// bukan dari FormData (perbaikan bug "Intent tidak dikenal", React 19).
async function simpanSuratJalan(
  intent: "draft" | "terbitkan",
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const parsed = suratJalanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const d = parsed.data;

  try {
    await prisma.$transaction(
      async (tx) => {
        // Validasi keberadaan customer tujuan (aktif)
        const customerCount = await tx.customer.count({
          where: { id: { in: d.tujuan.map((t) => t.customerId) }, isActive: true },
        });
        if (customerCount !== d.tujuan.length)
          throw new TripError("Ada customer tujuan yang tidak valid / nonaktif.");

        const terbit = intent === "terbitkan";
        let kendaraan;
        if (terbit) {
          const hasil = await pastikanLayakTerbit(tx, {
            kendaraanId: d.kendaraanId,
            driverId: d.driverId,
            overrideServis: d.overrideServis,
            kecualiTripId: d.id,
          });
          kendaraan = hasil.kendaraan;
        } else {
          // Draft: cukup pastikan armada ada (validasi penuh saat terbit).
          kendaraan = await tx.kendaraan.findUnique({
            where: { id: d.kendaraanId },
          });
          if (!kendaraan) throw new TripError("Armada tidak ditemukan.");
        }

        const tujuanRows = d.tujuan.map((t, i) => ({
          customerId: t.customerId,
          urutan: i + 1,
          uangSatpam: toMoney(t.uangSatpam),
          uangGudang: toMoney(t.uangGudang),
        }));

        const dataUmum = {
          kendaraanId: d.kendaraanId,
          driverId: d.driverId,
          tanggalBerangkat: d.tanggalBerangkat,
          // SNAPSHOT SERVER-SIDE: KM awal selalu = odometer master saat ini.
          // Klien hanya menampilkan, tidak pernah menentukan (anti-typo).
          kmAwal: kendaraan.odometerSaatIni,
          uangJalan: toMoney(d.uangJalan),
          catatan: d.catatan ?? null,
          status: terbit ? ("DITUGASKAN" as const) : ("DRAFT" as const),
        };

        // Bantuan variabel untuk ngecek status lama di luar blok if
        let statusLama = null;
        let kendaraanLamaId = null;

        if (d.id) {
          // ---- EDIT: KUNCI DIBUKA, DRAFT & DITUGASKAN BOLEH DIUBAH ----
          const lama = await tx.perjalanan.findUnique({ where: { id: d.id } });
          if (!lama) throw new TripError("Surat Jalan tidak ditemukan.");
          
          if (lama.status !== "DRAFT" && lama.status !== "DITUGASKAN")
            throw new TripError("Hanya Surat Jalan yang belum jalan (DRAFT / DITUGASKAN) yang dapat diedit.");

          statusLama = lama.status;
          kendaraanLamaId = lama.kendaraanId;

          await tx.perjalanan.update({
            where: { id: d.id },
            data: {
              ...dataUmum,
              tujuan: { deleteMany: {}, create: tujuanRows },
            },
          });
        } else {
          // ---- CREATE: nomor SJ atomik (Blueprint 4.6) ----
          const nomorSj = await generateNomor(tx, "SJ");
          await tx.perjalanan.create({
            data: {
              ...dataUmum,
              nomorSj,
              dibuatOleh: session.user.id,
              tujuan: { create: tujuanRows },
            },
          });
        }

        // Efek samping DITUGASKAN (Blueprint 3): armada terkunci.
        if (terbit) {
          await tx.kendaraan.update({
            where: { id: d.kendaraanId },
            data: { status: "DALAM_PERJALANAN" },
          });
          
          // Lepas armada lama jika saat edit mobilnya diganti
          if (d.id && statusLama === "DITUGASKAN" && kendaraanLamaId && kendaraanLamaId !== d.kendaraanId) {
             const kLama = await tx.kendaraan.findUnique({ where: { id: kendaraanLamaId }});
             if (kLama) {
                await tx.kendaraan.update({
                  where: { id: kLama.id },
                  data: { status: statusArmadaSetelahLepas(kLama) }
                });
             }
          }
        } else if (d.id && statusLama === "DITUGASKAN") {
          // Kalau asalnya DITUGASKAN (armada kekunci), tapi admin nyimpennya sebagai "DRAFT" 
          // (batal terbit sementara), armadanya harus dilepas biar bisa dipake orang lain.
          if (kendaraanLamaId) {
            const kLama = await tx.kendaraan.findUnique({ where: { id: kendaraanLamaId }});
            if (kLama) {
               await tx.kendaraan.update({
                 where: { id: kLama.id },
                 data: { status: statusArmadaSetelahLepas(kLama) }
               });
            }
          }
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof TripError) return { error: e.message };
    return { error: pesanErrorPrisma(e, "menyimpan Surat Jalan") };
  }

  revalidatePath("/perjalanan");
  revalidatePath("/kendaraan");
  revalidatePath("/dashboard");
  redirect("/perjalanan");
}

// Dua Server Action terpisah — dipasang ke tombol via formAction (React 19-proof).
export async function saveDraftSuratJalan(
  prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return simpanSuratJalan("draft", prev, formData);
}

export async function terbitkanSuratJalanBaru(
  prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return simpanSuratJalan("terbitkan", prev, formData);
}

// =====================================================================
//  TERBITKAN draft dari list/detail (DRAFT → DITUGASKAN)
//  Catatan: jika armada kini PERLU_SERVIS, terbit lewat sini DITOLAK —
//  admin harus lewat Edit Draft agar mencentang override secara sadar.
// =====================================================================
export async function terbitkanSuratJalan(id: string): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const trip = await tx.perjalanan.findUnique({ where: { id } });
        if (!trip) throw new TripError("Surat Jalan tidak ditemukan.");
        if (trip.status !== "DRAFT")
          throw new TripError("Hanya DRAFT yang dapat diterbitkan.");

        await pastikanLayakTerbit(tx, {
          kendaraanId: trip.kendaraanId,
          driverId: trip.driverId,
          overrideServis: false, // terbit cepat tidak membawa override
          kecualiTripId: id,
        });

        const kendaraan = await tx.kendaraan.findUniqueOrThrow({
          where: { id: trip.kendaraanId },
        });

        await tx.perjalanan.update({
          where: { id },
          // KM awal di-refresh: snapshot odometer PADA SAAT diterbitkan,
          // bukan saat draft dibuat (odometer bisa berubah di antaranya).
          data: { status: "DITUGASKAN", kmAwal: kendaraan.odometerSaatIni },
        });
        await tx.kendaraan.update({
          where: { id: trip.kendaraanId },
          data: { status: "DALAM_PERJALANAN" },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof TripError) return { error: e.message };
    return { error: pesanErrorPrisma(e, "menerbitkan Surat Jalan") };
  }

  revalidatePath("/perjalanan");
  revalidatePath("/kendaraan");
  revalidatePath("/dashboard");
  return { success: true };
}

// =====================================================================
//  BATALKAN (DRAFT / DITUGASKAN → DIBATALKAN)
//  Inilah buah 2-Step Settlement: NOL sentuhan ke ArusKas.
//  Armada dilepas — statusnya dihitung ulang (TERSEDIA / PERLU_SERVIS).
// =====================================================================
export async function batalkanSuratJalan(id: string): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        const trip = await tx.perjalanan.findUnique({
          where: { id },
          include: { kendaraan: true },
        });
        if (!trip) throw new TripError("Surat Jalan tidak ditemukan.");
        if (trip.status !== "DRAFT" && trip.status !== "DITUGASKAN")
          throw new TripError(
            "Trip yang sudah BERJALAN tidak dapat dibatalkan — selesaikan lewat laporan driver lalu settle apa adanya (kebijakan Blueprint 3)."
          );

        const sebelumnya = trip.status;
        await tx.perjalanan.update({
          where: { id },
          data: { status: "DIBATALKAN" },
        });

        // Armada hanya perlu dilepas jika trip sempat menguncinya.
        if (
          sebelumnya === "DITUGASKAN" &&
          trip.kendaraan.status === "DALAM_PERJALANAN"
        ) {
          await tx.kendaraan.update({
            where: { id: trip.kendaraanId },
            data: { status: statusArmadaSetelahLepas(trip.kendaraan) },
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof TripError) return { error: e.message };
    return { error: pesanErrorPrisma(e, "membatalkan Surat Jalan") };
  }

  revalidatePath("/perjalanan");
  revalidatePath("/kendaraan");
  revalidatePath("/dashboard");
  return { success: true };
}