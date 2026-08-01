# 🔧 Revisi Sprint 2 — Perbaikan Bug Intent + UX Surat Jalan

## 1. Pasang
```bash
# Ekstrak zip menimpa proyek (.env aman) — TANPA migrasi, TANPA dependency baru
npm run dev
```

## 2. Checklist Uji

### ① Bug "Intent tidak dikenal" — TUNTAS
- [ ] Klik "Terbitkan & Tugaskan Driver" → trip terbit DITUGASKAN (tanpa error intent)
- [ ] Klik "Simpan sebagai Draft" → tersimpan DRAFT
- [ ] Tekan ENTER saat kursor di kolom teks mana pun → form TIDAK ter-submit
- [ ] Tekan ENTER di dalam kotak cari combobox → memilih hasil teratas (bukan submit form)

### ② Combobox Customer Searchable
- [ ] Klik kolom customer → panel cari terbuka, kursor langsung di kotak ketik
- [ ] Ketik potongan nama toko / kode / wilayah → daftar terfilter real-time (maks 50 baris)
- [ ] Pilih customer → uangSatpam & uangGudang tetap AUTO-TERISI dari master (dan tetap editable)
- [ ] Klik area di luar panel / tekan Esc → panel tertutup
- [ ] Baris hasil menampilkan tarif default satpam & gudang sebagai pratinjau

### ③ KM Awal Terkunci (anti-typo)
- [ ] Sebelum pilih armada: kolom menampilkan "— pilih armada dahulu —"
- [ ] Pilih armada → kolom otomatis menampilkan odometer master, TIDAK BISA diketik
- [ ] Uji integritas: terbitkan trip → nilai km_awal di DB = odometer master
      (server yang menentukan; input klien diabaikan sepenuhnya)
- [ ] Terbitkan DRAFT lama dari list → km_awal DI-REFRESH ke odometer terkini saat terbit

## 3. Catatan Teknis
- Akar bug: React 19 tidak menyertakan name/value tombol submit ke FormData pada
  function action; Enter men-submit tanpa submitter sama sekali. Solusi terpasang:
  DUA Server Action terpisah via `formAction` + pencegahan Enter — bukan tambalan value.
- `docker-compose.yml` tetap mengekspos `5432:5432`; `suppressHydrationWarning`
  tetap terpasang di seluruh primitif + combobox baru.
