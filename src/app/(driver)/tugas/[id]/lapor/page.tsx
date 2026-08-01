import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getTugasUntukLapor } from "@/modules/laporan/queries";
import { getMasterBbmAktif } from "@/modules/master-bbm/queries";
import { LaporWizard } from "@/modules/laporan/components/lapor-wizard";

export const dynamic = "force-dynamic";

export default async function LaporPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Query sudah men-scope driverId + status BERJALAN — trip orang lain = 404.
  const [tugas, masterBbm] = await Promise.all([
    getTugasUntukLapor(id),
    getMasterBbmAktif(),
  ]);
  if (!tugas) notFound();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link
          href="/tugas"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500"
          aria-label="Kembali"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-base font-semibold text-slate-900">Laporan Pengiriman</h1>
          <p className="font-mono text-xs text-slate-500">{tugas.nomorSj}</p>
        </div>
      </div>

      {tugas.laporanPerluRevisi && tugas.catatanAdmin && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Catatan revisi admin:</span> {tugas.catatanAdmin}
        </p>
      )}

      <LaporWizard tugas={tugas} masterBbm={masterBbm} />
    </div>
  );
}
