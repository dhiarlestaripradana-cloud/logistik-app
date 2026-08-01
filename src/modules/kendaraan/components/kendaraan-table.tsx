"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { toggleKendaraanAktif } from "../actions";
import type { KendaraanDTO } from "../queries";
import { KendaraanForm } from "./kendaraan-form";

const statusBadge: Record<string, { level: "HIJAU" | "BIRU" | "MERAH" | "KUNING" | "ABU"; label: string }> = {
  TERSEDIA: { level: "HIJAU", label: "Tersedia" },
  DALAM_PERJALANAN: { level: "BIRU", label: "Dalam Perjalanan" },
  PERLU_SERVIS: { level: "MERAH", label: "Perlu Servis" },
  DALAM_SERVIS: { level: "KUNING", label: "Dalam Servis" },
  NONAKTIF: { level: "ABU", label: "Nonaktif" },
};

export function KendaraanTable({ data }: { data: KendaraanDTO[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<KendaraanDTO | null>(null);

  const columns: ColumnDef<KendaraanDTO, unknown>[] = [
    {
      accessorKey: "nomorPolisi",
      header: "No. Polisi",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-900">{row.original.nomorPolisi}</div>
          <div className="text-xs text-slate-500">
            {row.original.merk} {row.original.tipe} · {row.original.tahun}
          </div>
        </div>
      ),
    },
    { accessorKey: "jenisBbm", header: "BBM" },
    {
      accessorKey: "umurLabel",
      header: "Umur Kendaraan",
      cell: ({ row }) => <span className="whitespace-nowrap">{row.original.umurLabel}</span>,
    },
    {
      accessorKey: "odometerSaatIni",
      header: "Odometer",
      cell: ({ row }) => (
        <div>
          <div>{row.original.odometerSaatIni.toLocaleString("id-ID")} KM</div>
          <div className={`text-xs ${row.original.sisaKmServis <= 100 ? "font-semibold text-red-600" : row.original.sisaKmServis <= 500 ? "text-amber-600" : "text-slate-400"}`}>
            Sisa servis: {row.original.sisaKmServis.toLocaleString("id-ID")} KM
          </div>
        </div>
      ),
    },
    {
      id: "pajak",
      accessorFn: (r) => r.pajakAlert.label,
      header: "Pajak (STNK)",
      cell: ({ row }) => (
        <div className="space-y-1">
          <Badge level={row.original.pajakAlert.level}>{row.original.pajakAlert.label}</Badge>
          <div className="text-xs text-slate-400">{row.original.pajakBerlakuSampai}</div>
        </div>
      ),
    },
    {
      id: "kir",
      accessorFn: (r) => r.kirAlert?.label ?? "Tanpa KIR",
      header: "KIR",
      cell: ({ row }) =>
        row.original.kirAlert ? (
          <div className="space-y-1">
            <Badge level={row.original.kirAlert.level}>{row.original.kirAlert.label}</Badge>
            <div className="text-xs text-slate-400">{row.original.kirBerlakuSampai}</div>
          </div>
        ) : (
          <Badge level="ABU">Tanpa KIR</Badge>
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = statusBadge[row.original.status] ?? { level: "ABU" as const, label: row.original.status };
        return <Badge level={s.level}>{s.label}</Badge>;
      },
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(row.original);
              setFormOpen(true);
            }}
          >
            <Pencil size={13} /> Edit
          </Button>
          <form action={toggleKendaraanAktif.bind(null, row.original.id)}>
            <ConfirmSubmitButton
              message={
                row.original.status === "NONAKTIF"
                  ? `Aktifkan kembali ${row.original.nomorPolisi}?`
                  : `Nonaktifkan ${row.original.nomorPolisi}? Armada tidak akan bisa dipilih di Surat Jalan.`
              }
              variant={row.original.status === "NONAKTIF" ? "outline" : "destructive"}
            >
              {row.original.status === "NONAKTIF" ? "Aktifkan" : "Nonaktifkan"}
            </ConfirmSubmitButton>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} /> Tambah Kendaraan
        </Button>
      </div>

      <DataTable columns={columns} data={data} searchPlaceholder="Cari plat, merk, tipe..." />

      <KendaraanForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
      />
    </div>
  );
}
