"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CustomerOpsiEksternal } from "../queries";

// =====================================================================
//  Combobox customer untuk SJ EKSTERNAL.
//  Sengaja DIPISAH dari combobox milik modul Perjalanan: versi ini
//  TIDAK menampilkan uang satpam/gudang sama sekali (larangan spec) —
//  layar dokumen armada luar harus bersih dari angka kasbon internal.
// =====================================================================

const MAKS_HASIL = 50;

export function CustomerComboboxEksternal({
  customers,
  value,
  onSelect,
  inputId,
}: {
  customers: CustomerOpsiEksternal[];
  value: string;
  onSelect: (id: string) => void;
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
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  return (
    <div className="relative">
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
            : "Cari & pilih customer tujuan..."}
        </span>
        <ChevronsUpDown size={15} className="shrink-0 text-slate-400" />
      </button>

      {open && (
        <>
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
                  Tidak ada customer yang cocok.
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
                      {/* Hanya alamat & wilayah — TANPA nominal apa pun */}
                      <span className="block truncate text-xs text-slate-500">
                        {c.wilayah} · {c.alamat}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
