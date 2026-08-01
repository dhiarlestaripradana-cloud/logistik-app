import { prisma } from "@/lib/db";
import { formatTanggalID, startOfDayWIB } from "@/lib/utils/date";

// =====================================================================
//  Analitik & Laporan Eksekutif (Blueprint 4.4 + 5.3.3)
//  Rekap trip SELESAI + KPI pengeluaran + efisiensi BBM per armada.
// =====================================================================

export type FilterAnalitik = {
  dari?: string;    // YYYY-MM-DD
  sampai?: string;  // YYYY-MM-DD
  kendaraanId?: string;
  driverId?: string;
};

export type RekapTripRow = {
  id: string;
  nomorSj: string;
  tanggal: string;
  kendaraan: string;
  driver: string;
  kmTempuh: number;
  liter: number;
  rasio: number | null;       // km/L aktual
  standar: number;            // km/L standar armada
  anomali: boolean;           // rasio < 80% standar (Blueprint 4.4)
  biayaBbm: number;
  biayaNonBbm: number;        // realisasi − BBM (termasuk satpam/gudang)
  totalRealisasi: number;
  selisih: number;
};

export type AnalitikDTO = {
  periodeLabel: string;
  rows: RekapTripRow[];
  kpi: {
    totalRealisasi: number;
    totalBbm: number;
    totalNonBbm: number;
    totalKm: number;
    totalLiter: number;
    rasioAktual: number | null;   // Σkm / Σliter
    rasioStandar: number | null;  // rata-rata standar armada terlibat
    jumlahTrip: number;
    jumlahAnomali: number;
  };
};

// Default periode: tanggal 1 bulan berjalan s/d hari ini (WIB).
export function periodeDefault(): { dari: string; sampai: string } {
  const kini = startOfDayWIB();
  return {
    dari: kini.startOf("month").format("YYYY-MM-DD"),
    sampai: kini.format("YYYY-MM-DD"),
  };
}

export async function getAnalitik(f: FilterAnalitik): Promise<AnalitikDTO> {
  const { dari, sampai } = { ...periodeDefault(), ...f };
  // Rentang inklusif [dari 00:00, sampai 24:00) WIB
  const dariDate = startOfDayWIB(dari).toDate();
  const sampaiDate = startOfDayWIB(sampai).add(1, "day").toDate();

  const trips = await prisma.perjalanan.findMany({
    where: {
      status: "SELESAI",
      tanggalBerangkat: { gte: dariDate, lt: sampaiDate },
      ...(f.kendaraanId ? { kendaraanId: f.kendaraanId } : {}),
      ...(f.driverId ? { driverId: f.driverId } : {}),
    },
    include: {
      kendaraan: {
        select: { nomorPolisi: true, standarKmPerLiter: true },
      },
      driver: { select: { nama: true } },
      laporan: { include: { biaya: { select: { kategori: true, nominal: true, liter: true } } } },
    },
    orderBy: { tanggalBerangkat: "asc" },
  });

  const rows: RekapTripRow[] = trips.map((t) => {
    const biaya = t.laporan?.biaya ?? [];
    const biayaBbm = biaya
      .filter((b) => b.kategori === "BBM")
      .reduce((s, b) => s + Number(b.nominal), 0);
    const liter = biaya
      .filter((b) => b.kategori === "BBM")
      .reduce((s, b) => s + Number(b.liter ?? 0), 0);
    const totalRealisasi = Number(t.totalRealisasi ?? 0);
    const kmTempuh = (t.kmAkhir ?? t.kmAwal) - t.kmAwal;
    const rasio = liter > 0 ? kmTempuh / liter : null;
    const standar = Number(t.kendaraan.standarKmPerLiter);

    return {
      id: t.id,
      nomorSj: t.nomorSj,
      tanggal: formatTanggalID(t.tanggalBerangkat),
      kendaraan: t.kendaraan.nomorPolisi,
      driver: t.driver.nama,
      kmTempuh,
      liter,
      rasio,
      standar,
      anomali: rasio !== null && standar > 0 && rasio < standar * 0.8,
      biayaBbm,
      biayaNonBbm: totalRealisasi - biayaBbm,
      totalRealisasi,
      selisih: Number(t.selisih ?? 0),
    };
  });

  const totalKm = rows.reduce((s, r) => s + r.kmTempuh, 0);
  const totalLiter = rows.reduce((s, r) => s + r.liter, 0);
  const standarTerisi = rows.filter((r) => r.standar > 0);
  const rasioStandar =
    standarTerisi.length > 0
      ? standarTerisi.reduce((s, r) => s + r.standar, 0) / standarTerisi.length
      : null;

  return {
    periodeLabel: `${formatTanggalID(dari)} — ${formatTanggalID(sampai)}`,
    rows,
    kpi: {
      totalRealisasi: rows.reduce((s, r) => s + r.totalRealisasi, 0),
      totalBbm: rows.reduce((s, r) => s + r.biayaBbm, 0),
      totalNonBbm: rows.reduce((s, r) => s + r.biayaNonBbm, 0),
      totalKm,
      totalLiter,
      rasioAktual: totalLiter > 0 ? totalKm / totalLiter : null,
      rasioStandar,
      jumlahTrip: rows.length,
      jumlahAnomali: rows.filter((r) => r.anomali).length,
    },
  };
}

