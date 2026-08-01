"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils/date";
import type { ArusKasDTO } from "../queries";
import { KasManualForm } from "./kas-form";

const sumberLabel: Record<ArusKasDTO["sumber"], { text: string; level: "ABU" | "BIRU" | "KUNING" }> = {
  MANUAL: { text: "Manual", level: "ABU" },
  OPERASIONAL: { text: "Operasional Kantor", level: "BIRU" },
  TRIP: { text: "Settlement Trip", level: "KUNING" },
};

export function KasClient({ data }: { data: ArusKasDTO[] }) {
  const [formOpen, setFormOpen] = useState(false);

  const columns: ColumnDef<ArusKasDTO, unknown>[] = [
    {
      accessorKey: "nomorRef",
      header: "No. Ref",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600">{row.original.nomorRef}</span>
      ),
    },
    { accessorKey: "tanggal", header: "Tanggal" },
    {
      accessorKey: "keterangan",
      header: "Keterangan",
      cell: ({ row }) => (
        <div className="max-w-[240px]">
          <div className="truncate" title={row.original.keterangan}>
            {row.original.keterangan}
          </div>
          <Badge level={sumberLabel[row.original.sumber].level} className="mt-1">
            {sumberLabel[row.original.sumber].text}
          </Badge>
        </div>
      ),
    },
    {
      id: "pihak",
      accessorFn: (r) => `${r.pemberi} ${r.penerima}`,
      header: "Pemberi → Penerima",
      cell: ({ row }) => (
        <div className="text-xs">
          <div className="text-slate-500">{row.original.pemberi}</div>
          <div className="font-medium text-slate-700">→ {row.original.penerima}</div>
        </div>
      ),
    },
    {
      id: "masuk",
      header: "Masuk (Debit)",
      cell: ({ row }) =>
        row.original.tipe === "MASUK" ? (
          <span className="font-semibold text-emerald-600">
            {formatRupiah(row.original.nominal)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      id: "keluar",
      header: "Keluar (Kredit)",
      cell: ({ row }) =>
        row.original.tipe === "KELUAR" ? (
          <span className="font-semibold text-red-600">
            {formatRupiah(row.original.nominal)}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      accessorKey: "saldoSesudah",
      header: "Saldo",
      cell: ({ row }) => (
        <span className="font-medium">{formatRupiah(row.original.saldoSesudah)}</span>
      ),
    },
    { accessorKey: "dibuatOleh", header: "Dicatat oleh" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Input Kas Manual
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Cari no. ref, keterangan, pemberi, penerima..."
      />

      <KasManualForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
