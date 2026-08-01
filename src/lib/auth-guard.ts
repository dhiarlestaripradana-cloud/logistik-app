import { auth } from "@/lib/auth";

// Gerbang otorisasi Server Action. Middleware menjaga RUTE,
// guard ini menjaga AKSI — pertahanan berlapis.
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

// Guard role DRIVER — dipakai seluruh query & action portal driver.
// KEAMANAN MUTLAK: pemanggil WAJIB memakai session.user.id sebagai filter
// driverId di setiap query (scoping server-side, bukan sekadar sembunyi di UI).
export async function requireDriver() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DRIVER") {
    throw new Error("Tidak berwenang: area ini khusus Driver.");
  }
  return session;
}

// Guard area kantor: SUPER_ADMIN & OPERASIONAL sama-sama boleh —
// dipakai HANYA oleh pencatatan PENGELUARAN operasional. Penambahan
// modal (MASUK) tetap requireAdmin (Segregation of Duties, Revisi Final #2).
export async function requireKantor() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "SUPER_ADMIN" && role !== "OPERASIONAL")) {
    throw new Error("Tidak berwenang: aksi ini khusus staf kantor.");
  }
  return session;
}
