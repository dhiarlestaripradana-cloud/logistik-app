import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const nama = session?.user.nama ?? "Admin";
  const role = session?.user.role ?? "SUPER_ADMIN";
  const navMobile = (
    role === "OPERASIONAL"
      ? [["Operasional", "/operasional"]]
      : [
          ["Dashboard", "/dashboard"],
          ["Surat Jalan", "/perjalanan"],
          ["SJ Eksternal", "/surat-jalan-eksternal"],
          ["Kendaraan", "/kendaraan"],
          ["Harga BBM", "/master-bbm"],
          ["Customer", "/customer"],
          ["Driver", "/driver"],
          ["Buku Kas", "/kas"],
          ["Operasional", "/operasional"],
        ]
  ) as Array<[string, string]>;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — tersembunyi di layar kecil, tampil di md+ */}
      <div className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        <AdminSidebar nama={nama} role={role} />
      </div>

      <div className="flex-1 md:pl-64">
        {/* Bar navigasi ringkas untuk layar kecil */}
        <div className="sticky top-0 z-30 flex items-center gap-3 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          {navMobile.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="whitespace-nowrap rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700"
            >
              {label}
            </a>
          ))}
        </div>

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
