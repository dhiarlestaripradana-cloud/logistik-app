import { auth } from "@/lib/auth";
import { DriverBottomNav } from "@/components/driver-bottom-nav";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-blue-500/30 bg-blue-600 px-4 py-3 text-white">
        <div className="text-xs text-blue-100">Portal Driver Logistik</div>
        <div className="text-base font-semibold">Halo, {session?.user.nama} 👋</div>
      </header>

      {/* pb-24: ruang untuk bottom nav */}
      <main className="px-4 pb-24 pt-4">{children}</main>

      <DriverBottomNav />
    </div>
  );
}
