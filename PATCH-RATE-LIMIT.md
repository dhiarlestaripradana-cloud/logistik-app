# 🔒 Patch — Rate-Limit Login (Anti Brute-Force)

## 1. Pasang
```bash
# Migrasi menambah SATU tabel baru: login_throttle
npx prisma migrate dev --name login_throttle

npm run dev
```
> Produksi: `docker exec logistik_app npx prisma migrate deploy` (jalan otomatis
> juga saat container restart). Tanpa dependency baru.

## 2. Cara Kerja
- **Per-username, progresif**: 5 gagal beruntun → kunci 5 menit; gagal berikutnya
  (setelah kunci lewat) menaik ke 15 → 30 → 60 menit (batas atas).
- **Berbasis DB**, bukan memori: lockout **bertahan melewati restart** container —
  penyerang tidak bisa mereset hitungan dengan memicu restart.
- **Reset otomatis** saat login sukses (jejak gagal user itu dihapus).
- **Fail-open**: bila tabel throttle sendiri bermasalah, login normal tetap jalan
  (tetap butuh password benar) — tidak mengunci semua orang gara-gara infra.
- **IP dicatat** (dari X-Forwarded-For via Caddy) untuk audit; pengunci utamanya
  username, karena registrasi admin-only (hanya ~16 username sah).
- **Anti-enumerasi**: username tak dikenal yang gagal 5x juga ikut terkunci, jadi
  tidak ada sinyal yang membocorkan username mana yang valid.

## 3. Checklist Uji
- [ ] Salah password **5x** pada username yang sama → percobaan ke-5 memunculkan
      pesan **kuning 🔒** "Akun dikunci sementara — coba lagi dalam 5 menit"
- [ ] Coba lagi saat masih terkunci → tetap ditolak dengan sisa waktu (argon2
      bahkan tidak dijalankan — hemat CPU + anti-DoS)
- [ ] Cek Prisma Studio tabel `login_throttle`: ada baris username itu,
      `gagal_count`=5, `terkunci_sampai` terisi, `last_ip` tercatat
- [ ] Login dengan password BENAR sesudah kunci lewat → sukses, lalu cek tabel:
      baris username itu **hilang** (throttle ter-reset)
- [ ] Username acak yang tak terdaftar, salah 5x → juga terkunci (anti-enumerasi)
- [ ] Driver yang cuma salah ketik 1–2x → tetap bisa login normal (tidak terganggu)

## 4. Menyetel Ambang (opsional)
Semua angka ada di `src/lib/login-throttle.ts`:
- `MAKS_GAGAL` (default 5) — berapa kali gagal sebelum mulai mengunci
- `tangga = [5, 15, 30, 60]` — durasi kunci (menit) bertingkat

Lingkungan terjaga: suppressHydrationWarning ✓, tanpa dependency baru ✓,
logika settlement/akuntansi tidak tersentuh ✓.
