/*
  Warnings:

  - You are about to drop the column `jenis_sim` on the `driver_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `masa_berlaku_sim` on the `driver_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `no_sim` on the `driver_profiles` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "JenisSim" ADD VALUE 'C';

-- AlterTable
ALTER TABLE "driver_profiles" DROP COLUMN "jenis_sim",
DROP COLUMN "masa_berlaku_sim",
DROP COLUMN "no_sim";

-- AlterTable
ALTER TABLE "kendaraan" ALTER COLUMN "kir_berlaku_sampai" DROP NOT NULL;

-- CreateTable
CREATE TABLE "driver_sim" (
    "id" TEXT NOT NULL,
    "driver_profile_id" TEXT NOT NULL,
    "no_sim" VARCHAR(30) NOT NULL,
    "jenis_sim" "JenisSim" NOT NULL,
    "masa_berlaku_sim" DATE NOT NULL,

    CONSTRAINT "driver_sim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "driver_sim_driver_profile_id_idx" ON "driver_sim"("driver_profile_id");

-- AddForeignKey
ALTER TABLE "driver_sim" ADD CONSTRAINT "driver_sim_driver_profile_id_fkey" FOREIGN KEY ("driver_profile_id") REFERENCES "driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
