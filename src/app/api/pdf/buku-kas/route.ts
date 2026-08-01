import { auth } from "@/lib/auth";
import { htmlToPdf } from "@/lib/pdf";
import { getBukuKas } from "@/modules/kas/queries";
import { renderBukuKasHtml } from "@/modules/kas/pdf/template";
import { periodeDefault } from "@/modules/analitik/queries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return new Response("Tidak berwenang.", { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const def = periodeDefault();
  const dari = sp.get("dari") || def.dari;
  const sampai = sp.get("sampai") || def.sampai;

  try {
    const data = await getBukuKas(dari, sampai);
    // Landscape: 9 kolom (termasuk Pemberi & Penerima terpisah) butuh ruang.
    const pdf = await htmlToPdf(renderBukuKasHtml(data), { landscape: true });
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="buku-kas_${dari}_sd_${sampai}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Gagal merender PDF Buku Kas:", e);
    return new Response("Gagal merender PDF Buku Kas.", { status: 500 });
  }
}
