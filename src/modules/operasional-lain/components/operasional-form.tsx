"use client";

import { useActionState, useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";
import { catatModalMasuk, catatPengeluaranOperasional } from "../actions";

const rp = (n: number) => "Rp " + n.toLocaleString("id-ID");

export function PengeluaranForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    catatPengeluaranOperasional,
    null
  );
  // Preview total real-time di klien; nilai FINAL tetap dihitung server.
  const [jumlah, setJumlah] = useState(1);
  const [hargaSatuan, setHargaSatuan] = useState(0);
  const total = Math.round(jumlah * hargaSatuan * 100) / 100;

  useEffect(() => {
    if (state?.success) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onClose={onClose} title="Catat Pengeluaran Kantor">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tanggal">Tanggal *</Label>
            <Input id="tanggal" name="tanggal" type="date" required />
          </div>
          <div>
            <Label htmlFor="penerima">Penerima Dana *</Label>
            <Input id="penerima" name="penerima" placeholder="Toko ATK Sinar / PLN / Bengkel..." required />
          </div>
          <div>
            <Label htmlFor="jumlah">Jumlah (Qty) *</Label>
            <Input
              id="jumlah"
              name="jumlah"
              type="number"
              step="any"
              min="0.01"
              defaultValue={1}
              onChange={(e) => setJumlah(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
          <div>
            <Label htmlFor="hargaSatuan">Harga Satuan (Rp) *</Label>
            <Input
              id="hargaSatuan"
              name="hargaSatuan"
              type="number"
              step="any"
              min="0.01"
              onChange={(e) => setHargaSatuan(parseFloat(e.target.value) || 0)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="keterangan">Keterangan *</Label>
          <Textarea id="keterangan" name="keterangan" placeholder="Contoh: Beli kertas A4 2 rim untuk kantor" required />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Total Harga (Qty × Harga Satuan)</span>
          <span className="text-lg font-semibold text-slate-900">{rp(total)}</span>
        </div>
        <p className="text-xs text-slate-400">
          Saat disimpan, sistem otomatis membuat entri KELUAR di Buku Kas Umum dan memotong saldo — dalam satu transaksi atomik.
        </p>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Memproses..." : "Simpan & Potong Kas"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function ModalMasukForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    catatModalMasuk,
    null
  );

  useEffect(() => {
    if (state?.success) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onClose={onClose} title="Tambah Modal Kas (Pemasukan)">
      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tanggal-modal">Tanggal *</Label>
            <Input id="tanggal-modal" name="tanggal" type="date" required />
          </div>
          <div>
            <Label htmlFor="nominal">Nominal (Rp) *</Label>
            <Input id="nominal" name="nominal" type="number" min="1" step="any" required />
          </div>
        </div>
        <div>
          <Label htmlFor="pemberi">Pemberi Dana *</Label>
          <Input id="pemberi" name="pemberi" placeholder="Nama pemilik / sumber dana" required />
        </div>
        <div>
          <Label htmlFor="keterangan-modal">Keterangan *</Label>
          <Textarea id="keterangan-modal" name="keterangan" placeholder="Contoh: Setoran modal operasional Juli 2026" required />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Memproses..." : "Simpan Pemasukan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