// Opsi filter (armada & driver) untuk form laporan.
export async function getOpsiFilter() {
  const [kendaraan, drivers] = await Promise.all([
    prisma.kendaraan.findMany({
      select: { id: true, nomorPolisi: true },
      orderBy: { nomorPolisi: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "DRIVER" },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    }),
  ]);
  return { kendaraan, drivers };
}

// Builder CSV (delimiter ; — ramah Excel Indonesia; BOM utk UTF-8).
export function buatCsv(d: AnalitikDTO): string {
  const esc = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const baris = [
    ["No. SJ", "Tanggal", "Armada", "Driver", "KM Tempuh", "Liter BBM",
     "KM/L Aktual", "KM/L Standar", "Anomali BBM", "Biaya BBM", "Biaya Non-BBM",
     "Total Realisasi", "Selisih (setor+/reimburse-)"].map(esc).join(";"),
    ...d.rows.map((r) =>
      [r.nomorSj, r.tanggal, r.kendaraan, r.driver, r.kmTempuh, r.liter,
       r.rasio !== null ? r.rasio.toFixed(2) : "-",
       r.standar > 0 ? r.standar.toFixed(2) : "-",
       r.anomali ? "YA" : "TIDAK",
       r.biayaBbm, r.biayaNonBbm, r.totalRealisasi, r.selisih].map(esc).join(";")
    ),
    "",
    [esc("TOTAL"), "", "", "", d.kpi.totalKm, d.kpi.totalLiter,
     d.kpi.rasioAktual !== null ? d.kpi.rasioAktual.toFixed(2) : "-", "", "",
     d.kpi.totalBbm, d.kpi.totalNonBbm, d.kpi.totalRealisasi, ""].join(";"),
  ];
  return "\uFEFF" + baris.join("\r\n");
}

// ---------------------------------------------------------------
//  LAPORAN PERFORMA & SETTLEMENT PER DRIVER (Revisi Final #4)
//  Semantik Opsi B: uang diterima = uangJalan + uang drop (satpam+gudang).
// ---------------------------------------------------------------
export type TripDriverRow = {
  nomorSj: string;
  tanggal: string;
  kendaraan: string;
  kmAwal: number;
  kmAkhir: number;
  kmTempuh: number;
  liter: number;
  rasio: number | null;
  standar: number;
  anomali: boolean;
  uangJalan: number;
  uangDrop: number;      // Σ satpam+gudang
  totalTunai: number;    // uangJalan + uangDrop (Opsi B)
  biayaDriver: number;
  totalRealisasi: number;
  selisih: number;       // tersimpan saat settlement
  statusSettlement: "KEMBALIAN" | "NOMBOK" | "PAS";
};

