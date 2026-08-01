"use client";

import { useActionState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";
import { saveKendaraan } from "../actions";
import { JENIS_BBM, STATUS_KENDARAAN } from "../schema";
import type { KendaraanDTO } from "../queries";

const bbmLabel: Record<string, string> = {
  SOLAR: "Solar",
  DEXLITE: "Dexlite",
  PERTAMINA_DEX: "Pertamina Dex",
  PERTALITE: "Pertalite",
  PERTAMAX: "Pertamax",
  PERTAMAX_TURBO: "Pertamax Turbo",
  LAINNYA: "Lainnya",
};

export function KendaraanForm({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: KendaraanDTO | null;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveKendaraan,
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
      title={initial ? `Edit Kendaraan — ${initial.nomorPolisi}` : "Tambah Kendaraan"}
    >
      <form action={formAction} className="space-y-4" key={initial?.id ?? "new"}>
        <input type="hidden" name="id" value={initial?.id ?? ""} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nomorPolisi">Nomor Polisi *</Label>
            <Input
              id="nomorPolisi"
              name="nomorPolisi"
              defaultValue={initial?.nomorPolisi}
              placeholder="B 1234 XYZ"
              required
            />
          </div>
          <div>
            <Label htmlFor="jenisBbm">Jenis BBM *</Label>
            <Select id="jenisBbm" name="jenisBbm" defaultValue={initial?.jenisBbm ?? "SOLAR"} required>
              {JENIS_BBM.map((b) => (
                <option key={b} value={b}>
                  {bbmLabel[b]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="merk">Merk *</Label>
            <Input id="merk" name="merk" defaultValue={initial?.merk} placeholder="Mitsubishi" required />
          </div>
          <div>
            <Label htmlFor="tipe">Tipe *</Label>
            <Input id="tipe" name="tipe" defaultValue={initial?.tipe} placeholder="Colt Diesel FE74" required />
          </div>
          <div>
            <Label htmlFor="tahun">Tahun *</Label>
            <Input id="tahun" name="tahun" type="number" defaultValue={initial?.tahun} min={1980} max={2100} required />
          </div>
          <div>
            <Label htmlFor="tanggalPembelian">Tanggal Pembelian *</Label>
            <Input id="tanggalPembelian" name="tanggalPembelian" type="date" defaultValue={initial?.tanggalPembelian} required />
            <p className="mt-1 text-xs text-slate-400">Umur kendaraan dihitung otomatis dari tanggal ini.</p>
          </div>
          <div>
            <Label htmlFor="odometerSaatIni">Odometer Saat Ini (KM) *</Label>
            <Input id="odometerSaatIni" name="odometerSaatIni" type="number" min={0} defaultValue={initial?.odometerSaatIni ?? 0} required />
          </div>
          <div>
            <Label htmlFor="intervalServisKm">Interval Servis (KM) *</Label>
            <Input id="intervalServisKm" name="intervalServisKm" type="number" min={1} defaultValue={initial?.intervalServisKm ?? 10000} required />
          </div>
          <div>
            <Label htmlFor="kmServisTerakhir">KM Servis Terakhir *</Label>
            <Input id="kmServisTerakhir" name="kmServisTerakhir" type="number" min={0} defaultValue={initial?.kmServisTerakhir ?? 0} required />
          </div>
          <div>
            <Label htmlFor="standarKmPerLiter">Standar KM per Liter</Label>
            <Input id="standarKmPerLiter" name="standarKmPerLiter" type="number" step="any" min={0} defaultValue={initial?.standarKmPerLiter ?? 0} />
            <p className="mt-1 text-xs text-slate-400">Baseline efisiensi BBM untuk deteksi anomali.</p>
          </div>
          <div>
            <Label htmlFor="pajakBerlakuSampai">Pajak Berlaku Sampai *</Label>
            <Input id="pajakBerlakuSampai" name="pajakBerlakuSampai" type="date" defaultValue={initial?.pajakBerlakuSampai} required />
          </div>
          <div>
            <Label htmlFor="kirBerlakuSampai">KIR Berlaku Sampai (opsional)</Label>
            <Input id="kirBerlakuSampai" name="kirBerlakuSampai" type="date" defaultValue={initial?.kirBerlakuSampai ?? ""} />
            <p className="mt-1 text-xs text-slate-400">Kosongkan untuk armada tanpa KIR (motor/non-angkutan).</p>
          </div>
          {initial && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={initial.status}>
                {STATUS_KENDARAAN.map((s) => (
                  <option key={s} value={s}>
                    {s.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="catatan">Catatan</Label>
          <Textarea id="catatan" name="catatan" defaultValue={initial?.catatan ?? ""} />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
