import Link from "next/link";
import { CheckCircle2, SearchCheck } from "lucide-react";
import { getAntrianVerifikasi } from "@/modules/verifikasi/queries";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function VerifikasiPage({
  searchParams,
}: {
  searchParams: Promise<{ sukses?: string }>;
}) {
  const [{ sukses }, antrian] = await Promise.all([searchParams, getAntrianVerifikasi()]);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Verifikasi Laporan Driver</h1>
      <p className="text-sm text-slate-500">
        Antrian laporan pascakiriman menunggu audit. Setujui = settlement kas resmi
        (2-Step Settlement, Blueprint 4.5); Minta Revisi = laporan kembali ke driver.
      </p>

      {sukses === "1" && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 size={17} /> Aksi verifikasi berhasil diproses.
        </p>
      )}

      <div className="pt-4">
        {antrian.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <SearchCheck size={40} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-400">
              Tidak ada laporan menunggu verifikasi. Semua beres! 🎉
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left">
                <tr>
                  {["No. SJ", "Driver", "Armada", "Berangkat", "Laporan Masuk", "Uang Jalan", "Biaya Driver", ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 font-medium text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {antrian.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{a.nomorSj}</td>
                    <td className="px-4 py-3">{a.driver}</td>
                    <td className="px-4 py-3">{a.kendaraan}</td>
                    <td className="px-4 py-3 text-xs">{a.tanggalBerangkat}</td>
                    <td className="px-4 py-3 text-xs">{a.submittedAt}</td>
                    <td className="px-4 py-3">{formatRupiah(a.uangJalan)}</td>
                    <td className="px-4 py-3">{formatRupiah(a.totalBiayaDriver)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/verifikasi/${a.id}`}>
                        <Button size="sm">Periksa →</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
