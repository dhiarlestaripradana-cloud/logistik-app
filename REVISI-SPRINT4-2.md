# 🔧 Revisi Sprint 4 (2) — PDF Surat Jalan Transparan & PWA Responsif

## 1. Pasang
```bash
# Ekstrak zip menimpa proyek (.env aman) — TANPA migrasi, TANPA dependency baru
npm run dev
```
(Untuk VPS nanti: rebuild image Docker — Dockerfile kini menyertakan
`font-noto-emoji` agar 🛡️📦 tercetak di PDF Chromium Alpine.)

## 2. Checklist Uji

### ① PDF Surat Jalan (cetak ulang SJ mana pun)
- [ ] Tiap baris tujuan: di bawah nama/kode toko tampil
      "🛡️ Satpam: Rp 6.000 | 📦 Gudang: Rp 10.000" (biru kecil, format ribuan)
- [ ] Kotak ringkasan pojok kiri bawah kini 3 baris:
      Uang Jalan (Kasbon Operasional) : Rp ...
      Uang Drop (Satpam + Gudang, N titik) : Rp ...
      ───────────────────────────── (+)
      TOTAL TUNAI DIBAWA DRIVER : Rp ...  ← bold & lebih besar
- [ ] Angka TOTAL = uangJalan + Σ(satpam+gudang) persis
- [ ] Preview /print/surat-jalan/<id> identik dengan PDF

### ② PWA Driver Responsif
- [ ] [Mulai Perjalanan] → OK → status berubah BERJALAN SEKETIKA (tanpa pindah tab)
- [ ] Ketuk centang drop → ✅ muncul seketika
- [ ] Tombol [Keluar] → langsung berpindah ke /login seketika; tombol Back
      tidak bisa kembali masuk (sesi benar-benar bersih)

## 3. ⚖️ PERTANYAAN SEMANTIK AKUNTANSI — MOHON KONFIRMASI OWNER
Revisi PDF ini menetapkan: TOTAL TUNAI = uangJalan + uang drop, artinya
`uangJalan` = kasbon OPERASIONAL SAJA (bensin/makan), TERPISAH dari uang drop.

Namun mesin settlement saat ini menghitung:
    selisih = uangJalan − (komitmen drop + biaya driver)
yang mengasumsikan uangJalan SUDAH TERMASUK uang drop.

Contoh dampak (semantik baru): uangJalan ops 300rb + drop 50rb (total tunai
350rb), biaya driver 280rb, drop terpakai 50rb → sisa fisik di driver 20rb.
Settlement lama menghitung: 300 − (50+280) = −30rb ("kantor reimburse 30rb") ← SALAH.
Rumus benar utk semantik baru: selisih = (uangJalan + drop) − realisasi
                                        = uangJalan − biaya driver = +20rb ✓

Struktur 2-entri kas fisik TIDAK berubah — hanya nominal e1 menjadi
(uangJalan + drop) dan rumus selisih di atas. Patch-nya kecil, TAPI menyentuh
mesin settlement yang Anda kunci, jadi saya TIDAK mengubahnya tanpa perintah.

➡️ Balas salah satu:
   A. "uangJalan sudah termasuk uang drop" → PDF perlu saya sesuaikan (total = uangJalan saja).
   B. "uangJalan terpisah dari uang drop"  → saya patch rumus settlement (1 commit kecil).
