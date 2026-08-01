"use client";

import { useActionState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";
import { saveMasterBbm } from "../actions";
import type { MasterBbmDTO } from "../queries";

export function MasterBbmForm({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: MasterBbmDTO | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveMasterBbm,
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
      title={initial ? `Edit Harga — ${initial.namaProduk}` : "Tambah Produk BBM"}
    >
      <form action={formAction} className="space-y-4" key={initial?.id ?? "new"}>
        <input type="hidden" name="id" value={initial?.id ?? ""} />
        <input type="hidden" name="isActive" value={initial ? (initial.isActive ? "1" : "0") : "1"} />

        <div>
          <Label htmlFor="namaProduk">Nama Produk BBM *</Label>
          <Input
            id="namaProduk"
            name="namaProduk"
            defaultValue={initial?.namaProduk}
            placeholder="cth: Biosolar (B35) / Dexlite / Shell V-Power"
            required
          />
        </div>

        <div>
          <Label htmlFor="hargaPerLiter">Harga per Liter (Rp) *</Label>
          <Input
            id="hargaPerLiter"
            name="hargaPerLiter"
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            defaultValue={initial?.hargaPerLiter}
            placeholder="cth: 6800"
            required
          />
          <p className="mt-1 text-xs text-slate-400">
            Harga ini dipakai menghitung liter otomatis di laporan driver
            (liter = nominal ÷ harga per liter).
          </p>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
