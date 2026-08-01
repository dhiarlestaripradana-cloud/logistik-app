import { getDriverList } from "@/modules/driver/queries";
import { DriverTable } from "@/modules/driver/components/driver-table";

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const data = await getDriverList();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Manajemen Driver</h1>
      <p className="text-sm text-slate-500">
        Akun driver dibuat oleh Super Admin (tanpa self-register). Nonaktifkan —
        jangan hapus — agar riwayat perjalanan &amp; audit keuangan tetap utuh.
      </p>
      <div className="pt-4">
        <DriverTable data={data} />
      </div>
    </div>
  );
}
