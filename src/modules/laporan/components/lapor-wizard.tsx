"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CloudOff, Fuel, Plus, Send, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/utils/date";
import { ambilDraft, hapusDraft, simpanDraft } from "@/lib/utils/draft-db";
import { cn } from "@/lib/utils/cn";
import { submitLaporan } from "../actions";
import type { TugasAktifDTO } from "../queries";
import type { MasterBbmDTO } from "@/modules/master-bbm/queries";
import { FotoInput } from "./foto-input";

// =====================================================================
//  WIZARD LAPORAN PASCAKIRIMAN — 7 Parameter Wajib (Blueprint 5.2)
//  Langkah: ① KM Akhir → ② BBM → ③ Biaya Lapangan → ④ Ringkasan & Kirim
//  Draft (termasuk Blob foto) tersimpan otomatis ke IndexedDB per trip —
//  sinyal hilang / HP mati = inputan aman.
// =====================================================================

type BbmRow = {
  bbmId: string;      // produk dari Master BBM
  nominal: string;    // nominal pembelian (Rp) — satu-satunya yang diketik driver
  liter: string;      // AUTO-CALCULATE, read-only (nominal ÷ harga per liter)
  foto: Blob | null;
};

type Draft = {
  step: number;
  kmAkhir: string;
  bbm: BbmRow[];
  pakOgah: string;
  parkir: Record<string, string>; // tujuanId → nominal
  steamNominal: string;
  steamFoto: Blob | null;
  servisNominal: string;
  servisKeterangan: string;
  servisFoto: Blob | null;
  lainnyaNominal: string;
  lainnyaKeterangan: string;
  catatan: string;
};

const DRAFT_KOSONG: Draft = {
  step: 0,
  kmAkhir: "",
  bbm: [],
  pakOgah: "",
  parkir: {},
  steamNominal: "",
  steamFoto: null,
  servisNominal: "",
  servisKeterangan: "",
  servisFoto: null,
  lainnyaNominal: "",
  lainnyaKeterangan: "",
  catatan: "",
};

const JUDUL_LANGKAH = ["KM Akhir", "Pembelian BBM", "Biaya Lapangan", "Ringkasan"];

const num = (s: string) => {
  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
};

// Liter = nominal ÷ harga per liter (2 desimal). Dihitung ulang setiap
// nominal / produk berubah → field liter murni turunan, tak bisa diketik.
const hitungLiter = (nominal: string, harga?: number) =>
  harga && harga > 0 && num(nominal) > 0
    ? (num(nominal) / harga).toFixed(2)
    : "";

