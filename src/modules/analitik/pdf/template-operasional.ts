import { formatRupiah } from "@/lib/utils/date";
import { PERUSAHAAN } from "@/modules/perjalanan/pdf/template";
import type { LaporanOperasionalDTO } from "../queries";

// =====================================================================
//  PDF LAPORAN OPERASIONAL PERIODIK (gaya spreadsheet).
//  Header tabel hijau, border solid — meniru tampilan Excel.
//  Tiga tabel: (1) rincian biaya operasional per driver,
//              (2) pembelian BBM per driver × armada × jenis BBM.
//              (3) rincian rute/tujuan per driver.
// =====================================================================

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const rp = (n: number) => (n > 0 ? formatRupiah(n) : "-");

const ket = (list: string[]) =>
  list.length ? `<div class="ket">(${esc(list.join(" ; "))})</div>` : "";

export function renderLaporanOperasionalHtml(d: LaporanOperasionalDTO): string {
  // ── Tabel 1: TOTAL OPERASIONAL CUSTOMER ──
  const baris1 = d.tabel1
    .map(
      (r, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td class="b">${esc(r.driver)}${ket(r.catatanDriver)}</td>
        <td class="num">${rp(r.satpam)}</td>
        <td class="num">${rp(r.gudang)}</td>
        <td class="num">${rp(r.pakOgah)}</td>
        <td class="num">${rp(r.parkir)}</td>
        <td class="num">${rp(r.steam)}</td>
        <td class="num">${rp(r.servis)}${ket(r.ketServis)}</td>
        <td class="num">${rp(r.lain)}${ket(r.ketLain)}</td>
        <td class="num b">${rp(r.total)}</td>
        <td class="c">${r.jumlahTujuan}</td>
      </tr>`
    )
    .join("");

  const t1 = d.total1;
  const totalRow1 = `
      <tr class="total">
        <td class="c" colspan="2">TOTAL</td>
        <td class="num">${rp(t1.satpam)}</td>
        <td class="num">${rp(t1.gudang)}</td>
        <td class="num">${rp(t1.pakOgah)}</td>
        <td class="num">${rp(t1.parkir)}</td>
        <td class="num">${rp(t1.steam)}</td>
        <td class="num">${rp(t1.servis)}</td>
        <td class="num">${rp(t1.lain)}</td>
        <td class="num">${rp(t1.total)}</td>
        <td class="c">${t1.jumlahTujuan}</td>
      </tr>`;

  // ── Tabel 2: TOTAL PEMBELIAN BBM ──
  const baris2 = d.tabel2
    .map(
      (r, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td class="b">${esc(r.driver)}</td>
        <td class="mono">${esc(r.plat)}</td>
        <td>${esc(r.jenisKendaraan)}</td>
        <td>${esc(r.jenisBbm)}</td>
        <td class="num b">${rp(r.totalBbm)}</td>
      </tr>`
    )
    .join("");

  const totalRow2 = `
      <tr class="total">
        <td class="c" colspan="5">TOTAL PEMBELIAN BBM</td>
        <td class="num">${rp(d.total2Bbm)}</td>
      </tr>`;

  // ── Tabel 3: RINCIAN RUTE DRIVER (TAMBAHAN BARU) ──
  // Menggunakan optional chaining (?.) untuk jaga-jaga kalau datanya belum siap dari backend
  const baris3 = d.tabel3?.map(
      (r, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td class="b">${esc(r.driver)}</td>
        <td class="c">${esc(r.tanggal)}</td>
        <td class="mono c">${esc(r.noSuratJalan)}</td>
        <td>${esc(r.namaCustomer)}</td>
        <td>${esc(r.wilayah)}</td>
      </tr>`
    ).join("");

  const kosong = (colspan: number) =>
    `<tr><td colspan="${colspan}" class="c muted" style="padding:14px">Tidak ada data pada periode/filter ini.</td></tr>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Laporan Operasional — ${esc(d.modeLabel)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #111; padding: 22px 26px; }
  .b { font-weight: bold; } .c { text-align: center; } .muted { color: #666; }
  .mono { font-family: 'Courier New', monospace; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }

  .kop { display: flex; justify-content: space-between; align-items: flex-start;
         border-bottom: 3px double #111; padding-bottom: 9px; }
  .kop h1 { font-size: 14px; }
  .kop .sub { font-size: 9px; color: #444; margin-top: 3px; line-height: 1.5; }
  .doc-title { text-align: right; }
  .doc-title h2 { font-size: 15px; letter-spacing: 1px; }
  .doc-title .meta { font-size: 10px; margin-top: 3px; }
  .doc-title .mode { display: inline-block; margin-top: 4px; padding: 2px 10px;
                      background: #065f46; color: #fff; border-radius: 10px; font-size: 9px; }

  h3.judul-tabel { margin: 16px 0 6px; font-size: 11px; letter-spacing: 0.4px;
                   color: #065f46; border-left: 4px solid #059669; padding-left: 7px; page-break-before: auto; }
  
  /* Supaya tabel rute yang panjang bisa pindah halaman dengan rapi */
  .page-break-before { page-break-before: always; margin-top: 20px; }

  table.grid { width: 100%; border-collapse: collapse; }
  table.grid th, table.grid td { border: 1px solid #333; padding: 5px 6px; vertical-align: middle; }
  table.grid td { vertical-align: top; }
  
  .ket { font-weight: normal; font-size: 7.5px; color: #374151;
         line-height: 1.35; margin-top: 3px; text-align: left;
         white-space: normal; word-break: break-word; }

  /* Header hijau ala spreadsheet */
  table.grid thead th { background: #059669; color: #fff; font-size: 9px;
                        letter-spacing: 0.3px; text-align: center; }
  table.grid tbody tr:nth-child(even) td { background: #f0fdf4; }
  table.grid tr { page-break-inside: avoid; }
  tr.total td { background: #d1fae5 !important; font-weight: bold; border-top: 2px solid #059669; }

  .footer { margin-top: 16px; font-size: 8.5px; color: #777; border-top: 1px solid #ccc; padding-top: 5px; }
  .ttd { display: flex; justify-content: flex-end; gap: 60px; margin-top: 26px; page-break-inside: avoid; }
  .ttd-box { width: 190px; text-align: center; font-size: 10px; }
  .ttd-box .garis { margin-top: 52px; border-top: 1px solid #111; padding-top: 4px; }
</style>
</head>
<body>
  <div class="kop">
    <div>
      <h1>${esc(PERUSAHAAN.nama)}</h1>
      <div class="sub">${esc(PERUSAHAAN.alamat)}<br/>${esc(PERUSAHAAN.telepon)}</div>
    </div>
    <div class="doc-title">
      <h2>LAPORAN OPERASIONAL</h2>
      <div class="meta">Periode: <b>${esc(d.periodeLabel)}</b></div>
      <div class="mode">${esc(d.modeLabel)}</div>
    </div>
  </div>

  <h3 class="judul-tabel">TABEL 1 — TOTAL OPERASIONAL CUSTOMER (per Driver)</h3>
  <table class="grid">
    <thead>
      <tr>
        <th style="width:26px">NO</th>
        <th style="width:110px">DRIVER</th>
        <th>SATPAM</th>
        <th>GUDANG</th>
        <th>P OGAH</th>
        <th>PARKIR</th>
        <th>STEAM</th>
        <th>SERVIS</th>
        <th style="min-width:150px">KET. LAIN</th>
        <th>TOTAL</th>
        <th style="width:48px">CUST.<br/>(tujuan)</th>
      </tr>
    </thead>
    <tbody>
      ${baris1 || kosong(11)}
    </tbody>
    ${d.tabel1.length ? `<tfoot>${totalRow1}</tfoot>` : ""}
  </table>

  <h3 class="judul-tabel">TABEL 2 — TOTAL PEMBELIAN BBM</h3>
  <table class="grid">
    <thead>
      <tr>
        <th style="width:26px">NO</th>
        <th style="width:120px">DRIVER</th>
        <th style="width:90px">PLAT KENDARAAN</th>
        <th>JENIS KENDARAAN</th>
        <th>JENIS BBM</th>
        <th style="width:120px">TOTAL PEMBELIAN BBM</th>
      </tr>
    </thead>
    <tbody>
      ${baris2 || kosong(6)}
    </tbody>
    ${d.tabel2.length ? `<tfoot>${totalRow2}</tfoot>` : ""}
  </table>

  <h3 class="judul-tabel page-break-before">TABEL 3 — RINCIAN RUTE DRIVER</h3>
  <table class="grid">
    <thead>
      <tr>
        <th style="width:26px">NO</th>
        <th style="width:110px">DRIVER</th>
        <th style="width:70px">TANGGAL</th>
        <th style="width:100px">NO. SURAT JALAN</th>
        <th>NAMA CUSTOMER</th>
        <th>WILAYAH</th>
      </tr>
    </thead>
    <tbody>
      ${baris3 || kosong(6)}
    </tbody>
  </table>
  <div class="ttd">
    <div class="ttd-box">
      <div>Mengetahui / Menyetujui,</div>
      <div class="garis b">Pimpinan / Owner</div>
    </div>
  </div>

  <div class="footer">
    SATPAM &amp; GUDANG = uang drop (komitmen toko) [cite: 8] · JENIS BBM = produk yang tercatat
    saat pembelian oleh driver [cite: 8] · hanya trip berstatus SELESAI yang direkap [cite: 8] ·
    Dicetak oleh Sistem Operasional ${esc(PERUSAHAAN.nama)}
  </div>
</body>
</html>`;
}