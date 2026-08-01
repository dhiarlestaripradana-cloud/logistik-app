import { auth } from "@/lib/auth";
import { htmlToPdf } from "@/lib/pdf";
import { getLaporanOperasional } from "@/modules/analitik/queries";
import { renderLaporanOperasionalHtml } from "@/modules/analitik/pdf/template-operasional";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return new Response("Tidak berwenang.", { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const data = await getLaporanOperasional({
    dari: sp.get("dari") ?? undefined,
    sampai: sp.get("sampai") ?? undefined,
    driverId: sp.get("driverId") ?? undefined, // "all" / uuid / kosong
  });

  try {
    // Landscape: Tabel 1 memuat 11 kolom — butuh lebar penuh.
    const pdf = await htmlToPdf(renderLaporanOperasionalHtml(data), { landscape: true });
    const label = data.modeLabel.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="laporan-operasional_${label}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Gagal merender PDF Laporan Operasional:", e);
    return new Response("Gagal merender PDF.", { status: 500 });
  }
}
