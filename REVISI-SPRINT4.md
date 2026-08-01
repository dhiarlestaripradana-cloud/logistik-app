# 🔧 Revisi Sprint 4 (UAT) — 404 Verifikasi, Transparansi Driver, Repeater SIM

## 1. Pasang
```bash
# Ekstrak zip menimpa proyek (.env aman) — TANPA migrasi, TANPA dependency baru
npm run dev
```

## 2. Checklist Uji

### ① Fix 404 Pasca-Settlement (/verifikasi)
- [ ] Setujui & Settlement → langsung mendarat mulus di /verifikasi dengan banner hijau (TIDAK ada 404)
- [ ] Minta Revisi → sama: kembali ke antrian dengan banner
- [ ] Antrian kosong → tampil "Tidak ada laporan menunggu verifikasi. Semua beres! 🎉"
- [ ] Settlement tetap benar: 2 entri kas fisik, odometer, lepas armada (logika TIDAK disentuh)

### ② Transparansi Satpam & Gudang (HP Driver /tugas)
- [ ] Di kartu Tugas Aktif, tiap tujuan kini menampilkan baris biru:
      "🛡️ Satpam: Rp 10.000 | 📦 Gudang: Rp 15.000" (format ribuan rapi)
- [ ] Nilai sama persis dengan yang di-set admin saat membuat SJ (termasuk yang dianulir per trip)

### ③ Repeater SIM Driver — Bulletproof (/driver)
- [ ] EDIT driver lama + Tambah SIM lengkap → Simpan → BERHASIL (bug "Required" musnah)
- [ ] Uji anti-reset: isi form, KOSONGKAN sengaja "Jenis SIM" baris 2 → Simpan →
      error muncul TEPAT di bawah dropdown baris 2; SEMUA ketikan lain TETAP UTUH
- [ ] Username duplikat saat create → error tepat di bawah kolom username
- [ ] 2 SIM berjenis sama → error di baris duplikat: "Jenis SIM B1 UMUM sudah dipakai di baris 1"
- [ ] Edit tanpa mengubah password → password lama tetap berlaku

## 3. Catatan Teknis (Diagnosis Jujur Bug #3)
Hipotesis UAT (key `sim[0].nomor` gagal ter-serialize) masuk akal, namun akar
sebenarnya di kode kita ada dua:
  a) `disabled={!!initial}` pada input username — input DISABLED tidak pernah
     ikut terkirim di FormData → Zod melihat `username: undefined` → "Required".
  b) React 19 mereset field uncontrolled setelah form action selesai → ketikan hilang.
Solusi yang dieksekusi persis mandat UAT dan menutup kedua akar sekaligus:
payload OBJEK langsung (tanpa FormData), seluruh field controlled (anti-reset),
`readOnly` menggantikan `disabled`, dan fieldErrors per path Zod.

⚠️ Kelas bug (b) juga berpotensi di form Kendaraan/Customer (ketikan ter-reset
saat error validasi — jarang terjadi, tidak memblokir). Direkomendasikan
konversi ke pola yang sama pada sprint hardening.

Lingkungan: port 5432 ✓, suppressHydrationWarning ✓, timezone WIB ✓,
logika settlement 2-entri TIDAK disentuh ✓.
