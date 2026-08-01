import { Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/utils/date";
import {
  getOperasionalList,
  getSaldoKas,
} from "@/modules/operasional-lain/queries";
import { OperasionalClient } from "@/modules/operasional-lain/components/operasional-table";

export const dynamic = "force-dynamic";

export default async function OperasionalPage() {
  const [data, saldo] = await Promise.all([getOperasionalList(), getSaldoKas()]);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Operasional Kantor</h1>
      <p className="text-sm text-slate-500">
        Pengeluaran non-driver (ATK, listrik/air, servis bengkel kantor, dll).
        Setiap entri otomatis memotong saldo Buku Kas Umum dalam satu transaksi
        atomik — ledger bersifat append-only.
      </p>

      <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <Wallet size={20} />
        </div>
        <div>
          <div className="text-xs text-slate-500">Saldo Buku Kas Saat Ini</div>
          <div className="text-xl font-semibold text-slate-900">
            {formatRupiah(saldo)}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <OperasionalClient data={data} />
      </div>
    </div>
  );
}
