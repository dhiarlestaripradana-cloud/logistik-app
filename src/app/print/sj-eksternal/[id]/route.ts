import { auth } from "@/lib/auth";
import { getSjEksternalDetail } from "@/modules/sj-eksternal/queries";
import { renderSjEksternalHtml } from "@/modules/sj-eksternal/pdf/template";

export const dynamic = "force-dynamic";

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
  if (!detail) return new Response("Tidak ditemukan.", { status: 404 });

  return new Response(renderSjEksternalHtml(detail), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
