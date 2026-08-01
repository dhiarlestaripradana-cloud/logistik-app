import { getCustomerList } from "@/modules/customer/queries";
import { CustomerTable } from "@/modules/customer/components/customer-table";

export const dynamic = "force-dynamic";

export default async function CustomerPage() {
  const data = await getCustomerList();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Master Customer</h1>
      <p className="text-sm text-slate-500">
        Tarif default Uang Satpam &amp; Uang Gudang akan terisi otomatis saat
        pembuatan Surat Jalan (Sprint 2) dan tetap bisa diubah per trip.
      </p>
      <div className="pt-4">
        <CustomerTable data={data} />
      </div>
    </div>
  );
}