export function LaporWizard({
  tugas,
  masterBbm,
}: {
  tugas: TugasAktifDTO;
  masterBbm: MasterBbmDTO[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>(DRAFT_KOSONG);
  const [siap, setSiap] = useState(false); // draft selesai dimuat
  const [error, setError] = useState<string | null>(null);
  const [draftDipulihkan, setDraftDipulihkan] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Muat draft offline saat halaman dibuka ----
  useEffect(() => {
    (async () => {
      const tersimpan = await ambilDraft<Draft>(tugas.id);
      if (tersimpan) {
        // Draft dari versi sebelum Master BBM tidak punya `bbmId` —
        // normalkan agar input tetap controlled; driver tinggal memilih
        // jenis BBM-nya dan liter langsung terhitung ulang.
        const bbm = (tersimpan.bbm ?? []).map((b) => ({
          bbmId: b.bbmId ?? "",
          nominal: b.nominal ?? "",
          liter: b.liter ?? "",
          foto: b.foto ?? null,
        }));
        setDraft({ ...DRAFT_KOSONG, ...tersimpan, bbm });
        setDraftDipulihkan(true);
      }
      setSiap(true);
    })();
  }, [tugas.id]);

  // ---- Autosave draft (debounce 600ms) — foto Blob ikut tersimpan ----
  useEffect(() => {
    if (!siap) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => simpanDraft(tugas.id, draft), 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, siap, tugas.id]);

  const ubah = (patch: Partial<Draft>) => {
    setError(null);
    setDraft((d) => ({ ...d, ...patch }));
  };

  const totalBiaya = useMemo(() => {
    const bbm = draft.bbm.reduce((s, b) => s + num(b.nominal), 0);
    const parkir = Object.values(draft.parkir).reduce((s, v) => s + num(v), 0);
    return (
      bbm + parkir + num(draft.pakOgah) + num(draft.steamNominal) +
      num(draft.servisNominal) + num(draft.lainnyaNominal)
    );
  }, [draft]);
  const selisih = tugas.uangJalan - totalBiaya;

  // ---- Validasi per langkah (pesan jelas, sesuai spec) ----
  const validasiLangkah = (s: number): string | null => {
    if (s === 0) {
      const km = Number(draft.kmAkhir);
      if (!draft.kmAkhir || !Number.isInteger(km))
        return "KM Akhir wajib diisi angka bulat.";
      if (km <= tugas.kmAwal)
        return `KM Akhir harus LEBIH BESAR dari KM Awal (${tugas.kmAwal.toLocaleString("id-ID")} KM).`;
    }
    if (s === 1) {
      for (let i = 0; i < draft.bbm.length; i++) {
        const b = draft.bbm[i];
        if (!b.bbmId) return `Jenis BBM #${i + 1} wajib dipilih.`;
        if (num(b.nominal) <= 0) return `Nominal BBM #${i + 1} harus lebih dari 0.`;
        if (num(b.liter) <= 0)
          return `Liter BBM #${i + 1} belum terhitung — periksa nominal & jenis BBM.`;
        if (!b.foto) return `Foto struk BBM #${i + 1} wajib diunggah.`;
      }
    }
    if (s === 2) {
      if (num(draft.steamNominal) > 0 && !draft.steamFoto)
        return "Foto bukti wajib untuk biaya Steam/Cuci.";
      if (num(draft.servisNominal) > 0) {
        if (draft.servisKeterangan.trim().length < 3)
          return "Catatan perbaikan wajib untuk servis darurat.";
        if (!draft.servisFoto) return "Foto nota wajib untuk servis darurat.";
      }
      if (num(draft.lainnyaNominal) > 0 && draft.lainnyaKeterangan.trim().length < 3)
        return "Deskripsi wajib diisi untuk Keterangan Lain.";
    }
    return null;
  };

  const lanjut = () => {
    const pesan = validasiLangkah(draft.step);
    if (pesan) return setError(pesan);
    ubah({ step: Math.min(draft.step + 1, 3) });
    window.scrollTo({ top: 0 });
  };
  const mundur = () => {
    ubah({ step: Math.max(draft.step - 1, 0) });
    window.scrollTo({ top: 0 });
  };

  // ---- Kirim laporan ----
  const kirim = () =>
    startTransition(async () => {
      for (let s = 0; s <= 2; s++) {
        const pesan = validasiLangkah(s);
        if (pesan) {
          setError(pesan);
          ubah({ step: s });
          return;
        }
      }

      const fd = new FormData();
      fd.set("tripId", tugas.id);
      fd.set("kmAkhir", draft.kmAkhir);
      fd.set("pakOgah", draft.pakOgah || "0");
      fd.set(
        "bbmMeta",
        JSON.stringify(
          draft.bbm.map((b) => ({ bbmId: b.bbmId, nominal: b.nominal, liter: b.liter }))
        )
      );
      draft.bbm.forEach((b, i) => {
        if (b.foto) fd.set(`bbmFoto_${i}`, new File([b.foto], `bbm-${i}.jpg`, { type: "image/jpeg" }));
      });
      fd.set(
        "parkirMeta",
        JSON.stringify(
          Object.entries(draft.parkir).map(([tujuanPerjalananId, nominal]) => ({
            tujuanPerjalananId,
            nominal: nominal || "0",
          }))
        )
      );
      fd.set("steamNominal", draft.steamNominal || "0");
      if (draft.steamFoto)
        fd.set("steamFoto", new File([draft.steamFoto], "steam.jpg", { type: "image/jpeg" }));
      fd.set("servisNominal", draft.servisNominal || "0");
      fd.set("servisKeterangan", draft.servisKeterangan);
      if (draft.servisFoto)
        fd.set("servisFoto", new File([draft.servisFoto], "servis.jpg", { type: "image/jpeg" }));
      fd.set("lainnyaNominal", draft.lainnyaNominal || "0");
      fd.set("lainnyaKeterangan", draft.lainnyaKeterangan);
      fd.set("catatan", draft.catatan);

      const res = await submitLaporan(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      await hapusDraft(tugas.id); // sukses → draft offline dibersihkan
      router.push("/tugas?terkirim=1");
    });

  if (!siap) {
    return <p className="py-10 text-center text-sm text-slate-400">Memuat draft...</p>;
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Indikator langkah */}
      <div className="flex items-center gap-1.5">
        {JUDUL_LANGKAH.map((j, i) => (
          <div key={j} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full",
                i <= draft.step ? "bg-blue-600" : "bg-slate-200"
              )}
            />
            <div
              className={cn(
                "mt-1 text-center text-[10px] font-medium",
                i === draft.step ? "text-blue-700" : "text-slate-400"
              )}
            >
              {i + 1}. {j}
            </div>
          </div>
        ))}
      </div>

      {draftDipulihkan && (
        <p className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <CloudOff size={14} /> Draft sebelumnya dipulihkan dari penyimpanan HP — lanjutkan mengisi.
        </p>
      )}

      {/* ── LANGKAH 1: KM AKHIR ── */}
      {draft.step === 0 && (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <span className="text-slate-500">KM Awal (terkunci): </span>
            <span className="font-bold">{tugas.kmAwal.toLocaleString("id-ID")} KM</span>
          </div>
          <div>
            <Label htmlFor="kmAkhir" className="text-base">
              KM Akhir di odometer sekarang *
            </Label>
            <Input
              id="kmAkhir"
              type="number"
              inputMode="numeric"
              step="any"
              min={tugas.kmAwal + 1}
              value={draft.kmAkhir}
              onChange={(e) => ubah({ kmAkhir: e.target.value })}
              placeholder={`> ${tugas.kmAwal.toLocaleString("id-ID")}`}
              className="h-14 text-lg font-semibold"
            />
            {num(draft.kmAkhir) > tugas.kmAwal && (
              <p className="mt-1 text-xs text-emerald-600">
                Jarak tempuh: {(num(draft.kmAkhir) - tugas.kmAwal).toLocaleString("id-ID")} KM
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── LANGKAH 2: BBM (repeater + foto wajib) ── */}
      {draft.step === 1 && (
        <section className="space-y-3">
          {draft.bbm.length === 0 && (
            <p className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-400">
              Tidak isi BBM di trip ini? Langsung lanjut. Kalau isi, ketuk tombol di bawah.
            </p>
          )}
          {draft.bbm.map((b, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Fuel size={16} className="text-blue-600" /> Pembelian BBM #{i + 1}
                </span>
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => ubah({ bbm: draft.bbm.filter((_, x) => x !== i) })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 active:bg-red-50 active:text-red-600"
                  aria-label="Hapus pembelian BBM"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div>
                <Label htmlFor={`bbmJenis-${i}`}>Jenis BBM *</Label>
                <Select
                  id={`bbmJenis-${i}`}
                  value={b.bbmId}
                  onChange={(e) => {
                    const bbmId = e.target.value;
                    const harga = masterBbm.find((m) => m.id === bbmId)?.hargaPerLiter;
                    ubah({
                      bbm: draft.bbm.map((x, y) =>
                        y === i
                          ? { ...x, bbmId, liter: hitungLiter(x.nominal, harga) }
                          : x
                      ),
                    });
                  }}
                  className="h-12"
                >
                  <option value="">— Pilih jenis BBM —</option>
                  {masterBbm.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.namaProduk} — {formatRupiah(m.hargaPerLiter)}/L
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`bbmNominal-${i}`}>Nominal Pembelian (Rp) *</Label>
                  <Input
                    id={`bbmNominal-${i}`}
                    type="number" inputMode="decimal" step="any" min={0}
                    value={b.nominal}
                    onChange={(e) => {
                      const nominal = e.target.value;
                      const harga = masterBbm.find((m) => m.id === b.bbmId)?.hargaPerLiter;
                      ubah({
                        bbm: draft.bbm.map((x, y) =>
                          y === i ? { ...x, nominal, liter: hitungLiter(nominal, harga) } : x
                        ),
                      });
                    }}
                    className="h-12"
                  />
                </div>
                <div>
                  <Label htmlFor={`bbmLiter-${i}`}>Total Liter (otomatis)</Label>
                  <Input
                    id={`bbmLiter-${i}`}
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={b.liter ? `${b.liter} L` : "—"}
                    className="h-12 cursor-not-allowed bg-slate-100 font-semibold text-slate-600"
                  />
                </div>
              </div>
              {b.bbmId && num(b.nominal) > 0 && (
                <p className="text-xs text-slate-500">
                  {formatRupiah(num(b.nominal))} ÷{" "}
                  {formatRupiah(masterBbm.find((m) => m.id === b.bbmId)?.hargaPerLiter ?? 0)}/L
                  = <b>{b.liter} liter</b>
                </p>
              )}
              <FotoInput
                label="Foto struk BBM"
                wajib
                value={b.foto}
                onChange={(foto) =>
                  ubah({ bbm: draft.bbm.map((x, y) => (y === i ? { ...x, foto } : x)) })
                }
              />
            </div>
          ))}
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => ubah({ bbm: [...draft.bbm, { bbmId: "", nominal: "", liter: "", foto: null }] })}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 text-sm font-semibold text-blue-700"
          >
            <Plus size={17} /> Tambah Pembelian BBM
          </button>
        </section>
      )}

      {/* ── LANGKAH 3: BIAYA LAPANGAN ── */}
      {draft.step === 2 && (
        <section className="space-y-3">
          {/* (4) Parkir per customer — daftar dinamis sesuai tujuan trip */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-700">Parkir per Customer</h3>
            {tugas.tujuan.map((t) => (
              <div key={t.id}>
                <Label htmlFor={`parkir-${t.id}`}>
                  {t.urutan}. {t.namaCustomer}
                  <span className="ml-1 font-normal text-slate-400">({t.wilayah})</span>
                </Label>
                <Input
                  id={`parkir-${t.id}`}
                  type="number" inputMode="decimal" step="any" min={0}
                  value={draft.parkir[t.id] ?? ""}
                  onChange={(e) => ubah({ parkir: { ...draft.parkir, [t.id]: e.target.value } })}
                  placeholder="0 jika gratis"
                  className="h-12"
                />
              </div>
            ))}
          </div>

          {/* (3) Pak Ogah */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Label htmlFor="pakOgah">Pak Ogah / koordinasi jalanan (Rp)</Label>
            <Input
              id="pakOgah" type="number" inputMode="decimal" step="any" min={0}
              value={draft.pakOgah}
              onChange={(e) => ubah({ pakOgah: e.target.value })}
              placeholder="0 jika tidak ada" className="h-12"
            />
          </div>

          {/* (5) Steam + foto wajib */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <Label htmlFor="steam">Steam / Cuci mobil (Rp)</Label>
            <Input
              id="steam" type="number" inputMode="decimal" step="any" min={0}
              value={draft.steamNominal}
              onChange={(e) => ubah({ steamNominal: e.target.value })}
              placeholder="0 jika tidak ada" className="h-12"
            />
            {num(draft.steamNominal) > 0 && (
              <FotoInput label="Foto bukti steam" wajib value={draft.steamFoto}
                onChange={(steamFoto) => ubah({ steamFoto })} />
            )}
          </div>

          {/* (6) Servis darurat + catatan + foto wajib */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <Label htmlFor="servis">Servis darurat/kecil di jalan (Rp)</Label>
            <Input
              id="servis" type="number" inputMode="decimal" step="any" min={0}
              value={draft.servisNominal}
              onChange={(e) => ubah({ servisNominal: e.target.value })}
              placeholder="0 jika tidak ada" className="h-12"
            />
            {num(draft.servisNominal) > 0 && (
              <>
                <div>
                  <Label htmlFor="servisKet">Catatan perbaikan *</Label>
                  <Textarea
                    id="servisKet" value={draft.servisKeterangan}
                    onChange={(e) => ubah({ servisKeterangan: e.target.value })}
                    placeholder="cth: Tambal ban belakang kiri di daerah Cikarang"
                  />
                </div>
                <FotoInput label="Foto nota servis" wajib value={draft.servisFoto}
                  onChange={(servisFoto) => ubah({ servisFoto })} />
              </>
            )}
          </div>

          {/* (7) Keterangan lain */}
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
            <Label htmlFor="lainnya">Keterangan lain — pengeluaran tak terduga (Rp)</Label>
            <Input
              id="lainnya" type="number" inputMode="decimal" step="any" min={0}
              value={draft.lainnyaNominal}
              onChange={(e) => ubah({ lainnyaNominal: e.target.value })}
              placeholder="0 jika tidak ada" className="h-12"
            />
            {num(draft.lainnyaNominal) > 0 && (
              <div>
                <Label htmlFor="lainnyaKet">Deskripsi *</Label>
                <Textarea
                  id="lainnyaKet" value={draft.lainnyaKeterangan}
                  onChange={(e) => ubah({ lainnyaKeterangan: e.target.value })}
                  placeholder="cth: Kuli angkut tambahan di drop 2"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── LANGKAH 4: RINGKASAN & KIRIM ── */}
      {draft.step === 3 && (
        <section className="space-y-3">
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm">
            <h3 className="font-semibold text-slate-700">Ringkasan Laporan</h3>
            <Baris label="KM Akhir" nilai={`${num(draft.kmAkhir).toLocaleString("id-ID")} KM (tempuh ${(num(draft.kmAkhir) - tugas.kmAwal).toLocaleString("id-ID")} KM)`} />
            <Baris label={`BBM (${draft.bbm.length}×)`} nilai={formatRupiah(draft.bbm.reduce((s, b) => s + num(b.nominal), 0))} />
            <Baris label="Parkir" nilai={formatRupiah(Object.values(draft.parkir).reduce((s, v) => s + num(v), 0))} />
            <Baris label="Pak Ogah" nilai={formatRupiah(num(draft.pakOgah))} />
            <Baris label="Steam" nilai={formatRupiah(num(draft.steamNominal))} />
            <Baris label="Servis darurat" nilai={formatRupiah(num(draft.servisNominal))} />
            <Baris label="Lainnya" nilai={formatRupiah(num(draft.lainnyaNominal))} />
            <div className="border-t border-slate-200 pt-2">
              <Baris label="Total pengeluaran" nilai={formatRupiah(totalBiaya)} tebal />
              <Baris label="Uang jalan dibawa" nilai={formatRupiah(tugas.uangJalan)} />
              <Baris
                label={selisih >= 0 ? "Perkiraan setor kembali" : "Perkiraan kantor mengganti"}
                nilai={formatRupiah(Math.abs(selisih))}
                warna={selisih >= 0 ? "text-emerald-600" : "text-red-600"}
                tebal
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <Label htmlFor="catatan">Catatan untuk admin (opsional)</Label>
            <Textarea
              id="catatan" value={draft.catatan}
              onChange={(e) => ubah({ catatan: e.target.value })}
              placeholder="cth: Drop 2 tutup, barang dititipkan ke satpam."
            />
          </div>

          <button
            type="button"
            suppressHydrationWarning
            disabled={pending}
            onClick={kirim}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-base font-semibold text-white transition active:bg-emerald-700 disabled:opacity-60"
          >
            <Send size={19} /> {pending ? "Mengirim laporan..." : "Kirim Laporan ✔"}
          </button>
          <p className="text-center text-xs text-slate-400">
            Setelah terkirim, laporan terkunci &amp; menunggu verifikasi admin.
          </p>
        </section>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
      )}

      {/* Navigasi langkah */}
      <div className="flex gap-2">
        {draft.step > 0 && (
          <button
            type="button" suppressHydrationWarning onClick={mundur}
            className="flex h-12 flex-1 items-center justify-center gap-1 rounded-2xl border border-slate-300 bg-white text-sm font-semibold text-slate-600"
          >
            <ChevronLeft size={17} /> Kembali
          </button>
        )}
        {draft.step < 3 && (
          <button
            type="button" suppressHydrationWarning onClick={lanjut}
            className="flex h-12 flex-1 items-center justify-center gap-1 rounded-2xl bg-blue-600 text-sm font-semibold text-white active:bg-blue-700"
          >
            Lanjut <ChevronRight size={17} />
          </button>
        )}
      </div>
    </div>
  );
}

function Baris({
  label, nilai, tebal = false, warna,
}: {
  label: string; nilai: string; tebal?: boolean; warna?: string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={cn("text-right", tebal && "font-bold", warna)}>{nilai}</span>
    </div>
  );
}
