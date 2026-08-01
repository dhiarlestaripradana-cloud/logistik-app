"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, FileText, Pencil, Plus, Printer } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { Badge, type BadgeLevel } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatRupiah } from "@/lib/utils/date";
import { batalkanSuratJalan, terbitkanSuratJalan } from "../actions";
import type { PerjalananListDTO } from "../queries";

export const STATUS_TRIP_BADGE: Record<string, { level: BadgeLevel; label: string }> = {
  DRAFT: { level: "ABU", label: "Draft" },
  DITUGASKAN: { level: "BIRU", label: "Ditugaskan" },
  BERJALAN: { level: "KUNING", label: "Berjalan" },
  MENUNGGU_VERIFIKASI: { level: "KUNING", label: "Menunggu Verifikasi" },
  SELESAI: { level: "HIJAU", label: "Selesai" },
  DIBATALKAN: { level: "MERAH", label: "Dibatalkan" },
};

// Tombol aksi server-action dengan konfirmasi + tampilan error (alert).
function AksiTrip({
  label,
  confirmMsg,
  variant,
  onRun,
}: {
  label: string;
  confirmMsg: string;
  variant: "outline" | "destructive";
  onRun: () => Promise<{ error?: string; success?: boolean } | null>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant={variant}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmMsg)) return;
        startTransition(async () => {
          const res = await onRun();
          if (res?.error) window.alert(res.error);
        });
      }}
    >
      {pending ? "..." : label}
    </Button>
  );
}

export function PerjalananTable({ data }: { data: PerjalananListDTO[] }) {
  const [fStatus, setFStatus] = useState("");
  const [fKendaraan, setFKendaraan] = useState("");
  const [fDriver, setFDriver] = useState("");

  const armadaOpts = useMemo(
    () => [...new Map(data.map((d) => [d.kendaraanId, d.kendaraan])).entries()],
    [data]
  );
  const driverOpts = useMemo(
    () => [...new Map(data.map((d) => [d.driverId, d.driver])).entries()],
    [data]
  );

  const filtered = useMemo(
    () =>
      data.filter(
        (d) =>
          (!fStatus || d.status === fStatus) &&
          (!fKendaraan || d.kendaraanId === fKendaraan) &&
          (!fDriver || d.driverId === fDriver)
      ),
    [data, fStatus, fKendaraan, fDriver]
  );

  const columns: ColumnDef<PerjalananListDTO, unknown>[] = [
    {
      accessorKey: "nomorSj",
      header: "No. Surat Jalan",
      cell: ({ row }) => (
        <div>
          <div className="font-mono text-xs font-semibold text-slate-900">
            {row.original.nomorSj}
          </div>
          <div className="text-xs text-slate-500">{row.original.tanggalBerangkat}</div>
        </div>
      ),
    },
    { accessorKey: "kendaraan", header: "Armada" },
    { accessorKey: "driver", header: "Driver" },
    {
      accessorKey: "jumlahTujuan",
      header: "Drop",
      cell: ({ row }) => `${row.original.jumlahTujuan} titik`,
    },
    {
      accessorKey: "uangJalan",
      header: "Uang Jalan",
      cell: ({ row }) => formatRupiah(row.original.uangJalan),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = STATUS_TRIP_BADGE[row.original.status] ?? {
          level: "ABU" as const,
          label: row.original.status,
        };
        return <Badge level={s.level}>{s.label}</Badge>;
      },
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/perjalanan/${t.id}`}>
              <Button size="sm" variant="ghost" title="Lihat detail">
                <Eye size={14} /> Detail
              </Button>
            </Link>
            <a href={`/api/pdf/surat-jalan/${t.id}`} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline" title="Cetak PDF Surat Jalan">
                <Printer size={14} /> PDF
              </Button>
            </a>
            {t.status === "DRAFT" && (
              <>
                <Link href={`/perjalanan/${t.id}/edit`}>
                  <Button size="sm" variant="outline" title="Edit draft">
                    <Pencil size={14} /> Edit
                  </Button>
                </Link>
                <AksiTrip
                  label="Terbitkan"
                  variant="outline"
                  confirmMsg={`Terbitkan ${t.nomorSj} dan tugaskan driver ${t.driver}? Armada akan terkunci DALAM PERJALANAN.`}
                  onRun={() => terbitkanSuratJalan(t.id)}
                />
              </>
            )}
            {(t.status === "DRAFT" || t.status === "DITUGASKAN") && (
              <AksiTrip
                label="Batalkan"
                variant="destructive"
                confirmMsg={`Batalkan ${t.nomorSj}? Trip batal TIDAK menyentuh Buku Kas (2-Step Settlement).`}
                onRun={() => batalkanSuratJalan(t.id)}
              />
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="w-44">
            <Select value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label="Filter status">
              <option value="">Semua Status</option>
              {Object.entries(STATUS_TRIP_BADGE).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <Select value={fKendaraan} onChange={(e) => setFKendaraan(e.target.value)} aria-label="Filter armada">
              <option value="">Semua Armada</option>
              {armadaOpts.map(([id, plat]) => (
                <option key={id} value={id}>{plat}</option>
              ))}
            </Select>
          </div>
          <div className="w-44">
            <Select value={fDriver} onChange={(e) => setFDriver(e.target.value)} aria-label="Filter driver">
              <option value="">Semua Driver</option>
              {driverOpts.map(([id, nama]) => (
                <option key={id} value={id}>{nama}</option>
              ))}
            </Select>
          </div>
        </div>
        <Link href="/perjalanan/buat">
          <Button>
            <Plus size={16} /> Buat Surat Jalan
          </Button>
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Cari nomor SJ, armada, driver..."
      />

      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <FileText size={13} />
        Trip berstatus BERJALAN tidak dapat dibatalkan — selesaikan lewat laporan driver (kebijakan Blueprint 3).
      </p>
    </div>
  );
}
