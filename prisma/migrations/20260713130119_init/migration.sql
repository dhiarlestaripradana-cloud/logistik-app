-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'DRIVER');

-- CreateEnum
CREATE TYPE "JenisSim" AS ENUM ('A', 'B1', 'B1_UMUM', 'B2', 'B2_UMUM');

-- CreateEnum
CREATE TYPE "JenisArmada" AS ENUM ('PICKUP', 'CDE', 'CDD', 'FUSO', 'TRONTON', 'LAINNYA');

-- CreateEnum
CREATE TYPE "StatusKendaraan" AS ENUM ('TERSEDIA', 'DALAM_PERJALANAN', 'PERLU_SERVIS', 'DALAM_SERVIS', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "StatusPerjalanan" AS ENUM ('DRAFT', 'DITUGASKAN', 'BERJALAN', 'MENUNGGU_VERIFIKASI', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusDrop" AS ENUM ('MENUNGGU', 'TERKIRIM', 'GAGAL');

-- CreateEnum
CREATE TYPE "StatusLaporan" AS ENUM ('DRAFT', 'SUBMITTED', 'PERLU_REVISI', 'DISETUJUI');

-- CreateEnum
CREATE TYPE "KategoriBiaya" AS ENUM ('BBM', 'PAK_OGAH', 'PARKIR', 'STEAM', 'SERVIS_DARURAT', 'LAINNYA');

-- CreateEnum
CREATE TYPE "TipeKas" AS ENUM ('MASUK', 'KELUAR');

-- CreateEnum
CREATE TYPE "KategoriKas" AS ENUM ('MODAL_MASUK', 'SETTLEMENT_TRIP', 'ATK', 'LISTRIK_AIR', 'SERVIS_BENGKEL', 'PAJAK_KIR', 'GAJI', 'LAIN_LAIN');

-- CreateEnum
CREATE TYPE "JenisServis" AS ENUM ('RUTIN', 'DARURAT_LAPANGAN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "telepon" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "no_sim" VARCHAR(30),
    "jenis_sim" "JenisSim",
    "masa_berlaku_sim" DATE,
    "alamat" TEXT,
    "foto_url" VARCHAR(255),

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kendaraan" (
    "id" TEXT NOT NULL,
    "nomor_polisi" VARCHAR(15) NOT NULL,
    "merk" VARCHAR(50) NOT NULL,
    "tipe" VARCHAR(50) NOT NULL,
    "jenis_armada" "JenisArmada" NOT NULL,
    "tahun" SMALLINT NOT NULL,
    "tanggal_pembelian" DATE NOT NULL,
    "odometer_saat_ini" INTEGER NOT NULL DEFAULT 0,
    "interval_servis_km" INTEGER NOT NULL DEFAULT 10000,
    "km_servis_terakhir" INTEGER NOT NULL DEFAULT 0,
    "pajak_berlaku_sampai" DATE NOT NULL,
    "kir_berlaku_sampai" DATE NOT NULL,
    "standar_km_per_liter" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" "StatusKendaraan" NOT NULL DEFAULT 'TERSEDIA',
    "catatan" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "kendaraan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "nama" VARCHAR(150) NOT NULL,
    "alamat" TEXT NOT NULL,
    "telepon" VARCHAR(20),
    "pic" VARCHAR(100),
    "default_uang_satpam" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "default_uang_gudang" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perjalanan" (
    "id" TEXT NOT NULL,
    "nomor_sj" VARCHAR(30) NOT NULL,
    "kendaraan_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "dibuat_oleh" TEXT NOT NULL,
    "tanggal_berangkat" TIMESTAMPTZ(6) NOT NULL,
    "km_awal" INTEGER NOT NULL,
    "km_akhir" INTEGER,
    "uang_jalan" DECIMAL(14,2) NOT NULL,
    "status" "StatusPerjalanan" NOT NULL DEFAULT 'DRAFT',
    "total_realisasi" DECIMAL(14,2),
    "selisih" DECIMAL(14,2),
    "catatan" TEXT,
    "verified_by" TEXT,
    "verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "perjalanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tujuan_perjalanan" (
    "id" TEXT NOT NULL,
    "perjalanan_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "urutan" SMALLINT NOT NULL,
    "uang_satpam" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "uang_gudang" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status_drop" "StatusDrop" NOT NULL DEFAULT 'MENUNGGU',
    "catatan" TEXT,

    CONSTRAINT "tujuan_perjalanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_driver" (
    "id" TEXT NOT NULL,
    "perjalanan_id" TEXT NOT NULL,
    "km_akhir" INTEGER NOT NULL,
    "total_biaya_driver" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "StatusLaporan" NOT NULL DEFAULT 'DRAFT',
    "catatan_driver" TEXT,
    "catatan_admin" TEXT,
    "submitted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "laporan_driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biaya_perjalanan" (
    "id" TEXT NOT NULL,
    "laporan_id" TEXT NOT NULL,
    "kategori" "KategoriBiaya" NOT NULL,
    "tujuan_perjalanan_id" TEXT,
    "nominal" DECIMAL(12,2) NOT NULL,
    "liter" DECIMAL(6,2),
    "keterangan" TEXT,
    "foto_bukti_url" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biaya_perjalanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arus_kas" (
    "id" TEXT NOT NULL,
    "nomor_ref" VARCHAR(30) NOT NULL,
    "tanggal" DATE NOT NULL,
    "tipe" "TipeKas" NOT NULL,
    "kategori" "KategoriKas" NOT NULL,
    "nominal" DECIMAL(14,2) NOT NULL,
    "keterangan" TEXT NOT NULL,
    "perjalanan_id" TEXT,
    "saldo_sesudah" DECIMAL(14,2) NOT NULL,
    "dibuat_oleh" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arus_kas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servis_kendaraan" (
    "id" TEXT NOT NULL,
    "kendaraan_id" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "jenis" "JenisServis" NOT NULL,
    "km_saat_servis" INTEGER,
    "biaya" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "keterangan" TEXT,
    "foto_nota_url" VARCHAR(255),
    "biaya_perjalanan_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servis_kendaraan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_counter" (
    "id" TEXT NOT NULL,
    "jenis" VARCHAR(10) NOT NULL,
    "tahun" INTEGER NOT NULL,
    "bulan" INTEGER NOT NULL,
    "terakhir" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "document_counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_user_id_key" ON "driver_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "kendaraan_nomor_polisi_key" ON "kendaraan"("nomor_polisi");

-- CreateIndex
CREATE INDEX "kendaraan_status_idx" ON "kendaraan"("status");

-- CreateIndex
CREATE INDEX "customers_is_active_idx" ON "customers"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "perjalanan_nomor_sj_key" ON "perjalanan"("nomor_sj");

-- CreateIndex
CREATE INDEX "perjalanan_status_idx" ON "perjalanan"("status");

-- CreateIndex
CREATE INDEX "perjalanan_driver_id_status_idx" ON "perjalanan"("driver_id", "status");

-- CreateIndex
CREATE INDEX "perjalanan_kendaraan_id_idx" ON "perjalanan"("kendaraan_id");

-- CreateIndex
CREATE INDEX "tujuan_perjalanan_perjalanan_id_idx" ON "tujuan_perjalanan"("perjalanan_id");

-- CreateIndex
CREATE UNIQUE INDEX "tujuan_perjalanan_perjalanan_id_urutan_key" ON "tujuan_perjalanan"("perjalanan_id", "urutan");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_driver_perjalanan_id_key" ON "laporan_driver"("perjalanan_id");

-- CreateIndex
CREATE INDEX "biaya_perjalanan_laporan_id_idx" ON "biaya_perjalanan"("laporan_id");

-- CreateIndex
CREATE INDEX "biaya_perjalanan_kategori_idx" ON "biaya_perjalanan"("kategori");

-- CreateIndex
CREATE UNIQUE INDEX "arus_kas_nomor_ref_key" ON "arus_kas"("nomor_ref");

-- CreateIndex
CREATE INDEX "arus_kas_tanggal_idx" ON "arus_kas"("tanggal");

-- CreateIndex
CREATE INDEX "arus_kas_kategori_idx" ON "arus_kas"("kategori");

-- CreateIndex
CREATE UNIQUE INDEX "servis_kendaraan_biaya_perjalanan_id_key" ON "servis_kendaraan"("biaya_perjalanan_id");

-- CreateIndex
CREATE INDEX "servis_kendaraan_kendaraan_id_idx" ON "servis_kendaraan"("kendaraan_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_counter_jenis_tahun_bulan_key" ON "document_counter"("jenis", "tahun", "bulan");

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perjalanan" ADD CONSTRAINT "perjalanan_kendaraan_id_fkey" FOREIGN KEY ("kendaraan_id") REFERENCES "kendaraan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perjalanan" ADD CONSTRAINT "perjalanan_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perjalanan" ADD CONSTRAINT "perjalanan_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perjalanan" ADD CONSTRAINT "perjalanan_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tujuan_perjalanan" ADD CONSTRAINT "tujuan_perjalanan_perjalanan_id_fkey" FOREIGN KEY ("perjalanan_id") REFERENCES "perjalanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tujuan_perjalanan" ADD CONSTRAINT "tujuan_perjalanan_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_driver" ADD CONSTRAINT "laporan_driver_perjalanan_id_fkey" FOREIGN KEY ("perjalanan_id") REFERENCES "perjalanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biaya_perjalanan" ADD CONSTRAINT "biaya_perjalanan_laporan_id_fkey" FOREIGN KEY ("laporan_id") REFERENCES "laporan_driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biaya_perjalanan" ADD CONSTRAINT "biaya_perjalanan_tujuan_perjalanan_id_fkey" FOREIGN KEY ("tujuan_perjalanan_id") REFERENCES "tujuan_perjalanan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arus_kas" ADD CONSTRAINT "arus_kas_perjalanan_id_fkey" FOREIGN KEY ("perjalanan_id") REFERENCES "perjalanan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arus_kas" ADD CONSTRAINT "arus_kas_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servis_kendaraan" ADD CONSTRAINT "servis_kendaraan_kendaraan_id_fkey" FOREIGN KEY ("kendaraan_id") REFERENCES "kendaraan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servis_kendaraan" ADD CONSTRAINT "servis_kendaraan_biaya_perjalanan_id_fkey" FOREIGN KEY ("biaya_perjalanan_id") REFERENCES "biaya_perjalanan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
