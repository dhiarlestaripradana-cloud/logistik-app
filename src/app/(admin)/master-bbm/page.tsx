import { getMasterBbmList } from "@/modules/master-bbm/queries";
import { MasterBbmTable } from "@/modules/master-bbm/components/master-bbm-table";

export const dynamic = "force-dynamic";

export default async function MasterBbmPage() {
  const data = await getMasterBbmList();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Master Harga BBM</h1>
      <p className="text-sm text-slate-500">
        Harga resmi per produk dipakai untuk menghitung <b>liter otomatis</b> saat
        driver menginput nominal pembelian BBM — menutup celah salah hitung maupun
        manipulasi angka liter. Perbarui harga di sini setiap ada penyesuaian SPBU.
      </p>
      <div className="pt-4">
        <MasterBbmTable data={data} />
      </div>
    </div>
  );
}
