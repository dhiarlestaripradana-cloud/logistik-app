import { prisma } from "@/lib/db";
import { formatTanggalID } from "@/lib/utils/date";

export type SjEksternalRow = {
  id: string;
  nomorSj: string;
  tanggal: string;
  kategoriPengirim: string;
  namaPengirim: string;
  customer: string;
  kodeCustomer: string;
  wilayah: string;
  keteranganBarang: string;
  status: "DIBAWA" | "DIKEMBALIKAN";
  dibuatOleh: string;
};

export async function getSjEksternalList(): Promise<SjEksternalRow[]> {
  const rows = await prisma.suratJalanEksternal.findMany({
    include: {
      customer: { select: { nama: true, kodeCustomer: true, wilayah: true } },
      pembuat: { select: { nama: true } },
    },
    orderBy: [{ status: "asc" }, { tanggal: "desc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    nomorSj: r.nomorSj,
    tanggal: formatTanggalID(r.tanggal),
    kategoriPengirim: r.kategoriPengirim,
    namaPengirim: r.namaPengirim,
    customer: r.customer.nama,
    kodeCustomer: r.customer.kodeCustomer,
    wilayah: r.customer.wilayah,
    keteranganBarang: r.keteranganBarang,
    status: r.status,
    dibuatOleh: r.pembuat.nama,
  }));
}

// Opsi customer untuk form SJ Eksternal.
// SENGAJA TANPA defaultUangSatpam/defaultUangGudang — tarif internal tidak
// relevan (dan dilarang tampil) pada pengiriman armada luar.
export type CustomerOpsiEksternal = {
  id: string;
  kodeCustomer: string;
  nama: string;
  alamat: string;
  wilayah: string;
};

export async function getCustomerOpsiEksternal(): Promise<CustomerOpsiEksternal[]> {
  const rows = await prisma.customer.findMany({
    where: { isActive: true },
    select: { id: true, kodeCustomer: true, nama: true, alamat: true, wilayah: true },
    orderBy: { nama: "asc" },
  });
  return rows;
}

export type SjEksternalDetail = SjEksternalRow & {
  alamat: string;
  telepon: string | null;
  pic: string | null;
};

export async function getSjEksternalDetail(
  id: string
): Promise<SjEksternalDetail | null> {
  const r = await prisma.suratJalanEksternal.findUnique({
    where: { id },
    include: {
      customer: true,
      pembuat: { select: { nama: true } },
    },
  });
  if (!r) return null;

  return {
    id: r.id,
    nomorSj: r.nomorSj,
    tanggal: formatTanggalID(r.tanggal),
    kategoriPengirim: r.kategoriPengirim,
    namaPengirim: r.namaPengirim,
    customer: r.customer.nama,
    kodeCustomer: r.customer.kodeCustomer,
    wilayah: r.customer.wilayah,
    keteranganBarang: r.keteranganBarang,
    status: r.status,
    dibuatOleh: r.pembuat.nama,
    alamat: r.customer.alamat,
    telepon: r.customer.telepon,
    pic: r.customer.pic,
  };
}