export type LaporanDriverDTO = {
  driver: { nama: string; username: string; telepon: string | null };
  periodeLabel: string;
  rows: TripDriverRow[];
  total: {
    trip: number;
    km: number;
    liter: number;
    rasio: number | null;
    totalTunai: number;
    totalRealisasi: number;
    totalSelisih: number; // + = akumulasi setoran, − = akumulasi nombok
    anomali: number;
  };
};

export async function getLaporanDriver(f: {
  dari?: string;
  sampai?: string;
  driverId: string;
}): Promise<LaporanDriverDTO | null> {
  const { dari, sampai } = { ...periodeDefault(), dari: f.dari || undefined, sampai: f.sampai || undefined };
  // Rentang inklusif [dari 00:00, sampai 24:00) WIB — pola sama dgn getAnalitik.
  const dariDate = startOfDayWIB(dari ?? periodeDefault().dari).toDate();
  const sampaiDate = startOfDayWIB(sampai ?? periodeDefault().sampai)
    .add(1, "day")
    .toDate();

  const driver = await prisma.user.findFirst({
    where: { id: f.driverId, role: "DRIVER" },
    select: { nama: true, username: true, telepon: true },
  });
  if (!driver) return null;

  const trips = await prisma.perjalanan.findMany({
    where: {
      driverId: f.driverId,
      status: "SELESAI",
      tanggalBerangkat: { gte: dariDate, lt: sampaiDate },
    },
    include: {
      kendaraan: { select: { nomorPolisi: true, standarKmPerLiter: true } },
      tujuan: { select: { uangSatpam: true, uangGudang: true } },
      laporan: { include: { biaya: { select: { kategori: true, nominal: true, liter: true } } } },
    },
    orderBy: { tanggalBerangkat: "asc" },
  });

  const rows: TripDriverRow[] = trips.map((t) => {
    const kmAkhir = t.kmAkhir ?? t.kmAwal;
    const kmTempuh = kmAkhir - t.kmAwal;
    const biayaList = t.laporan?.biaya ?? [];
    const liter = biayaList
      .filter((b) => b.kategori === "BBM")
      .reduce((s, b) => s + Number(b.liter ?? 0), 0);
    const biayaDriver = biayaList.reduce((s, b) => s + Number(b.nominal), 0);
    const uangDrop = t.tujuan.reduce(
      (s, d) => s + Number(d.uangSatpam) + Number(d.uangGudang),
      0
    );
    const uangJalan = Number(t.uangJalan);
    const standar = Number(t.kendaraan.standarKmPerLiter);
    const rasio = liter > 0 ? kmTempuh / liter : null;
    const selisih = Number(t.selisih ?? 0);

    return {
      nomorSj: t.nomorSj,
      tanggal: formatTanggalID(t.tanggalBerangkat),
      kendaraan: t.kendaraan.nomorPolisi,
      kmAwal: t.kmAwal,
      kmAkhir,
      kmTempuh,
      liter,
      rasio,
      standar,
      anomali: rasio !== null && standar > 0 && rasio < standar * 0.8,
      uangJalan,
      uangDrop,
      totalTunai: uangJalan + uangDrop,
      biayaDriver,
      totalRealisasi: Number(t.totalRealisasi ?? uangDrop + biayaDriver),
      selisih,
      statusSettlement: selisih > 0 ? "KEMBALIAN" : selisih < 0 ? "NOMBOK" : "PAS",
    };
  });

  const totKm = rows.reduce((s, r) => s + r.kmTempuh, 0);
  const totLiter = rows.reduce((s, r) => s + r.liter, 0);

  return {
    driver,
    periodeLabel: `${formatTanggalID(dariDate)} — ${formatTanggalID(startOfDayWIB(sampai ?? periodeDefault().sampai).toDate())}`,
    rows,
    total: {
      trip: rows.length,
      km: totKm,
      liter: totLiter,
      rasio: totLiter > 0 ? totKm / totLiter : null,
      totalTunai: rows.reduce((s, r) => s + r.totalTunai, 0),
      totalRealisasi: rows.reduce((s, r) => s + r.totalRealisasi, 0),
      totalSelisih: rows.reduce((s, r) => s + r.selisih, 0),
      anomali: rows.filter((r) => r.anomali).length,
    },
  };
}

