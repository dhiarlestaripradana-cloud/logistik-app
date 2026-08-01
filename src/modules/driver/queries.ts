import dayjs from "dayjs";
import { prisma } from "@/lib/db";
import { TZ_WIB } from "@/lib/utils/date";
import { statusDokumen, type AlertDokumen } from "@/lib/utils/alerts";

export type DriverSimDTO = {
  id: string;
  noSim: string;
  jenisSim: string;
  masaBerlakuSim: string;
  alert: AlertDokumen; // alert H-14 per SIM
};

export type DriverDTO = {
  id: string;
  nama: string;
  username: string;
  telepon: string | null;
  isActive: boolean;
  jenisKelamin: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  alamat: string | null;
  sims: DriverSimDTO[];
};

const toDateStr = (d: Date | null) =>
  d ? dayjs(d).tz(TZ_WIB).format("YYYY-MM-DD") : null;

export async function getDriverList(): Promise<DriverDTO[]> {
  // Nama selalu diambil dari User (sumber tunggal) via include — kontrak skema.
  const rows = await prisma.user.findMany({
    where: { role: "DRIVER" },
    include: {
      driverProfile: {
        include: { sims: { orderBy: { masaBerlakuSim: "asc" } } },
      },
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((u) => ({
    id: u.id,
    nama: u.nama,
    username: u.username,
    telepon: u.telepon,
    isActive: u.isActive,
    jenisKelamin: u.driverProfile?.jenisKelamin ?? null,
    tempatLahir: u.driverProfile?.tempatLahir ?? null,
    tanggalLahir: toDateStr(u.driverProfile?.tanggalLahir ?? null),
    alamat: u.driverProfile?.alamat ?? null,
    sims: (u.driverProfile?.sims ?? []).map((s) => ({
      id: s.id,
      noSim: s.noSim,
      jenisSim: s.jenisSim,
      masaBerlakuSim: toDateStr(s.masaBerlakuSim)!,
      alert: statusDokumen(s.masaBerlakuSim),
    })),
  }));
}
