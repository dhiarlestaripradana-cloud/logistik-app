import type { Prisma } from "@prisma/client";
import { nowWIB } from "./date";

// Penomoran dokumen atomik (Blueprint 4.6):
// SJ/YYYY/MM/#### · KAS/YYYY/MM/#### · SJ-EXT/YYYY/MM/####
// WAJIB dipanggil DI DALAM prisma.$transaction — upsert + increment pada baris
// counter unik (jenis, tahun, bulan) mencegah nomor kembar antar admin.
export async function generateNomor(
  tx: Prisma.TransactionClient,
  jenis: "SJ" | "KAS" | "SJ-EXT"
): Promise<string> {
  const now = nowWIB();
  const tahun = now.year();
  const bulan = now.month() + 1;

  const counter = await tx.documentCounter.upsert({
    where: { jenis_tahun_bulan: { jenis, tahun, bulan } },
    create: { jenis, tahun, bulan, terakhir: 1 },
    update: { terakhir: { increment: 1 } },
  });

  const rakit = (n: number) =>
    `${jenis}/${tahun}/${String(bulan).padStart(2, "0")}/${String(n).padStart(4, "0")}`;

  let urut = counter.terakhir;
  let nomor = rakit(urut);

  // SELF-HEALING: jika counter pernah tidak sinkron dengan data (mis. database
  // di-restore sebagian, atau baris counter terhapus), nomor hasil increment
  // bisa bentrok dengan dokumen lama → unique constraint gagal. Di sini kita
  // majukan nomor sampai bebas, lalu simpan balik posisi counter.
  for (let percobaan = 0; percobaan < 50; percobaan++) {
    const bentrok =
      jenis === "KAS"
        ? await tx.arusKas.count({ where: { nomorRef: nomor } })
        : jenis === "SJ"
          ? await tx.perjalanan.count({ where: { nomorSj: nomor } })
          : await tx.suratJalanEksternal.count({ where: { nomorSj: nomor } });

    if (!bentrok) break;
    urut += 1;
    nomor = rakit(urut);
  }

  if (urut !== counter.terakhir) {
    await tx.documentCounter.update({
      where: { jenis_tahun_bulan: { jenis, tahun, bulan } },
      data: { terakhir: urut },
    });
  }

  return nomor;
}
