import { prisma } from "@/lib/db";

export type MasterBbmDTO = {
  id: string;
  namaProduk: string;
  hargaPerLiter: number;
  isActive: boolean;
};

export async function getMasterBbmList(): Promise<MasterBbmDTO[]> {
  const rows = await prisma.masterBbm.findMany({
    orderBy: [{ isActive: "desc" }, { namaProduk: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    namaProduk: r.namaProduk,
    hargaPerLiter: Number(r.hargaPerLiter),
    isActive: r.isActive,
  }));
}

// Dipakai wizard driver: hanya produk aktif yang boleh dipilih.
export async function getMasterBbmAktif(): Promise<MasterBbmDTO[]> {
  const rows = await prisma.masterBbm.findMany({
    where: { isActive: true },
    orderBy: { namaProduk: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    namaProduk: r.namaProduk,
    hargaPerLiter: Number(r.hargaPerLiter),
    isActive: r.isActive,
  }));
}
