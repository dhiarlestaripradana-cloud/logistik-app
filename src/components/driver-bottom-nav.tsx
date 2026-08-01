"use client";

import { useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, History, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { logoutTanpaRedirect } from "@/modules/auth/actions";

const NAV = [
  { href: "/tugas", label: "Tugas Aktif", icon: ClipboardList },
  { href: "/riwayat", label: "Riwayat", icon: History },
];

export function DriverBottomNav() {
  const pathname = usePathname();
  const [keluarPending, startTransition] = useTransition();

  // FIX LOGOUT BENGONG (revisi UAT #2.2): sesi dihapus via server action
  // TANPA redirect server, lalu hard navigation window.location — browser
  // HP langsung berpindah mutlak, tidak menunggu router cache.
  const keluar = () =>
    startTransition(async () => {
      try {
        await logoutTanpaRedirect();
      } finally {
        window.location.href = "/login";
      }
    });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const aktif = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                aktif ? "text-blue-600" : "text-slate-400"
              )}
            >
              <Icon size={22} />
              {label}
            </Link>
          );
        })}
        <button
          type="button"
          suppressHydrationWarning
          disabled={keluarPending}
          onClick={keluar}
          className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-slate-400 disabled:opacity-60"
        >
          <LogOut size={22} />
          {keluarPending ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </nav>
  );
}
