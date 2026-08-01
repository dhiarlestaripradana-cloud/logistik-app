import { auth } from "@/lib/auth";
import { buatCsv, getAnalitik, periodeDefault } from "@/modules/analitik/queries";

export const dynamic = "force-dynamic";

// Unduh rekap sebagai CSV (delimiter ; + BOM — terbuka mulus di Excel).
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

  const dari = sp.get("dari") || periodeDefault().dari;
  const sampai = sp.get("sampai") || periodeDefault().sampai;
  return new Response(buatCsv(d), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-armada_${dari}_sd_${sampai}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
