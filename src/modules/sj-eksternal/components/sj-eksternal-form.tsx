"use client";

import { useActionState, useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";
import { buatSjEksternal } from "../actions";
import { KATEGORI_LABEL, KATEGORI_PENGIRIM } from "../schema";
import type { CustomerOpsiEksternal } from "../queries";
import { CustomerComboboxEksternal } from "./customer-combobox-eksternal";

export function SjEksternalForm({
  open,
  onClose,
  customers,
}: {
  open: boolean;
  onClose: () => void;
  customers: CustomerOpsiEksternal[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    buatSjEksternal,
    null
  );
  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    if (open) setCustomerId("");
  }, [open]);

  useEffect(() => {
    if (state?.success) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onClose={onClose} title="Buat Surat Jalan Eksternal">
      <form action={formAction} className="space-y-4">
        {/* customerId dari combobox — dikirim lewat hidden field */}
        <input type="hidden" name="customerId" value={customerId} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tanggal">Tanggal *</Label>
            <Input id="tanggal" name="tanggal" type="date" required />
          </div>
          <div>
            <Label htmlFor="kategoriPengirim">Kategori Pengirim *</Label>
            <Select id="kategoriPengirim" name="kategoriPengirim" defaultValue="SALES" required>
              {KATEGORI_PENGIRIM.map((k) => (
                <option key={k} value={k}>{KATEGORI_LABEL[k]}</option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="namaPengirim">Nama / Plat Pengirim *</Label>
          <Input
            id="namaPengirim"
            name="namaPengirim"
            placeholder="cth: Andi (Sales) / B 6789 XYZ (Gojek) / PT Kurir Cepat"
            required
          />
        </div>

        <div>
          <Label htmlFor="customerEks">Customer Tujuan *</Label>
          <CustomerComboboxEksternal
            inputId="customerEks"
            customers={customers}
            value={customerId}
            onSelect={setCustomerId}
          />
        </div>

        <div>
          <Label htmlFor="keteranganBarang">Keterangan Barang *</Label>
          <Textarea
            id="keteranganBarang"
            name="keteranganBarang"
            placeholder="cth: 5 dus Mie Instan, 2 karton Sabun Cair 1L"
            required
          />
        </div>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Dokumen ini murni surat pengantar barang — <b>tidak ada</b> uang jalan,
          uang satpam, maupun uang gudang, dan tidak memengaruhi Buku Kas.
        </p>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan & Terbitkan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