// ---------------------------------------------------------------
//  LAPORAN OPERASIONAL PERIODIK (rekap gaya spreadsheet, PDF)
//  Dua tabel agregat GROUP BY Driver atas trip SELESAI di periode:
//    Tabel 1 — rincian biaya operasional customer per driver
//    Tabel 2 — pembelian BBM per driver × armada × jenis BBM
//  Catatan sumber data (penting untuk akurasi):
//   - SATPAM & GUDANG = uang drop dari TujuanPerjalanan (BUKAN BiayaPerjalanan;
//     BiayaPerjalanan tidak punya kategori satpam/gudang).
//   - JENIS BBM = nama produk yang tercatat saat pembelian (BiayaPerjalanan
//     .keterangan berformat "Nama @ harga/L") — mencerminkan yang benar-benar
//     dibeli per transaksi, akurat secara historis meski harga master berubah.
// ---------------------------------------------------------------

export type OpsBarisCustomer = {
  driverId: string;
  driver: string;
  satpam: number;
  gudang: number;
  pakOgah: number;
  parkir: number;
  steam: number;
  servis: number;
  lain: number;
  total: number; // satpam+gudang+ogah+parkir+steam+servis+lain (TANPA BBM)
  jumlahTujuan: number;
};

export type OpsBarisBbm = {
  driverId: string;
  driver: string;
  plat: string;
  jenisKendaraan: string;
  jenisBbm: string;
  totalBbm: number;
};

export type LaporanOperasionalDTO = {
  periodeLabel: string;
  modeLabel: string; // "Semua Driver" | nama driver
  tabel1: OpsBarisCustomer[];
  total1: Omit<OpsBarisCustomer, "driverId" | "driver">;
  tabel2: OpsBarisBbm[];
  total2Bbm: number;
};

// Ambil nama produk BBM dari keterangan "Nama @ harga/L" → "Nama".
function jenisBbmDariKeterangan(ket: string | null): string {
  if (!ket) return "(tidak dicatat)";
  const potong = ket.split(" @ ")[0]?.trim();
  return potong || "(tidak dicatat)";
}

