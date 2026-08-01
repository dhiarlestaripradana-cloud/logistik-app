import { auth } from "@/lib/auth";
import { getLaporanDriver } from "@/modules/analitik/queries";
import { renderLaporanDriverHtml } from "@/modules/analitik/pdf/template-driver";

export const dynamic = "force-dynamic";

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

  return new Response(renderLaporanDriverHtml(data), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
