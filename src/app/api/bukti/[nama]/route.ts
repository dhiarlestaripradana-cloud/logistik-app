import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { dirUpload } from "@/lib/upload";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ nama: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response("Tidak berwenang.", { status: 401 });

  const { nama } = await params;
  // Guard path traversal: hanya nama file polos, tanpa slash / titik ganda.
  if (!/^[A-Za-z0-9._-]+\.jpg$/.test(nama) || nama.includes("..")) {
    return new Response("Nama file tidak valid.", { status: 400 });
  }

  const berkas = path.join(dirUpload(), nama);
  try {
    const info = await stat(berkas);
    if (!info.isFile()) throw new Error("bukan file");

    const stream = Readable.toWeb(createReadStream(berkas)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(info.size),
        // private: boleh di-cache browser, TIDAK boleh oleh proxy/CDN.
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new Response("Bukti tidak ditemukan.", { status: 404 });
  }
}