"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { toggleCustomerAktif } from "../actions";
import type { CustomerDTO } from "../queries";
import { CustomerForm } from "./customer-form";

const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

export function CustomerTable({ data }: { data: CustomerDTO[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerDTO | null>(null);

  const columns: ColumnDef<CustomerDTO, unknown>[] = [
    { accessorKey: "kodeCustomer", header: "Kode", cell: ({ row }) => (
      <span className="font-semibold text-slate-900">{row.original.kodeCustomer}</span>
    )},
    {
      accessorKey: "nama",
      header: "Nama Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nama}</div>
          <div className="max-w-[220px] truncate text-xs text-slate-400">{row.original.alamat}</div>
        </div>
      ),
    },
    { accessorKey: "wilayah", header: "Wilayah" },
    { accessorKey: "sales", header: "Sales", cell: ({ row }) => row.original.sales ?? "—" },
    {
      accessorKey: "defaultUangSatpam",
      header: "Uang Satpam",
      cell: ({ row }) => rp(row.original.defaultUangSatpam),
    },
    {
      accessorKey: "defaultUangGudang",
      header: "Uang Gudang",
      cell: ({ row }) => rp(row.original.defaultUangGudang),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge level="HIJAU">Aktif</Badge>
        ) : (
          <Badge level="ABU">Nonaktif</Badge>
        ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setEditing(row.original); setFormOpen(true); }}>
            <Pencil size={13} /> Edit
          </Button>
          <form action={toggleCustomerAktif.bind(null, row.original.id)}>
            <ConfirmSubmitButton
              message={
                row.original.isActive
                  ? `Nonaktifkan ${row.original.nama}? Customer tidak akan muncul di pilihan Surat Jalan.`
                  : `Aktifkan kembali ${row.original.nama}?`
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
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus size={16} /> Tambah Customer
        </Button>
      </div>
      <DataTable columns={columns} data={data} searchPlaceholder="Cari kode, nama, wilayah, sales..." />
      <CustomerForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
    </div>
  );
}
