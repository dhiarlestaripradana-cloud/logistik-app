# 🏁 Revisi Final MVP — Opsi B, RBAC Operasional, PDF Buku Kas & Laporan Driver

## 1. Pasang
```bash
npm install                       # tanpa dependency baru (jaga-jaga)
npx prisma migrate dev --name revisi_final_opsi_b_rbac   # enum Role + OPERASIONAL
npm run dev
```
Akun staf OPERASIONAL perdana (opsional): isi `SEED_OPS_USERNAME` & `SEED_OPS_PASSWORD`
di `.env` lalu `npm run db:seed` — atau buat manual via Prisma Studio (role OPERASIONAL).

## 2. Checklist Uji

### ① Semantik Opsi B (settlement)
Skenario emas: uang jalan 300.000, drop (satpam+gudang) 50.000, biaya driver 280.000.
- [ ] Preview verifikasi: "Total Tunai Rp 350.000 (uang jalan 300.000 + drop 50.000)"
- [ ] Selisih tampil: DRIVER SETOR Rp 20.000 (hijau) — bukan reimburse 30rb!
- [ ] Setelah settle, /kas: e1 KELUAR Rp 350.000 "Total tunai SJ/... (uang jalan 300.000 + uang drop 50.000)"
      + e2 MASUK Rp 20.000 → saldo bersih turun Rp 330.000 = realisasi ✓
- [ ] Dashboard: Dana Pending trip aktif kini = Σ(uang jalan + drop), Kas Efektif konsisten
- [ ] PDF Surat Jalan (TOTAL TUNAI) kini SEJALAN dengan settlement — satu kebenaran

### ② RBAC Role OPERASIONAL
- [ ] Login akun OPERASIONAL → mendarat di /operasional; sidebar hanya menu Operasional
- [ ] Tombol "Tambah Modal Kas" TIDAK ADA di /operasional (untuk semua role — resmi pindah ke /kas)
- [ ] OPERASIONAL akses paksa /kas, /dashboard, /perjalanan via URL → terlempar ke /operasional
- [ ] OPERASIONAL bisa Catat Pengeluaran (guard requireKantor) ✓
- [ ] Uji server-side: panggilan catatModalMasuk oleh OPERASIONAL → "Akses ditolak"
- [ ] SUPER_ADMIN tetap penuh; Tambah Modal via /kas → Input Kas Manual (MASUK/Modal Masuk)

### ③ PDF Buku Kas (/kas)
- [ ] Filter Dari–Sampai bekerja (harian, bulanan, rentang bebas); default bulan berjalan
- [ ] [Cetak PDF Buku Kas] → PDF resmi: kop, periode, SALDO AWAL periode,
      kolom No|Tanggal|Ref|Keterangan(pemberi→penerima+sumber)|Masuk|Keluar|Saldo,
      footer TOTAL MASUK/KELUAR + SALDO AKHIR, blok ttd Dibuat/Disetujui
- [ ] Uji saldo awal: filter mulai tengah bulan → saldo awal = saldo entri terakhir sebelum tanggal itu

### ④ PDF Laporan per Driver (/laporan)
- [ ] Pilih driver di filter → tombol biru [Cetak PDF Laporan Driver] muncul
- [ ] PDF berisi: identitas driver, KPI (trip, KM, efisiensi, total tunai, realisasi,
      akumulasi selisih setor/nombok), tabel per trip dgn KM awal→akhir, km/L vs standar
      (baris merah ⚠ BOROS), uang diterima (UJ+Drop), realisasi, status Kembalian/Nombok/Pas
- [ ] Kolom ttd Admin & Driver di bawah — siap jadi dasar evaluasi bulanan

## 3. Catatan
- Trip yang DISETTLE SEBELUM revisi ini menyimpan `selisih` rumus lama (historis,
  tidak ditulis ulang — ledger append-only). Trip baru memakai Opsi B penuh.
- OPERASIONAL sengaja tidak diberi akses /kas (melihat ledger penuh & modal = wewenang owner).
- Lingkungan terjaga: port 5432, suppressHydrationWarning, step="any", TZ WIB.
