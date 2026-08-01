-- CreateEnum
CREATE TYPE "KategoriPengirim" AS ENUM ('SALES', 'OJOL', 'EKSPEDISI');

-- CreateEnum
CREATE TYPE "StatusSjEksternal" AS ENUM ('DIBAWA', 'DIKEMBALIKAN');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OPERASIONAL';

-- CreateTable
CREATE TABLE "surat_jalan_eksternal" (
    "id" TEXT NOT NULL,
    "nomor_sj" VARCHAR(30) NOT NULL,
    "tanggal" DATE NOT NULL,
    "kategori_pengirim" "KategoriPengirim" NOT NULL,
    "nama_pengirim" VARCHAR(120) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "keterangan_barang" TEXT NOT NULL,
    "status" "StatusSjEksternal" NOT NULL DEFAULT 'DIBAWA',
    "dikembalikan_at" TIMESTAMPTZ(6),
    "dibuat_oleh" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "surat_jalan_eksternal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_bbm" (
    "id" TEXT NOT NULL,
    "nama_produk" VARCHAR(60) NOT NULL,
    "harga_per_liter" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "master_bbm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_throttle" (
    "id" TEXT NOT NULL,
    "identifier" VARCHAR(60) NOT NULL,
    "gagal_count" INTEGER NOT NULL DEFAULT 0,
    "terkunci_sampai" TIMESTAMPTZ(6),
    "last_ip" VARCHAR(64),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_throttle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surat_jalan_eksternal_nomor_sj_key" ON "surat_jalan_eksternal"("nomor_sj");

-- CreateIndex
CREATE INDEX "surat_jalan_eksternal_status_idx" ON "surat_jalan_eksternal"("status");

-- CreateIndex
CREATE INDEX "surat_jalan_eksternal_tanggal_idx" ON "surat_jalan_eksternal"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "master_bbm_nama_produk_key" ON "master_bbm"("nama_produk");

-- CreateIndex
CREATE INDEX "master_bbm_is_active_idx" ON "master_bbm"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "login_throttle_identifier_key" ON "login_throttle"("identifier");

-- AddForeignKey
ALTER TABLE "surat_jalan_eksternal" ADD CONSTRAINT "surat_jalan_eksternal_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surat_jalan_eksternal" ADD CONSTRAINT "surat_jalan_eksternal_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
