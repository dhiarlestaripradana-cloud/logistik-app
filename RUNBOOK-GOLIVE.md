# 🚀 Runbook Go-Live — Sistem Operasional Logistik & Armada

**Skala target:** 1 Super Admin + 15 Driver (opsional +1 Operasional)
**Cara pakai:** kerjakan berurutan dari atas. Jangan lompat tahap. Setiap `[ ]` dicentang setelah benar-benar terbukti, bukan sekadar "kayaknya jalan".

**Prinsip Tech Lead:** di skala ini musuh Anda bukan performa (VPS kecil pun sanggup), tapi **kehilangan data keuangan, salah hitung uang, dan celah keamanan di internet publik**. Seluruh runbook diurutkan berdasarkan tiga risiko itu.

> **Aturan paling penting di seluruh dokumen ini** (baca sekarang, jangan sampai lupa):
> Setelah akun produksi dibuat dan orang mulai login, **JANGAN PERNAH menjalankan `prisma migrate reset`** atau menghapus volume database. Sesi login (JWT) bertahan melewati reset dan akan menunjuk user yang sudah terhapus — itu persis akar bug kas yang sudah kita bereskan. Perubahan skema ke depan cukup `prisma migrate deploy`.

---

## TAHAP 0 — Prasyarat (sebelum menyentuh apa pun)

- [ ] Domain sudah disiapkan (mis. `logistik.perusahaan.co.id`)
- [ ] VPS siap: **minimal 2GB RAM, rekomendasi 4GB + swap 2GB** (alasan di Tahap 5)
- [ ] DNS domain (A record) sudah diarahkan ke IP VPS — cek dengan `ping domain-anda`
- [ ] Akses SSH ke VPS lancar
- [ ] Sudah terpasang di VPS: `docker -v` dan `docker compose version` jalan
- [ ] Punya folder backup di VPS, mis. `/backup` (`sudo mkdir -p /backup`)

---

## TAHAP 1 — QC Fungsional (di laptop / staging, BUKAN di produksi)

Jalankan mode produksi lokal dulu supaya PWA & service worker aktif (di `npm run dev` service worker sengaja mati):

```bash
npm install
npm run build
npm start          # buka http://localhost:3000
```

### 1a. Jalankan checklist sprint yang sudah ada
- [ ] Semua poin di `SPRINT0.md` … `SPRINT4.md` lulus
- [ ] Semua poin di `REVISI-*.md`, `EKSPANSI.md`, `PATCH-KAS.md` lulus

### 1b. 8 Uji Regresi Kritis (masing-masing pernah jadi bug nyata — WAJIB lulus)
- [ ] **1. Settlement idempoten** — klik "Setujui" 2x cepat / buka 2 tab → kas **tidak** terpotong dua kali
- [ ] **2. Scoping driver** — login driver B, buka URL laporan milik driver A (`/tugas/<id-A>/lapor`) → **404**, bukan data A
- [ ] **3. KM Awal server-side** — terbitkan trip, cek `km_awal` di DB = odometer master; ubah lewat DevTools tidak berpengaruh
- [ ] **4. Liter BBM server-recompute** — kirim laporan BBM, cek `biaya_perjalanan.liter` = nominal ÷ harga master (bukan angka kiriman klien)
- [ ] **5. Matematika Opsi B** — skenario emas: uang jalan 300.000 + drop 50.000 + biaya driver 280.000 → hasil **"Driver setor 20.000"** (bukan reimburse)
- [ ] **6. SJ Eksternal nol uang** — cari kata "Rp" di PDF SJ Eksternal → **nihil**; buka /kas & Dashboard sebelum-sesudah membuat SJ Eksternal → **tidak berubah**
- [ ] **7. RBAC Operasional** — login akun OPERASIONAL, akses paksa `/kas` via URL → dilempar ke `/operasional`
- [ ] **8. Input kas manual** — simpan transaksi kas → berhasil; jika gagal, pesan error kini **menyebut sebabnya** (bukan "coba lagi" generik)

> Kalau ada satu saja yang merah di sini, **berhenti** dan laporkan ke saya sebelum lanjut. Jangan bawa bug fungsional ke uji keuangan.

