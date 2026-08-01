import { auth } from "@/lib/auth";
import { getLaporanOperasional } from "@/modules/analitik/queries";
import { renderLaporanOperasionalHtml } from "@/modules/analitik/pdf/template-operasional";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return new Response("Tidak berwenang.", { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const data = await getLaporanOperasional({
    dari: sp.get("dari") ?? undefined,
    sampai: sp.get("sampai") ?? undefined,
    driverId: sp.get("driverId") ?? undefined,
  });
  return new Response(renderLaporanOperasionalHtml(data), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
