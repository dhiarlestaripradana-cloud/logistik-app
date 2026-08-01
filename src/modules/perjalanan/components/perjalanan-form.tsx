"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils/date";
import type { ActionState } from "@/lib/action-state";
import { saveDraftSuratJalan, terbitkanSuratJalanBaru } from "../actions";
import { CustomerCombobox } from "./customer-combobox";
import type { FormOptions, PerjalananDetailDTO } from "../queries";

type TujuanRow = { customerId: string; uangSatpam: number; uangGudang: number };

export function PerjalananForm({
  options,
  initial,
}: {
  options: FormOptions;
  initial?: PerjalananDetailDTO | null;
}) {
  // PERBAIKAN BUG "Intent tidak dikenal" (React 19): dua Server Action
  // terpisah — tidak lagi bergantung pada serialisasi name/value tombol submit.
  const [stateDraft, draftAction, pendingDraft] = useActionState<ActionState, FormData>(
    saveDraftSuratJalan,
    null
  );
  const [stateTerbit, terbitAction, pendingTerbit] = useActionState<ActionState, FormData>(
    terbitkanSuratJalanBaru,
    null
  );
  const pending = pendingDraft || pendingTerbit;
  const errorMsg = stateTerbit?.error ?? stateDraft?.error;

  const [kendaraanId, setKendaraanId] = useState(initial?.kendaraanId ?? "");
  const [kmAwal, setKmAwal] = useState<number>(initial?.kmAwal ?? 0);
  const [tujuan, setTujuan] = useState<TujuanRow[]>(
    initial?.tujuan.map((t) => ({
      customerId: t.customerId,
      uangSatpam: t.uangSatpam,
      uangGudang: t.uangGudang,
    })) ?? [{ customerId: "", uangSatpam: 0, uangGudang: 0 }]
  );

  const armada = useMemo(
    () => options.kendaraan.find((k) => k.id === kendaraanId),
    [options.kendaraan, kendaraanId]
  );
  const customerById = useMemo(
    () => new Map(options.customers.map((c) => [c.id, c])),
    [options.customers]
  );

  // AUTO-FILL TARIF DINAMIS (Blueprint 2.2 + spec Sprint 2):
  // pilih customer → satpam/gudang terisi dari master, tetap editable.
  const pilihCustomer = (i: number, customerId: string) => {
    const c = customerById.get(customerId);
    setTujuan((rows) =>
      rows.map((r, idx) =>
        idx === i
          ? {
              customerId,
              uangSatpam: c?.defaultUangSatpam ?? 0,
              uangGudang: c?.defaultUangGudang ?? 0,
            }
          : r
      )
    );
  };
  const ubahNominal = (i: number, patch: Partial<TujuanRow>) =>
    setTujuan((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const tambahBaris = () =>
    setTujuan((rows) => [...rows, { customerId: "", uangSatpam: 0, uangGudang: 0 }]);
  const hapusBaris = (i: number) =>
    setTujuan((rows) => (rows.length > 1 ? rows.filter((_, idx) => idx !== i) : rows));
  const geser = (i: number, arah: -1 | 1) =>
    setTujuan((rows) => {
      const j = i + arah;
      if (j < 0 || j >= rows.length) return rows;
      const copy = [...rows];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const pilihArmada = (id: string) => {
    setKendaraanId(id);
    const k = options.kendaraan.find((x) => x.id === id);
    // Prefill KM awal dari odometer master (Blueprint 2.2) — tetap editable.
    if (k) setKmAwal(k.odometerSaatIni);
  };

  const totalKomitmen = tujuan.reduce(
    (s, t) => s + (Number(t.uangSatpam) || 0) + (Number(t.uangGudang) || 0),
    0
  );

  return (
    <form
      action={draftAction}
      onKeyDown={(e) => {
        // Cegah Enter men-submit form tanpa tombol aksi (submitter kosong).
        const tag = (e.target as HTMLElement).tagName;
        if (e.key === "Enter" && tag !== "TEXTAREA" && tag !== "BUTTON") {
          e.preventDefault();
        }
      }}
      className="max-w-3xl space-y-6"
    >
      <input type="hidden" name="id" value={initial?.id ?? ""} />
      <input type="hidden" name="tujuan" value={JSON.stringify(tujuan)} />

      {/* ── Armada & Driver ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Armada &amp; Driver
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="kendaraanId">Armada *</Label>
            <Select
              id="kendaraanId"
              name="kendaraanId"
              value={kendaraanId}
              onChange={(e) => pilihArmada(e.target.value)}
              required
            >
              <option value="">— Pilih armada —</option>
              {options.kendaraan.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                  {k.status === "PERLU_SERVIS" ? " ⚠ PERLU SERVIS" : ""}
                </option>
              ))}
            </Select>
            {armada && (
              <p className="mt-1 text-xs text-slate-500">
                Odometer: {armada.odometerSaatIni.toLocaleString("id-ID")} KM ·
                Sisa jarak ke servis: {armada.sisaKmServis.toLocaleString("id-ID")} KM
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="driverId">Driver (bebas tugas) *</Label>
            <Select id="driverId" name="driverId" defaultValue={initial?.driverId ?? ""} required>
              <option value="">— Pilih driver —</option>
              {options.drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama} ({d.username})
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-slate-400">
              Driver dengan tugas DITUGASKAN/BERJALAN tidak muncul di daftar.
            </p>
          </div>
          <div>
            <Label htmlFor="tanggalBerangkat">Tanggal Berangkat *</Label>
            <Input
              id="tanggalBerangkat"
              name="tanggalBerangkat"
              type="date"
              defaultValue={initial?.tanggalBerangkatInput ?? ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="kmAwal">KM Awal (otomatis dari odometer)</Label>
            <Input
              id="kmAwal"
              type="text"
              readOnly
              tabIndex={-1}
              value={
                kendaraanId
                  ? `${kmAwal.toLocaleString("id-ID")} KM`
                  : "— pilih armada dahulu —"
              }
              className="cursor-not-allowed bg-slate-100 text-slate-600"
            />
            <p className="mt-1 text-xs text-slate-400">
              Terkunci — server men-snapshot odometer master saat disimpan/terbit
              (tidak bisa diketik manual, anti-typo kilometer).
            </p>
          </div>
        </div>

        {/* Soft-block Blueprint 3: armada PERLU_SERVIS butuh override sadar */}
        {armada?.status === "PERLU_SERVIS" && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
            <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">
                Armada ini berstatus PERLU SERVIS (sisa {armada.sisaKmServis.toLocaleString("id-ID")} KM).
              </p>
              <label className="mt-2 flex items-center gap-2">
                <input type="checkbox" name="overrideServis" value="1" className="h-4 w-4" suppressHydrationWarning />
                Saya paham risikonya — tetap tugaskan armada ini <b>khusus rute dekat</b>.
              </label>
            </div>
          </div>
        )}
      </section>

      {/* ── Multi-Drop Repeater ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Tujuan Pengiriman (Multi-Drop) — urutan = urutan kirim
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={tambahBaris}>
            <Plus size={14} /> Tambah Tujuan
          </Button>
        </div>

        <div className="space-y-3">
          {tujuan.map((row, i) => {
            const c = customerById.get(row.customerId);
            return (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <div className="grid grid-cols-[28px_1fr_130px_130px_72px] items-end gap-2">
                  <div className="pb-2 text-center text-sm font-bold text-slate-500">{i + 1}</div>
                  <div>
                    <Label htmlFor={`cust-${i}`}>Customer *</Label>
                    <CustomerCombobox
                      inputId={`cust-${i}`}
                      customers={options.customers}
                      value={row.customerId}
                      onSelect={(id) => pilihCustomer(i, id)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`satpam-${i}`}>Uang Satpam</Label>
                    <Input
                      id={`satpam-${i}`}
                      type="number"
                      step="any"
                      min={0}
                      value={row.uangSatpam}
                      onChange={(e) => ubahNominal(i, { uangSatpam: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`gudang-${i}`}>Uang Gudang</Label>
                    <Input
                      id={`gudang-${i}`}
                      type="number"
                      step="any"
                      min={0}
                      value={row.uangGudang}
                      onChange={(e) => ubahNominal(i, { uangGudang: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex gap-1 pb-0.5">
                    <button type="button" onClick={() => geser(i, -1)} disabled={i === 0}
                      className="flex h-9 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                      title="Naikkan urutan" aria-label="Naik"><ArrowUp size={15} /></button>
                    <button type="button" onClick={() => geser(i, 1)} disabled={i === tujuan.length - 1}
                      className="flex h-9 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                      title="Turunkan urutan" aria-label="Turun"><ArrowDown size={15} /></button>
                    <button type="button" onClick={() => hapusBaris(i)} disabled={tujuan.length === 1}
                      className="flex h-9 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      title="Hapus tujuan" aria-label="Hapus"><Trash2 size={15} /></button>
                  </div>
                </div>
                {c && (
                  <p className="mt-2 pl-9 text-xs text-slate-500">
                    📍 {c.alamat} · Tarif default: satpam {formatRupiah(c.defaultUangSatpam)},
                    gudang {formatRupiah(c.defaultUangGudang)} <span className="text-slate-400">(boleh diubah utk trip ini)</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Kasbon & Ringkasan ── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Uang Jalan (Kasbon) &amp; Ringkasan
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="uangJalan">Uang Jalan Dibawa Driver (Rp) *</Label>
            <Input
              id="uangJalan"
              name="uangJalan"
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              defaultValue={initial?.uangJalan ?? ""}
              placeholder="cth: 500000"
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              TIDAK memotong Buku Kas sekarang — tercatat sebagai Dana Pending
              hingga laporan driver diverifikasi (2-Step Settlement).
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Titik drop</span>
              <span className="font-medium">{tujuan.filter((t) => t.customerId).length}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-slate-500">Komitmen satpam + gudang</span>
              <span className="font-medium">{formatRupiah(totalKomitmen)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Label htmlFor="catatan">Catatan (opsional)</Label>
          <Textarea id="catatan" name="catatan" defaultValue={initial?.catatan ?? ""}
            placeholder="cth: Muatan mudah pecah — prioritaskan drop 1 sebelum jam 10." />
        </div>
      </section>

      {errorMsg && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="flex justify-end gap-2">
        {/* Submit default form = draft */}
        <Button type="submit" variant="outline" disabled={pending}>
          {pendingDraft ? "Menyimpan..." : "Simpan sebagai Draft"}
        </Button>
        {/* formAction override = terbitkan (React 19-proof, tanpa name/value) */}
        <Button type="submit" formAction={terbitAction} disabled={pending}>
          {pendingTerbit ? "Memproses..." : "Terbitkan & Tugaskan Driver"}
        </Button>
      </div>
    </form>
  );
}
