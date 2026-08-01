# 🚚 Sprint 2 — Surat Jalan & PDF: Panduan Pasang & Uji

## 1. Pasang

```bash
# Ekstrak zip menimpa proyek (.env aman, tidak ikut di zip)
npm install        # dependency baru: puppeteer (otomatis unduh Chromium utk dev Windows)
npm run dev
```

Tanpa migrasi database — skema tidak berubah di sprint ini.
Port DB tetap terekspos `5432:5432` di docker-compose sesuai permintaan (catatan: di VPS, tutup 5432 dari publik via ufw).

## 2. Checklist Uji

### ① Form Buat Surat Jalan (/perjalanan/buat)
- [ ] Dropdown armada hanya berisi TERSEDIA & PERLU SERVIS (yang DALAM PERJALANAN/NONAKTIF tidak muncul)
- [ ] Pilih armada → KM Awal otomatis terisi odometer + info sisa servis tampil
- [ ] Pilih armada PERLU SERVIS → kotak kuning muncul; terbitkan TANPA centang → DITOLAK; dengan centang → berhasil
- [ ] Dropdown driver hanya berisi driver aktif yang bebas tugas
- [ ] Repeater: tambah 3 tujuan; pilih customer → satpam & gudang AUTO-TERISI dari master, lalu ubah manual salah satunya → nilai editan yang tersimpan
- [ ] Tombol naik/turun mengubah urutan drop; customer sama 2× → DITOLAK
- [ ] "Simpan sebagai Draft" → status DRAFT, armada TETAP TERSEDIA
- [ ] "Terbitkan & Tugaskan" → status DITUGASKAN, armada jadi DALAM PERJALANAN (cek /kendaraan)

### ② Penomoran & Dana Pending
- [ ] Nomor SJ berformat SJ/2026/07/0001, 0002 … berurutan tanpa kembar
- [ ] Setelah terbit: Dashboard menampilkan Dana Pending = Σ uang jalan trip aktif,
      Kas Efektif = Saldo Buku − Dana Pending, Trip Aktif bertambah
- [ ] Buka /kas → TIDAK ADA entri baru (kas resmi belum terpotong — 2-Step!)

### ③ PDF Surat Jalan (Puppeteer)
- [ ] Dari list, klik PDF → tab baru berisi PDF A4: kop perusahaan, nomor SJ, armada+driver,
      tabel tujuan berurutan dengan KOLOM TTD & STEMPEL per drop, kotak uang jalan, ttd Admin & Driver
- [ ] Preview HTML identik: buka /print/surat-jalan/<id>
- [ ] Logout → akses URL PDF langsung → 401/redirect (terlindungi)

### ④ Monitoring & Aksi (/perjalanan)
- [ ] Filter Status / Armada / Driver bekerja, dikombinasikan dengan search & paginasi
- [ ] DRAFT: tombol Edit & Terbitkan tampil; edit draft → ubah tujuan → tersimpan
- [ ] Batalkan trip DITUGASKAN → status DIBATALKAN, armada kembali TERSEDIA, Dana Pending turun, /kas tetap bersih
- [ ] Terbitkan cepat dari list saat armada keburu PERLU SERVIS → DITOLAK dengan pesan (override hanya lewat Edit)

## 3. Catatan
- Identitas kop perusahaan diedit di: `src/modules/perjalanan/pdf/template.ts` (konstanta `PERUSAHAAN`)
- Trip BERJALAN tidak bisa dibatalkan (kebijakan Blueprint 3) — diselesaikan via laporan driver di Sprint 3–4