export async function getLaporanOperasional(f: {
  dari?: string;
  sampai?: string;
  driverId?: string; // undefined / "all" = semua driver
}): Promise<LaporanOperasionalDTO> {
  const dari = f.dari || periodeDefault().dari;
  const sampai = f.sampai || periodeDefault().sampai;
  const dariDate = startOfDayWIB(dari).toDate();
  const sampaiDate = startOfDayWIB(sampai).add(1, "day").toDate();
  const perDriver = f.driverId && f.driverId !== "all" ? f.driverId : null;

  const trips = await prisma.perjalanan.findMany({
    where: {
      status: "SELESAI",
      tanggalBerangkat: { gte: dariDate, lt: sampaiDate },
      ...(perDriver ? { driverId: perDriver } : {}),
    },
    include: {
      driver: { select: { id: true, nama: true } },
      kendaraan: { select: { nomorPolisi: true, merk: true, tipe: true } },
      tujuan: { select: { uangSatpam: true, uangGudang: true } },
      laporan: {
        include: {
          biaya: { select: { kategori: true, nominal: true, keterangan: true } },
        },
      },
    },
    orderBy: [{ driverId: "asc" }, { tanggalBerangkat: "asc" }],
  });

  // ── Agregasi Tabel 1: per driver ──
  const peta1 = new Map<string, OpsBarisCustomer>();
  // ── Agregasi Tabel 2: per (driver | armada | jenis BBM) ──
  const peta2 = new Map<string, OpsBarisBbm>();

  for (const t of trips) {
    const did = t.driver.id;

    // -- Tabel 1 --
    let r1 = peta1.get(did);
    if (!r1) {
      r1 = {
        driverId: did,
        driver: t.driver.nama,
        satpam: 0, gudang: 0, pakOgah: 0, parkir: 0,
        steam: 0, servis: 0, lain: 0, total: 0, jumlahTujuan: 0,
      };
      peta1.set(did, r1);
    }
    for (const tj of t.tujuan) {
      r1.satpam += Number(tj.uangSatpam);
      r1.gudang += Number(tj.uangGudang);
    }
    r1.jumlahTujuan += t.tujuan.length;

    for (const b of t.laporan?.biaya ?? []) {
      const nom = Number(b.nominal);
      switch (b.kategori) {
        case "PAK_OGAH": r1.pakOgah += nom; break;
        case "PARKIR": r1.parkir += nom; break;
        case "STEAM": r1.steam += nom; break;
        case "SERVIS_DARURAT": r1.servis += nom; break;
        case "LAINNYA": r1.lain += nom; break;
        case "BBM": {
          // -- Tabel 2 (hanya baris BBM) --
          const jenis = jenisBbmDariKeterangan(b.keterangan);
          const key = `${did}|${t.kendaraan.nomorPolisi}|${jenis}`;
          let r2 = peta2.get(key);
          if (!r2) {
            r2 = {
              driverId: did,
              driver: t.driver.nama,
              plat: t.kendaraan.nomorPolisi,
              jenisKendaraan: `${t.kendaraan.merk} ${t.kendaraan.tipe}`,
              jenisBbm: jenis,
              totalBbm: 0,
            };
            peta2.set(key, r2);
          }
          r2.totalBbm += nom;
          break;
        }
      }
    }
  }

  // Finalisasi TOTAL Tabel 1 per baris
  const tabel1 = [...peta1.values()].map((r) => {
    r.total = r.satpam + r.gudang + r.pakOgah + r.parkir + r.steam + r.servis + r.lain;
    return r;
  });
  tabel1.sort((a, b) => a.driver.localeCompare(b.driver, "id"));

  const tabel2 = [...peta2.values()].sort(
    (a, b) => a.driver.localeCompare(b.driver, "id") || a.plat.localeCompare(b.plat)
  );

  // Baris TOTAL keseluruhan Tabel 1
  const total1 = tabel1.reduce(
    (s, r) => ({
      satpam: s.satpam + r.satpam,
      gudang: s.gudang + r.gudang,
      pakOgah: s.pakOgah + r.pakOgah,
      parkir: s.parkir + r.parkir,
      steam: s.steam + r.steam,
      servis: s.servis + r.servis,
      lain: s.lain + r.lain,
      total: s.total + r.total,
      jumlahTujuan: s.jumlahTujuan + r.jumlahTujuan,
    }),
    { satpam: 0, gudang: 0, pakOgah: 0, parkir: 0, steam: 0, servis: 0, lain: 0, total: 0, jumlahTujuan: 0 }
  );

  const total2Bbm = tabel2.reduce((s, r) => s + r.totalBbm, 0);

  // Label mode: nama driver bila difilter satu, else "Semua Driver".
  let modeLabel = "Semua Driver";
  if (perDriver) {
    const d = await prisma.user.findUnique({
      where: { id: perDriver },
      select: { nama: true },
    });
    modeLabel = d?.nama ?? "Driver";
  }

  return {
    periodeLabel: `${formatTanggalID(dariDate)} — ${formatTanggalID(startOfDayWIB(sampai).toDate())}`,
    modeLabel,
    tabel1,
    total1,
    tabel2,
    total2Bbm,
  };
}
