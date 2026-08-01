"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRupiah } from "@/lib/utils/date";
import type { CustomerOption } from "../queries";

// =====================================================================
//  Combobox Customer (Popover + daftar + input search, tanpa Radix):
//  ketik nama toko / kode customer / wilayah → daftar terfilter real-time.
//  Dirancang untuk RATUSAN customer: hasil dibatasi 50 baris teratas.
// =====================================================================

const MAKS_HASIL = 50;

export function CustomerCombobox({
  customers,
  value,
  onSelect,
  inputId,
}: {
  customers: CustomerOption[];
  value: string; // customerId terpilih ("" = belum)
  onSelect: (customerId: string) => void;
  inputId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const terpilih = useMemo(
    () => customers.find((c) => c.id === value) ?? null,
    [customers, value]
  );

  const hasil = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cocok = q
      ? customers.filter((c) =>
          `${c.nama} ${c.kodeCustomer} ${c.wilayah} ${c.alamat}`
            .toLowerCase()
            .includes(q)
        )
      : customers;
    return cocok.slice(0, MAKS_HASIL);
  }, [customers, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      // Fokuskan kolom cari begitu popover terbuka.
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        id={inputId}
        suppressHydrationWarning
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-left text-sm outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900",
          !terpilih && "text-slate-400"
        )}
      >
        <span className="truncate">
          {terpilih
            ? `[${terpilih.kodeCustomer}] ${terpilih.nama} — ${terpilih.wilayah}`
            : "Cari & pilih customer..."}
        </span>
        <ChevronsUpDown size={15} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <>
          {/* Backdrop: klik di luar = tutup */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="relative border-b border-slate-100">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchRef}
                suppressHydrationWarning
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "Enter") {
                    // Enter memilih hasil teratas — mempercepat input massal.
                    e.preventDefault();
                    if (hasil[0]) {
                      onSelect(hasil[0].id);
                      setOpen(false);
                    }
                  }
                }}
                placeholder="Ketik nama toko, kode, atau wilayah..."
                className="h-10 w-full pl-9 pr-3 text-sm outline-none"
              />
            </div>

            <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
              {hasil.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-slate-400">
                  Tidak ada customer yang cocok dengan &ldquo;{query}&rdquo;.
                </li>
              )}
              {hasil.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      onSelect(c.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                      c.id === value && "bg-slate-50"
                    )}
                  >
                    <Check
                      size={15}
                      className={cn(
                        "mt-0.5 shrink-0",
                        c.id === value ? "text-slate-900" : "text-transparent"
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">
                        [{c.kodeCustomer}] {c.nama}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {c.wilayah} · satpam {formatRupiah(c.defaultUangSatpam)} ·
                        gudang {formatRupiah(c.defaultUangGudang)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {customers.length > MAKS_HASIL && hasil.length === MAKS_HASIL && (
                <li className="px-3 py-2 text-center text-xs text-slate-400">
                  Menampilkan {MAKS_HASIL} teratas — ketik untuk mempersempit.
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
