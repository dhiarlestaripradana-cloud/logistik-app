# 📦 Fase Ekspansi — SJ Eksternal, Kas Pure In/Out, Master BBM

## 1. Pasang
```bash
npm install                        # tanpa dependency baru
npx prisma migrate dev --name ekspansi_sjext_bbm    # 2 tabel + 2 enum baru
npm run db:seed                    # mengisi 6 produk BBM default (idempoten, aman diulang)
npm run dev
```

## 2. Checklist Uji

### ① Surat Jalan Eksternal (/surat-jalan-eksternal — menu baru)
- [ ] [+ Buat SJ Eksternal]: pilih kategori (Sales/Ojol/Ekspedisi), isi nama/plat pengirim,
      cari customer via combobox, isi keterangan barang → tersimpan
- [ ] Nomor berformat **SJ-EXT/2026/07/0001** dan deret **tidak mengganggu** nomor SJ internal
      (buat SJ internal setelahnya → nomornya lanjut dari deret SJ sendiri)
- [ ] Combobox customer TIDAK menampilkan uang satpam/gudang sama sekali
- [ ] Filter Status & Kategori + search bekerja
- [ ] [Tandai Kembali (ACC)] → status DIKEMBALIKAN seketika (tanpa pindah tab); tombol hilang
- [ ] [PDF] → dokumen pengantar: kop, kategori+pengirim, tujuan+alamat, keterangan barang,
      3 kolom ttd (Admin / Pengirim / Penerima+stempel)
- [ ] **UJI KRITIS**: cari kata "Uang"/"Rp" di PDF SJ Eksternal → HARUS NIHIL
- [ ] Buka /kas & Dashboard → Buku Kas dan Dana Pending TIDAK berubah sedikit pun

### ② Buku Kas Pure In/Out (/kas)
- [ ] Modal [Input Kas Manual] kini tepat 6 field: Tanggal, Tipe, Pemberi, Penerima,
      Nominal, Keterangan — dropdown Kategori SUDAH TIDAK ADA
- [ ] Simpan MASUK & KELUAR → tetap tercatat benar, saldo berjalan konsisten
- [ ] PDF Buku Kas: kolom kini jernih — No | Tanggal | No.Ref | **Pemberi** | **Penerima** |
      Keterangan | Masuk | Keluar | Saldo (cetak landscape agar lega)
- [ ] Settlement trip & Operasional Kantor tetap otomatis masuk ledger (logika tak tersentuh)

### ③ Master BBM & Liter Otomatis
- [ ] /master-bbm (menu "Harga BBM"): 6 produk default tampil dengan kolom
      "Contoh: Rp 100.000 = X liter"
- [ ] Tambah produk baru & ubah harga → tersimpan; nama duplikat ditolak
- [ ] Nonaktifkan satu produk → hilang dari pilihan driver (data lama tetap aman)
- [ ] **HP Driver, wizard langkah 2 BBM**: pilih "Biosolar (B35) — Rp 6.800/L",
      ketik nominal 100000 → kolom **Total Liter terisi 14.71 L SEKETIKA** dan
      **tidak bisa diketik** (abu-abu, read-only) + baris rumus tampil di bawahnya
- [ ] Ganti jenis BBM → liter langsung dihitung ulang
- [ ] Kirim laporan → cek DB (biaya_perjalanan): liter tersimpan hasil hitungan
      SERVER, keterangan berisi "Biosolar (B35) @ 6.800/L"
- [ ] Laporan audit & efisiensi km/L tetap akurat memakai liter ini

## 3. Catatan Teknis Tech Lead

**a. React Hook Form — sengaja TIDAK dipakai.** Mandat meminta RHF (`watch`/`setValue`)
demi reaktivitas. Reaktivitas itu sudah 100% tercapai dengan controlled state yang
kita pakai di seluruh proyek (liter berubah pada keystroke yang sama). Menambah RHF
hanya di layar ini berarti: dependency baru di bundle PWA yang diunduh driver via 3G,
plus dua paradigma form yang berbeda dalam satu codebase — persis kelas masalah yang
kita bereskan saat revisi form Driver. Kalau Owner tetap ingin RHF sebagai standar,
sebaiknya dilakukan sebagai migrasi menyeluruh di sprint hardening, bukan tambalan satu layar.

**b. Liter dihitung ULANG di server.** Angka liter dari klien hanya untuk tampilan;
server menghitung `nominal ÷ hargaPerLiter` dari Master BBM saat submit — prinsip yang
sama dengan KM Awal. Ini yang benar-benar menutup celah manipulasi, bukan sekadar
`readOnly` di UI (yang bisa diakali lewat DevTools).

**c. Isolasi SJ Eksternal dijamin di level skema.** Model `SuratJalanEksternal` memang
tidak punya kolom uang apa pun dan tidak berelasi ke `ArusKas` — jadi kebocoran nominal
kasbon ke dokumen armada luar mustahil terjadi, bukan sekadar disembunyikan di UI.
Combobox customer-nya pun dibuat terpisah (tanpa tarif) alih-alih memakai ulang milik
modul Perjalanan.

**d. Kolom `kategori` di ArusKas tetap ada** (dibutuhkan entri otomatis settlement &
operasional), hanya disembunyikan dari form manual dan diisi server: MASUK → MODAL_MASUK,
KELUAR → LAIN_LAIN.

Lingkungan: port 5432 ✓, suppressHydrationWarning ✓, step="any" ✓, TZ WIB ✓,
logika settlement 2-entri Opsi B TIDAK tersentuh ✓.
