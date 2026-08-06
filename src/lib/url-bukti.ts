/** Ubah nilai fotoBuktiUrl dari DB → URL yang aman dibuka di browser. */
export function urlBukti(u: string | null | undefined): string | null {
  if (!u) return null;
  const nama = u.split("/").pop();
  return nama ? `/api/bukti/${nama}` : null;
}