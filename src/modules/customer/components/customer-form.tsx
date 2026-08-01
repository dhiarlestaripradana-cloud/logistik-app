"use client";

import { useActionState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";
import { saveCustomer } from "../actions";
import type { CustomerDTO } from "../queries";

export function CustomerForm({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: CustomerDTO | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveCustomer,
    null
  );

  useEffect(() => {
    if (state?.success) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? `Edit Customer — ${initial.kodeCustomer}` : "Tambah Customer"}
    >
      <form action={formAction} className="space-y-4" key={initial?.id ?? "new"}>
        <input type="hidden" name="id" value={initial?.id ?? ""} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="kodeCustomer">Kode Customer *</Label>
            <Input id="kodeCustomer" name="kodeCustomer" defaultValue={initial?.kodeCustomer} placeholder="CUST-001" required />
          </div>
          <div>
            <Label htmlFor="nama">Nama Customer *</Label>
            <Input id="nama" name="nama" defaultValue={initial?.nama} placeholder="PT Maju Jaya" required />
          </div>
          <div>
            <Label htmlFor="wilayah">Wilayah *</Label>
            <Input id="wilayah" name="wilayah" defaultValue={initial?.wilayah} placeholder="Bekasi / Cikarang / Karawang" required />
          </div>
          <div>
            <Label htmlFor="sales">Sales Penanggung Jawab</Label>
            <Input id="sales" name="sales" defaultValue={initial?.sales ?? ""} placeholder="Nama sales" />
          </div>
          <div>
            <Label htmlFor="pic">PIC Customer</Label>
            <Input id="pic" name="pic" defaultValue={initial?.pic ?? ""} />
          </div>
          <div>
            <Label htmlFor="telepon">Telepon</Label>
            <Input id="telepon" name="telepon" defaultValue={initial?.telepon ?? ""} placeholder="08xxxxxxxxxx" />
          </div>
          <div>
            <Label htmlFor="defaultUangSatpam">Default Uang Satpam (Rp) *</Label>
            <Input id="defaultUangSatpam" name="defaultUangSatpam" type="number" min={0} step="any" defaultValue={initial?.defaultUangSatpam ?? 0} required />
          </div>
          <div>
            <Label htmlFor="defaultUangGudang">Default Uang Gudang (Rp) *</Label>
            <Input id="defaultUangGudang" name="defaultUangGudang" type="number" min={0} step="any" defaultValue={initial?.defaultUangGudang ?? 0} required />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Tarif default ini akan terisi otomatis saat pembuatan Surat Jalan (Sprint 2), namun tetap bisa diubah per trip.
        </p>

        <div>
          <Label htmlFor="alamat">Alamat *</Label>
          <Textarea id="alamat" name="alamat" defaultValue={initial?.alamat ?? ""} required />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