---

## TAHAP 2 — Uji Keuangan / "Dry-Run Satu Bulan Palsu" (paling penting, paling sering dilewat)

Sistem ini memegang uang. Tujuan tahap ini: membuktikan **Saldo Buku = uang fisik sungguhan, sampai rupiah terakhir**, sebelum uang asli masuk.

### 2a. Siapkan data dummy realistis
- [ ] 5 armada, 10 customer, 5 driver, isi Master BBM
- [ ] Catat 1–2 Modal Masuk awal (mis. modal kas 10.000.000)

### 2b. Jalankan siklus penuh 15–20 trip
- [ ] Terbitkan SJ → driver "Mulai Perjalanan" → isi laporan (BBM, parkir, dll.) → verifikasi → settlement
- [ ] Sengaja buat **ketiga skenario selisih**: driver setor (+), kantor reimburse (−), dan pas (0)
- [ ] Selipkan beberapa pengeluaran operasional kantor & 1–2 servis darurat

### 2c. Rekonsiliasi manual (langkah penentu)
- [ ] Di kertas/Excel, hitung manual: `saldo akhir = modal masuk − semua uang keluar + semua setoran`
- [ ] Bandingkan dengan **Saldo Buku Kas** di sistem → **harus sama PERSIS**
- [ ] Cetak **PDF Buku Kas** periode itu → total masuk/keluar & saldo akhir cocok dengan layar
- [ ] Cetak **PDF Laporan Driver** untuk 1–2 driver → akumulasi selisih setor/nombok masuk akal

> ❗ Kalau saldo meleset walau 1 rupiah, ada bug akuntansi. **Stop dan lapor ke saya** — jauh lebih murah dibereskan sekarang daripada setelah 3 bulan transaksi asli.

### 2d. Reset data sebelum produksi
- [ ] Setelah puas, bersihkan data dummy. Karena ini **belum go-live** dan belum ada user asli, di tahap ini `npx prisma migrate reset` masih boleh (menghapus semua). **Ini kesempatan terakhir Anda boleh reset.**

---

## TAHAP 3 — Hardening Keamanan & Data (WAJIB sebelum publik)

Berurutan berdasarkan prioritas.

### 3a. Backup + UJI RESTORE (prioritas #1)
Backup yang belum pernah di-restore itu harapan, bukan jaminan.

- [ ] Pasang cron backup harian DB di VPS (jam 02:00 WIB):
  ```bash
  crontab -e
  # tambahkan baris:
  0 2 * * * docker exec logistik_db pg_dump -U logistik logistik_db | gzip > /backup/db_$(date +\%F).sql.gz
  ```
- [ ] **Lakukan restore drill sekali** (buktikan backup bisa dipulihkan):
  ```bash
  # 1. buat dump manual
  docker exec logistik_db pg_dump -U logistik logistik_db | gzip > /backup/uji.sql.gz
  # 2. buat DB uji kosong, lalu restore ke sana
  docker exec -it logistik_db createdb -U logistik logistik_uji
  gunzip -c /backup/uji.sql.gz | docker exec -i logistik_db psql -U logistik -d logistik_uji
  # 3. cek jumlah baris tabel penting di logistik_uji — harus sama dgn asli
  # 4. hapus DB uji setelah puas
  docker exec -it logistik_db dropdb -U logistik logistik_uji
  ```
  - [ ] Data di DB uji terbukti utuh → backup Anda **nyata**, bukan harapan

### 3b. Backup folder `uploads` juga (pg_dump TIDAK mencakup foto!)
15 driver mengunggah foto struk/nota tiap hari. Foto disimpan di Docker volume `uploads`, terpisah dari database.

- [ ] Cek nama volume asli: `docker volume ls | grep uploads` (biasanya `logistik-app_uploads`)
- [ ] Tambahkan cron backup foto harian (sesuaikan nama volume dari langkah di atas):
  ```bash
  0 3 * * * docker run --rm -v logistik-app_uploads:/data -v /backup:/backup alpine tar czf /backup/uploads_$(date +\%F).tar.gz -C /data .
  ```
