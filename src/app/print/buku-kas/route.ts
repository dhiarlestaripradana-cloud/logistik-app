import { auth } from "@/lib/auth";
import { getBukuKas } from "@/modules/kas/queries";
import { renderBukuKasHtml } from "@/modules/kas/pdf/template";
import { periodeDefault } from "@/modules/analitik/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return new Response("Tidak berwenang.", { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const def = periodeDefault();
  const data = await getBukuKas(sp.get("dari") || def.dari, sp.get("sampai") || def.sampai);
  return new Response(renderBukuKasHtml(data), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
