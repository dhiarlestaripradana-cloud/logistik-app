# 🛠️ Panduan Setup Sprint 0 — Langkah demi Langkah

Ikuti berurutan. Perkiraan waktu: 15–20 menit sampai bisa login sebagai Super Admin.

## Prasyarat (sekali saja)
- **Node.js 20 LTS** — cek: `node -v`
- **Docker + Docker Compose** — cek: `docker -v && docker compose version`
- Editor (VS Code disarankan)

---

## LANGKAH 1 — Siapkan folder & dependency

```bash
cd logistik-app          # masuk ke folder hasil ekstrak

# Install semua dependency
npm install
```

> Jika `npm install` menolak versi `next-auth@5.0.0-beta.25`, jalankan
> `npm install --legacy-peer-deps`. Ini normal untuk paket beta.

---

## LANGKAH 2 — Konfigurasi environment (.env)

```bash
cp .env.example .env
```

Buka `.env`, lalu isi tiga hal wajib:

1. **AUTH_SECRET** — generate:
   ```bash
   npx auth secret
   # atau: openssl rand -base64 32
   ```
   Salin hasilnya ke `AUTH_SECRET`.

2. **Password database** — ganti `POSTGRES_PASSWORD` dan samakan di `DATABASE_URL`.

3. **Kredensial admin perdana** — isi `SEED_ADMIN_USERNAME` & `SEED_ADMIN_PASSWORD`.

> **Untuk development di laptop**, ubah host `DATABASE_URL` dari `@db:5432`
> menjadi `@localhost:5432` (karena kita akan ekspos Postgres ke localhost).

---

## LANGKAH 3 — Nyalakan database (mode development)

Untuk dev, kita cukup jalankan container Postgres saja dulu. Buka `docker-compose.yml`, pada service `db` tambahkan sementara:

```yaml
    ports:
      - "5432:5432"
```

Lalu:

```bash
docker compose up -d db
docker compose ps        # pastikan status 'healthy'
```

---

## LANGKAH 4 — Migrasi & generate Prisma

```bash
# Buat tabel di database sesuai schema.prisma (10 tabel + enum + index)
npx prisma migrate dev --name init

# (otomatis menjalankan prisma generate juga)
```

Verifikasi visual:

```bash
npx prisma studio       # buka http://localhost:5555 — harus tampil 10 tabel kosong
```

---

## LANGKAH 5 — Seed Super Admin perdana

```bash
npm run db:seed
```

Output yang diharapkan:
```
✅ Super Admin siap:
   Nama     : Administrator Utama
   Username : superadmin
   Role     : SUPER_ADMIN
```

---

## LANGKAH 6 — Jalankan aplikasi

```bash
npm run dev
```

Buka **http://localhost:3000** → otomatis diarahkan ke `/login`.

Login dengan username & password dari `.env` (`SEED_ADMIN_*`).

**Kriteria sukses Sprint 0:**
- ✅ Login admin → masuk ke `/dashboard`, nama & role tampil benar.
- ✅ Coba akses `/tugas` sebagai admin → otomatis dilempar balik ke `/dashboard` (RBAC bekerja).
- ✅ Tombol "Keluar" → kembali ke `/login`.
- ✅ Password salah → pesan "Username atau password salah."

Jika keempat poin ini jalan, **Sprint 0 tuntas** dan fondasi kita solid.

---

## Lampiran — Deploy ke VPS (produksi, nanti setelah beberapa sprint)

```bash
# Di VPS, arahkan DNS domain ke IP VPS lebih dulu.
# Hapus 'ports: 5432' dari service db (jangan ekspos DB ke publik).
# Pastikan DATABASE_URL memakai host '@db:5432'.

cp .env.example .env     # isi APP_DOMAIN & APP_URL dengan domain asli
docker compose up -d --build

# Caddy otomatis menerbitkan sertifikat HTTPS Let's Encrypt.
# Migrasi & (opsional) seed dijalankan otomatis oleh container app saat start.
```

### Backup harian otomatis (dianjurkan sejak awal)
```bash
# Tambahkan ke crontab VPS: pg_dump harian jam 02:00 WIB
0 2 * * * docker exec logistik_db pg_dump -U logistik logistik_db | gzip > /backup/logistik_$(date +\%F).sql.gz
```

---

## Troubleshooting singkat

| Gejala | Solusi |
|---|---|
| `Can't reach database server` | Container `db` belum `healthy`, atau host di `DATABASE_URL` salah (dev pakai `localhost`, prod pakai `db`). |
| `@node-rs/argon2` error saat build | Sudah ditangani `serverExternalPackages` di `next.config.mjs`. Pastikan tidak dihapus. |
| Migrasi minta reset | Saat dev boleh `npx prisma migrate reset` (menghapus data). JANGAN di produksi. |
| Puppeteer error di VPS nanti | Dockerfile sudah set `--no-sandbox` via `PUPPETEER_EXECUTABLE_PATH` + Chromium sistem. |
