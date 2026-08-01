# 🏁 Sprint 4 — Verifikasi, Settlement & Laporan Eksekutif (Penutup MVP)

## 1. Pasang
```bash
# Ekstrak zip menimpa proyek (.env aman) — TANPA migrasi, TANPA dependency baru
npm run dev
```

## 2. ⚖️ KEPUTUSAN AKUNTANSI SETTLEMENT (WAJIB DIBACA OWNER)
Spec meminta HANYA mencatat entri selisih di ArusKas. Itu membuat Buku Kas
tidak pernah merekam beban trip. Contoh: modal 5.000.000 → kasbon 500.000 →
realisasi 463.000 → jika hanya dicatat MASUK 37.000, saldo buku jadi
5.037.000 padahal laci fisik 4.537.000 (selisih 500rb selamanya).

Implementasi memakai MODEL KAS FISIK 2 ENTRI per settlement:
  e1) KELUAR uang jalan (kasbon diakui resmi saat settlement — 2-Step utuh)
  e2) MASUK selisih (driver setor)  ATAU  KELUAR |selisih| (kantor reimburse)
      — persis entri yang diminta spec, dengan pemberi/penerima bernama.
Efek bersih saldo = −total realisasi → Buku Kas = laci fisik. Selisih 0 → tanpa e2.

Catatan kebijakan: settlement TIDAK diblokir walau saldo buku akan minus
(uang secara fisik sudah keluar saat kasbon diberikan; buku wajib mengakui
realita). Saldo minus = sinyal ada Modal Masuk yang belum dicatat.

## 3. Checklist Uji

### ① Verifikasi (/verifikasi — menu baru)
- [ ] Trip MENUNGGU_VERIFIKASI muncul di antrian; Dashboard juga menampilkan panelnya
- [ ] Halaman detail: KM Awal vs Akhir + km/L vs standar armada (flag ⚠ anomali jika boros >20%)
- [ ] Rincian biaya per kategori + komitmen satpam/gudang per drop; foto struk klik → lightbox zoom
- [ ] Kotak SELISIH: hijau (driver setor) / merah (kantor reimburse)

### ② Minta Revisi (loop lengkap)
- [ ] [Minta Revisi] tanpa catatan → ditolak; dengan catatan → trip kembali BERJALAN
- [ ] HP driver: banner kuning catatan revisi muncul, wizard aktif lagi (draft lama masih ada)
- [ ] Driver kirim ulang → kembali masuk antrian verifikasi

### ③ Settlement (transaksi puncak — uji dengan 3 skenario selisih)
- [ ] Selisih > 0: /kas berisi 2 entri (KELUAR uang jalan + MASUK setoran driver, pemberi=nama driver)
- [ ] Selisih < 0: 2 entri KELUAR (uang jalan + reimburse, penerima=nama driver)
- [ ] Selisih = 0: 1 entri KELUAR uang jalan saja
- [ ] Trip → SELESAI, laporan DISETUJUI (terkunci), Dana Pending turun, Kas Efektif konsisten
- [ ] Odometer master armada = KM Akhir laporan; armada → TERSEDIA
- [ ] Skenario servis: buat trip yang KM Akhir-nya menembus (servis terakhir + interval − 100)
      → armada otomatis PERLU_SERVIS + alert dashboard
- [ ] Ada biaya SERVIS_DARURAT → baris baru muncul di riwayat servis kendaraan (dengan foto nota)
- [ ] Klik ganda / dua tab tombol Setujui → kas TIDAK terpotong dua kali (guard idempoten)

### ④ Laporan Eksekutif (/laporan — menu baru)
- [ ] Filter tanggal + armada + driver (form GET, bisa di-bookmark)
- [ ] KPI: total pengeluaran (BBM vs Non-BBM), total KM, efisiensi rata2 vs standar, jumlah anomali
- [ ] Baris trip anomali berlatar merah dengan badge ⚠
- [ ] [Unduh CSV] → terbuka rapi di Excel (delimiter ; + BOM UTF-8), baris TOTAL di bawah
- [ ] [Cetak PDF Audit] → PDF A4 siap diserahkan ke Owner

## 4. MVP SELESAI — Menuju Produksi (Sprint 5/Hardening)
Buku Kas PDF (Blueprint 5.3.1), backup pg_dump harian + restore drill,
rate-limit login, UAT driver pilot, deploy VPS + HTTPS Caddy.
