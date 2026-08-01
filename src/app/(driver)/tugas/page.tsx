import { CheckCircle2, Inbox } from "lucide-react";
import { getTugasAktif } from "@/modules/laporan/queries";
import { TugasAktifCard } from "@/modules/laporan/components/tugas-aktif-card";

export const dynamic = "force-dynamic";

export default async function TugasPage({
  searchParams,
}: {
  searchParams: Promise<{ terkirim?: string }>;
}) {
  const [{ terkirim }, tugas] = await Promise.all([searchParams, getTugasAktif()]);

  return (
    <div className="space-y-4">
      {terkirim === "1" && (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={18} />
          Laporan terkirim! Menunggu verifikasi admin.
        </p>
      )}

      {tugas ? (
        <TugasAktifCard tugas={tugas} />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <Inbox size={40} className="mx-auto text-slate-300" />
          <p className="mt-3 font-medium text-slate-600">Belum ada tugas aktif</p>
          <p className="mt-1 text-sm text-slate-400">
            Tugas baru dari admin akan muncul di sini.
          </p>
        </div>
      )}
    </div>
  );
}
