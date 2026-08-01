import { auth } from "@/lib/auth";
import { htmlToPdf } from "@/lib/pdf";
import { getLaporanDriver } from "@/modules/analitik/queries";
import { renderLaporanDriverHtml } from "@/modules/analitik/pdf/template-driver";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return new Response("Tidak berwenang.", { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const driverId = sp.get("driverId");
  if (!driverId) return new Response("Parameter driverId wajib.", { status: 400 });

  const data = await getLaporanDriver({
    dari: sp.get("dari") ?? undefined,
    sampai: sp.get("sampai") ?? undefined,
    driverId,
  });
  if (!data) return new Response("Driver tidak ditemukan.", { status: 404 });

  try {
    const pdf = await htmlToPdf(renderLaporanDriverHtml(data));
    const nama = data.driver.username.replace(/[^a-z0-9._-]/gi, "");
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="laporan-driver_${nama}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Gagal merender PDF Laporan Driver:", e);
    return new Response("Gagal merender PDF Laporan Driver.", { status: 500 });
  }
}
