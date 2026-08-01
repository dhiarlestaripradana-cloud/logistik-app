import { auth } from "@/lib/auth";
import { getAnalitik } from "@/modules/analitik/queries";
import { renderLaporanAuditHtml } from "@/modules/analitik/pdf/template";

export const dynamic = "force-dynamic";

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
  return new Response(renderLaporanAuditHtml(d, sp.get("label") ?? ""), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
