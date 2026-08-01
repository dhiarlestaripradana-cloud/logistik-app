import { auth } from "@/lib/auth";
import { htmlToPdf } from "@/lib/pdf";
import { getAnalitik } from "@/modules/analitik/queries";
import { renderLaporanAuditHtml } from "@/modules/analitik/pdf/template";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return new Response("Tidak berwenang.", { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const d = await getAnalitik({
    dari: sp.get("dari") ?? undefined,
    sampai: sp.get("sampai") ?? undefined,
    kendaraanId: sp.get("kendaraanId") ?? undefined,
    driverId: sp.get("driverId") ?? undefined,
  });

  try {
    // Landscape: tabel audit lebar (14 kolom)
    const pdf = await htmlToPdf(renderLaporanAuditHtml(d, sp.get("label") ?? ""), {
      landscape: true,
    });
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="laporan-audit.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Gagal merender PDF laporan audit:", e);
    return new Response("Gagal merender PDF.", { status: 500 });
  }
}
