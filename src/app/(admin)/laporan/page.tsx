import { BarChart3, Download, Printer, TriangleAlert } from "lucide-react";
import { getAnalitik, getOpsiFilter, periodeDefault } from "@/modules/analitik/queries";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{
    dari?: string;
    sampai?: string;
    kendaraanId?: string;
    driverId?: string;
  }>;
}) {
  const sp = await searchParams;
  const def = periodeDefault();
  const filter = {
    dari: sp.dari || def.dari,
    sampai: sp.sampai || def.sampai,
    kendaraanId: sp.kendaraanId || undefined,
    driverId: sp.driverId || undefined,
  };

  const [data, opsi] = await Promise.all([getAnalitik(filter), getOpsiFilter()]);
  const { kpi } = data;

  const qs = new URLSearchParams({
    dari: filter.dari,
    sampai: filter.sampai,
    ...(filter.kendaraanId ? { kendaraanId: filter.kendaraanId } : {}),
    ...(filter.driverId ? { driverId: filter.driverId } : {}),
  }).toString();

  // Laporan Operasional: mode "Semua Driver" dikirim sebagai driverId=all
  // (sesuai spec), atau uuid driver bila satu driver dipilih.
  const qsOperasional = new URLSearchParams({
    dari: filter.dari,
    sampai: filter.sampai,
    driverId: filter.driverId || "all",
  }).toString();

  const inputCls =
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Laporan Eksekutif &amp; Analitik Armada</h1>
        <p className="text-sm text-slate-500">
          Rekap trip SELESAI: pengeluaran, jarak tempuh, dan efisiensi BBM vs standar.
          Baris merah = anomali boros &gt; 20% (Blueprint 4.4).
        </p>
      </div>

      {/* ── Filter (form GET — bisa di-bookmark) ── */}
      <form method="GET" className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="dari" className="mb-1 block text-xs font-medium text-slate-500">Dari tanggal</label>
          <input suppressHydrationWarning id="dari" name="dari" type="date" defaultValue={filter.dari} className={inputCls} />
        </div>
        <div>
          <label htmlFor="sampai" className="mb-1 block text-xs font-medium text-slate-500">Sampai tanggal</label>
          <input suppressHydrationWarning id="sampai" name="sampai" type="date" defaultValue={filter.sampai} className={inputCls} />
        </div>
        <div>
          <label htmlFor="kendaraanId" className="mb-1 block text-xs font-medium text-slate-500">Armada</label>
          <select suppressHydrationWarning id="kendaraanId" name="kendaraanId" defaultValue={filter.kendaraanId ?? ""} className={inputCls}>
            <option value="">Semua Armada</option>
            {opsi.kendaraan.map((k) => (
              <option key={k.id} value={k.id}>{k.nomorPolisi}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="driverId" className="mb-1 block text-xs font-medium text-slate-500">Driver</label>
          <select suppressHydrationWarning id="driverId" name="driverId" defaultValue={filter.driverId ?? ""} className={inputCls}>
            <option value="">Semua Driver</option>
            {opsi.drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            suppressHydrationWarning
            type="submit"
            className="h-10 w-full rounded-lg bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Terapkan Filter
          </button>
        </div>
      </form>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total Pengeluaran ({kpi.jumlahTrip} trip)</div>
          <div className="mt-2 text-xl font-semibold">{formatRupiah(kpi.totalRealisasi)}</div>
          <div className="mt-1 text-xs text-slate-500">
            BBM {formatRupiah(kpi.totalBbm)} · Non-BBM {formatRupiah(kpi.totalNonBbm)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Total KM Tempuh</div>
          <div className="mt-2 text-xl font-semibold">{kpi.totalKm.toLocaleString("id-ID")} KM</div>
          <div className="mt-1 text-xs text-slate-500">{kpi.totalLiter.toLocaleString("id-ID")} liter BBM</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Efisiensi Rata-rata</div>
          <div className="mt-2 text-xl font-semibold">
            {kpi.rasioAktual !== null ? `${kpi.rasioAktual.toFixed(2)} km/L` : "—"}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Standar armada: {kpi.rasioStandar !== null ? `${kpi.rasioStandar.toFixed(2)} km/L` : "—"}
          </div>
        </div>
        <div className={`rounded-xl border p-5 ${kpi.jumlahAnomali > 0 ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <TriangleAlert size={13} /> Anomali BBM
          </div>
          <div className={`mt-2 text-xl font-semibold ${kpi.jumlahAnomali > 0 ? "text-red-700" : ""}`}>
            {kpi.jumlahAnomali} trip
          </div>
          <div className="mt-1 text-xs text-slate-500">konsumsi &gt; 20% di atas standar</div>
        </div>
      </div>

      {/* ── Export ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <BarChart3 size={15} /> Periode: <b>{data.periodeLabel}</b>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/export/laporan-csv?${qs}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <Download size={14} /> Unduh CSV (Excel)
          </a>
          {filter.driverId && (
            <a
              href={`/api/pdf/laporan-driver?${qs}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              <Printer size={14} /> Cetak PDF Laporan Driver
            </a>
          )}
          <a
            href={`/api/pdf/laporan-operasional?${qsOperasional}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Printer size={14} /> Cetak Laporan Operasional
            <span className="opacity-80">
              ({filter.driverId ? "1 driver" : "semua"})
            </span>
          </a>
          <a
            href={`/api/pdf/laporan-audit?${qs}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
          >
            <Printer size={14} /> Cetak PDF Audit
          </a>
        </div>
      </div>

      {/* ── Tabel Rekap ── */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left">
            <tr>
              {["No. SJ", "Tanggal", "Armada", "Driver", "KM", "Liter", "KM/L", "BBM", "Non-BBM", "Realisasi", "Selisih"].map((h) => (
                <th key={h} className="whitespace-nowrap px-3 py-3 text-xs font-medium text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada trip SELESAI pada periode/filter ini.
                </td>
              </tr>
            )}
            {data.rows.map((r) => (
              <tr key={r.id} className={`border-b border-slate-100 last:border-0 ${r.anomali ? "bg-red-50" : "hover:bg-slate-50/60"}`}>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-semibold">{r.nomorSj}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs">{r.tanggal}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.kendaraan}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.driver}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">{r.kmTempuh.toLocaleString("id-ID")}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">{r.liter.toLocaleString("id-ID")}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  {r.rasio !== null ? (
                    <span className="inline-flex items-center gap-1">
                      <b>{r.rasio.toFixed(2)}</b>
                      {r.anomali && <Badge level="MERAH">⚠</Badge>}
                    </span>
                  ) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatRupiah(r.biayaBbm)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatRupiah(r.biayaNonBbm)}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">{formatRupiah(r.totalRealisasi)}</td>
                <td className={`whitespace-nowrap px-3 py-2.5 text-right ${r.selisih >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatRupiah(r.selisih)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