- [ ] (Opsional tapi dianjurkan) salin `/backup` ke storage lain (Google Drive/S3/hard disk kantor) berkala — jangan taruh semua telur di satu VPS

### 3c. Ganti SEMUA secret produksi
- [ ] `AUTH_SECRET` baru: `npx auth secret` (atau `openssl rand -base64 32`) → tempel ke `.env`
- [ ] `POSTGRES_PASSWORD` kuat & unik → samakan di `DATABASE_URL` (host tetap `@db:5432`)
- [ ] `SEED_ADMIN_PASSWORD` = password admin sungguhan (kuat), bukan contoh dari `.env.example`
- [ ] Isi `APP_URL` & `APP_DOMAIN` dengan domain asli, dan identitas `COMPANY_*` untuk kop PDF
- [ ] Pastikan file `.env` **tidak** ikut ter-commit ke git (cek `.gitignore`)

### 3d. Tutup port database dari internet (celah paling umum diretas)
`docker-compose.yml` sengaja mengekspos `5432` untuk dev di laptop. Di VPS ini **berbahaya**.

- [ ] Pilih salah satu:
  - **Opsi A (paling aman):** hapus/comment blok `ports: - "5432:5432"` pada service `db` di `docker-compose.yml`. Aplikasi tetap jalan karena `app` konek via jaringan internal Docker (`@db:5432`), bukan lewat host.
  - **Opsi B:** biarkan, tapi tutup di firewall: `sudo ufw deny 5432`
- [ ] Firewall hanya buka yang perlu:
  ```bash
  sudo ufw allow 22      # SSH
  sudo ufw allow 80      # HTTP (Caddy → redirect ke HTTPS)
  sudo ufw allow 443     # HTTPS
  sudo ufw enable
  sudo ufw status        # verifikasi 5432 TIDAK ada di daftar allow
  ```

### 3e. HTTPS (Caddy sudah otomatis, tinggal verifikasi)
- [ ] Setelah deploy (Tahap 4), buka `https://domain-anda` → gembok hijau, sertifikat valid
- [ ] Akses `http://` (tanpa s) → otomatis redirect ke `https://`

### 3f. Rate-limit login — ✅ SUDAH TERPASANG
Perlindungan brute-force di halaman login sudah aktif (penguncian progresif
per-username, berbasis DB). Uji sesuai `PATCH-RATE-LIMIT.md`.
- [ ] Salah password 5x pada satu username → akun terkunci sementara (pesan kuning 🔒)
- [ ] Tunggu durasi kunci ATAU login benar setelahnya → hitungan bersih kembali
- [ ] Baris muncul di tabel `login_throttle` (audit percobaan gagal)

---

## TAHAP 4 — Deploy ke VPS

Prasyarat: DNS sudah mengarah ke VPS, Tahap 3c–3d beres.

- [ ] Kirim source + `.env` produksi ke VPS (git clone / scp). **Pastikan `.env` berisi nilai produksi**, host DB `@db:5432`
- [ ] Build & jalankan seluruh stack:
  ```bash
  docker compose up -d --build
  docker compose ps        # db, app, caddy semua 'running'/'healthy'
  ```
  > Migrasi `prisma migrate deploy` **jalan otomatis** saat container `app` start (sudah diatur di Dockerfile) — non-destruktif, aman.

- [ ] **Seed admin perdana (TIDAK otomatis — jalankan manual sekali):**
  ```bash
  docker exec -it logistik_app npm run db:seed
  ```
  - [ ] Muncul `✅ Super Admin siap: ... (SUPER_ADMIN)`
  - [ ] (Jika pakai staf kantor) isi `SEED_OPS_*` di `.env` lalu ulangi seed → akun OPERASIONAL dibuat
  > Catatan: jika `npm run db:seed` gagal di image standalone (tsx tidak tersedia), beri tahu saya — ada jalur alternatif membuat admin perdana dengan aman tanpa reset apa pun.

- [ ] Cek log tidak ada error fatal: `docker compose logs -f app` (lalu Ctrl-C)

---

