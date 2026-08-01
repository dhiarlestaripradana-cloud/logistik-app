import { getPerjalananList } from "@/modules/perjalanan/queries";
import { PerjalananTable } from "@/modules/perjalanan/components/perjalanan-table";

export const dynamic = "force-dynamic";

export default async function PerjalananPage() {
  const data = await getPerjalananList();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Surat Jalan / Perjalanan</h1>
      <p className="text-sm text-slate-500">
        Pusat monitoring seluruh penugasan pengiriman. Uang jalan trip aktif
        terhitung sebagai Dana Pending — Buku Kas baru terpotong saat verifikasi (Sprint 4).
      </p>
      <div className="pt-4">
        <PerjalananTable data={data} />
      </div>
    </div>
  );
}
