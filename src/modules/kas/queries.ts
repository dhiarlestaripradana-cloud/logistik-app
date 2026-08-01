import { prisma } from "@/lib/db";
import { formatTanggalID } from "@/lib/utils/date";

export type ArusKasDTO = {
  id: string;
  nomorRef: string;
  tanggal: string;
  tipe: "MASUK" | "KELUAR";
  kategori: string;
  nominal: number;
  keterangan: string;
  pemberi: string;
  penerima: string;
  saldoSesudah: number;
  dibuatOleh: string;
  sumber: "MANUAL" | "OPERASIONAL" | "TRIP"; // asal entri (jejak audit)
};

export type FilterKas = { dari?: string; sampai?: string };

const rentangTanggal = (f?: FilterKas) =>
  f?.dari || f?.sampai
    ? {
        tanggal: {
          ...(f.dari ? { gte: new Date(f.dari) } : {}),
          ...(f.sampai ? { lte: new Date(f.sampai) } : {}),
        },
      }
    : {};

// LEDGER TERPADU: SEMUA arus uang tampil di sini —
// input manual, potongan otomatis OperasionalLain, dan settlement trip.
export async function getArusKasList(filter?: FilterKas): Promise<ArusKasDTO[]> {
  const rows = await prisma.arusKas.findMany({
    where: rentangTanggal(filter),
    include: {
      pembuat: { select: { nama: true } },
      operasional: { select: { id: true } },
      perjalanan: { select: { nomorSj: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    nomorRef: r.nomorRef,
    tanggal: formatTanggalID(r.tanggal),
    tipe: r.tipe,
    kategori: r.kategori,
    nominal: Number(r.nominal),
    keterangan: r.keterangan,
    pemberi: r.pemberi ?? "—",
    penerima: r.penerima ?? "—",
    saldoSesudah: Number(r.saldoSesudah),
    dibuatOleh: r.pembuat.nama,
    sumber: r.operasional ? "OPERASIONAL" : r.perjalanan ? "TRIP" : "MANUAL",
  }));
}

// Saldo Buku Kas terkini = saldoSesudah entri ledger terakhir (append-only).
export async function getSaldoKas(): Promise<number> {
  const last = await prisma.arusKas.findFirst({
    orderBy: { createdAt: "desc" },
    select: { saldoSesudah: true },
  });
  return last ? Number(last.saldoSesudah) : 0;
}

// ---------------------------------------------------------------
//  BUKU KAS UMUM per periode (Revisi Final #3):
//  saldo awal = saldoSesudah entri TERAKHIR sebelum periode (append-only),
//  lalu total masuk/keluar dalam periode → saldo akhir.
// ---------------------------------------------------------------
export type BukuKasDTO = {
  periodeDari: string;
  periodeSampai: string;
  saldoAwal: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  rows: ArusKasDTO[]; // urut kronologis (untuk cetakan resmi)
};

export async function getBukuKas(dari: string, sampai: string): Promise<BukuKasDTO> {
  const dariDate = new Date(dari);

  const [sebelum, rowsDesc] = await Promise.all([
    prisma.arusKas.findFirst({
      where: { tanggal: { lt: dariDate } },
      orderBy: { createdAt: "desc" },
      select: { saldoSesudah: true },
    }),
    getArusKasList({ dari, sampai }),
  ]);

  const rows = [...rowsDesc].reverse(); // kronologis utk pembukuan
  const totalMasuk = rows
    .filter((r) => r.tipe === "MASUK")
    .reduce((s, r) => s + r.nominal, 0);
  const totalKeluar = rows
    .filter((r) => r.tipe === "KELUAR")
    .reduce((s, r) => s + r.nominal, 0);
  const saldoAwal = sebelum ? Number(sebelum.saldoSesudah) : 0;

  return {
    periodeDari: dari,
    periodeSampai: sampai,
    saldoAwal,
    totalMasuk,
    totalKeluar,
    saldoAkhir: saldoAwal + totalMasuk - totalKeluar,
    rows,
  };
}
