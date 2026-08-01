import dayjs from "dayjs";
import { prisma } from "@/lib/db";
import { requireDriver } from "@/lib/auth-guard";
import { TZ_WIB, formatTanggalID } from "@/lib/utils/date";

// =====================================================================
//  KEAMANAN MUTLAK (spec Sprint 3 #2):
//  Setiap fungsi di file ini MEMANGGIL requireDriver() sendiri dan
//  MENYUNTIKKAN driverId = session.user.id ke dalam WHERE.
//  Scoping tidak bisa terlupa oleh pemanggil — driver mustahil membaca
//  tugas/riwayat driver lain, bahkan lewat manipulasi URL.
// =====================================================================

const fmtWaktu = (d: Date) => dayjs(d).tz(TZ_WIB).format("D MMM YYYY · HH.mm");

export type DropDTO = {
  id: string;
  urutan: number;
  namaCustomer: string;
  alamat: string;
  wilayah: string;
  statusDrop: string;
  // Transparansi jatah per titik utk driver (revisi UAT Sprint 4)
  uangSatpam: number;
  uangGudang: number;
};

export type TugasAktifDTO = {
  id: string;
  nomorSj: string;
  status: "DITUGASKAN" | "BERJALAN";
  kendaraan: string;
  tanggalBerangkat: string;
  berangkatAktual: string | null;
  kmAwal: number;
  uangJalan: number;
  catatan: string | null;
  tujuan: DropDTO[];
  // Loop revisi (Sprint 4): admin menolak laporan → trip kembali BERJALAN
  laporanPerluRevisi: boolean;
  catatanAdmin: string | null;
};

// Tugas aktif milik driver yang login — hanya DITUGASKAN / BERJALAN.
export async function getTugasAktif(): Promise<TugasAktifDTO | null> {
  const session = await requireDriver();

  const p = await prisma.perjalanan.findFirst({
    where: {
      driverId: session.user.id, // ← SCOPING MUTLAK
      status: { in: ["DITUGASKAN", "BERJALAN"] },
    },
    include: {
      kendaraan: { select: { nomorPolisi: true, merk: true, tipe: true } },
      tujuan: { include: { customer: true }, orderBy: { urutan: "asc" } },
      laporan: { select: { status: true, catatanAdmin: true } },
    },
    orderBy: { tanggalBerangkat: "asc" },
  });
  if (!p) return null;

  return {
    id: p.id,
    nomorSj: p.nomorSj,
    status: p.status as "DITUGASKAN" | "BERJALAN",
    kendaraan: `${p.kendaraan.nomorPolisi} · ${p.kendaraan.merk} ${p.kendaraan.tipe}`,
    tanggalBerangkat: formatTanggalID(p.tanggalBerangkat),
    berangkatAktual: p.berangkatAktualAt ? fmtWaktu(p.berangkatAktualAt) : null,
    kmAwal: p.kmAwal,
    uangJalan: Number(p.uangJalan),
    catatan: p.catatan,
    tujuan: p.tujuan.map((t) => ({
      id: t.id,
      urutan: t.urutan,
      namaCustomer: t.customer.nama,
      alamat: t.customer.alamat,
      wilayah: t.customer.wilayah,
      statusDrop: t.statusDrop,
      uangSatpam: Number(t.uangSatpam),
      uangGudang: Number(t.uangGudang),
    })),
    laporanPerluRevisi: p.laporan?.status === "PERLU_REVISI",
    catatanAdmin:
      p.laporan?.status === "PERLU_REVISI" ? (p.laporan.catatanAdmin ?? null) : null,
  };
}

// Data trip untuk wizard laporan — hanya trip MILIK driver ini & BERJALAN.
export async function getTugasUntukLapor(
  tripId: string
): Promise<TugasAktifDTO | null> {
  const session = await requireDriver();

  const p = await prisma.perjalanan.findFirst({
    where: {
      id: tripId,
      driverId: session.user.id, // ← SCOPING MUTLAK
      status: "BERJALAN",
    },
    include: {
      kendaraan: { select: { nomorPolisi: true, merk: true, tipe: true } },
      tujuan: { include: { customer: true }, orderBy: { urutan: "asc" } },
      laporan: { select: { status: true, catatanAdmin: true } },
    },
  });
  if (!p) return null;

  return {
    id: p.id,
    nomorSj: p.nomorSj,
    status: p.status as "BERJALAN",
    kendaraan: `${p.kendaraan.nomorPolisi} · ${p.kendaraan.merk} ${p.kendaraan.tipe}`,
    tanggalBerangkat: formatTanggalID(p.tanggalBerangkat),
    berangkatAktual: p.berangkatAktualAt ? fmtWaktu(p.berangkatAktualAt) : null,
    kmAwal: p.kmAwal,
    uangJalan: Number(p.uangJalan),
    catatan: p.catatan,
    tujuan: p.tujuan.map((t) => ({
      id: t.id,
      urutan: t.urutan,
      namaCustomer: t.customer.nama,
      alamat: t.customer.alamat,
      wilayah: t.customer.wilayah,
      statusDrop: t.statusDrop,
      uangSatpam: Number(t.uangSatpam),
      uangGudang: Number(t.uangGudang),
    })),
    laporanPerluRevisi: p.laporan?.status === "PERLU_REVISI",
    catatanAdmin:
      p.laporan?.status === "PERLU_REVISI" ? (p.laporan.catatanAdmin ?? null) : null,
  };
}

export type RiwayatDTO = {
  id: string;
  nomorSj: string;
  tanggalBerangkat: string;
  kendaraan: string;
  jumlahDrop: number;
  status: string;
  totalBiaya: number | null;
};

// Riwayat MILIK driver sendiri — dibatasi 20 terbaru (hemat memori HP).
export async function getRiwayatTugas(): Promise<RiwayatDTO[]> {
  const session = await requireDriver();

  const rows = await prisma.perjalanan.findMany({
    where: {
      driverId: session.user.id, // ← SCOPING MUTLAK
      status: { in: ["MENUNGGU_VERIFIKASI", "SELESAI", "DIBATALKAN"] },
    },
    include: {
      kendaraan: { select: { nomorPolisi: true } },
      laporan: { select: { totalBiayaDriver: true } },
      _count: { select: { tujuan: true } },
    },
    orderBy: { tanggalBerangkat: "desc" },
    take: 20,
  });

  return rows.map((p) => ({
    id: p.id,
    nomorSj: p.nomorSj,
    tanggalBerangkat: formatTanggalID(p.tanggalBerangkat),
    kendaraan: p.kendaraan.nomorPolisi,
    jumlahDrop: p._count.tujuan,
    status: p.status,
    totalBiaya: p.laporan ? Number(p.laporan.totalBiayaDriver) : null,
  }));
}
