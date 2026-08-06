"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Fuel, Undo2, X, ZoomIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { ActionState } from "@/lib/action-state";
import { mintaRevisi, setujuiSettlement } from "../actions";
import type { DetailVerifikasiDTO } from "../queries";
import { urlBukti } from "@/lib/url-bukti";

const LABEL_KATEGORI: Record<string, string> = {
  BBM: "BBM",
  PAK_OGAH: "Pak Ogah",
  PARKIR: "Parkir",
  STEAM: "Steam / Cuci",
  SERVIS_DARURAT: "Servis Darurat",
  LAINNYA: "Lainnya",
};

// ---------- Lightbox foto bukti ----------
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        suppressHydrationWarning
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
        aria-label="Tutup"
      >
        <X size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Foto bukti"
        className="max-h-[90vh] max-w-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

export function VerifikasiReview({ d }: { d: DetailVerifikasiDTO }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [revisiOpen, setRevisiOpen] = useState(false);

  const [stateRevisi, revisiAction, pendingRevisi] = useActionState<ActionState, FormData>(
    mintaRevisi,
    null
  );
  const [stateSetuju, setujuAction, pendingSetuju] = useActionState<ActionState, FormData>(
    setujuiSettlement,
    null
  );

  const errorMsg = stateSetuju?.error ?? stateRevisi?.error;

  return (
    <div className="space-y-5">
      {/* ── Analisis KM & BBM (Blueprint 4.4) ── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">Kilometer</div>
          <div className="mt-1 text-lg font-semibold">
            {d.kmAwal.toLocaleString("id-ID")} → {d.kmAkhir.toLocaleString("id-ID")}
          </div>
          <div className="text-sm text-slate-600">
            Tempuh: <b>{d.kmTempuh.toLocaleString("id-ID")} KM</b>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Fuel size={13} /> Konsumsi BBM
          </div>
          <div className="mt-1 text-lg font-semibold">
            {d.totalLiter.toLocaleString("id-ID")} liter
          </div>
          <div className="text-sm text-slate-600">
            {d.rasioKmPerLiter !== null
              ? <>Rasio: <b>{d.rasioKmPerLiter.toFixed(2)} km/L</b> (standar {d.standarKmPerLiter > 0 ? d.standarKmPerLiter.toFixed(2) : "—"})</>
              : "Tidak ada pembelian BBM"}
          </div>
        </div>
        <div
          className={cn(
            "rounded-xl border p-4",
            d.anomaliBbm
              ? "border-red-300 bg-red-50"
              : "border-emerald-200 bg-emerald-50"
          )}
        >
          <div className="text-xs text-slate-500">Deteksi Anomali</div>
          {d.anomaliBbm ? (
            <>
              <div className="mt-1 text-lg font-bold text-red-700">⚠ BOROS &gt; 20%</div>
              <div className="text-sm text-red-600">
                Indikasi masalah mesin / kecurangan BBM — periksa struk!
              </div>
            </>
          ) : (
            <>
              <div className="mt-1 text-lg font-bold text-emerald-700">✓ Normal</div>
              <div className="text-sm text-emerald-600">Konsumsi dalam batas wajar.</div>
            </>
          )}
        </div>
      </section>

      {/* ── Side-by-side: Kasbon vs Realisasi (Blueprint 5.1) ── */}
      <section className="grid gap-4 lg:grid-cols-2">
        {/* KIRI: komitmen kasbon */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Kasbon &amp; Komitmen (dibuat admin)
          </h2>
          <div className="mb-3 flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">Uang Jalan dibawa driver</span>
            <span className="font-bold">{formatRupiah(d.uangJalan)}</span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="py-1.5">Tujuan</th>
                <th className="py-1.5 text-right">Satpam</th>
                <th className="py-1.5 text-right">Gudang</th>
                <th className="py-1.5 text-center">Drop</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.tujuan.map((t) => (
                <tr key={t.id}>
                  <td className="py-2">{t.urutan}. {t.nama}</td>
                  <td className="py-2 text-right">{formatRupiah(t.uangSatpam)}</td>
                  <td className="py-2 text-right">{formatRupiah(t.uangGudang)}</td>
                  <td className="py-2 text-center">
                    <Badge level={t.statusDrop === "TERKIRIM" ? "HIJAU" : t.statusDrop === "GAGAL" ? "MERAH" : "ABU"}>
                      {t.statusDrop === "TERKIRIM" ? "✓" : t.statusDrop === "GAGAL" ? "✗" : "•"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 text-sm font-semibold">
            <span>Total komitmen satpam+gudang</span>
            <span>{formatRupiah(d.totalKomitmen)}</span>
          </div>
        </div>

        {/* KANAN: realisasi driver + galeri bukti */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Realisasi Lapangan (laporan driver)
          </h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {d.biaya.map((b) => (
              <li key={b.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0">
                  <div className="font-medium">
                    {LABEL_KATEGORI[b.kategori] ?? b.kategori}
                    {b.namaTujuan && <span className="text-slate-500"> — {b.namaTujuan}</span>}
                    {b.liter !== null && <span className="text-slate-500"> · {b.liter} L</span>}
                  </div>
                  {b.keterangan && (
                    <div className="text-xs text-slate-500">{b.keterangan}</div>
                  )}
                  {b.fotoBuktiUrl && (
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => setLightbox(urlBukti(b.fotoBuktiUrl) ?? "")}
                      className="group relative mt-1.5 block overflow-hidden rounded-lg border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={urlBukti(b.fotoBuktiUrl) ?? ""} alt="bukti" className="h-16 w-24 object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition group-hover:bg-black/40">
                        <ZoomIn size={16} className="opacity-0 group-hover:opacity-100" />
                      </span>
                    </button>
                  )}
                </div>
                <span className="shrink-0 font-semibold">{formatRupiah(b.nominal)}</span>
              </li>
            ))}
            {d.biaya.length === 0 && (
              <li className="py-4 text-center text-slate-400">Tidak ada biaya dilaporkan.</li>
            )}
          </ul>
          <div className="mt-3 space-y-1 border-t border-slate-200 pt-2 text-sm">
            {d.perKategori.map((k) => (
              <div key={k.kategori} className="flex justify-between text-slate-500">
                <span>Subtotal {LABEL_KATEGORI[k.kategori] ?? k.kategori}</span>
                <span>{formatRupiah(k.total)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold">
              <span>Total biaya driver</span>
              <span>{formatRupiah(d.totalBiayaDriver)}</span>
            </div>
          </div>
          {d.catatanDriver && (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <span className="font-semibold">Catatan driver:</span> {d.catatanDriver}
            </p>
          )}
        </div>
      </section>

      {/* ── Kotak SELISIH (rekonsiliasi) ── */}
      <section
        className={cn(
          "rounded-xl border-2 p-5",
          d.selisih > 0 && "border-emerald-300 bg-emerald-50",
          d.selisih < 0 && "border-red-300 bg-red-50",
          d.selisih === 0 && "border-slate-300 bg-slate-50"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-slate-500">
              Rekonsiliasi: Total Tunai {formatRupiah(d.totalTunai)}{" "}
              <span className="text-xs">(uang jalan {formatRupiah(d.uangJalan)} + drop {formatRupiah(d.totalKomitmen)})</span>{" "}
              − Total Realisasi {formatRupiah(d.totalRealisasi)}{" "}
              <span className="text-xs">(komitmen + biaya driver)</span>
            </div>
            <div className="mt-1 text-2xl font-bold">
              {d.selisih > 0 && <span className="text-emerald-700">Driver setor kembali {formatRupiah(d.selisih)}</span>}
              {d.selisih < 0 && <span className="text-red-700">Kantor mengganti (reimburse) {formatRupiah(Math.abs(d.selisih))}</span>}
              {d.selisih === 0 && <span className="text-slate-700">PAS — kasbon = realisasi</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={pendingRevisi || pendingSetuju} onClick={() => setRevisiOpen(true)}>
              <Undo2 size={15} /> Minta Revisi
            </Button>
            <form
              action={setujuAction}
              onSubmit={(e) => {
                if (
                  !window.confirm(
                    `Setujui & settle ${d.nomorSj}?\n\nBuku Kas akan mencatat total tunai keluar ${formatRupiah(d.totalTunai)}${
                      d.selisih > 0 ? ` + setoran kembali ${formatRupiah(d.selisih)}` :
                      d.selisih < 0 ? ` + reimburse ${formatRupiah(Math.abs(d.selisih))}` : ""
                    }, odometer armada ter-update, dan trip SELESAI. Aksi ini tidak bisa dibatalkan.`
                  )
                )
                  e.preventDefault();
              }}
            >
              <input type="hidden" name="tripId" value={d.id} />
              <Button type="submit" disabled={pendingRevisi || pendingSetuju}>
                <CheckCircle2 size={15} />
                {pendingSetuju ? "Memproses settlement..." : "Setujui & Settlement Kas ✔"}
              </Button>
            </form>
          </div>
        </div>
        {errorMsg && (
          <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
        )}
      </section>

      {/* Dialog Minta Revisi */}
      <Dialog open={revisiOpen} onClose={() => setRevisiOpen(false)} title={`Minta Revisi — ${d.nomorSj}`}>
        <form action={revisiAction} className="space-y-4">
          <input type="hidden" name="tripId" value={d.id} />
          <div>
            <Label htmlFor="catatan">Alasan / catatan untuk driver *</Label>
            <Textarea
              id="catatan"
              name="catatan"
              required
              placeholder="cth: Foto struk BBM #2 buram — tolong unggah ulang. Nominal parkir drop 1 tidak wajar."
            />
            <p className="mt-1 text-xs text-slate-400">
              Trip kembali BERJALAN; wizard di HP driver aktif lagi dengan banner catatan ini.
            </p>
          </div>
          {stateRevisi?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{stateRevisi.error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRevisiOpen(false)}>Batal</Button>
            <Button type="submit" variant="destructive" disabled={pendingRevisi}>
              {pendingRevisi ? "Mengirim..." : "Kirim Permintaan Revisi"}
            </Button>
          </div>
        </form>
      </Dialog>

      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}