import { formatRupiah } from "@/lib/utils/date";
import { PERUSAHAAN } from "@/modules/perjalanan/pdf/template";
import type { AnalitikDTO } from "../queries";

// Laporan Audit Driver & Armada (Blueprint 5.3.3) — A4 landscape.
// Dipakai /print/laporan-audit (preview) dan /api/pdf/laporan-audit (PDF).

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rp = (n: number) => formatRupiah(n).replace("Rp ", "");

export function renderLaporanAuditHtml(
  d: AnalitikDTO,
  filterLabel: string
): string {
  const baris = d.rows
    .map(
      (r, i) => `
    <tr class="${r.anomali ? "anomali" : ""}">
      <td class="c">${i + 1}</td>
      <td class="mono">${esc(r.nomorSj)}</td>
      <td>${esc(r.tanggal)}</td>
      <td>${esc(r.kendaraan)}</td>
      <td>${esc(r.driver)}</td>
      <td class="r">${r.kmTempuh.toLocaleString("id-ID")}</td>
      <td class="r">${r.liter.toLocaleString("id-ID")}</td>
      <td class="r b">${r.rasio !== null ? r.rasio.toFixed(2) : "—"}</td>
      <td class="r">${r.standar > 0 ? r.standar.toFixed(2) : "—"}</td>
      <td class="c">${r.anomali ? "⚠ BOROS" : "OK"}</td>
      <td class="r">${rp(r.biayaBbm)}</td>
      <td class="r">${rp(r.biayaNonBbm)}</td>
      <td class="r b">${rp(r.totalRealisasi)}</td>
      <td class="r">${rp(r.selisih)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Laporan Audit Driver & Armada</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size:9.5px; color:#111; padding:16px 18px; }
  .kop { display:flex; justify-content:space-between; border-bottom:3px double #111; padding-bottom:8px; }
  .kop h1 { font-size:13px; } .kop .sub { font-size:8.5px; color:#444; margin-top:2px; }
  .judul { text-align:right; } .judul h2 { font-size:14px; letter-spacing:1px; }
  .judul .periode { font-size:9px; margin-top:3px; }
  .kpi { display:flex; gap:8px; margin:10px 0; }
  .kpi .box { flex:1; border:1px solid #333; padding:6px 8px; }
  .kpi .lbl { font-size:7.5px; color:#555; letter-spacing:.4px; text-transform:uppercase; }
  .kpi .val { font-size:11.5px; font-weight:bold; margin-top:2px; }
  table { width:100%; border-collapse:collapse; }
  th, td { border:1px solid #444; padding:4px 5px; }
  th { background:#efefef; font-size:8px; letter-spacing:.3px; }
  tr { page-break-inside:avoid; }
  .c { text-align:center; } .r { text-align:right; } .b { font-weight:bold; }
  .mono { font-family:'Courier New',monospace; font-size:8.5px; }
  .anomali td { background:#fde8e8; }
  tfoot td { background:#efefef; font-weight:bold; }
  .footer { margin-top:10px; font-size:7.5px; color:#777; }
</style>
</head>
<body>
  <div class="kop">
    <div>
      <h1>${esc(PERUSAHAAN.nama)}</h1>
      <div class="sub">${esc(PERUSAHAAN.alamat)}</div>
    </div>
    <div class="judul">
      <h2>LAPORAN AUDIT DRIVER &amp; ARMADA</h2>
      <div class="periode">Periode: ${esc(d.periodeLabel)}${filterLabel ? ` · ${esc(filterLabel)}` : ""}</div>
    </div>
  </div>

  <div class="kpi">
    <div class="box"><div class="lbl">Total Pengeluaran</div><div class="val">${formatRupiah(d.kpi.totalRealisasi)}</div></div>
    <div class="box"><div class="lbl">Biaya BBM</div><div class="val">${formatRupiah(d.kpi.totalBbm)}</div></div>
    <div class="box"><div class="lbl">Biaya Non-BBM</div><div class="val">${formatRupiah(d.kpi.totalNonBbm)}</div></div>
    <div class="box"><div class="lbl">Total KM Tempuh</div><div class="val">${d.kpi.totalKm.toLocaleString("id-ID")} KM</div></div>
    <div class="box"><div class="lbl">Efisiensi Aktual vs Standar</div><div class="val">${d.kpi.rasioAktual !== null ? d.kpi.rasioAktual.toFixed(2) : "—"} / ${d.kpi.rasioStandar !== null ? d.kpi.rasioStandar.toFixed(2) : "—"} km/L</div></div>
    <div class="box"><div class="lbl">Trip · Anomali</div><div class="val">${d.kpi.jumlahTrip} · ${d.kpi.jumlahAnomali} ⚠</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>No</th><th>No. SJ</th><th>Tanggal</th><th>Armada</th><th>Driver</th>
        <th>KM</th><th>Liter</th><th>KM/L</th><th>Std</th><th>Status BBM</th>
        <th>BBM (Rp)</th><th>Non-BBM (Rp)</th><th>Realisasi (Rp)</th><th>Selisih (Rp)</th>
      </tr>
    </thead>
    <tbody>${baris}</tbody>
    <tfoot>
      <tr>
        <td colspan="5" class="c">TOTAL — ${d.kpi.jumlahTrip} trip</td>
        <td class="r">${d.kpi.totalKm.toLocaleString("id-ID")}</td>
        <td class="r">${d.kpi.totalLiter.toLocaleString("id-ID")}</td>
        <td class="r">${d.kpi.rasioAktual !== null ? d.kpi.rasioAktual.toFixed(2) : "—"}</td>
        <td></td><td></td>
        <td class="r">${rp(d.kpi.totalBbm)}</td>
        <td class="r">${rp(d.kpi.totalNonBbm)}</td>
        <td class="r">${rp(d.kpi.totalRealisasi)}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    Baris merah = konsumsi BBM &gt; 20% lebih boros dari standar armada (indikasi masalah mesin / kecurangan — Blueprint 4.4).
    Digenerate otomatis oleh Sistem Operasional ${esc(PERUSAHAAN.nama)}.
  </div>
</body>
</html>`;
}
