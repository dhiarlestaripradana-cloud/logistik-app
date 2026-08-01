import { prisma } from "@/lib/db";

export type CustomerDTO = {
  id: string;
  kodeCustomer: string;
  nama: string;
  alamat: string;
  wilayah: string;
  sales: string | null;
  pic: string | null;
  telepon: string | null;
  defaultUangSatpam: number;
  defaultUangGudang: number;
  isActive: boolean;
};

export async function getCustomerList(): Promise<CustomerDTO[]> {
  const rows = await prisma.customer.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((c) => ({
    id: c.id,
    kodeCustomer: c.kodeCustomer,
    nama: c.nama,
    alamat: c.alamat,
    wilayah: c.wilayah,
    sales: c.sales,
    pic: c.pic,
    telepon: c.telepon,
    defaultUangSatpam: Number(c.defaultUangSatpam),
    defaultUangGudang: Number(c.defaultUangGudang),
    isActive: c.isActive,
  }));
}
