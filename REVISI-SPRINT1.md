# 🔧 Revisi Sprint 1 — Panduan Terap & Uji

## 1. Terapkan

```bash
# Ekstrak zip menimpa proyek (file .env Anda aman, tidak ada di zip)
npm install                # tidak ada dependency baru, jalankan untuk jaga-jaga

# MIGRASI SKEMA (KIR nullable + model DriverSim + enum SIM C)
npx prisma migrate dev --name revisi_kir_sim_kas
```

> ⚠️ Prisma akan memperingatkan penghapusan kolom `no_sim`, `jenis_sim`,
> `masa_berlaku_sim` dari `driver_profiles` (dipindah ke tabel baru `driver_sim`).
> Data SIM driver uji-coba yang lama akan hilang — ini disengaja dan aman di dev.
> Ketik `y` untuk melanjutkan. Jika macet: `npx prisma migrate reset` (re-seed admin otomatis).

```bash
npm run dev
```

## 2. Checklist Uji Revisi

### ① KIR Opsional (/kendaraan)
- [ ] Tambah armada motor TANPA mengisi KIR → tersimpan, kolom KIR = badge abu "Tanpa KIR"
- [ ] Armada tanpa KIR tidak memunculkan alert KIR di Dashboard
- [ ] Edit armada lama, KOSONGKAN tanggal KIR → tersimpan null (badge "Tanpa KIR")

### ② Multi-SIM Driver (/driver)
- [ ] Daftarkan driver dengan 2 SIM sekaligus (mis. B1 UMUM + C) via tombol "Tambah SIM"
- [ ] Kolom SIM di tabel menampilkan kedua SIM, masing-masing dengan badge masa berlaku
- [ ] Isi 2 SIM berjenis sama → ditolak: "Terdapat jenis SIM yang sama..."
- [ ] Edit driver: hapus 1 SIM, tambah 1 SIM lain → tersimpan sesuai (replace-all)
- [ ] SIM dengan masa berlaku ≤14 hari → badge kuning/merah

### ③ Buku Kas Terpadu (/kas — menu baru di sidebar)
- [ ] Entri lama dari "Tambah Modal" & "Operasional Kantor" TAMPIL SEMUA di satu tabel
- [ ] Label sumber tampil per baris: Manual / Operasional Kantor
- [ ] Input Kas Manual MASUK (kategori Modal Masuk, pemberi+penerima) → saldo naik
- [ ] Input Kas Manual KELUAR > saldo → DITOLAK "Saldo kas tidak mencukupi"
- [ ] Kolom Masuk (hijau) / Keluar (merah) / Saldo berjalan tampil rapi

### ④ Bug step HTML5
- [ ] Form Tambah Modal Kas: ketik nominal 1.234.567 → TIDAK ada error "two nearest valid values"
- [ ] Form Operasional: Qty 2.5 × Harga 17.375 → diterima tanpa error browser
- [ ] Form Customer: tarif satpam 12.500 → diterima
