"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type KategoriBiaya } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireDriver } from "@/lib/auth-guard";
import type { ActionState } from "@/lib/action-state";
import { simpanFotoBukti } from "@/lib/upload";

class LaporError extends Error {}
const toMoney = (n: number) => Math.round(n * 100) / 100;

// =====================================================================
//  ① MULAI PERJALANAN — DITUGASKAN → BERJALAN + timestamp aktual.
//  Ownership dicek DI DALAM WHERE (id + driverId) — bukan setelahnya.
// =====================================================================
export async function mulaiPerjalanan(tripId: string): Promise<ActionState> {
  let session;
  try {
    session = await requireDriver();
  } catch {
    return { error: "Akses ditolak." };
  }

  const hasil = await prisma.perjalanan.updateMany({
    where: {
      id: tripId,
      driverId: session.user.id, // ← SCOPING MUTLAK
      status: "DITUGASKAN",
    },
    data: { status: "BERJALAN", berangkatAktualAt: new Date() },
  });
  if (hasil.count === 0) {
    return { error: "Tugas tidak ditemukan atau bukan milik Anda." };
  }

  revalidatePath("/tugas");
  revalidatePath("/perjalanan");
  return { success: true };
}

// =====================================================================
//  ② TANDAI DROP ✅/⬜ — toggle MENUNGGU ⇄ TERKIRIM saat BERJALAN.
// =====================================================================
export async function tandaiDrop(tujuanId: string): Promise<ActionState> {
  let session;
  try {
    session = await requireDriver();
  } catch {
    return { error: "Akses ditolak." };
  }

  const t = await prisma.tujuanPerjalanan.findFirst({
    where: {
      id: tujuanId,
      perjalanan: { driverId: session.user.id, status: "BERJALAN" }, // ← SCOPING
    },
  });
  if (!t) return { error: "Titik drop tidak ditemukan / trip belum berjalan." };

  await prisma.tujuanPerjalanan.update({
    where: { id: tujuanId },
    data: { statusDrop: t.statusDrop === "TERKIRIM" ? "MENUNGGU" : "TERKIRIM" },
  });

  revalidatePath("/tugas");
  return { success: true };
}

// =====================================================================
//  ③ SUBMIT LAPORAN 7 PARAMETER (Blueprint 2.2 model biaya_perjalanan)
//  Alur: validasi penuh → simpan foto → TRANSAKSI (upsert laporan +
//  replace biaya + trip → MENUNGGU_VERIFIKASI). Laporan terkunci utk driver.
// =====================================================================

const metaBbmSchema = z.array(
  z.object({
    // bbmId opsional demi kompatibilitas draft offline lama (pra Master BBM).
    bbmId: z.string().uuid().optional().or(z.literal("")),
    nominal: z.coerce.number().positive("Nominal BBM harus lebih dari 0"),
    liter: z.coerce.number().positive("Liter BBM wajib terhitung (lebih dari 0)"),
  })
).max(10, "Maksimal 10 pembelian BBM");

const metaParkirSchema = z.array(
  z.object({
    tujuanPerjalananId: z.string().uuid(),
    nominal: z.coerce.number().min(0, "Parkir tidak boleh negatif"),
  })
);

const angka = (v: FormDataEntryValue | null, label: string, wajibPositif = false) => {
  const n = Number(v ?? 0);
  if (Number.isNaN(n) || n < 0) throw new LaporError(`${label} tidak valid.`);
  if (wajibPositif && n <= 0) throw new LaporError(`${label} harus lebih dari 0.`);
  return toMoney(n);
};

