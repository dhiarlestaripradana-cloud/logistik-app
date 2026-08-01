"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, MapPin, Play, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { mulaiPerjalanan, tandaiDrop } from "../actions";
import type { TugasAktifDTO } from "../queries";

export function TugasAktifCard({ tugas }: { tugas: TugasAktifDTO }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const jalankan = (fn: () => Promise<{ error?: string } | null>) =>
    startTransition(async () => {
      const res = await fn();
      if (res?.error) {
        window.alert(res.error);
        return;
      }
      // FIX UI BENGONG (stale client cache): paksa refetch RSC seketika —
      // status DITUGASKAN→BERJALAN / centang drop langsung tampil
      // tanpa harus pindah tab (revisi UAT #2.1).
      router.refresh();
    });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header biru */}
      <div className="bg-blue-600 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-blue-100">
            Tugas Aktif
          </span>
          <Badge level={tugas.status === "BERJALAN" ? "KUNING" : "BIRU"}>
            {tugas.status === "BERJALAN" ? "Sedang Berjalan" : "Ditugaskan"}
          </Badge>
        </div>
        <div className="mt-1 font-mono text-lg font-bold">{tugas.nomorSj}</div>
        <div className="mt-0.5 text-sm text-blue-100">🚚 {tugas.kendaraan}</div>
      </div>

      {/* Banner revisi dari admin (loop verifikasi) */}
      {tugas.laporanPerluRevisi && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">⚠ Laporan Anda diminta REVISI oleh admin:</p>
          <p className="mt-0.5">{tugas.catatanAdmin ?? "Periksa kembali isian laporan."}</p>
        </div>
      )}

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">Berangkat (jadwal)</div>
            <div className="font-semibold">{tugas.tanggalBerangkat}</div>
            {tugas.berangkatAktual && (
              <div className="mt-0.5 text-xs text-emerald-600">
                Mulai: {tugas.berangkatAktual}
              </div>
            )}
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">KM Awal · Uang Jalan</div>
            <div className="font-semibold">
              {tugas.kmAwal.toLocaleString("id-ID")} KM
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              {formatRupiah(tugas.uangJalan)}
            </div>
          </div>
        </div>

        {/* Daftar tujuan drop */}
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tujuan Pengiriman ({tugas.tujuan.length})
            {tugas.status === "BERJALAN" && (
              <span className="ml-1 normal-case text-slate-400">— ketuk untuk tandai ✓</span>
            )}
          </div>
          <ul className="space-y-2">
            {tugas.tujuan.map((t) => {
              const terkirim = t.statusDrop === "TERKIRIM";
              const Isi = (
                <>
                  {terkirim ? (
                    <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle size={22} className="mt-0.5 shrink-0 text-slate-300" />
                  )}
                  <span className="min-w-0 flex-1 text-left">
                    <span className={cn("block text-sm font-medium", terkirim && "text-slate-400 line-through")}>
                      {t.urutan}. {t.namaCustomer}
                    </span>
                    <span className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      {t.alamat} · {t.wilayah}
                    </span>
                    <span className="mt-1 inline-flex flex-wrap gap-x-2 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      🛡️ Satpam: {formatRupiah(t.uangSatpam)}
                      <span className="text-blue-300">|</span>
                      📦 Gudang: {formatRupiah(t.uangGudang)}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={t.id}>
                  {tugas.status === "BERJALAN" ? (
                    <button
                      type="button"
                      suppressHydrationWarning
                      disabled={pending}
                      onClick={() => jalankan(() => tandaiDrop(t.id))}
                      className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3 transition active:bg-slate-50"
                    >
                      {Isi}
                    </button>
                  ) : (
                    <div className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-3">
                      {Isi}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {tugas.catatan && (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <span className="font-semibold">Catatan admin:</span> {tugas.catatan}
          </p>
        )}

        {/* Aksi utama — tombol setinggi jempol */}
        {tugas.status === "DITUGASKAN" ? (
          <button
            type="button"
            suppressHydrationWarning
            disabled={pending}
            onClick={() =>
              window.confirm("Mulai perjalanan sekarang? Waktu keberangkatan akan dicatat.") &&
              jalankan(() => mulaiPerjalanan(tugas.id))
            }
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-base font-semibold text-white transition active:bg-blue-700 disabled:opacity-60"
          >
            <Play size={20} /> {pending ? "Memproses..." : "Mulai Perjalanan"}
          </button>
        ) : (
          <Link
            href={`/tugas/${tugas.id}/lapor`}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-semibold text-white transition active:bg-emerald-700"
          >
            <ClipboardList size={20} />
            {tugas.laporanPerluRevisi ? "Perbaiki & Kirim Ulang Laporan" : "Selesai & Isi Laporan"}
          </Link>
        )}
      </div>
    </div>
  );
}
