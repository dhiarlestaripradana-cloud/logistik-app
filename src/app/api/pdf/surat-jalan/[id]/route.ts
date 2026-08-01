import { auth } from "@/lib/auth";
import { htmlToPdf } from "@/lib/pdf";
import { getPerjalananDetail } from "@/modules/perjalanan/queries";
import { renderSuratJalanHtml } from "@/modules/perjalanan/pdf/template";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // render Chromium butuh napas di mesin kecil

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return new Response("Tidak berwenang.", { status: 401 });
  }

  const { id } = await params;
  const detail = await getPerjalananDetail(id);
  if (!detail) return new Response("Surat Jalan tidak ditemukan.", { status: 404 });

  try {
    const pdf = await htmlToPdf(renderSuratJalanHtml(detail));
    const filename = `${detail.nomorSj.replaceAll("/", "-")}.pdf`;

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Gagal merender PDF Surat Jalan:", e);
    return new Response(
      "Gagal merender PDF. Pastikan Chromium/Puppeteer terpasang (npm install menjalankan unduhan browser otomatis).",
      { status: 500 }
    );
  }
}
