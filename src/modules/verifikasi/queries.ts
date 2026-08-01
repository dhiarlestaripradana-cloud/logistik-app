import dayjs from "dayjs";
import { prisma } from "@/lib/db";
import { TZ_WIB, formatTanggalID } from "@/lib/utils/date";

// =====================================================================
//  Queries Verifikasi (Blueprint 5.1 "Halaman Verifikasi" + 4.4 + 4.5)
// =====================================================================

const toMoney = (n: unknown) => Number(n);

export type AntrianVerifikasiDTO = {
  id: string;
  nomorSj: string;
  driver: string;
  kendaraan: string;
  tanggalBerangkat: string;
  submittedAt: string;
  uangJalan: number;
  totalBiayaDriver: number;
};

export async function getAntrianVerifikasi(): Promise<AntrianVerifikasiDTO[]> {
  const rows = await prisma.perjalanan.findMany({
    where: { status: "MENUNGGU_VERIFIKASI" },
    include: {
      driver: { select: { nama: true } },
      kendaraan: { select: { nomorPolisi: true } },
      laporan: { select: { totalBiayaDriver: true, submittedAt: true } },
    },
    orderBy: { updatedAt: "asc" }, // paling lama menunggu = paling atas
  });

  return rows.map((p) => ({
    id: p.id,
    nomorSj: p.nomorSj,
    driver: p.driver.nama,
    kendaraan: p.kendaraan.nomorPolisi,
    tanggalBerangkat: formatTanggalID(p.tanggalBerangkat),
    submittedAt: p.laporan?.submittedAt
      ? dayjs(p.laporan.submittedAt).tz(TZ_WIB).format("D MMM YYYY · HH.mm")
      : "—",
    uangJalan: toMoney(p.uangJalan),
    totalBiayaDriver: toMoney(p.laporan?.totalBiayaDriver ?? 0),
  }));
}

export type BiayaRowDTO = {
  id: string;
  kategori: string;
  nominal: number;
  liter: number | null;
  keterangan: string | null;
  fotoBuktiUrl: string | null;
  namaTujuan: string | null; // utk PARKIR
};

export type DetailVerifikasiDTO = {
  id: string;
  nomorSj: string;
  status: string;
  driver: string;
  kendaraan: string;
  standarKmPerLiter: number;
  tanggalBerangkat: string;
  berangkatAktual: string | null;
  catatanTrip: string | null;
  catatanDriver: string | null;
  // KM & BBM (Blueprint 4.4)
  kmAwal: number;
  kmAkhir: number;
  kmTempuh: number;
  totalLiter: number;
  rasioKmPerLiter: number | null; // null jika liter 0
  anomaliBbm: boolean;
  // Komitmen per drop (sisi kasbon)
  tujuan: Array<{
    id: string;
    urutan: number;
    nama: string;
    uangSatpam: number;
    uangGudang: number;
    statusDrop: string;
  }>;
  totalKomitmen: number;
  // Realisasi driver (sisi laporan)
  biaya: BiayaRowDTO[];
  totalBiayaDriver: number;
  perKategori: Array<{ kategori: string; total: number }>;
  // Rekonsiliasi (Blueprint 4.5)
  uangJalan: number;
  totalTunai: number; // uangJalan + komitmen drop (Opsi B)
  totalRealisasi: number;
  selisih: number;
};

export async function getDetailVerifikasi(
  id: string
): Promise<DetailVerifikasiDTO | null> {
  const p = await prisma.perjalanan.findFirst({
    where: { id, status: "MENUNGGU_VERIFIKASI" },
    include: {
      driver: { select: { nama: true } },
      kendaraan: true,
      tujuan: { include: { customer: true }, orderBy: { urutan: "asc" } },
      laporan: { include: { biaya: { orderBy: { createdAt: "asc" } } } },
    },
  });
  if (!p || !p.laporan || p.kmAkhir === null) return null;

  const tujuanMap = new Map(p.tujuan.map((t) => [t.id, t.customer.nama]));
  const biaya: BiayaRowDTO[] = p.laporan.biaya.map((b) => ({
    id: b.id,
    kategori: b.kategori,
    nominal: toMoney(b.nominal),
    liter: b.liter ? Number(b.liter) : null,
    keterangan: b.keterangan,
    fotoBuktiUrl: b.fotoBuktiUrl,
    namaTujuan: b.tujuanPerjalananId
      ? (tujuanMap.get(b.tujuanPerjalananId) ?? null)
      : null,
  }));

  const totalBiayaDriver = biaya.reduce((s, b) => s + b.nominal, 0);
  const totalKomitmen = p.tujuan.reduce(
    (s, t) => s + toMoney(t.uangSatpam) + toMoney(t.uangGudang),
    0
  );
  const totalRealisasi = totalKomitmen + totalBiayaDriver;

  const kmTempuh = p.kmAkhir - p.kmAwal;
  const totalLiter = biaya
    .filter((b) => b.kategori === "BBM")
    .reduce((s, b) => s + (b.liter ?? 0), 0);
  const rasio = totalLiter > 0 ? kmTempuh / totalLiter : null;
  const standar = Number(p.kendaraan.standarKmPerLiter);
  // Blueprint 4.4: rasio < 80% standar → indikasi mesin bermasalah / kecurangan BBM
  const anomaliBbm = rasio !== null && standar > 0 && rasio < standar * 0.8;

  const perKategoriMap = new Map<string, number>();
  for (const b of biaya) {
    perKategoriMap.set(b.kategori, (perKategoriMap.get(b.kategori) ?? 0) + b.nominal);
  }

  return {
    id: p.id,
    nomorSj: p.nomorSj,
    status: p.status,
    driver: p.driver.nama,
    kendaraan: `${p.kendaraan.nomorPolisi} · ${p.kendaraan.merk} ${p.kendaraan.tipe}`,
    standarKmPerLiter: standar,
    tanggalBerangkat: formatTanggalID(p.tanggalBerangkat),
    berangkatAktual: p.berangkatAktualAt
      ? dayjs(p.berangkatAktualAt).tz(TZ_WIB).format("D MMM YYYY · HH.mm")
      : null,
    catatanTrip: p.catatan,
    catatanDriver: p.laporan.catatanDriver,
    kmAwal: p.kmAwal,
    kmAkhir: p.kmAkhir,
    kmTempuh,
    totalLiter,
    rasioKmPerLiter: rasio,
    anomaliBbm,
    tujuan: p.tujuan.map((t) => ({
      id: t.id,
      urutan: t.urutan,
      nama: t.customer.nama,
      uangSatpam: toMoney(t.uangSatpam),
      uangGudang: toMoney(t.uangGudang),
      statusDrop: t.statusDrop,
    })),
    totalKomitmen,
    biaya,
    totalBiayaDriver,
    perKategori: [...perKategoriMap.entries()].map(([kategori, total]) => ({
      kategori,
      total,
    })),
    uangJalan: toMoney(p.uangJalan),
    // Opsi B: total tunai = uang jalan + uang drop; selisih dari total tunai.
    totalTunai: toMoney(Number(p.uangJalan) + totalKomitmen),
    totalRealisasi,
    selisih: toMoney(Number(p.uangJalan) + totalKomitmen - totalRealisasi),
  };
}
