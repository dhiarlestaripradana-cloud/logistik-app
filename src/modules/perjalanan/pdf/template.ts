import { formatRupiah } from "@/lib/utils/date";
import type { PerjalananDetailDTO } from "../queries";

// =====================================================================
//  TEMPLATE SURAT JALAN (Blueprint 5.3.2)
//  Satu fungsi → dua konsumen:
//   1. /print/surat-jalan/[id]  → preview HTML di browser (Ctrl+P manual)
//   2. /api/pdf/surat-jalan/[id] → Puppeteer setContent() → PDF resmi
//  Dengan begini layout preview = layout PDF, selamanya identik.
// =====================================================================

// Identitas perusahaan — ganti sesuai data resmi PT.
export const PERUSAHAAN = {
  nama: "PT Dhiar Lestari Pradana",
  alamat: "Komplek pergudangan, Jl. Sentra Niaga V Jl. Harapan Indah Boulevard, RT.10/RW.8, Pusaka Rakyat, Kec. Tarumajaya, Kabupaten Bekasi, Jawa Barat 17214",
  telepon: ""
};

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderSuratJalanHtml(d: PerjalananDetailDTO): string {
  const barisTujuan = d.tujuan
    .map(
      (t) => `
      <tr>
        <td class="c">${t.urutan}</td>
        <td>
          <div class="b">${esc(t.namaCustomer)}</div>
          <div class="xs muted">${esc(t.kodeCustomer)} · ${esc(t.wilayah)}</div>
          <div class="xs drop-uang">🛡️ Satpam: ${formatRupiah(t.uangSatpam)} &nbsp;|&nbsp; 📦 Gudang: ${formatRupiah(t.uangGudang)}</div>
        </td>
        <td class="xs">${esc(t.alamat)}</td>
        <td class="ttd-cell">
          <div class="ttd-space"></div>
          <div class="xs c muted">Nama jelas, TTD &amp; Stempel Toko</div>
        </td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Surat Jalan ${esc(d.nomorSj)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; padding: 24px 28px; }
  .b { font-weight: bold; }
  .c { text-align: center; }
  .xs { font-size: 9.5px; }
  .muted { color: #555; }

  /* ---- Kop ---- */
  .kop { display: flex; justify-content: space-between; align-items: flex-start;
         border-bottom: 3px double #111; padding-bottom: 10px; }
  .kop h1 { font-size: 15px; letter-spacing: 0.5px; }
  .kop .sub { font-size: 9.5px; color: #444; margin-top: 3px; line-height: 1.5; }
  .doc-title { text-align: right; }
  .doc-title h2 { font-size: 17px; letter-spacing: 2px; }
  .doc-title .nomor { font-family: 'Courier New', monospace; font-size: 12px; margin-top: 4px; }
  .badge-status { display: inline-block; margin-top: 5px; padding: 2px 10px; border: 1px solid #111;
                  border-radius: 10px; font-size: 9px; letter-spacing: 1px; }

  /* ---- Info grid ---- */
  .info { display: flex; gap: 24px; margin: 14px 0; }
  .info table { border-collapse: collapse; }
  .info td { padding: 2.5px 0; vertical-align: top; }
  .info td.k { color: #555; width: 118px; }
  .info td.sep { width: 12px; }

  /* ---- Tabel tujuan ---- */
  table.tujuan { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.tujuan th, table.tujuan td { border: 1px solid #333; padding: 6px 7px; vertical-align: top; }
  table.tujuan th { background: #efefef; font-size: 10px; letter-spacing: 0.4px; }
  table.tujuan { page-break-inside: auto; }
  table.tujuan tr { page-break-inside: avoid; }
  .ttd-cell { width: 150px; }
  .ttd-space { height: 52px; }

  /* ---- Rincian uang per drop di tabel tujuan ---- */
  .drop-uang { margin-top: 2px; color: #1d4ed8; }

  /* ---- Kotak ringkasan keuangan ---- */
  .uang { margin-top: 12px; border: 1.5px solid #111; padding: 8px 12px; width: 340px; }
  .uang .lbl { font-size: 9.5px; color: #444; letter-spacing: 0.4px; margin-bottom: 4px; }
  .uang-rinci { border-collapse: collapse; width: 100%; font-size: 10.5px; }
  .uang-rinci td { padding: 2px 0; vertical-align: bottom; }
  .uang-rinci td.sep { width: 10px; text-align: center; }
  .uang-rinci td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .uang-rinci tr.garis-jumlah td { border-bottom: 1.2px solid #111; padding-bottom: 1px; }
  .uang-rinci tr.total td { padding-top: 4px; }
  .uang-rinci .total-val { font-size: 14px; }

  .catatan { margin-top: 10px; font-size: 10px; }

  /* ---- TTD bawah ---- */
  .ttd-bawah { display: flex; justify-content: space-between; margin-top: 26px; page-break-inside: avoid; }
  .ttd-box { width: 200px; text-align: center; }
  .ttd-box .garis { margin-top: 58px; border-top: 1px solid #111; padding-top: 4px; }

  .footer { margin-top: 18px; font-size: 8.5px; color: #777; border-top: 1px solid #ccc; padding-top: 5px; }

  @media print { body { padding: 0; } }
</style>
</head>
<body>

  <div class="kop">
    <div>
      <h1>${esc(PERUSAHAAN.nama)}</h1>
      <div class="sub">${esc(PERUSAHAAN.alamat)}<br/>${esc(PERUSAHAAN.telepon)}</div>
    </div>
    <div class="doc-title">
      <h2>SURAT JALAN</h2>
      <div class="nomor">${esc(d.nomorSj)}</div>
      <div class="badge-status">${esc(d.status.replaceAll("_", " "))}</div>
    </div>
  </div>

  <div class="info">
    <table>
      <tr><td class="k">Tanggal Berangkat</td><td class="sep">:</td><td class="b">${esc(d.tanggalBerangkatLabel)}</td></tr>
      <tr><td class="k">Armada</td><td class="sep">:</td><td class="b">${esc(d.kendaraanLabel)}</td></tr>
      <tr><td class="k">KM Awal</td><td class="sep">:</td><td>${d.kmAwal.toLocaleString("id-ID")} KM</td></tr>
    </table>
    <table>
      <tr><td class="k">Driver</td><td class="sep">:</td><td class="b">${esc(d.driverNama)}</td></tr>
      <tr><td class="k">Jumlah Tujuan</td><td class="sep">:</td><td>${d.tujuan.length} titik drop</td></tr>
      <tr><td class="k">Dibuat oleh</td><td class="sep">:</td><td>${esc(d.dibuatOlehNama)}</td></tr>
    </table>
  </div>

  <table class="tujuan">
    <thead>
      <tr>
        <th style="width:28px">No</th>
        <th style="width:170px">Customer Tujuan</th>
        <th>Alamat Pengiriman</th>
        <th class="ttd-cell">Diterima Oleh</th>
      </tr>
    </thead>
    <tbody>${barisTujuan}
    </tbody>
  </table>

  <div class="uang">
    <div class="lbl">RINGKASAN UANG TUNAI DIBAWA DRIVER</div>
    <table class="uang-rinci">
      <tr>
        <td>Uang Jalan (Kasbon Operasional)</td>
        <td class="sep">:</td>
        <td class="num">${d.uangJalan > 0 ? formatRupiah(d.uangJalan) : "— (tanpa kasbon)"}</td>
      </tr>
      <tr>
        <td>Uang Drop (Satpam + Gudang, ${d.tujuan.length} titik)</td>
        <td class="sep">:</td>
        <td class="num">${formatRupiah(d.totalKomitmen)}</td>
      </tr>
      <tr class="garis-jumlah">
        <td colspan="2"></td>
        <td class="num xs muted">(+)</td>
      </tr>
      <tr class="total">
        <td class="b">TOTAL TUNAI DIBAWA DRIVER</td>
        <td class="sep">:</td>
        <td class="num b total-val">${formatRupiah(d.uangJalan + d.totalKomitmen)}</td>
      </tr>
    </table>
    <div class="xs muted" style="margin-top:4px">
      Dipertanggungjawabkan melalui laporan pascakiriman &amp; verifikasi admin.
    </div>
  </div>

  ${d.catatan ? `<div class="catatan"><span class="b">Catatan:</span> ${esc(d.catatan)}</div>` : ""}

  <div class="ttd-bawah">
    <div class="ttd-box">
      <div>Dibuat oleh (Admin),</div>
      <div class="garis b">${esc(d.dibuatOlehNama)}</div>
    </div>
    <div class="ttd-box">
      <div>Dibawa oleh (Driver),</div>
      <div class="garis b">${esc(d.driverNama)}</div>
    </div>
  </div>

  <div class="footer">
    Dokumen ini diterbitkan oleh Sistem Operasional ${esc(PERUSAHAAN.nama)} · ${esc(d.nomorSj)} ·
    Lembar pengiriman wajib kembali ke kantor bersama laporan driver.
  </div>

</body>
</html>`;
}