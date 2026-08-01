// -------------------------------------------------------------
//  Kompresi foto di sisi KLIEN sebelum upload (target < 300KB).
//  Memakai Canvas API native (tanpa library) — foto kamera HP 5–8MB
//  diciutkan: sisi terpanjang 1280px + kualitas JPEG bertingkat.
//  Hemat kuota driver & storage server (Blueprint 5.2).
// -------------------------------------------------------------

const SISI_MAKS = 1280;
const TARGET_BYTES = 300 * 1024;

async function keBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* jatuh ke fallback <img> */
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal membaca gambar."));
    img.src = URL.createObjectURL(file);
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

export async function kompresFoto(file: File): Promise<Blob> {
  const sumber = await keBitmap(file);
  const w = "width" in sumber ? sumber.width : 0;
  const h = "height" in sumber ? sumber.height : 0;
  const skala = Math.min(1, SISI_MAKS / Math.max(w, h));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * skala);
  canvas.height = Math.round(h * skala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak didukung browser ini.");
  ctx.drawImage(sumber as CanvasImageSource, 0, 0, canvas.width, canvas.height);

  let hasil: Blob | null = null;
  for (const q of [0.8, 0.65, 0.5, 0.35]) {
    hasil = await toBlob(canvas, q);
    if (hasil && hasil.size <= TARGET_BYTES) break;
  }
  if (!hasil) throw new Error("Kompresi foto gagal.");
  return hasil;
}

export function labelUkuran(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