## TAHAP 5 — Smoke Test di Produksi (URL asli)

- [ ] `https://domain-anda` terbuka, HTTPS valid, mendarat di `/login`
- [ ] Login Super Admin sukses → `/dashboard`
- [ ] Buat 1 armada, 1 customer, 1 driver uji
- [ ] Terbitkan 1 SJ → **cetak PDF Surat Jalan** (menguji Puppeteer/Chromium di VPS)
  - [ ] Emoji 🛡️📦 & TOTAL TUNAI tampil benar di PDF (font emoji sudah dipasang di Dockerfile)
- [ ] **PWA di HP Android sungguhan** (bukan cuma emulator): buka URL → "Add to Home Screen"
  - [ ] Login driver uji → Mulai Perjalanan → isi laporan
  - [ ] **Kamera + kompresi foto** jalan (foto masuk < 300KB)
  - [ ] **Draft offline**: isi separuh, matikan koneksi, tutup–buka → data pulih

> **Tentang RAM/swap:** Puppeteer meluncurkan Chromium tiap cetak PDF. Di VPS 2GB tanpa swap, cetak PDF berbarengan beban lain bisa OOM (aplikasi mati mendadak). Kalau belum pasang swap:
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
> sudo mkswap /swapfile && sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```
> - [ ] Swap aktif (`free -h` menampilkan Swap 2Gi)

---

## TAHAP 6 — Pilot Terbatas, BARU Rollout Penuh

Jangan lempar 15 driver sekaligus di hari pertama.

- [ ] Hapus data uji dari smoke test (lewat UI, **bukan** reset DB)
- [ ] Buatkan akun untuk **1–2 driver paling melek HP** lebih dulu
- [ ] Jalankan **operasi nyata 1 minggu penuh** dengan pilot ini
- [ ] Kumpulkan temuan lapangan (UI membingungkan? langkah lambat? sinyal?) → lapor ke saya untuk revisi
- [ ] Setelah pilot mulus: buat 13 akun driver sisanya
- [ ] Training singkat + dampingi hari pertama (portal driver sudah sesederhana mungkin, tapi tetap temani)
- [ ] Ganti password admin perdana bila sempat dibagikan saat setup

---

## Yang BELUM Ada — transparansi risiko (bukan blocker di skala ini)

Anda berhak tahu batas sistem saat ini:
- **Belum ada automated test** — QC kita manual per sprint. Wajar untuk tim sekecil ini, tapi tiap perubahan ke depan harus diuji manual ulang.
- **Belum ada reset password mandiri** — admin mereset password driver secara manual (cukup untuk 15 orang).
- **Monitoring = log terminal** — belum ada dashboard uptime/alert otomatis.

Kalau tim membesar, tiga hal pertama yang saya sarankan diangkat lebih dulu.

---

## Kartu Darurat (simpan, untuk saat panik)

| Situasi | Tindakan aman |
|---|---|
| Aplikasi mati / tidak bisa diakses | `docker compose ps` → `docker compose logs -f app` → `docker compose restart app` |
| Perlu update kode | `git pull` → `docker compose up -d --build` (migrasi jalan otomatis, **jangan** reset) |
| Salah input kas / laporan | **Jangan hapus/edit DB manual.** Buku Kas append-only — koreksi lewat entri jurnal balik dari UI |
| "Gagal simpan" di kas & pesannya menyuruh login ulang | Itu sesi menunjuk user lama — **Keluar lalu Login ulang** |
| Butuh pulihkan data | Restore dari `/backup` sesuai prosedur Tahap 3a (yang sudah Anda uji) |
| Ganti skema database | Buat migrasi baru → `docker exec logistik_app npx prisma migrate deploy`. **TIDAK PERNAH** `migrate reset` di produksi |

---

**Ringkasan urutan:** QC fungsional (8 uji kritis) → uji keuangan sampai saldo cocok ke rupiah → backup+restore drill → tutup port DB & ganti secret → deploy → smoke test di HP asli → pilot 1 minggu → rollout 15 driver. Kerjakan berurutan, dan panggil saya di titik mana pun yang merah.
