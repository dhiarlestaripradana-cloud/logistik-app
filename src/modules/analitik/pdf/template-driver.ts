import { formatRupiah } from "@/lib/utils/date";
import { PERUSAHAAN } from "@/modules/perjalanan/pdf/template";
import type { LaporanDriverDTO } from "../queries";

// Laporan Performa & Settlement Driver (Revisi Final #4):
// evaluasi kinerja individu + rekonsiliasi kasbon per sopir.

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const statusLabel: Record<string, string> = {
  KEMBALIAN: "Kembalian",
  NOMBOK: "Nombok",
  PAS: "Pas",
};

export function renderLaporanDriverHtml(d: LaporanDriverDTO): string {
  const baris = d.rows
    .map(
      (r) => `
      <tr class="${r.anomali ? "anomali" : ""}">
        <td class="mono xs b">${esc(r.nomorSj)}</td>
        <td class="xs">${esc(r.tanggal)}<br/><span class="muted">${esc(r.kendaraan)}</span></td>
        <td class="num xs">${r.kmAwal.toLocaleString("id-ID")} → ${r.kmAkhir.toLocaleString("id-ID")}<br/>
            <span class="b">${r.kmTempuh.toLocaleString("id-ID")} KM</span></td>
        <td class="num xs">${r.liter.toLocaleString("id-ID")} L<br/>
            <span class="b">${r.rasio !== null ? r.rasio.toFixed(2) : "—"} km/L</span>
            ${r.anomali ? '<span class="flag">⚠ BOROS</span>' : r.rasio !== null && r.standar > 0 ? '<span class="flag hemat">✓</span>' : ""}
            <br/><span class="muted">std ${r.standar > 0 ? r.standar.toFixed(2) : "—"}</span></td>
        <td class="num xs">
          UJ ${formatRupiah(r.uangJalan)}<br/>
          Drop ${formatRupiah(r.uangDrop)}<br/>
          <span class="b">${formatRupiah(r.totalTunai)}</span>
        </td>
        <td class="num xs">
          Driver ${formatRupiah(r.biayaDriver)}<br/>
          <span class="b">Total ${formatRupiah(r.totalRealisasi)}</span>
        </td>
        <td class="num ${r.selisih > 0 ? "hijau" : r.selisih < 0 ? "merah" : ""}">
          ${formatRupiah(Math.abs(r.selisih))}<br/>
          <span class="xs b">${statusLabel[r.statusSettlement]}</span>
        </td>
      </tr>`
    )
    .join("");

  const t = d.total;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Laporan Driver — ${esc(d.driver.nama)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; color: #111; padding: 24px 28px; }
  .b { font-weight: bold; } .xs { font-size: 9px; } .muted { color: #666; }
  .mono { font-family: 'Courier New', monospace; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .hijau { color: #047857; } .merah { color: #b91c1c; }
  .flag { display: inline-block; font-size: 8px; font-weight: bold; color: #b91c1c; }
  .flag.hemat { color: #047857; }

  .kop { display: flex; justify-content: space-between; border-bottom: 3px double #111; padding-bottom: 10px; }
  .kop h1 { font-size: 14px; }
  .kop .sub { font-size: 9px; color: #444; margin-top: 3px; line-height: 1.5; }
  .doc-title { text-align: right; }
  .doc-title h2 { font-size: 14px; letter-spacing: 1px; }
  .doc-title .nama { font-size: 16px; font-weight: bold; margin-top: 2px; }
  .periode { font-size: 10px; margin-top: 3px; }

  .kpi { display: flex; gap: 10px; margin: 12px 0; }
  .kpi > div { flex: 1; border: 1px solid #333; padding: 6px 8px; }
  .kpi .l { font-size: 8.5px; color: #555; letter-spacing: 0.3px; }
  .kpi .v { font-size: 12px; font-weight: bold; margin-top: 2px; }

  table.trip { width: 100%; border-collapse: collapse; }
  table.trip th, table.trip td { border: 1px solid #444; padding: 5px 6px; vertical-align: top; }
  table.trip th { background: #efefef; font-size: 9px; letter-spacing: 0.3px; }
  table.trip tr { page-break-inside: avoid; }
  tr.anomali td { background: #fee2e2; }
  tfoot td { background: #efefef; font-weight: bold; }

  .ttd { display: flex; justify-content: space-between; margin-top: 26px; page-break-inside: avoid; }
  .ttd-box { width: 200px; text-align: center; font-size: 10px; }
  .ttd-box .garis { margin-top: 56px; border-top: 1px solid #111; padding-top: 4px; }
  .footer { margin-top: 16px; font-size: 8.5px; color: #777; border-top: 1px solid #ccc; padding-top: 5px; }
</style>
</head>
<body>
  <div class="kop">
    <div>
      <h1>${esc(PERUSAHAAN.nama)}</h1>
      <div class="sub">${esc(PERUSAHAAN.alamat)}<br/>${esc(PERUSAHAAN.telepon)}</div>
    </div>
    <div class="doc-title">
      <h2>LAPORAN PERFORMA &amp; SETTLEMENT DRIVER</h2>
      <div class="nama">${esc(d.driver.nama)}</div>
      <div class="xs muted">@${esc(d.driver.username)}${d.driver.telepon ? " · " + esc(d.driver.telepon) : ""}</div>
      <div class="periode">Periode: <b>${esc(d.periodeLabel)}</b></div>
    </div>
  </div>

  <div class="kpi">
    <div><div class="l">TRIP SELESAI</div><div class="v">${t.trip}</div></div>
    <div><div class="l">TOTAL KM</div><div class="v">${t.km.toLocaleString("id-ID")}</div></div>
    <div><div class="l">EFISIENSI RATA²</div><div class="v">${t.rasio !== null ? t.rasio.toFixed(2) + " km/L" : "—"}</div></div>
    <div><div class="l">TOTAL TUNAI DITERIMA</div><div class="v">${formatRupiah(t.totalTunai)}</div></div>
    <div><div class="l">TOTAL REALISASI</div><div class="v">${formatRupiah(t.totalRealisasi)}</div></div>
    <div><div class="l">AKUMULASI SELISIH</div>
      <div class="v ${t.totalSelisih > 0 ? "hijau" : t.totalSelisih < 0 ? "merah" : ""}">
        ${formatRupiah(Math.abs(t.totalSelisih))} ${t.totalSelisih > 0 ? "(setor)" : t.totalSelisih < 0 ? "(nombok)" : "(pas)"}
      </div></div>
  </div>

  <table class="trip">
    <thead>
      <tr>
        <th style="width:92px">No. SJ</th>
        <th style="width:100px">Tanggal · Armada</th>
        <th style="width:95px">KM Awal→Akhir</th>
        <th style="width:95px">BBM &amp; Efisiensi</th>
        <th style="width:110px">Uang Diterima<br/>(UJ + Drop)</th>
        <th style="width:105px">Realisasi</th>
        <th style="width:95px">Selisih &amp; Status</th>
      </tr>
    </thead>
    <tbody>
      ${baris || `<tr><td colspan="7" style="text-align:center;padding:14px" class="muted">Tidak ada trip SELESAI pada periode ini.</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="text-align:center">TOTAL (${t.trip} trip · ${t.anomali} anomali BBM)</td>
        <td class="num">${t.km.toLocaleString("id-ID")} KM</td>
        <td class="num">${t.liter.toLocaleString("id-ID")} L</td>
        <td class="num">${formatRupiah(t.totalTunai)}</td>
        <td class="num">${formatRupiah(t.totalRealisasi)}</td>
        <td class="num ${t.totalSelisih > 0 ? "hijau" : t.totalSelisih < 0 ? "merah" : ""}">${formatRupiah(Math.abs(t.totalSelisih))}</td>
      </tr>
    </tfoot>
  </table>

  <div class="ttd">
    <div class="ttd-box">
      <div>Diperiksa oleh (Admin),</div>
      <div class="garis b">&nbsp;</div>
    </div>
    <div class="ttd-box">
      <div>Driver ybs,</div>
      <div class="garis b">${esc(d.driver.nama)}</div>
    </div>
  </div>

  <div class="footer">
    Semantik kas: Uang Diterima = Uang Jalan (kasbon operasional) + Uang Drop (satpam+gudang) ·
    Baris merah = konsumsi BBM &gt; 20% di atas standar armada ·
    Dicetak oleh Sistem Operasional ${esc(PERUSAHAAN.nama)}
  </div>
</body>
</html>`;
}
