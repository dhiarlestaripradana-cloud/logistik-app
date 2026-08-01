# 🔧 Patch — Bug Input Kas Manual & Diagnosis Error

## 1. Pasang
```bash
# Ekstrak zip menimpa proyek (.env aman) — TANPA migrasi, TANPA dependency baru
npm run dev
```

## 2. ⚠️ HASIL INVESTIGASI: Hipotesis Zod TIDAK Terbukti

Saya bedah kodenya lebih dulu sebelum menambal, dan **field `kategori` sudah
tidak ada di Zod schema** sejak patch penyederhanaan kemarin. Buktinya di alur kode:

```ts
const parsed = kasManualSchema.safeParse(...);
if (!parsed.success) return { error: parsed.error.errors[0].message };  // ← pesan SPESIFIK
...
} catch (e) {
  return { error: "Gagal mencatat transaksi kas. Coba lagi." };          // ← pesan GENERIK
}
```

Pesan yang Anda lihat adalah yang **generik**, jadi validasi Zod LULUS dan
kegagalan terjadi di dalam transaksi database. Sayangnya `catch` lama membuang
objek error mentah-mentah tanpa mencatatnya ke log — itulah **defect sebenarnya**:
sistem menyembunyikan penyebabnya sendiri.

### Dua tersangka utama (kini keduanya ditangani & akan tampil jelas)
1. **P2003 — sesi menunjuk akun yang sudah tidak ada.** Sesi kita berbasis JWT
   yang bertahan meski database di-reset. Jika Anda pernah menjalankan
   `prisma migrate reset` / seed ulang, cookie lama membawa `user.id` versi lama,
   sedangkan `dibuatOleh` wajib merujuk user yang ada → foreign key gagal.
   👉 **Solusi tercepat bila ini penyebabnya: Keluar lalu Login ulang.**
2. **P2002 — nomor `KAS/2026/07/####` bentrok** karena counter tidak sinkron
   dengan data (mis. database di-restore sebagian).

## 3. Yang Diperbaiki

1. **Kategori** — dikonfirmasi tidak divalidasi dari klien; di-inject server tepat
   sebelum `prisma.create` (`MASUK → MODAL_MASUK`, `KELUAR → LAIN_LAIN`). Sesuai mandat.
2. **fieldErrors per kolom** — action kini menerima **payload objek** (bukan FormData,
   menutup total celah serialisasi) dan mengembalikan `fieldErrors`; pesan muncul
   tepat di bawah kolom bermasalah, kotaknya bergaris merah.
3. **Form controlled & anti-reset** — gagal simpan tidak lagi menghapus ketikan Admin
   (pola yang sama dengan form Driver/SIM).
4. **Error jujur & bisa ditindaklanjuti** — `pesanErrorPrisma()` baru di
   `src/lib/prisma-error.ts`: SELALU `console.error` ke terminal server, dan pesan
   di layar menyebut kode Prisma + saran tindakan. Diterapkan juga ke modul
   Operasional, SJ Eksternal, Perjalanan, dan Verifikasi yang punya pola penelanan
   error yang sama.
5. **`generateNomor` self-healing** — bila nomor hasil counter bentrok dengan
   dokumen yang sudah ada, nomor dimajukan sampai bebas lalu counter disinkronkan
   (berlaku untuk KAS, SJ, dan SJ-EXT).

## 4. Checklist Uji
- [ ] Buka /kas → Input Kas Manual → isi lengkap → Simpan → **berhasil tersimpan**
- [ ] Jika masih gagal: pesan kini menyebut sebabnya (mis. "Sesi Anda menunjuk akun
      yang sudah tidak ada... login ulang"). **Ikuti sarannya**, dan kirimkan saya
      baris `[ERROR] Gagal ...` yang muncul di terminal `npm run dev`.
- [ ] Kosongkan Keterangan → Simpan → error "Keterangan minimal 3 karakter" muncul
      **tepat di bawah kolom Keterangan**, dan isian lain TIDAK hilang
- [ ] Nominal 0 → error tepat di bawah kolom Nominal
- [ ] KELUAR melebihi saldo → pesan saldo tidak mencukupi (logika lama tetap jalan)
- [ ] Entri tersimpan muncul di tabel & PDF Buku Kas; saldo berjalan konsisten

Logika settlement 2-entri Opsi B tidak tersentuh ✓ · suppressHydrationWarning ✓ · step="any" ✓
