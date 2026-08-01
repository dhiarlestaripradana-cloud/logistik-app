"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Fuel, Pencil, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { formatRupiah } from "@/lib/utils/date";
import { toggleMasterBbmAktif } from "../actions";
import type { MasterBbmDTO } from "../queries";
import { MasterBbmForm } from "./master-bbm-form";

export function MasterBbmTable({ data }: { data: MasterBbmDTO[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [edit, setEdit] = useState<MasterBbmDTO | null>(null);

  const buka = (row: MasterBbmDTO | null) => {
    setEdit(row);
    setFormOpen(true);
  };

  const columns: ColumnDef<MasterBbmDTO, unknown>[] = [
    {
      accessorKey: "namaProduk",
      header: "Produk BBM",
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          <Fuel size={15} className="text-blue-600" />
          {row.original.namaProduk}
        </span>
      ),
    },
    {
      accessorKey: "hargaPerLiter",
      header: "Harga / Liter",
      cell: ({ row }) => (
        <span className="font-semibold">{formatRupiah(row.original.hargaPerLiter)}</span>
      ),
    },
    {
      id: "contoh",
      header: "Contoh: Rp 100.000 =",
      cell: ({ row }) => (
        <span className="text-slate-500">
          {(100000 / row.original.hargaPerLiter).toFixed(2)} liter
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge level={row.original.isActive ? "HIJAU" : "ABU"}>
          {row.original.isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => buka(row.original)}>
            <Pencil size={13} /> Edit
          </Button>
          <form action={toggleMasterBbmAktif.bind(null, row.original.id)}>
            <ConfirmSubmitButton
              message={
                row.original.isActive
                  ? `Nonaktifkan ${row.original.namaProduk}? Produk tidak akan muncul di pilihan driver.`
                  : `Aktifkan kembali ${row.original.namaProduk}?`
              }
              variant={row.original.isActive ? "destructive" : "outline"}
            >
              {row.original.isActive ? "Nonaktifkan" : "Aktifkan"}
            </ConfirmSubmitButton>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => buka(null)}>
          <Plus size={16} /> Tambah Produk BBM
        </Button>
      </div>

      <DataTable columns={columns} data={data} searchPlaceholder="Cari produk BBM..." />

      <MasterBbmForm open={formOpen} onClose={() => setFormOpen(false)} initial={edit} />
    </div>
  );
}
