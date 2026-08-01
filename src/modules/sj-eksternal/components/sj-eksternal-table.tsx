"use client";

import { useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Printer } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { tandaiKembali } from "../actions";
import { KATEGORI_LABEL } from "../schema";
import type { CustomerOpsiEksternal, SjEksternalRow } from "../queries";
import { SjEksternalForm } from "./sj-eksternal-form";

export function SjEksternalClient({
  data,
  customers,
}: {
  data: SjEksternalRow[];
  customers: CustomerOpsiEksternal[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [fStatus, setFStatus] = useState("");
  const [fKategori, setFKategori] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = data.filter(
    (d) =>
      (!fStatus || d.status === fStatus) &&
      (!fKategori || d.kategoriPengirim === fKategori)
  );

  const accKembali = (row: SjEksternalRow) =>
    startTransition(async () => {
      if (!window.confirm(`Tandai ${row.nomorSj} sudah kembali (ACC)?`)) return;
      const res = await tandaiKembali(row.id);
      if (res?.error) {
        window.alert(res.error);
        return;
      }
      router.refresh();
    });

  const columns: ColumnDef<SjEksternalRow, unknown>[] = [
    {
      accessorKey: "nomorSj",
      header: "No. SJ Eksternal",
      cell: ({ row }) => (
        <div>
          <div className="font-mono text-xs font-semibold text-slate-900">
            {row.original.nomorSj}
          </div>
          <div className="text-xs text-slate-500">{row.original.tanggal}</div>
        </div>
      ),
    },
    {
      accessorKey: "kategoriPengirim",
      header: "Pengirim",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.namaPengirim}</div>
          <Badge level="BIRU" className="mt-1">
            {KATEGORI_LABEL[row.original.kategoriPengirim] ?? row.original.kategoriPengirim}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Tujuan",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.customer}</div>
          <div className="text-xs text-slate-500">
            {row.original.kodeCustomer} · {row.original.wilayah}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "keteranganBarang",
      header: "Barang",
      cell: ({ row }) => (
        <span
          className="block max-w-[220px] truncate text-sm"
          title={row.original.keteranganBarang}
        >
          {row.original.keteranganBarang}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge level={row.original.status === "DIKEMBALIKAN" ? "HIJAU" : "KUNING"}>
          {row.original.status === "DIKEMBALIKAN" ? "Dikembalikan" : "Dibawa"}
        </Badge>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <a
            href={`/api/pdf/sj-eksternal/${row.original.id}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button size="sm" variant="outline" title="Cetak PDF">
              <Printer size={14} /> PDF
            </Button>
          </a>
          {row.original.status === "DIBAWA" && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => accKembali(row.original)}
            >
              <CheckCircle2 size={14} /> Tandai Kembali (ACC)
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="w-40">
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter status">
              <option value="">Semua Status</option>
              <option value="DIBAWA">Dibawa</option>
              <option value="DIKEMBALIKAN">Dikembalikan</option>
            </Select>
          </div>
          <div className="w-52">
            <Select value={fKategori} onChange={(e) => setFKategori(e.target.value)} aria-label="Filter kategori">
              <option value="">Semua Kategori</option>
              {Object.entries(KATEGORI_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} /> Buat SJ Eksternal
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Cari nomor, pengirim, tujuan, barang..."
      />

      <SjEksternalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        customers={customers}
      />
    </div>
  );
}
