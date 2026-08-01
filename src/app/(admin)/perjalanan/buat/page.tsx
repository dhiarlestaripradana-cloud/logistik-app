import { getFormOptions } from "@/modules/perjalanan/queries";
import { PerjalananForm } from "@/modules/perjalanan/components/perjalanan-form";

export const dynamic = "force-dynamic";

export default async function BuatPerjalananPage() {
  const options = await getFormOptions();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Buat Surat Jalan</h1>
      <p className="text-sm text-slate-500">
        Pilih armada &amp; driver, susun tujuan multi-drop (tarif satpam/gudang
        terisi otomatis dari master customer — tetap bisa diubah per trip),
        lalu simpan sebagai draft atau langsung terbitkan.
      </p>
      <div className="pt-4">
        <PerjalananForm options={options} />
      </div>
    </div>
  );
}
