import { PERUSAHAAN } from "@/modules/perjalanan/pdf/template";
import { KATEGORI_LABEL } from "../schema";
import type { SjEksternalDetail } from "../queries";

// =====================================================================
//  PDF SURAT JALAN EKSTERNAL (armada luar).
//  ATURAN KERAS: template ini TIDAK BOLEH memuat unsur uang apa pun —
//  tidak ada uang jalan, uang satpam, uang gudang, maupun nominal lain.
//  DTO yang di-render pun memang tidak membawa field uang (lihat queries.ts),
//  jadi kebocoran angka kasbon mustahil terjadi dari sini.
// =====================================================================

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function renderSjEksternalHtml(d: SjEksternalDetail): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Surat Jalan Eksternal ${esc(d.nomorSj)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; padding: 24px 28px; }
  .b { font-weight: bold; } .c { text-align: center; }
  .xs { font-size: 9.5px; } .muted { color: #555; }

  .kop { display: flex; justify-content: space-between; align-items: flex-start;
         border-bottom: 3px double #111; padding-bottom: 10px; }
  .kop h1 { font-size: 15px; letter-spacing: 0.5px; }
  .kop .sub { font-size: 9.5px; color: #444; margin-top: 3px; line-height: 1.5; }
  .doc-title { text-align: right; }
  .doc-title h2 { font-size: 15px; letter-spacing: 1.5px; }
  .doc-title .tag { font-size: 9px; letter-spacing: 1px; color: #444; }
  .doc-title .nomor { font-family: 'Courier New', monospace; font-size: 12px; margin-top: 4px; }
  .badge-status { display: inline-block; margin-top: 5px; padding: 2px 10px; border: 1px solid #111;
                  border-radius: 10px; font-size: 9px; letter-spacing: 1px; }

  .info { display: flex; gap: 24px; margin: 14px 0 10px; }
  .info table { border-collapse: collapse; }
  .info td { padding: 2.5px 0; vertical-align: top; }
  .info td.k { color: #555; width: 118px; }
  .info td.sep { width: 12px; }

  table.isi { width: 100%; border-collapse: collapse; margin-top: 6px; }
  table.isi th, table.isi td { border: 1px solid #333; padding: 7px 8px; vertical-align: top; }
  table.isi th { background: #efefef; font-size: 10px; letter-spacing: 0.4px; }
  .barang { min-height: 90px; white-space: pre-wrap; }

  .catatan-box { margin-top: 10px; border: 1px dashed #666; padding: 7px 10px; font-size: 9.5px; color: #444; }

  .ttd-bawah { display: flex; justify-content: space-between; margin-top: 26px; page-break-inside: avoid; }
  .ttd-box { width: 175px; text-align: center; font-size: 10px; }
  .ttd-box .garis { margin-top: 56px; border-top: 1px solid #111; padding-top: 4px; }

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
      <div class="tag">DOKUMEN PENGANTAR BARANG</div>
      <h2>SURAT JALAN EKSTERNAL</h2>
      <div class="nomor">${esc(d.nomorSj)}</div>
      <div class="badge-status">${d.status === "DIKEMBALIKAN" ? "DIKEMBALIKAN" : "DIBAWA"}</div>
    </div>
  </div>

  <div class="info">
    <table>
      <tr><td class="k">Tanggal Kirim</td><td class="sep">:</td><td class="b">${esc(d.tanggal)}</td></tr>
      <tr><td class="k">Kategori Pengirim</td><td class="sep">:</td><td class="b">${esc(KATEGORI_LABEL[d.kategoriPengirim] ?? d.kategoriPengirim)}</td></tr>
      <tr><td class="k">Nama / Plat</td><td class="sep">:</td><td class="b">${esc(d.namaPengirim)}</td></tr>
    </table>
    <table>
      <tr><td class="k">Diterbitkan oleh</td><td class="sep">:</td><td>${esc(d.dibuatOleh)}</td></tr>
      <tr><td class="k">Kode Customer</td><td class="sep">:</td><td>${esc(d.kodeCustomer)}</td></tr>
      <tr><td class="k">Wilayah</td><td class="sep">:</td><td>${esc(d.wilayah)}</td></tr>
    </table>
  </div>

  <table class="isi">
    <thead>
      <tr>
        <th style="width:45%">Tujuan Pengiriman</th>
        <th>Keterangan Barang</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="b">${esc(d.customer)}</div>
          <div class="xs" style="margin-top:4px">${esc(d.alamat)}</div>
          ${d.pic ? `<div class="xs muted" style="margin-top:4px">PIC: ${esc(d.pic)}</div>` : ""}
          ${d.telepon ? `<div class="xs muted">Telp: ${esc(d.telepon)}</div>` : ""}
        </td>
        <td><div class="barang">${esc(d.keteranganBarang)}</div></td>
      </tr>
    </tbody>
  </table>

  <div class="catatan-box">
    Barang diterima dalam keadaan baik dan sesuai keterangan di atas. Lembar surat
    jalan ini wajib dikembalikan ke kantor setelah ditandatangani &amp; distempel penerima.
  </div>

  <div class="ttd-bawah">
    <div class="ttd-box">
      <div>Diserahkan oleh (Admin),</div>
      <div class="garis b">${esc(d.dibuatOleh)}</div>
    </div>
    <div class="ttd-box">
      <div>Dibawa oleh (Pengirim),</div>
      <div class="garis b">${esc(d.namaPengirim)}</div>
    </div>
    <div class="ttd-box">
      <div>Diterima oleh &amp; Stempel,</div>
      <div class="garis b">${esc(d.customer)}</div>
    </div>
  </div>

  <div class="footer">
    Dokumen pengantar barang armada eksternal · ${esc(d.nomorSj)} ·
    Diterbitkan oleh Sistem Operasional ${esc(PERUSAHAAN.nama)}
  </div>

</body>
</html>`;
}
