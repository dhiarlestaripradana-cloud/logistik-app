"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { saveDriver, type DriverActionResult } from "../actions";
import { JENIS_KELAMIN, JENIS_SIM, type DriverPayload } from "../schema";
import type { DriverDTO } from "../queries";

// =====================================================================
//  REVISI UAT SPRINT 4 #3 — arsitektur form baru:
//  1) SEMUA field controlled state → error/refresh TIDAK mereset ketikan
//     (React 19 mereset field uncontrolled setelah form action; di sini
//     tidak ada form action — submit via onClick + payload objek).
//  2) Payload dikirim sebagai OBJEK langsung ke Server Action —
//     array `sims` tiba utuh, tanpa serialisasi FormData sama sekali.
//  3) fieldErrors dari server dipetakan TEPAT ke bawah kolomnya
//     (kunci path Zod: "username", "sims.0.jenisSim", dst).
// =====================================================================

const jkLabel: Record<string, string> = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
};

type SimRow = { noSim: string; jenisSim: string; masaBerlakuSim: string };

type FormState = {
  nama: string;
  username: string;
  password: string;
  telepon: string;
  jenisKelamin: string;
  tempatLahir: string;
  tanggalLahir: string;
  alamat: string;
  sims: SimRow[];
};

const KOSONG: FormState = {
  nama: "",
  username: "",
  password: "",
  telepon: "",
  jenisKelamin: "LAKI_LAKI",
  tempatLahir: "",
  tanggalLahir: "",
  alamat: "",
  sims: [],
};

function dariInitial(initial: DriverDTO | null): FormState {
  if (!initial) return KOSONG;
  return {
    nama: initial.nama,
    username: initial.username,
    password: "",
    telepon: initial.telepon ?? "",
    jenisKelamin: initial.jenisKelamin ?? "LAKI_LAKI",
    tempatLahir: initial.tempatLahir ?? "",
    tanggalLahir: initial.tanggalLahir ?? "",
    alamat: initial.alamat ?? "",
    sims: initial.sims.map((s) => ({
      noSim: s.noSim,
      jenisSim: s.jenisSim,
      masaBerlakuSim: s.masaBerlakuSim,
    })),
  };
}

// Pesan error kecil di bawah kolom — inti revisi #3.3.
function ErrMsg({ errors, name }: { errors: Record<string, string>; name: string }) {
  const msg = errors[name];
  if (!msg) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{msg}</p>;
}

