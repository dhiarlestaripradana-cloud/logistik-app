import dayjs from "dayjs";
import { prisma } from "@/lib/db";
import { umurKendaraan, TZ_WIB } from "@/lib/utils/date";
import { statusDokumen, type AlertDokumen } from "@/lib/utils/alerts";

// DTO plain-serializable: Decimal→number, Date→string ISO,
// plus DERIVED STATE dihitung di sini (umur, alert H-14, sisa KM servis)
// sesuai Blueprint 4.1–4.3 — tidak ada kolom basi di database.

export type KendaraanDTO = {
  id: string;
  nomorPolisi: string;
  merk: string;
  tipe: string;
  jenisBbm: string;
  tahun: number;
  tanggalPembelian: string;
  odometerSaatIni: number;
  intervalServisKm: number;
  kmServisTerakhir: number;
  standarKmPerLiter: number;
  pajakBerlakuSampai: string;
  kirBerlakuSampai: string | null;
  status: string;
  catatan: string | null;
  // ---- derived (real-time) ----
  umurLabel: string;
  pajakAlert: AlertDokumen;
  kirAlert: AlertDokumen | null; // null = armada tanpa KIR
  sisaKmServis: number;
};

const toDateStr = (d: Date) => dayjs(d).tz(TZ_WIB).format("YYYY-MM-DD");

export async function getKendaraanList(): Promise<KendaraanDTO[]> {
  const rows = await prisma.kendaraan.findMany({
    orderBy: { createdAt: "desc" },
  });

  return rows.map((k) => ({
    id: k.id,
    nomorPolisi: k.nomorPolisi,
    merk: k.merk,
    tipe: k.tipe,
    jenisBbm: k.jenisBbm,
    tahun: k.tahun,
    tanggalPembelian: toDateStr(k.tanggalPembelian),
    odometerSaatIni: k.odometerSaatIni,
    intervalServisKm: k.intervalServisKm,
    kmServisTerakhir: k.kmServisTerakhir,
    standarKmPerLiter: Number(k.standarKmPerLiter),
    pajakBerlakuSampai: toDateStr(k.pajakBerlakuSampai),
    kirBerlakuSampai: k.kirBerlakuSampai ? toDateStr(k.kirBerlakuSampai) : null,
    status: k.status,
    catatan: k.catatan,
    umurLabel: umurKendaraan(k.tanggalPembelian).label,
    pajakAlert: statusDokumen(k.pajakBerlakuSampai),
    kirAlert: k.kirBerlakuSampai ? statusDokumen(k.kirBerlakuSampai) : null,
    sisaKmServis: k.kmServisTerakhir + k.intervalServisKm - k.odometerSaatIni,
  }));
}
