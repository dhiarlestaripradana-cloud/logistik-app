import { Printer, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/utils/date";
import { getArusKasList, getSaldoKas } from "@/modules/kas/queries";
import { periodeDefault } from "@/modules/analitik/queries";
import { KasClient } from "@/modules/kas/components/kas-table";

export const dynamic = "force-dynamic";

export default async function KasPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
  const sp = await searchParams;
  const def = periodeDefault();
  // Filter fleksibel (Revisi Final #3): harian, rentang, bulanan, tahunan.
  const dari = sp.dari || def.dari;
  const sampai = sp.sampai || def.sampai;

  const [data, saldo] = await Promise.all([
    getArusKasList({ dari, sampai }),
    getSaldoKas(),
  ]);

  const qs = new URLSearchParams({ dari, sampai }).toString();
  const inputCls =
    "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Buku Kas Umum</h1>
      <p className="text-sm text-slate-500">
        Ledger terpadu seluruh arus uang: input manual, potongan otomatis
        Operasional Kantor, dan settlement trip (Sprint 4). Append-only —
        salah catat dikoreksi dengan jurnal balik, bukan edit/hapus.
      </p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Wallet size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Saldo Buku Kas Saat Ini</div>
            <div className="text-xl font-semibold text-slate-900">{formatRupiah(saldo)}</div>
          </div>
        </div>

        {/* Filter periode + cetak resmi (Revisi Final #3) */}
        <form method="GET" className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="dari" className="mb-1 block text-xs font-medium text-slate-500">Dari</label>
            <input suppressHydrationWarning id="dari" name="dari" type="date" defaultValue={dari} className={inputCls} />
          </div>
          <div>
            <label htmlFor="sampai" className="mb-1 block text-xs font-medium text-slate-500">Sampai</label>
            <input suppressHydrationWarning id="sampai" name="sampai" type="date" defaultValue={sampai} className={inputCls} />
          </div>
          <button
            suppressHydrationWarning
            type="submit"
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Terapkan
          </button>
          <a
            href={`/api/pdf/buku-kas?${qs}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Printer size={15} /> Cetak PDF Buku Kas
          </a>
        </form>
      </div>

      <div className="pt-4">
        <KasClient data={data} />
      </div>
    </div>
  );
}
