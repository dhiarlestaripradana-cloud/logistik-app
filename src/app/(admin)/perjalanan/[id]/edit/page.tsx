import { notFound, redirect } from "next/navigation";
import { getFormOptions, getPerjalananDetail } from "@/modules/perjalanan/queries";
import { PerjalananForm } from "@/modules/perjalanan/components/perjalanan-form";

export const dynamic = "force-dynamic";

export default async function EditPerjalananPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getPerjalananDetail(id);
  
  if (!detail) notFound();
  
  // 👇 INI YANG KITA JEBOL: DRAFT dan DITUGASKAN boleh diedit!
  if (detail.status !== "DRAFT" && detail.status !== "DITUGASKAN") {
    redirect(`/perjalanan/${id}`);
  }

  const options = await getFormOptions({
    kendaraanId: detail.kendaraanId,
    driverId: detail.driverId,
  });

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">
        Edit {detail.status === "DRAFT" ? "Draft" : "Surat Jalan"} — <span className="font-mono">{detail.nomorSj}</span>
      </h1>
      <p className="text-sm text-slate-500">
        Perubahan diizinkan sebelum driver memulai perjalanan. Validasi kelayakan
        armada &amp; driver dijalankan ulang saat diterbitkan.
      </p>
      <div className="pt-4">
        <PerjalananForm options={options} initial={detail} />
      </div>
    </div>
  );
}