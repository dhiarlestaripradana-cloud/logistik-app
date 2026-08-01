import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// -------------------------------------------------------------
//  Penyimpanan foto bukti (struk BBM, nota servis, bukti steam).
//  - Foto SUDAH dikompresi di klien (< ~300KB); guard 2MB di sini
//    hanyalah pagar terakhir.
//  - Disimpan ke public/uploads (di produksi = volume Docker persisten).
// -------------------------------------------------------------

const MAKS_BYTES = 2 * 1024 * 1024;

export async function simpanFotoBukti(
  file: File,
  prefix: string
): Promise<string> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Foto bukti tidak valid / kosong.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("File bukti harus berupa gambar.");
  }
  if (file.size > MAKS_BYTES) {
    throw new Error("Ukuran foto melebihi 2MB — kompresi klien gagal?");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const aman = prefix.replace(/[^a-zA-Z0-9-]/g, "");
  const nama = `${aman}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.jpg`;

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, nama), buf);

  return `/uploads/${nama}`;
}
