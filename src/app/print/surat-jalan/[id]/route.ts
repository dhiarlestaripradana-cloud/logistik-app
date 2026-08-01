import { auth } from "@/lib/auth";
import { getPerjalananDetail } from "@/modules/perjalanan/queries";
import { renderSuratJalanHtml } from "@/modules/perjalanan/pdf/template";

export const dynamic = "force-dynamic";

// Preview HTML di browser — layout 100% identik dgn PDF (template sama).
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

  return new Response(renderSuratJalanHtml(detail), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
