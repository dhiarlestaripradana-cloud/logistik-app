# ✅ Sprint 1 — Master Data & Operasional: Panduan Pasang & Uji

## 1. Pasang

```bash
# Ekstrak zip ini menggantikan folder proyek lama (atau timpa seluruh isi src/,
# package.json — file .env Anda TIDAK ada di zip, jadi aman).
npm install          # ada 2 dependency baru: @tanstack/react-table, lucide-react
npm run dev
```

Tidak ada migrasi database baru — skema `revisi_skema_operasional` Anda sudah final.

## 2. Checklist Uji (klik di browser)

### Modul Kendaraan (/kendaraan)
- [ ] Tambah kendaraan; isi Tgl Pajak = 10 hari dari sekarang → badge **KUNING** "10 hari lagi"
- [ ] Tambah kendaraan; isi Tgl KIR = kemarin → badge **MERAH** "Terlambat 1 hari"
- [ ] Kolom Umur Kendaraan tampil "X tahun Y bulan" sesuai tanggal pembelian
- [ ] Input plat yang sama 2× → ditolak "Nomor polisi tersebut sudah terdaftar."
- [ ] Nonaktifkan armada → status NONAKTIF (soft-delete, tidak terhapus)

### Modul Customer (/customer)
- [ ] Tambah customer lengkap: kode (otomatis UPPERCASE), wilayah, sales, tarif satpam & gudang
- [ ] Kode customer duplikat → ditolak
- [ ] Search cepat berfungsi (ketik nama/wilayah), paginasi muncul di data ke-11

### Modul Driver (/driver)
- [ ] Daftarkan driver baru (username + password + biodata + SIM)
- [ ] **Logout, login sebagai driver tsb** → masuk ke /tugas (bukan dashboard)
- [ ] Login kembali sebagai admin → Nonaktifkan driver → coba login driver → DITOLAK
- [ ] Edit driver dengan password dikosongkan → password lama tetap berlaku
- [ ] Isi Masa Berlaku SIM ≤14 hari → badge alert SIM muncul

### Modul Operasional Kantor (/operasional)
- [ ] Saat saldo Rp 0, langsung Catat Pengeluaran → DITOLAK: "Saldo kas tidak mencukupi..."
- [ ] Tambah Modal Kas (mis. Rp 5.000.000, pemberi: Owner) → kartu saldo ter-update
- [ ] Catat Pengeluaran: Qty 2 × Harga 25.000 → total Rp 50.000 dihitung SERVER, saldo jadi 4.950.000
- [ ] Nomor referensi kas berformat KAS/2026/07/0001, 0002, ... berurutan
- [ ] Buka Prisma Studio → tabel arus_kas: entri MASUK & KELUAR dengan saldo_sesudah berjalan,
      tabel operasional_lain: baris tertaut arus_kas_id ✔

### Dashboard (/dashboard)
- [ ] 4 kartu KPI tampil (Saldo, Armada, Customer, Driver)
- [ ] Panel Alert menampilkan kendaraan berbadge kuning/merah dari uji di atas
