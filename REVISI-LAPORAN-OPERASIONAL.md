# 📊 Fitur — Laporan Operasional Periodik (PDF Gaya Spreadsheet)

## 1. Pasang
```bash
# Ekstrak zip menimpa proyek (.env aman) — TANPA migrasi, TANPA dependency baru
npm run dev
```

## 2. Cara Pakai (menu /laporan)
1. Set **Dari–Sampai** tanggal
2. Pilih **Driver** (biarkan "Semua Driver" untuk rekap seluruh driver)
3. Klik **Terapkan Filter**
4. Klik tombol hijau **[Cetak Laporan Operasional]** → PDF terbuka di tab baru
   - Label tombol menandakan mode aktif: "(semua)" atau "(1 driver)"

Mode ditentukan otomatis dari dropdown Driver:
- "Semua Driver" → dikirim sebagai `driverId=all` → 1 baris per driver + baris TOTAL
- Driver tertentu → hanya baris driver itu (format 2 tabel tetap sama)

## 3. Isi PDF (2 tabel, header hijau, border solid ala Excel — landscape)

**TABEL 1 — TOTAL OPERASIONAL CUSTOMER (per Driver)**
`NO | DRIVER | SATPAM | GUDANG | P OGAH | PARKIR | STEAM | SERVIS | KET. LAIN | TOTAL | CUST(tujuan)`
+ baris TOTAL keseluruhan di bawah.

**TABEL 2 — TOTAL PEMBELIAN BBM**
`NO | DRIVER | PLAT KENDARAAN | JENIS KENDARAAN | JENIS BBM | TOTAL PEMBELIAN BBM`
+ baris TOTAL BBM di bawah. Satu baris per kombinasi driver × armada × jenis BBM.

## 4. Checklist Uji
- [ ] "Semua Driver" + rentang tanggal → tiap driver 1 baris di Tabel 1, angka per kolom benar
- [ ] Baris TOTAL Tabel 1 = penjumlahan kolom seluruh driver
- [ ] Pilih 1 driver → hanya baris driver itu yang tampil (2 tabel tetap ada)
- [ ] Tabel 2: plat, merk+tipe kendaraan, dan jenis BBM (nama produk) benar per pembelian
- [ ] Header tabel hijau, border solid, baris genap berselang hijau muda (gaya spreadsheet)
- [ ] Preview HTML `/print/laporan-operasional?driverId=all&dari=...&sampai=...` identik dgn PDF

## 5. Catatan Tech Lead — Keputusan Sumber Data (penting utk akurasi)

Spec menyebut beberapa hal yang perlu saya luruskan agar angkanya BENAR:

**a. SATPAM & GUDANG bukan dari BiayaPerjalanan.** Kategori `BiayaPerjalanan` yang
diinput driver hanya: BBM, Pak Ogah, Parkir, Steam, Servis, Lainnya — TIDAK ada
satpam/gudang. Uang satpam & gudang adalah **uang drop** (komitmen toko) yang
di-set admin di tiap tujuan. Jadi Tabel 1 mengagregasi keduanya dari
`TujuanPerjalanan.uangSatpam/uangGudang`, bukan dari biaya driver. Ini konsisten
dengan semantik Opsi B yang sudah kita sepakati.

**b. TOTAL Tabel 1 TIDAK memasukkan BBM.** Kolom yang diminta di Tabel 1 tidak ada
BBM (BBM punya Tabel 2 sendiri), jadi TOTAL = satpam+gudang+ogah+parkir+steam+
servis+lain. Kalau Owner mau BBM ikut di TOTAL Tabel 1, bilang — 1 baris ubah.

**c. JENIS BBM diambil dari catatan pembelian, bukan dari kendaraan.** Spec menulis
"relasi Kendaraan → MasterBbm", tapi secara struktur BBM bukan properti kendaraan
(satu truk bisa isi Biosolar hari ini, Dexlite besok). Yang akurat adalah produk
yang benar-benar dipilih driver saat mengisi laporan — sudah kita simpan di
`BiayaPerjalanan.keterangan` ("Nama @ harga/L"). Tabel 2 membaca dari sana.
Bonus: ini akurat secara historis — kalau harga master diubah nanti, laporan lama
tetap menampilkan jenis BBM yang benar saat itu. **Tanpa perlu migrasi.**

**d. Hanya trip SELESAI yang direkap** (sudah terverifikasi & final), konsisten
dengan Laporan Eksekutif dan Laporan Driver yang sudah ada.

Lingkungan: suppressHydrationWarning ✓, tanpa dependency baru ✓, tanpa migrasi ✓,
logika settlement/akuntansi tidak tersentuh ✓.
