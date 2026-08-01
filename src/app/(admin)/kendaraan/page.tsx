import { getKendaraanList } from "@/modules/kendaraan/queries";
import { KendaraanTable } from "@/modules/kendaraan/components/kendaraan-table";

export const dynamic = "force-dynamic"; // alert H-14 & umur = derived state, harus segar

export default async function KendaraanPage() {
  const data = await getKendaraanList();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Master Kendaraan</h1>
      <p className="text-sm text-slate-500">
        Umur armada dihitung real-time dari tanggal pembelian. Badge Pajak/KIR:
        kuning = jatuh tempo ≤ 14 hari, merah = ≤ 7 hari atau terlambat.
      </p>
      <div className="pt-4">
        <KendaraanTable data={data} />
      </div>
    </div>
  );
}
