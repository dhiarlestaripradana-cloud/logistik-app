import { formatRupiah, formatTanggalID } from "@/lib/utils/date";
import { PERUSAHAAN } from "@/modules/perjalanan/pdf/template";
import type { BukuKasDTO } from "../queries";

// Cetakan resmi Buku Kas Umum (Blueprint 5.3.1 + Revisi Final #3):
// pembukuan standar — Saldo Awal, Debit/Kredit per baris, running balance,
// Total Masuk/Keluar, Saldo Akhir, blok tanda tangan.

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const sumberLabel: Record<string, string> = {
  MANUAL: "Manual",
  OPERASIONAL: "Operasional Kantor",
  TRIP: "Settlement Trip",
};

export function renderBukuKasHtml(d: BukuKasDTO): string {
  const baris = d.rows
    .map(
      (r, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td class="xs">${esc(r.tanggal)}</td>
        <td class="xs mono">${esc(r.nomorRef)}</td>
        <td class="xs">${esc(r.pemberi)}</td>
        <td class="xs">${esc(r.penerima)}</td>
        <td>
          <div>${esc(r.keterangan)}</div>
          <div class="xs muted">${esc(sumberLabel[r.sumber] ?? r.sumber)}</div>
        </td>
        <td class="num hijau">${r.tipe === "MASUK" ? formatRupiah(r.nominal) : "—"}</td>
        <td class="num merah">${r.tipe === "KELUAR" ? formatRupiah(r.nominal) : "—"}</td>
        <td class="num b">${formatRupiah(r.saldoSesudah)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Buku Kas Umum</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9.5px; color: #111; padding: 24px 28px; }
  .b { font-weight: bold; } .c { text-align: center; }
  .xs { font-size: 9px; } .muted { color: #666; }
  .mono { font-family: 'Courier New', monospace; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .hijau { color: #047857; } .merah { color: #b91c1c; }

  .kop { display: flex; justify-content: space-between; align-items: flex-start;
         border-bottom: 3px double #111; padding-bottom: 10px; }
  .kop h1 { font-size: 14px; } .kop .sub { font-size: 9px; color: #444; margin-top: 3px; line-height: 1.5; }
  .doc-title { text-align: right; }
  .doc-title h2 { font-size: 16px; letter-spacing: 2px; }
  .periode { font-size: 10px; margin-top: 4px; }

  table.kas { width: 100%; border-collapse: collapse; margin-top: 12px; }
  table.kas th, table.kas td { border: 1px solid #444; padding: 4px 5px; vertical-align: top; }
  table.kas th { background: #efefef; font-size: 9.5px; letter-spacing: 0.3px; }
  table.kas tr { page-break-inside: avoid; }
  tr.saldo-awal td { background: #f8fafc; font-style: italic; }
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
      <h2>BUKU KAS UMUM</h2>
      <div class="periode">Periode: <b>${formatTanggalID(d.periodeDari)} — ${formatTanggalID(d.periodeSampai)}</b></div>
    </div>
  </div>

  <table class="kas">
    <thead>
      <tr>
        <th style="width:24px">No</th>
        <th style="width:70px">Tanggal</th>
        <th style="width:84px">No. Ref</th>
        <th style="width:80px">Pemberi</th>
        <th style="width:80px">Penerima</th>
        <th>Keterangan</th>
        <th style="width:80px">Masuk<br/>(Debit)</th>
        <th style="width:80px">Keluar<br/>(Kredit)</th>
        <th style="width:88px">Saldo</th>
      </tr>
    </thead>
    <tbody>
      <tr class="saldo-awal">
        <td colspan="6">Saldo Awal Periode</td>
        <td class="num">—</td>
        <td class="num">—</td>
        <td class="num b">${formatRupiah(d.saldoAwal)}</td>
      </tr>
      ${baris || `<tr><td colspan="9" class="c muted" style="padding:14px">Tidak ada transaksi pada periode ini.</td></tr>`}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6" class="c">TOTAL PERIODE &amp; SALDO AKHIR</td>
        <td class="num hijau">${formatRupiah(d.totalMasuk)}</td>
        <td class="num merah">${formatRupiah(d.totalKeluar)}</td>
        <td class="num">${formatRupiah(d.saldoAkhir)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="ttd">
    <div class="ttd-box">
      <div>Dibuat oleh,</div>
      <div class="garis b">Admin Keuangan</div>
    </div>
    <div class="ttd-box">
      <div>Disetujui oleh,</div>
      <div class="garis b">Pimpinan / Owner</div>
    </div>
  </div>

  <div class="footer">
    Ledger append-only — koreksi dicatat sebagai jurnal balik, bukan penghapusan ·
    ${d.rows.length} transaksi · Dicetak oleh Sistem Operasional ${esc(PERUSAHAAN.nama)}
  </div>
</body>
</html>`;
}
