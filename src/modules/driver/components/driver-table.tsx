"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { toggleDriverAktif } from "../actions";
import type { DriverDTO } from "../queries";
import { DriverForm } from "./driver-form";

export function DriverTable({ data }: { data: DriverDTO[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DriverDTO | null>(null);

  const columns: ColumnDef<DriverDTO, unknown>[] = [
    {
      accessorKey: "nama",
      header: "Driver",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-900">{row.original.nama}</div>
          <div className="text-xs text-slate-500">@{row.original.username}</div>
        </div>
      ),
    },
    { accessorKey: "telepon", header: "Telepon", cell: ({ row }) => row.original.telepon ?? "—" },
    {
      id: "sim",
      accessorFn: (r) => r.sims.map((s) => `${s.jenisSim} ${s.noSim}`).join(" "),
      header: "SIM",
      cell: ({ row }) =>
        row.original.sims.length === 0 ? (
          <span className="text-slate-400">Belum diisi</span>
        ) : (
          <div className="space-y-1">
            {row.original.sims.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span className="text-sm font-medium">{s.jenisSim.replaceAll("_", " ")}</span>
                <span className="text-xs text-slate-500">{s.noSim}</span>
                <Badge level={s.alert.level}>
                  {s.alert.level === "HIJAU" ? `s/d ${s.masaBerlakuSim}` : s.alert.label}
                </Badge>
              </div>
            ))}
          </div>
        ),
    },
    {
      accessorKey: "isActive",
      header: "Status Akun",
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
          <form action={toggleDriverAktif.bind(null, row.original.id)}>
            <ConfirmSubmitButton
              message={
                row.original.isActive
                  ? `Nonaktifkan akun ${row.original.nama}? Driver tidak bisa login lagi, tapi seluruh riwayat perjalanannya tetap tersimpan.`
                  : `Aktifkan kembali akun ${row.original.nama}?`
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
          <Plus size={16} /> Daftarkan Driver
        </Button>
      </div>
      <DataTable columns={columns} data={data} searchPlaceholder="Cari nama, username, no. SIM..." />
      <DriverForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
    </div>
  );
}
