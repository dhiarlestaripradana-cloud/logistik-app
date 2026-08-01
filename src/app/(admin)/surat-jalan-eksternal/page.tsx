import {
  getCustomerOpsiEksternal,
  getSjEksternalList,
} from "@/modules/sj-eksternal/queries";
import { SjEksternalClient } from "@/modules/sj-eksternal/components/sj-eksternal-table";

export const dynamic = "force-dynamic";

export default async function SjEksternalPage() {
  const [data, customers] = await Promise.all([
    getSjEksternalList(),
    getCustomerOpsiEksternal(),
  ]);

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Surat Jalan Eksternal</h1>
      <p className="text-sm text-slate-500">
        Dokumen pengantar untuk armada luar (canvas sales, ojek online, ekspedisi
        atau sewa truk). Terpisah penuh dari kasbon sopir internal — dokumen ini
        <b> tidak pernah</b> menyentuh uang jalan, uang satpam/gudang, maupun Buku Kas.
      </p>
      <div className="pt-4">
        <SjEksternalClient data={data} customers={customers} />
      </div>
    </div>
  );
}
