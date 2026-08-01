import { auth } from "@/lib/auth";
import { htmlToPdf } from "@/lib/pdf";
import { getSjEksternalDetail } from "@/modules/sj-eksternal/queries";
import { renderSjEksternalHtml } from "@/modules/sj-eksternal/pdf/template";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return new Response("Tidak berwenang.", { status: 401 });
  }

  const { id } = await params;
  const detail = await getSjEksternalDetail(id);
  if (!detail) return new Response("Surat Jalan Eksternal tidak ditemukan.", { status: 404 });

  try {
    const pdf = await htmlToPdf(renderSjEksternalHtml(detail));
    const filename = `${detail.nomorSj.replaceAll("/", "-")}.pdf`;
    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Gagal merender PDF SJ Eksternal:", e);
    return new Response("Gagal merender PDF.", { status: 500 });
  }
}
