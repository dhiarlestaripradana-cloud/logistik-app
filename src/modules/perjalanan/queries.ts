import dayjs from "dayjs";
import { prisma } from "@/lib/db";
import { TZ_WIB, formatTanggalID } from "@/lib/utils/date";
import { urlBukti } from "@/lib/url-bukti";

// =====================================================================
//  Query modul Perjalanan — semua DTO plain-serializable
//  (Decimal→number, Date→string) agar aman dilempar ke client component.
// =====================================================================

const toDateInput = (d: Date) => dayjs(d).tz(TZ_WIB).format("YYYY-MM-DD");

// Status trip yang menyandera kasbon → basis "Dana Pending" (Blueprint 4.5 Step 1)
export const STATUS_TRIP_AKTIF = [
  "DITUGASKAN",
  "BERJALAN",
  "MENUNGGU_VERIFIKASI",
] as const;

// ---------------------------------------------------------------------
//  LIST
// ---------------------------------------------------------------------

export type PerjalananListDTO = {
  id: string;
  nomorSj: string;
  tanggalBerangkat: string;
  kendaraan: string;
  kendaraanId: string;
  driver: string;
  driverId: string;
  jumlahTujuan: number;
  uangJalan: number;
  status: string;
};

export async function getPerjalananList(): Promise<PerjalananListDTO[]> {
  const rows = await prisma.perjalanan.findMany({
    include: {
      kendaraan: { select: { nomorPolisi: true } },
      driver: { select: { nama: true } },
      _count: { select: { tujuan: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((p) => ({
    id: p.id,
    nomorSj: p.nomorSj,
    tanggalBerangkat: formatTanggalID(p.tanggalBerangkat),
    kendaraan: p.kendaraan.nomorPolisi,
    kendaraanId: p.kendaraanId,
    driver: p.driver.nama,
    driverId: p.driverId,
    jumlahTujuan: p._count.tujuan,
    uangJalan: Number(p.uangJalan),
    status: p.status,
  }));
}

// ---------------------------------------------------------------------
//  DETAIL
// ---------------------------------------------------------------------

export type TujuanDetailDTO = {
  id: string;
  urutan: number;
  customerId: string;
  kodeCustomer: string;
  namaCustomer: string;
  alamat: string;
  wilayah: string;
  uangSatpam: number;
  uangGudang: number;
  statusDrop: string;
};

export type PerjalananDetailDTO = {
  id: string;
  nomorSj: string;
  status: string;
  kendaraanId: string;
  kendaraanLabel: string;
  kendaraanStatus: string;
  driverId: string;
  driverNama: string;
  dibuatOlehNama: string;
  tanggalBerangkatInput: string; // YYYY-MM-DD utk form edit
  tanggalBerangkatLabel: string; // utk tampilan
  kmAwal: number;
  kmAkhir: number | null;
  uangJalan: number;
  totalKomitmen: number; // Σ(satpam+gudang) — estimasi biaya tetap per drop
  catatan: string | null;
  tujuan: TujuanDetailDTO[];
  bukti: {
    id: string;
    kategori: string;
    nominal: number;
    keterangan: string | null;
    url: string;
  }[];
};

export async function getPerjalananDetail(
  id: string
): Promise<PerjalananDetailDTO | null> {
  const p = await prisma.perjalanan.findUnique({
    where: { id },
    include: {
      kendaraan: true,
      driver: { select: { nama: true } },
      pembuat: { select: { nama: true } },
      tujuan: {
        include: { customer: true },
        orderBy: { urutan: "asc" },
      },
      // Tarik juga laporan biayanya buat arsip foto bukti
      laporan: { include: { biaya: { orderBy: { createdAt: "asc" } } } },
    },
  });
  if (!p) return null;

  const tujuan = p.tujuan.map((t) => ({
    id: t.id,
    urutan: t.urutan,
    customerId: t.customerId,
    kodeCustomer: t.customer.kodeCustomer,
    namaCustomer: t.customer.nama,
    alamat: t.customer.alamat,
    wilayah: t.customer.wilayah,
    uangSatpam: Number(t.uangSatpam),
    uangGudang: Number(t.uangGudang),
    statusDrop: t.statusDrop,
  }));

  const bukti = (p.laporan?.biaya ?? [])
    .filter((b) => b.fotoBuktiUrl)
    .map((b) => ({
      id: b.id,
      kategori: b.kategori,
      nominal: Number(b.nominal),
      keterangan: b.keterangan,
      url: urlBukti(b.fotoBuktiUrl)!,
    }));

  return {
    id: p.id,
    nomorSj: p.nomorSj,
    status: p.status,
    kendaraanId: p.kendaraanId,
    kendaraanLabel: `${p.kendaraan.nomorPolisi} — ${p.kendaraan.merk} ${p.kendaraan.tipe}`,
    kendaraanStatus: p.kendaraan.status,
    driverId: p.driverId,
    driverNama: p.driver.nama,
    dibuatOlehNama: p.pembuat.nama,
    tanggalBerangkatInput: toDateInput(p.tanggalBerangkat),
    tanggalBerangkatLabel: formatTanggalID(p.tanggalBerangkat),
    kmAwal: p.kmAwal,
    kmAkhir: p.kmAkhir,
    uangJalan: Number(p.uangJalan),
    totalKomitmen: tujuan.reduce((s, t) => s + t.uangSatpam + t.uangGudang, 0),
    catatan: p.catatan,
    tujuan,
    bukti,
  };
}

// ---------------------------------------------------------------------
//  OPSI FORM (armada layak tugas, driver bebas, customer + tarif default)
// ---------------------------------------------------------------------

export type KendaraanOption = {
  id: string;
  nomorPolisi: string;
  label: string;
  status: string;
  odometerSaatIni: number;
  sisaKmServis: number;
};

export type DriverOption = { id: string; nama: string; username: string };

export type CustomerOption = {
  id: string;
  kodeCustomer: string;
  nama: string;
  wilayah: string;
  alamat: string;
  defaultUangSatpam: number;
  defaultUangGudang: number;
};

export type FormOptions = {
  kendaraan: KendaraanOption[];
  drivers: DriverOption[];
  customers: CustomerOption[];
};

export async function getFormOptions(include?: {
  kendaraanId?: string;
  driverId?: string;
}): Promise<FormOptions> {
  const [kendaraanRows, driverRows, tripAktif, customerRows] =
    await Promise.all([
      prisma.kendaraan.findMany({
        where: {
          OR: [
            { status: { in: ["TERSEDIA", "PERLU_SERVIS"] } },
            ...(include?.kendaraanId ? [{ id: include.kendaraanId }] : []),
          ],
        },
        orderBy: { nomorPolisi: "asc" },
      }),
      prisma.user.findMany({
        where: { role: "DRIVER", isActive: true },
        orderBy: { nama: "asc" },
      }),
      prisma.perjalanan.findMany({
        where: { status: { in: ["DITUGASKAN", "BERJALAN"] } },
        select: { driverId: true },
      }),
      prisma.customer.findMany({
        where: { isActive: true },
        orderBy: [{ wilayah: "asc" }, { nama: "asc" }],
      }),
    ]);

  const busy = new Set(tripAktif.map((t) => t.driverId));
  if (include?.driverId) busy.delete(include.driverId);

  return {
    kendaraan: kendaraanRows.map((k) => ({
      id: k.id,
      nomorPolisi: k.nomorPolisi,
      label: `${k.nomorPolisi} — ${k.merk} ${k.tipe}`,
      status: k.status,
      odometerSaatIni: k.odometerSaatIni,
      sisaKmServis: k.kmServisTerakhir + k.intervalServisKm - k.odometerSaatIni,
    })),
    drivers: driverRows
      .filter((d) => !busy.has(d.id))
      .map((d) => ({ id: d.id, nama: d.nama, username: d.username })),
    customers: customerRows.map((c) => ({
      id: c.id,
      kodeCustomer: c.kodeCustomer,
      nama: c.nama,
      wilayah: c.wilayah,
      alamat: c.alamat,
      defaultUangSatpam: Number(c.defaultUangSatpam),
      defaultUangGudang: Number(c.defaultUangGudang),
    })),
  };
}

// ---------------------------------------------------------------------
//  DANA PENDING (Blueprint 4.5 Step 1) — kasbon di jalan, BELUM potong kas
// ---------------------------------------------------------------------

export async function getDanaPending(): Promise<number> {
  const trips = await prisma.perjalanan.findMany({
    where: { status: { in: [...STATUS_TRIP_AKTIF] } },
    select: {
      uangJalan: true,
      tujuan: { select: { uangSatpam: true, uangGudang: true } },
    },
  });
  return trips.reduce(
    (s, t) =>
      s +
      Number(t.uangJalan) +
      t.tujuan.reduce((k, d) => k + Number(d.uangSatpam) + Number(d.uangGudang), 0),
    0
  );
}

export async function getTripAktifCount(): Promise<number> {
  return prisma.perjalanan.count({
    where: { status: { in: [...STATUS_TRIP_AKTIF] } },
  });
}