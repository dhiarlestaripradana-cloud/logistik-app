"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { catatKasManual, type KasActionResult } from "../actions";
import { TIPE_KAS } from "../schema";

// =====================================================================
//  FORM KAS MANUAL — pure in/out, 6 field.
//  Pola sama dengan form Driver (pelajaran revisi UAT):
//   1) payload OBJEK langsung ke Server Action (bukan FormData)
//   2) semua field controlled → gagal simpan TIDAK mereset ketikan
//   3) fieldErrors dari server tampil TEPAT di bawah kolomnya
// =====================================================================

type FormState = {
  tanggal: string;
  tipe: string;
  pemberi: string;
  penerima: string;
  nominal: string;
  keterangan: string;
};

const KOSONG: FormState = {
  tanggal: "",
  tipe: "MASUK",
  pemberi: "",
  penerima: "",
  nominal: "",
  keterangan: "",
};

function ErrMsg({ errors, name }: { errors: Record<string, string>; name: string }) {
  const msg = errors[name];
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{msg}</p>;
}

export function KasManualForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(KOSONG);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  // Reset HANYA saat dialog dibuka — bukan saat error.
  useEffect(() => {
    if (open) {
      setForm(KOSONG);
      setErrors({});
      setErrorUmum(null);
    }
  }, [open]);

  const ubah = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const simpan = () =>
    startTransition(async () => {
      setErrors({});
      setErrorUmum(null);

      const res: KasActionResult = await catatKasManual({
        tanggal: form.tanggal,
        tipe: form.tipe,
        pemberi: form.pemberi,
        penerima: form.penerima,
        nominal: form.nominal,
        keterangan: form.keterangan,
      });

      if (res.success) {
        onClose();
        router.refresh();
        return;
      }
      // GAGAL: isian tetap utuh, error dipetakan ke kolomnya.
      setErrors(res.fieldErrors ?? {});
      setErrorUmum(res.error ?? "Gagal menyimpan transaksi kas.");
    });

  const err = (k: string) => (errors[k] ? "border-red-400" : "");

  return (
    <Dialog open={open} onClose={onClose} title="Input Kas Manual (Masuk / Keluar)">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="kas-tanggal">Tanggal *</Label>
            <Input
              id="kas-tanggal"
              type="date"
              value={form.tanggal}
              onChange={(e) => ubah({ tanggal: e.target.value })}
              className={cn(err("tanggal"))}
            />
            <ErrMsg errors={errors} name="tanggal" />
          </div>

          <div>
            <Label htmlFor="kas-tipe">Tipe *</Label>
            <Select
              id="kas-tipe"
              value={form.tipe}
              onChange={(e) => ubah({ tipe: e.target.value })}
              className={cn(err("tipe"))}
            >
              {TIPE_KAS.map((t) => (
                <option key={t} value={t}>
                  {t === "MASUK" ? "MASUK (Uang diterima)" : "KELUAR (Uang dibayarkan)"}
                </option>
              ))}
            </Select>
            <ErrMsg errors={errors} name="tipe" />
          </div>

          <div>
            <Label htmlFor="kas-pemberi">Pemberi Dana *</Label>
            <Input
              id="kas-pemberi"
              value={form.pemberi}
              onChange={(e) => ubah({ pemberi: e.target.value })}
              placeholder='cth: "Owner" / "Kas Perusahaan"'
              className={cn(err("pemberi"))}
            />
            <ErrMsg errors={errors} name="pemberi" />
          </div>

          <div>
            <Label htmlFor="kas-penerima">Penerima Dana *</Label>
            <Input
              id="kas-penerima"
              value={form.penerima}
              onChange={(e) => ubah({ penerima: e.target.value })}
              placeholder='cth: "Kas Perusahaan" / "PLN"'
              className={cn(err("penerima"))}
            />
            <ErrMsg errors={errors} name="penerima" />
          </div>

          <div className="col-span-2">
            <Label htmlFor="kas-nominal">Nominal (Rp) *</Label>
            <Input
              id="kas-nominal"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={form.nominal}
              onChange={(e) => ubah({ nominal: e.target.value })}
              placeholder="cth: 1500000"
              className={cn(err("nominal"))}
            />
            <ErrMsg errors={errors} name="nominal" />
          </div>
        </div>

        <p className="text-xs text-slate-400">
          MASUK: pemberi = pihak penyetor, penerima = &ldquo;Kas Perusahaan&rdquo;.
          KELUAR: pemberi = &ldquo;Kas Perusahaan&rdquo;, penerima = vendor/pihak yang dibayar.
        </p>

        <div>
          <Label htmlFor="kas-keterangan">Keterangan *</Label>
          <Textarea
            id="kas-keterangan"
            value={form.keterangan}
            onChange={(e) => ubah({ keterangan: e.target.value })}
            placeholder="cth: Setoran modal awal Juli / Bayar listrik kantor bulan Juli"
            className={cn(err("keterangan"))}
          />
          <ErrMsg errors={errors} name="keterangan" />
        </div>

        {errorUmum && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorUmum}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button" onClick={simpan} disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan Transaksi"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
