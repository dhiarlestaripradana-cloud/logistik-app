import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Printer } from "lucide-react";
import { getPerjalananDetail } from "@/modules/perjalanan/queries";
import { STATUS_TRIP_BADGE } from "@/modules/perjalanan/components/perjalanan-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export default async function DetailPerjalananPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getPerjalananDetail(id);
  if (!d) notFound();

  const badge = STATUS_TRIP_BADGE[d.status] ?? { level: "ABU" as const, label: d.status };

  const info: Array<[string, string]> = [
    ["Tanggal Berangkat", d.tanggalBerangkatLabel],
    ["Armada", d.kendaraanLabel],
    ["Driver", d.driverNama],
    ["KM Awal", `${d.kmAwal.toLocaleString("id-ID")} KM`],
    ["KM Akhir", d.kmAkhir ? `${d.kmAkhir.toLocaleString("id-ID")} KM` : "— (menunggu laporan driver)"],
    ["Uang Jalan (Kasbon)", formatRupiah(d.uangJalan)],
    ["Komitmen Satpam+Gudang", formatRupiah(d.totalKomitmen)],
    ["Dibuat oleh", d.dibuatOlehNama],
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            <span className="font-mono">{d.nomorSj}</span>
          </h1>
          <div className="mt-2">
            <Badge level={badge.level}>{badge.label}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {d.status === "DRAFT" && (
            <Link href={`/perjalanan/${d.id}/edit`}>
              <Button variant="outline">
                <Pencil size={15} /> Edit Draft
              </Button>
            </Link>
          )}
          <a href={`/api/pdf/surat-jalan/${d.id}`} target="_blank" rel="noreferrer">
            <Button>
              <Printer size={15} /> Cetak PDF Surat Jalan
            </Button>
          </a>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Informasi Perjalanan
        </h2>
        <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 text-sm">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-medium text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
        {d.catatan && (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <span className="font-semibold">Catatan:</span> {d.catatan}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Tujuan Pengiriman ({d.tujuan.length} titik)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Urut</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Alamat</th>
                <th className="px-3 py-2 text-right">Uang Satpam</th>
                <th className="px-3 py-2 text-right">Uang Gudang</th>
                <th className="px-3 py-2">Status Drop</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {d.tujuan.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2.5 text-center font-semibold">{t.urutan}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium">{t.namaCustomer}</div>
                    <div className="text-xs text-slate-500">
                      {t.kodeCustomer} · {t.wilayah}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{t.alamat}</td>
                  <td className="px-3 py-2.5 text-right">{formatRupiah(t.uangSatpam)}</td>
                  <td className="px-3 py-2.5 text-right">{formatRupiah(t.uangGudang)}</td>
                  <td className="px-3 py-2.5">
                    <Badge
                      level={
                        t.statusDrop === "TERKIRIM"
                          ? "HIJAU"
                          : t.statusDrop === "GAGAL"
                            ? "MERAH"
                            : "ABU"
                      }
                    >
                      {t.statusDrop}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
