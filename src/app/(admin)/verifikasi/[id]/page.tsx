import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getDetailVerifikasi } from "@/modules/verifikasi/queries";
import { VerifikasiReview } from "@/modules/verifikasi/components/verifikasi-review";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DetailVerifikasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getDetailVerifikasi(id);
  if (!d) notFound();

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/verifikasi"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
          aria-label="Kembali"
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Audit Laporan — <span className="font-mono">{d.nomorSj}</span>
          </h1>
          <p className="text-sm text-slate-500">
            {d.driver} · {d.kendaraan} · berangkat {d.tanggalBerangkat}
            {d.berangkatAktual && ` (mulai ${d.berangkatAktual})`}
          </p>
        </div>
        <div className="ml-auto">
          <Badge level="KUNING">Menunggu Verifikasi</Badge>
        </div>
      </div>

      {d.catatanTrip && (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold">Catatan trip:</span> {d.catatanTrip}
        </p>
      )}

      <VerifikasiReview d={d} />
    </div>
  );
}
