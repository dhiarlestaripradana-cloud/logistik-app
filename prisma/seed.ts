import { PrismaClient, Role } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const prisma = new PrismaClient();

// -------------------------------------------------------------
//  Seed Super Admin perdana.
//  Idempoten: aman dijalankan berkali-kali (pakai upsert).
//  Kredensial diambil dari .env — JANGAN hardcode password di repo.
// -------------------------------------------------------------

async function main() {
  const nama = process.env.SEED_ADMIN_NAMA ?? "Administrator Utama";
  const username = process.env.SEED_ADMIN_USERNAME ?? "superadmin";
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "SEED_ADMIN_PASSWORD belum di-set di .env — batal seeding demi keamanan."
    );
  }

  // Parameter argon2id yang seimbang untuk VPS 2–4GB.
  const passwordHash = await hash(password, {
    memoryCost: 19456, // ~19 MB
    timeCost: 2,
    parallelism: 1,
  });

  const admin = await prisma.user.upsert({
    where: { username },
    update: {}, // jika sudah ada, jangan timpa (hindari reset password tak sengaja)
    create: {
      nama,
      username,
      passwordHash,
      role: Role.SUPER_ADMIN,
      isActive: true,
    },
  });

  // Akun staf OPERASIONAL perdana (opsional — isi env utk mengaktifkan).
  const opsUsername = process.env.SEED_OPS_USERNAME;
  const opsPassword = process.env.SEED_OPS_PASSWORD;
  if (opsUsername && opsPassword) {
    const opsHash = await hash(opsPassword, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
    const ops = await prisma.user.upsert({
      where: { username: opsUsername },
      update: {},
      create: {
        nama: process.env.SEED_OPS_NAMA ?? "Staf Operasional",
        username: opsUsername,
        passwordHash: opsHash,
        role: Role.OPERASIONAL,
        isActive: true,
      },
    });
    console.log(`✅ Staf Operasional siap: ${ops.username} (${ops.role})`);
  }

  // ---- Master BBM default (harga indikatif — Admin bebas ubah di /master-bbm) ----
  const bbmDefault = [
    { namaProduk: "Biosolar (B35)", hargaPerLiter: 6800 },
    { namaProduk: "Dexlite", hargaPerLiter: 14600 },
    { namaProduk: "Pertamina Dex", hargaPerLiter: 15100 },
    { namaProduk: "Pertalite", hargaPerLiter: 10000 },
    { namaProduk: "Pertamax", hargaPerLiter: 12500 },
    { namaProduk: "Shell Diesel", hargaPerLiter: 15200 },
  ];
  for (const b of bbmDefault) {
    // upsert: harga yang sudah diubah Admin TIDAK ditimpa saat seed ulang.
    await prisma.masterBbm.upsert({
      where: { namaProduk: b.namaProduk },
      update: {},
      create: b,
    });
  }
  console.log(`✅ Master BBM siap: ${bbmDefault.length} produk default`);

  console.log("✅ Super Admin siap:");
  console.log(`   Nama     : ${admin.nama}`);
  console.log(`   Username : ${admin.username}`);
  console.log(`   Role     : ${admin.role}`);
  console.log("   (Login dengan password dari SEED_ADMIN_PASSWORD)");
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
