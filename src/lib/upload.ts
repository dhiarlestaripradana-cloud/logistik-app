import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// -------------------------------------------------------------
//  Penyimpanan foto bukti (struk BBM, nota servis, bukti steam).
//  PENTING: file TIDAK boleh di public/ — Next.js hanya melayani isi
//  public/ yang ada saat BUILD, sehingga upload runtime bisa 404.
//  Disimpan di UPLOAD_DIR (volume Docker) & disajikan lewat
//  /api/bukti/[nama] yang mengecek sesi login lebih dulu.
// -------------------------------------------------------------

const MAKS_BYTES = 2 * 1024 * 1024;

export function dirUpload(): string {
  return process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");
}

export async function simpanFotoBukti(file: File, prefix: string): Promise<string> {
  if (!(file instanceof File) || file.size === 0)
    throw new Error("Foto bukti tidak valid / kosong.");
  if (!file.type.startsWith("image/"))
    throw new Error("File bukti harus berupa gambar.");
  if (file.size > MAKS_BYTES)
    throw new Error("Ukuran foto melebihi 2MB — kompresi klien gagal?");

  const buf = Buffer.from(await file.arrayBuffer());
  const aman = prefix.replace(/[^a-zA-Z0-9-]/g, "");
  const nama = `${aman}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.jpg`;

  const dir = dirUpload();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, nama), buf);

  return `/uploads/${nama}`;
}