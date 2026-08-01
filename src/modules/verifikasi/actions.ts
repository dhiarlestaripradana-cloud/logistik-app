"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { pesanErrorPrisma } from "@/lib/prisma-error";
import { requireAdmin } from "@/lib/auth-guard";
import type { ActionState } from "@/lib/action-state";
import { generateNomor } from "@/lib/utils/nomor";

class VerifError extends Error {}
const toMoney = (n: number) => Math.round(n * 100) / 100;

// =====================================================================
//  ① MINTA REVISI — laporan kembali ke driver dgn catatan wajib.
//  Trip MENUNGGU_VERIFIKASI → BERJALAN; wizard driver aktif kembali
//  dan menampilkan banner kuning berisi catatan ini (sudah siap sejak Sprint 3).
// =====================================================================
export async function mintaRevisi(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const tripId = String(formData.get("tripId") ?? "");
  const catatan = String(formData.get("catatan") ?? "").trim();
  if (catatan.length < 5) {
    return { error: "Catatan revisi wajib diisi (minimal 5 karakter) agar driver paham apa yang harus diperbaiki." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const trip = await tx.perjalanan.findFirst({
        where: { id: tripId, status: "MENUNGGU_VERIFIKASI" },
        include: { laporan: { select: { id: true } } },
      });
      if (!trip?.laporan) throw new VerifError("Laporan tidak ditemukan / sudah diproses.");

      await tx.laporanDriver.update({
        where: { id: trip.laporan.id },
        data: { status: "PERLU_REVISI", catatanAdmin: catatan },
      });
      await tx.perjalanan.update({
        where: { id: tripId },
        data: { status: "BERJALAN" },
      });
    });
  } catch (e) {
    if (e instanceof VerifError) return { error: e.message };
    return { error: pesanErrorPrisma(e, "mengirim permintaan revisi") };
  }

  revalidatePath("/verifikasi");
  revalidatePath("/perjalanan");
  revalidatePath("/tugas");
  // FIX BUG 404: kembali ke antrian SEBELUM halaman detail sempat
  // me-render ulang id yang statusnya sudah berubah (query detail → null).
  redirect("/verifikasi?sukses=1");
}

