import { prisma } from "@/lib/db";
import { formatTanggalID } from "@/lib/utils/date";

export type OperasionalDTO = {
  id: string;
  tanggal: string;
  keterangan: string;
  jumlah: number;
  hargaSatuan: number;
  totalHarga: number;
  penerima: string;
  nomorRef: string;
  penginput: string;
};

export async function getOperasionalList(): Promise<OperasionalDTO[]> {
  const rows = await prisma.operasionalLain.findMany({
    include: {
      arusKas: { select: { nomorRef: true, penerima: true } },
      user: { select: { nama: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((o) => ({
    id: o.id,
    tanggal: formatTanggalID(o.tanggal),
    keterangan: o.keterangan,
    jumlah: Number(o.jumlah),
    hargaSatuan: Number(o.hargaSatuan),
    totalHarga: Number(o.totalHarga),
    penerima: o.arusKas.penerima ?? "—",
    nomorRef: o.arusKas.nomorRef,
    penginput: o.user.nama,
  }));
}

// Saldo kas kini dimiliki modul kas — satu sumber kebenaran logika keuangan.
export { getSaldoKas } from "@/modules/kas/queries";
