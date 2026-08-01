"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  BarChart3,
  Truck,
  Store,
  Users,
  Receipt,
  Wallet,
  LogOut,
  FileOutput, 
  Fuel        
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logoutAction } from "@/modules/auth/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/perjalanan", label: "Surat Jalan", icon: FileText },
  { href: "/verifikasi", label: "Verifikasi", icon: ClipboardCheck },
  { href: "/surat-jalan-eksternal", label: "SJ Eksternal", icon: FileOutput },
  { href: "/kendaraan", label: "Kendaraan", icon: Truck },
  { href: "/master-bbm", label: "Harga BBM", icon: Fuel },
  { href: "/customer", label: "Customer", icon: Store },
  { href: "/driver", label: "Driver", icon: Users },
  { href: "/kas", label: "Buku Kas", icon: Wallet },
  { href: "/operasional", label: "Operasional Kantor", icon: Receipt },
  { href: "/laporan", label: "Laporan", icon: BarChart3 },
];

export function AdminSidebar({
  nama,
  role,
}: {
  nama: string;
  role: string;
}) {
  const pathname = usePathname();
  // Role OPERASIONAL hanya melihat menu yang boleh ia akses.
  const nav = role === "OPERASIONAL" ? NAV.filter((n) => n.href === "/operasional") : NAV;

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
          <Image 
            src="/logo.png"
            alt="Logo PT" 
            width={40} 
            height={40} 
            className="object-contain"
          />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">
            PT Dhiar Lestari Pradana
          </div>
          <div className="text-xs text-slate-500">{role === "OPERASIONAL" ? "Panel Operasional" : "Panel Super Admin"}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 truncate px-3 text-xs text-slate-500">
          Masuk sebagai <span className="font-medium text-slate-700">{nama}</span>
        </div>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700">
            <LogOut size={17} />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