// =====================================================================
//  ② SETUJUI & SETTLEMENT KAS — transaksi finansial puncak (Blueprint 4.5)
//
//  KOREKSI AKUNTANSI (keputusan Tech Lead atas spec Sprint 4):
//  Spec meminta HANYA mencatat entri selisih. Itu membuat Buku Kas tidak
//  pernah merekam beban trip: modal 5jt → kasbon 500rb → realisasi 463rb →
//  hanya MASUK 37rb ⇒ saldo buku 5.037.000, padahal laci fisik 4.537.000.
//  Solusi: MODEL KAS FISIK 2 ENTRI —
//   e1 KELUAR uangJalan   (kasbon keluar, diakui saat settlement — 2-Step tetap utuh)
//   e2 MASUK selisih (>0)  ATAU  KELUAR |selisih| (<0)   [persis entri di spec]
//  Efek bersih saldo = −totalRealisasi ✓ buku = laci ✓ jejak audit lengkap.
//  Selisih = 0 → tanpa entri kedua (saldo tak berubah, sesuai opsi spec).
// =====================================================================
export async function setujuiSettlement(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Akses ditolak." };
  }

  const tripId = String(formData.get("tripId") ?? "");

  try {
    await prisma.$transaction(
      async (tx) => {
        // Guard idempoten: hanya dari MENUNGGU_VERIFIKASI — klik ganda /
        // dua tab tidak akan men-settle dua kali (Blueprint 4.5).
        const trip = await tx.perjalanan.findFirst({
          where: { id: tripId, status: "MENUNGGU_VERIFIKASI" },
          include: {
            laporan: { include: { biaya: true } },
            tujuan: true,
            kendaraan: true,
            driver: { select: { nama: true } },
          },
        });
        if (!trip?.laporan || trip.laporan.status !== "SUBMITTED" || trip.kmAkhir === null) {
          throw new VerifError("Trip tidak valid untuk settlement / sudah diproses.");
        }

        // ---- Rekonsiliasi (angka dihitung ulang dari sumber, bukan cache) ----
        const totalBiayaDriver = trip.laporan.biaya.reduce(
          (s, b) => s + Number(b.nominal),
          0
        );
        const totalKomitmen = trip.tujuan.reduce(
          (s, t) => s + Number(t.uangSatpam) + Number(t.uangGudang),
          0
        );
        const totalRealisasi = toMoney(totalBiayaDriver + totalKomitmen);
        const uangJalan = Number(trip.uangJalan);
        // SEMANTIK OPSI B (keputusan resmi Owner, Revisi Final):
        // uangJalan = kasbon operasional SAJA, TERPISAH dari uang drop.
        // Total tunai fisik dibawa driver = uangJalan + komitmen drop.
        // selisih = totalTunai − totalRealisasi  (≡ uangJalan − biaya driver)
        const totalTunai = toMoney(uangJalan + totalKomitmen);
        const selisih = toMoney(totalTunai - totalRealisasi);

        // ---- Saldo berjalan ----
        const last = await tx.arusKas.findFirst({
          orderBy: { createdAt: "desc" },
          select: { saldoSesudah: true },
        });
        let saldo = last ? Number(last.saldoSesudah) : 0;

        // e1 — TOTAL TUNAI keluar (uang jalan + uang drop) diakui saat settlement
        saldo = toMoney(saldo - totalTunai);
        await tx.arusKas.create({
          data: {
            nomorRef: await generateNomor(tx, "KAS"),
            tanggal: new Date(),
            tipe: "KELUAR",
            kategori: "SETTLEMENT_TRIP",
            nominal: totalTunai,
            keterangan: `Total tunai ${trip.nomorSj} (uang jalan ${uangJalan.toLocaleString("id-ID")} + uang drop ${totalKomitmen.toLocaleString("id-ID")}) — realisasi ${totalRealisasi.toLocaleString("id-ID")}`,
            pemberi: "Kas Perusahaan",
            penerima: trip.driver.nama,
            perjalananId: trip.id,
            saldoSesudah: saldo,
            dibuatOleh: session.user.id,
          },
        });

        // e2 — entri selisih (persis spec)
        if (selisih > 0) {
          saldo = toMoney(saldo + selisih);
          await tx.arusKas.create({
            data: {
              nomorRef: await generateNomor(tx, "KAS"),
              tanggal: new Date(),
              tipe: "MASUK",
              kategori: "SETTLEMENT_TRIP",
              nominal: selisih,
              keterangan: `Pengembalian sisa uang jalan ${trip.nomorSj}`,
              pemberi: trip.driver.nama,
              penerima: "Kas Perusahaan",
              perjalananId: trip.id,
              saldoSesudah: saldo,
              dibuatOleh: session.user.id,
            },
          });
        } else if (selisih < 0) {
          saldo = toMoney(saldo - Math.abs(selisih));
          await tx.arusKas.create({
            data: {
              nomorRef: await generateNomor(tx, "KAS"),
              tanggal: new Date(),
              tipe: "KELUAR",
              kategori: "SETTLEMENT_TRIP",
              nominal: Math.abs(selisih),
              keterangan: `Penggantian kekurangan biaya (reimburse) ${trip.nomorSj}`,
              pemberi: "Kas Perusahaan",
              penerima: trip.driver.nama,
              perjalananId: trip.id,
              saldoSesudah: saldo,
              dibuatOleh: session.user.id,
            },
          });
        }
        // selisih === 0 → tanpa entri kedua; kasbon pas (tercatat di trip).

        // ---- Laporan disahkan, trip selesai ----
        await tx.laporanDriver.update({
          where: { id: trip.laporan.id },
          data: { status: "DISETUJUI" },
        });
        await tx.perjalanan.update({
          where: { id: trip.id },
          data: {
            status: "SELESAI",
            totalRealisasi,
            selisih,
            verifiedBy: session.user.id,
            verifiedAt: new Date(),
          },
        });

        // ---- Odometer master ter-update + lepas kunci armada ----
        const k = trip.kendaraan;
        const odometerBaru = trip.kmAkhir;
        const sisaServis =
          k.kmServisTerakhir + k.intervalServisKm - odometerBaru;
        await tx.kendaraan.update({
          where: { id: k.id },
          data: {
            odometerSaatIni: odometerBaru,
            // Blueprint 4.3: ≤100 KM → PERLU_SERVIS (soft-block rute jauh)
            status: sisaServis <= 100 ? "PERLU_SERVIS" : "TERSEDIA",
          },
        });

        // ---- Servis darurat lapangan → log riwayat servis kendaraan ----
        const darurat = trip.laporan.biaya.filter(
          (b) => b.kategori === "SERVIS_DARURAT"
        );
        for (const b of darurat) {
          await tx.servisKendaraan.create({
            data: {
              kendaraanId: k.id,
              tanggal: new Date(),
              jenis: "DARURAT_LAPANGAN",
              kmSaatServis: odometerBaru,
              biaya: b.nominal,
              keterangan: b.keterangan ?? `Servis darurat ${trip.nomorSj}`,
              fotoNotaUrl: b.fotoBuktiUrl,
              biayaPerjalananId: b.id,
            },
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (e) {
    if (e instanceof VerifError) return { error: e.message };
    console.error("Settlement gagal:", e);
    return { error: "Settlement gagal — tidak ada perubahan yang tersimpan (transaksi dibatalkan utuh)." };
  }

  revalidatePath("/verifikasi");
  revalidatePath("/perjalanan");
  revalidatePath("/kendaraan");
  revalidatePath("/kas");
  revalidatePath("/dashboard");
  revalidatePath("/tugas");
  revalidatePath("/riwayat");
  // FIX BUG 404: redirect server-side, bukan router.push dari klien yang
  // kalah cepat dari re-render halaman detail.
  redirect("/verifikasi?sukses=1");
}
