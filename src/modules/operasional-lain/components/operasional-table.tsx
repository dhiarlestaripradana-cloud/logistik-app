"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils/date";
import type { OperasionalDTO } from "../queries";
import { PengeluaranForm } from "./operasional-form";

export function OperasionalClient({ data }: { data: OperasionalDTO[] }) {
  const [pengeluaranOpen, setPengeluaranOpen] = useState(false);

  const columns: ColumnDef<OperasionalDTO, unknown>[] = [
    {
      accessorKey: "nomorRef",
      header: "No. Ref Kas",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600">
          {row.original.nomorRef}
        </span>
      ),
    },
    { accessorKey: "tanggal", header: "Tanggal" },
    {
      accessorKey: "keterangan",
      header: "Keterangan",
      cell: ({ row }) => (
        <span className="block max-w-[260px] truncate" title={row.original.keterangan}>
          {row.original.keterangan}
        </span>
      ),
    },
    {
      accessorKey: "jumlah",
      header: "Qty",
      cell: ({ row }) => row.original.jumlah.toLocaleString("id-ID"),
    },
    {
      accessorKey: "hargaSatuan",
      header: "Harga Satuan",
      cell: ({ row }) => formatRupiah(row.original.hargaSatuan),
    },
    {
      accessorKey: "totalHarga",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-red-600">
          − {formatRupiah(row.original.totalHarga)}
        </span>
      ),
    },
    { accessorKey: "penerima", header: "Penerima" },
    { accessorKey: "penginput", header: "Diinput oleh" },
  ];

  return (
    <div className="space-y-4">
      {/* Segregation of Duties (Revisi Final #2): halaman ini KHUSUS
          pengeluaran. Penambahan Modal Kas hanya via /kas oleh SUPER_ADMIN. */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={() => setPengeluaranOpen(true)}>
          <Plus size={16} /> Catat Pengeluaran
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Cari keterangan, penerima, no. ref..."
      />

      <PengeluaranForm
        open={pengeluaranOpen}
        onClose={() => setPengeluaranOpen(false)}
      />
    </div>
  );
}
