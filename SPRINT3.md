# 📱 Sprint 3 — Portal PWA Driver: Panduan Pasang & Uji

## 1. Pasang

```bash
npm install     # dependency baru: @serwist/next + serwist

# MIGRASI: kolom berangkat_aktual_at (timestamp "Mulai Perjalanan")
npx prisma migrate dev --name sprint3_pwa_driver

npm run dev
```

> Service worker sengaja NONAKTIF saat `npm run dev` (agar hot-reload lancar).
> Untuk menguji PWA installable: `npm run build && npm start`, buka dari HP
> (atau Chrome DevTools → Application → Manifest).

## 2. Checklist Uji

### ① PWA & Manifest (mode production build)
- [ ] Buka /tugas di Chrome Android → muncul prompt "Add to Home Screen"
- [ ] Ikon biru + nama "Portal Driver" terpasang; buka dari homescreen = fullscreen (standalone)
- [ ] DevTools → Application → Service Worker: sw.js aktif; Manifest: valid tanpa error

### ② Keamanan Scoping Driver (PALING KRITIS)
- [ ] Login driver A (punya tugas aktif). Catat id trip dari URL laporan.
- [ ] Login driver B → /tugas TIDAK menampilkan tugas driver A
- [ ] Driver B akses langsung /tugas/<id-trip-A>/lapor → 404 (bukan data driver A!)
- [ ] /riwayat driver B hanya berisi trip milik B
- [ ] Driver akses /dashboard → dilempar ke /tugas (RBAC tetap hidup)

### ③ Tugas Aktif & Mulai Perjalanan
- [ ] (Admin) terbitkan SJ untuk driver → (Driver) kartu tugas muncul: nomor SJ, armada, tanggal, urutan drop ⬜
- [ ] Tombol [Mulai Perjalanan] → status trip BERJALAN (cek di dasbor admin), waktu mulai tampil di kartu
- [ ] Saat BERJALAN: ketuk tiap drop → toggle ✅/⬜
- [ ] Tombol berubah jadi [Selesai & Isi Laporan]

### ④ Wizard Laporan 7 Parameter
- [ ] Langkah 1: isi KM Akhir ≤ KM Awal → pesan error jelas; > KM Awal → jarak tempuh tampil
- [ ] Langkah 2: tambah 2 pembelian BBM; tanpa foto → ditolak; foto kamera 3-8MB → terkompresi (< 300 KB, label ukuran tampil)
- [ ] Langkah 3: daftar Parkir muncul PERSIS sesuai tujuan trip; steam>0 wajib foto; servis>0 wajib catatan+foto; lainnya>0 wajib deskripsi
- [ ] Langkah 4: ringkasan total vs uang jalan + perkiraan setor/ganti; [Kirim Laporan ✔]
- [ ] Setelah kirim: banner sukses; trip jadi MENUNGGU_VERIFIKASI (cek admin); laporan & biaya masuk DB (Prisma Studio: laporan_driver + biaya_perjalanan + foto di public/uploads)

### ⑤ Ketahanan Lapangan
- [ ] Isi form separuh (termasuk 1 foto) → TUTUP tab / matikan browser → buka lagi /tugas/<id>/lapor → banner "Draft dipulihkan", isian & foto kembali
- [ ] Matikan koneksi (DevTools offline) → klik Kirim → error ramah, draft tetap ada → online → kirim sukses → draft terhapus

## 3. Catatan Teknis
- Kompresi foto memakai Canvas API NATIF (bukan library) — nol dependency baru,
  hasil sama: sisi terpanjang 1280px + kualitas bertingkat hingga < 300KB.
- Port DB 5432 tetap terekspos; suppressHydrationWarning terpasang di seluruh
  komponen driver; semua input uang/liter memakai step="any" + inputMode="decimal".
- Odometer master SENGAJA belum ter-update saat laporan masuk — itu efek samping
  settlement admin di Sprint 4 (Blueprint 4.5), bukan bug.
