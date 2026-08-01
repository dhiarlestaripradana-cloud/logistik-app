/*
  Warnings:

  - You are about to drop the column `jenis_armada` on the `kendaraan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[kode_customer]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kode_customer` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wilayah` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "JenisBbm" AS ENUM ('SOLAR', 'DEXLITE', 'PERTAMINA_DEX', 'PERTALITE', 'PERTAMAX', 'PERTAMAX_TURBO', 'LAINNYA');

-- AlterEnum
ALTER TYPE "KategoriKas" ADD VALUE 'OPERASIONAL_LAIN';

-- AlterTable
ALTER TABLE "arus_kas" ADD COLUMN     "pemberi" VARCHAR(100),
ADD COLUMN     "penerima" VARCHAR(100);

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "kode_customer" VARCHAR(30) NOT NULL,
ADD COLUMN     "sales" VARCHAR(100),
ADD COLUMN     "wilayah" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "driver_profiles" ADD COLUMN     "jenis_kelamin" "JenisKelamin",
ADD COLUMN     "tanggal_lahir" DATE,
ADD COLUMN     "tempat_lahir" VARCHAR(100);

-- AlterTable
ALTER TABLE "kendaraan" DROP COLUMN "jenis_armada",
ADD COLUMN     "jenis_bbm" "JenisBbm" NOT NULL DEFAULT 'SOLAR';

-- DropEnum
DROP TYPE "JenisArmada";

-- CreateTable
CREATE TABLE "operasional_lain" (
    "id" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "user_id" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "jumlah" DECIMAL(10,2) NOT NULL,
    "harga_satuan" DECIMAL(12,2) NOT NULL,
    "total_harga" DECIMAL(14,2) NOT NULL,
    "arus_kas_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operasional_lain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operasional_lain_arus_kas_id_key" ON "operasional_lain"("arus_kas_id");

-- CreateIndex
CREATE INDEX "operasional_lain_tanggal_idx" ON "operasional_lain"("tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "customers_kode_customer_key" ON "customers"("kode_customer");

-- CreateIndex
CREATE INDEX "customers_wilayah_idx" ON "customers"("wilayah");

-- AddForeignKey
ALTER TABLE "operasional_lain" ADD CONSTRAINT "operasional_lain_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operasional_lain" ADD CONSTRAINT "operasional_lain_arus_kas_id_fkey" FOREIGN KEY ("arus_kas_id") REFERENCES "arus_kas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