export async function submitLaporan(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let session;
  try {
    session = await requireDriver();
  } catch {
    return { error: "Akses ditolak." };
  }

  try {
    const tripId = String(formData.get("tripId") ?? "");

    // ---- Trip milik driver ini & sedang BERJALAN ----
    const trip = await prisma.perjalanan.findFirst({
      where: { id: tripId, driverId: session.user.id, status: "BERJALAN" }, // ← SCOPING
      include: { tujuan: { select: { id: true } }, laporan: true },
    });
    if (!trip)
      throw new LaporError("Tugas tidak ditemukan, bukan milik Anda, atau belum dimulai.");

    // ---- (1) KM AKHIR — wajib > KM Awal ----
    const kmAkhir = Number(formData.get("kmAkhir"));
    if (!Number.isInteger(kmAkhir) || kmAkhir <= trip.kmAwal) {
      throw new LaporError(
        `KM Akhir wajib bilangan bulat LEBIH BESAR dari KM Awal (${trip.kmAwal.toLocaleString("id-ID")} KM).`
      );
    }

    // ---- (2) BBM — repeater + foto struk wajib per baris ----
    const bbmMeta = metaBbmSchema.parse(
      JSON.parse(String(formData.get("bbmMeta") ?? "[]"))
    );
    const bbmFotos: File[] = [];
    for (let i = 0; i < bbmMeta.length; i++) {
      const f = formData.get(`bbmFoto_${i}`);
      if (!(f instanceof File) || f.size === 0)
        throw new LaporError(`Foto struk wajib untuk pembelian BBM #${i + 1}.`);
      bbmFotos.push(f);
    }

    // ---- (4) Parkir per customer — id harus milik trip ini ----
    const parkirMeta = metaParkirSchema.parse(
      JSON.parse(String(formData.get("parkirMeta") ?? "[]"))
    );
    const tujuanValid = new Set(trip.tujuan.map((t) => t.id));
    for (const pr of parkirMeta) {
      if (!tujuanValid.has(pr.tujuanPerjalananId))
        throw new LaporError("Data parkir tidak sesuai daftar tujuan trip ini.");
    }

    // ---- (3,5,6,7) Nominal tunggal ----
    const pakOgah = angka(formData.get("pakOgah"), "Pak Ogah");
    const steamNominal = angka(formData.get("steamNominal"), "Steam/Cuci");
    const servisNominal = angka(formData.get("servisNominal"), "Servis darurat");
    const lainnyaNominal = angka(formData.get("lainnyaNominal"), "Keterangan lain");
    const servisKet = String(formData.get("servisKeterangan") ?? "").trim();
    const lainnyaKet = String(formData.get("lainnyaKeterangan") ?? "").trim();
    const catatanDriver = String(formData.get("catatan") ?? "").trim() || null;

    const steamFoto = formData.get("steamFoto");
    const servisFoto = formData.get("servisFoto");

    if (steamNominal > 0 && (!(steamFoto instanceof File) || steamFoto.size === 0))
      throw new LaporError("Foto bukti wajib untuk biaya Steam/Cuci mobil.");
    if (servisNominal > 0) {
      if (servisKet.length < 3)
        throw new LaporError("Catatan perbaikan wajib untuk servis darurat.");
      if (!(servisFoto instanceof File) || servisFoto.size === 0)
        throw new LaporError("Foto nota wajib untuk servis darurat.");
    }
    if (lainnyaNominal > 0 && lainnyaKet.length < 3)
      throw new LaporError("Deskripsi wajib untuk pengeluaran Keterangan Lain.");

    // ---- Simpan foto (di luar transaksi DB) ----
    const noRef = trip.nomorSj.replaceAll("/", "");
    const bbmUrls: string[] = [];
    for (let i = 0; i < bbmFotos.length; i++) {
      bbmUrls.push(await simpanFotoBukti(bbmFotos[i], `bbm-${noRef}-${i + 1}`));
    }
    const steamUrl =
      steamNominal > 0 ? await simpanFotoBukti(steamFoto as File, `steam-${noRef}`) : null;
    const servisUrl =
      servisNominal > 0 ? await simpanFotoBukti(servisFoto as File, `servis-${noRef}`) : null;

    // ---- Susun baris biaya (7 parameter → line item per kategori) ----
    type Baris = {
      kategori: KategoriBiaya;
      nominal: number;
      liter?: number;
      keterangan?: string | null;
      fotoBuktiUrl?: string | null;
      tujuanPerjalananId?: string | null;
    };
    const baris: Baris[] = [];

    // LITER DIHITUNG ULANG DI SERVER dari harga Master BBM — angka liter
    // yang dikirim klien hanya untuk tampilan; server yang menentukan
    // (prinsip sama dgn KM Awal: klien menampilkan, server memutuskan).
    const bbmIds = [...new Set(bbmMeta.map((b) => b.bbmId).filter(Boolean))] as string[];
    const produkBbm = bbmIds.length
      ? await prisma.masterBbm.findMany({ where: { id: { in: bbmIds } } })
      : [];
    const hargaMap = new Map(
      produkBbm.map((p) => [p.id, { nama: p.namaProduk, harga: Number(p.hargaPerLiter) }])
    );

    bbmMeta.forEach((b, i) => {
      const produk = b.bbmId ? hargaMap.get(b.bbmId) : undefined;
      const nominal = toMoney(b.nominal);
      // Tanpa produk (draft lama): pakai liter kiriman klien sebagai fallback.
      const liter = produk
        ? Math.round((nominal / produk.harga) * 100) / 100
        : b.liter;

      baris.push({
        kategori: "BBM",
        nominal,
        liter,
        keterangan: produk
          ? `${produk.nama} @ ${produk.harga.toLocaleString("id-ID")}/L`
          : null,
        fotoBuktiUrl: bbmUrls[i],
      });
    });
    if (pakOgah > 0) baris.push({ kategori: "PAK_OGAH", nominal: pakOgah });
    parkirMeta
      .filter((pr) => pr.nominal > 0)
      .forEach((pr) =>
        baris.push({
          kategori: "PARKIR",
          nominal: toMoney(pr.nominal),
          tujuanPerjalananId: pr.tujuanPerjalananId,
        })
      );
    if (steamNominal > 0)
      baris.push({ kategori: "STEAM", nominal: steamNominal, fotoBuktiUrl: steamUrl });
    if (servisNominal > 0)
      baris.push({
        kategori: "SERVIS_DARURAT",
        nominal: servisNominal,
        keterangan: servisKet,
        fotoBuktiUrl: servisUrl,
      });
    if (lainnyaNominal > 0)
      baris.push({ kategori: "LAINNYA", nominal: lainnyaNominal, keterangan: lainnyaKet });

    const totalBiaya = toMoney(baris.reduce((s, b) => s + b.nominal, 0));

    // ---- TRANSAKSI: laporan + biaya + status trip ----
    await prisma.$transaction(
      async (tx) => {
        const laporan = await tx.laporanDriver.upsert({
          where: { perjalananId: trip.id },
          create: {
            perjalananId: trip.id,
            kmAkhir,
            totalBiayaDriver: totalBiaya,
            status: "SUBMITTED",
            catatanDriver,
            submittedAt: new Date(),
          },
          update: {
            // Resubmit setelah PERLU_REVISI: baris biaya lama diganti total.
            kmAkhir,
            totalBiayaDriver: totalBiaya,
            status: "SUBMITTED",
            catatanDriver,
            submittedAt: new Date(),
            biaya: { deleteMany: {} },
          },
        });

        await tx.biayaPerjalanan.createMany({
          data: baris.map((b) => ({
            laporanId: laporan.id,
            kategori: b.kategori,
            nominal: b.nominal,
            liter: b.liter ?? null,
            keterangan: b.keterangan ?? null,
            fotoBuktiUrl: b.fotoBuktiUrl ?? null,
            tujuanPerjalananId: b.tujuanPerjalananId ?? null,
          })),
        });

        // KM akhir dicatat di trip; odometer master BARU di-update saat
        // admin verifikasi (settlement Sprint 4 — Blueprint 4.5).
        await tx.perjalanan.update({
          where: { id: trip.id },
          data: { status: "MENUNGGU_VERIFIKASI", kmAkhir },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof LaporError) return { error: e.message };
    if (e instanceof z.ZodError) return { error: e.errors[0].message };
    if (e instanceof SyntaxError) return { error: "Data form rusak — muat ulang halaman." };
    console.error("submitLaporan gagal:", e);
    return { error: "Gagal mengirim laporan. Periksa sinyal lalu coba lagi — draft Anda tersimpan." };
  }

  revalidatePath("/tugas");
  revalidatePath("/riwayat");
  revalidatePath("/perjalanan");
  return { success: true };
}