export function DriverForm({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial: DriverDTO | null;
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(KOSONG);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorUmum, setErrorUmum] = useState<string | null>(null);

  // Reset state HANYA saat dialog dibuka / target edit berganti —
  // BUKAN saat error (ketikan admin dipertahankan, revisi #3.2).
  useEffect(() => {
    if (open) {
      setForm(dariInitial(initial));
      setErrors({});
      setErrorUmum(null);
    }
  }, [initial, open]);

  const ubah = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
  };
  const ubahSim = (i: number, patch: Partial<SimRow>) =>
    setForm((f) => ({
      ...f,
      sims: f.sims.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    }));

  const simpan = () =>
    startTransition(async () => {
      setErrors({});
      setErrorUmum(null);

      const payload: DriverPayload = {
        id: initial?.id || undefined,
        nama: form.nama,
        username: form.username,
        password: form.password || undefined,
        telepon: form.telepon || undefined,
        jenisKelamin: form.jenisKelamin,
        tempatLahir: form.tempatLahir || undefined,
        tanggalLahir: form.tanggalLahir || undefined,
        alamat: form.alamat || undefined,
        sims: form.sims,
      };

      // Objek dikirim langsung — bukan FormData (revisi #3.1).
      const res: DriverActionResult = await saveDriver(payload);

      if (res.success) {
        onClose();
        return;
      }
      // GAGAL: state form TIDAK disentuh — semua ketikan tetap utuh (#3.2).
      setErrors(res.fieldErrors ?? {});
      setErrorUmum(res.error ?? "Gagal menyimpan.");
    });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? `Edit Driver — ${initial.nama}` : "Daftarkan Driver Baru"}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Akun Login
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="username">Username *</Label>
              {/* readOnly (BUKAN disabled!) saat edit: nilai tetap ada di state
                  & payload — inilah akar bug "Required" yang lama. */}
              <Input
                id="username"
                value={form.username}
                onChange={(e) => ubah({ username: e.target.value })}
                placeholder="budi.s"
                readOnly={!!initial}
                className={cn(initial && "cursor-not-allowed bg-slate-100 text-slate-500")}
              />
              {initial && (
                <p className="mt-1 text-xs text-slate-400">Username tidak dapat diubah.</p>
              )}
              <ErrMsg errors={errors} name="username" />
            </div>
            <div>
              <Label htmlFor="password">
                {initial ? "Password Baru (opsional)" : "Password *"}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => ubah({ password: e.target.value })}
                placeholder={initial ? "Kosongkan jika tidak diganti" : "Minimal 6 karakter"}
              />
              <ErrMsg errors={errors} name="password" />
            </div>
            <div>
              <Label htmlFor="telepon">Telepon</Label>
              <Input
                id="telepon"
                value={form.telepon}
                onChange={(e) => ubah({ telepon: e.target.value })}
                placeholder="08xxxxxxxxxx"
              />
              <ErrMsg errors={errors} name="telepon" />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Biodata
          </legend>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nama">Nama Lengkap *</Label>
              <Input id="nama" value={form.nama} onChange={(e) => ubah({ nama: e.target.value })} />
              <ErrMsg errors={errors} name="nama" />
            </div>
            <div>
              <Label htmlFor="jenisKelamin">Jenis Kelamin *</Label>
              <Select
                id="jenisKelamin"
                value={form.jenisKelamin}
                onChange={(e) => ubah({ jenisKelamin: e.target.value })}
              >
                {JENIS_KELAMIN.map((jk) => (
                  <option key={jk} value={jk}>{jkLabel[jk]}</option>
                ))}
              </Select>
              <ErrMsg errors={errors} name="jenisKelamin" />
            </div>
            <div>
              <Label htmlFor="tempatLahir">Tempat Lahir</Label>
              <Input id="tempatLahir" value={form.tempatLahir} onChange={(e) => ubah({ tempatLahir: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
              <Input id="tanggalLahir" type="date" value={form.tanggalLahir} onChange={(e) => ubah({ tanggalLahir: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="alamat">Alamat</Label>
            <Textarea id="alamat" value={form.alamat} onChange={(e) => ubah({ alamat: e.target.value })} />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Data SIM — bisa lebih dari satu
          </legend>
          <ErrMsg errors={errors} name="sims" />

          {form.sims.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-center text-sm text-slate-400">
              Belum ada SIM. Klik &ldquo;Tambah SIM&rdquo; untuk menambahkan.
            </p>
          )}

          {form.sims.map((row, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
            >
              <div className="grid grid-cols-[1fr_130px_150px_36px] items-start gap-2">
                <div>
                  <Label htmlFor={`noSim-${i}`}>Nomor SIM *</Label>
                  <Input
                    id={`noSim-${i}`}
                    value={row.noSim}
                    onChange={(e) => ubahSim(i, { noSim: e.target.value })}
                    placeholder="1234-5678-9012"
                    className={cn(errors[`sims.${i}.noSim`] && "border-red-400")}
                  />
                  <ErrMsg errors={errors} name={`sims.${i}.noSim`} />
                </div>
                <div>
                  <Label htmlFor={`jenisSim-${i}`}>Jenis *</Label>
                  <Select
                    id={`jenisSim-${i}`}
                    value={row.jenisSim}
                    onChange={(e) => ubahSim(i, { jenisSim: e.target.value })}
                    className={cn(errors[`sims.${i}.jenisSim`] && "border-red-400")}
                  >
                    <option value="">— Pilih —</option>
                    {JENIS_SIM.map((s) => (
                      <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                    ))}
                  </Select>
                  <ErrMsg errors={errors} name={`sims.${i}.jenisSim`} />
                </div>
                <div>
                  <Label htmlFor={`masaSim-${i}`}>Berlaku s/d *</Label>
                  <Input
                    id={`masaSim-${i}`}
                    type="date"
                    value={row.masaBerlakuSim}
                    onChange={(e) => ubahSim(i, { masaBerlakuSim: e.target.value })}
                    className={cn(errors[`sims.${i}.masaBerlakuSim`] && "border-red-400")}
                  />
                  <ErrMsg errors={errors} name={`sims.${i}.masaBerlakuSim`} />
                </div>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() =>
                    setForm((f) => ({ ...f, sims: f.sims.filter((_, idx) => idx !== i) }))
                  }
                  className="mt-6 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus baris SIM"
                  title="Hapus SIM ini"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((f) => ({
                ...f,
                sims: [...f.sims, { noSim: "", jenisSim: "", masaBerlakuSim: "" }],
              }))
            }
          >
            <Plus size={14} /> Tambah SIM
          </Button>
        </fieldset>

        {errorUmum && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorUmum}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
          <Button type="button" onClick={simpan} disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
