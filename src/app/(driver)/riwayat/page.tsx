import { History } from "lucide-react";
import { getRiwayatTugas } from "@/modules/laporan/queries";
import { Badge, type BadgeLevel } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

const BADGE: Record<string, { level: BadgeLevel; label: string }> = {
  MENUNGGU_VERIFIKASI: { level: "KUNING", label: "Menunggu Verifikasi" },
  SELESAI: { level: "HIJAU", label: "Selesai" },
  DIBATALKAN: { level: "MERAH", label: "Dibatalkan" },
};

export default async function RiwayatPage() {
  // Query men-scope driverId dari session — hanya riwayat milik sendiri.
  const riwayat = await getRiwayatTugas();

  return (
    <div className="space-y-3">
      <h1 className="text-base font-semibold text-slate-900">
        Riwayat Tugas <span className="font-normal text-slate-400">(20 terakhir)</span>
      </h1>

      {riwayat.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <History size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">Belum ada riwayat tugas.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {riwayat.map((r) => {
            const b = BADGE[r.status] ?? { level: "ABU" as const, label: r.status };
            return (
              <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-semibold">{r.nomorSj}</span>
                  <Badge level={b.level}>{b.label}</Badge>
                </div>
                <div className="mt-1.5 text-xs text-slate-500">
                  {r.tanggalBerangkat} · 🚚 {r.kendaraan} · {r.jumlahDrop} drop
                </div>
                {r.totalBiaya !== null && (
                  <div className="mt-1 text-xs text-slate-600">
                    Total laporan biaya:{" "}
                    <span className="font-semibold">{formatRupiah(r.totalBiaya)}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
