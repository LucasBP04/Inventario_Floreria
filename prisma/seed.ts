import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 Seeding Florería Perla database...");

  // Owner user
  const passwordHash = await bcrypt.hash("Admin1234!", 12);

  const owner = await prisma.user.upsert({
    where: { email: "admin@floreria.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@floreria.com",
      passwordHash,
      role: "OWNER",
    },
  });
  console.log(`✅ Owner created: ${owner.email}`);

  // Flower catalog
  const flowers = await Promise.all([
    prisma.flower.upsert({
      where: { id: "000000000000000000000001" },
      update: {},
      create: {
        name: "Rosa Roja",
        bouquetSize: 12,
        pricePerBouquet: 280,
        isFoliage: false,
      },
    }),
    prisma.flower.upsert({
      where: { id: "000000000000000000000002" },
      update: {},
      create: {
        name: "Girasol",
        bouquetSize: 10,
        pricePerBouquet: 200,
        isFoliage: false,
      },
    }),
    prisma.flower.upsert({
      where: { id: "000000000000000000000003" },
      update: {},
      create: {
        name: "Lirio Blanco",
        bouquetSize: 8,
        pricePerBouquet: 240,
        isFoliage: false,
      },
    }),
    prisma.flower.upsert({
      where: { id: "000000000000000000000004" },
      update: {},
      create: {
        name: "Follaje Silvestre",
        bouquetSize: 20,
        pricePerBouquet: 120,
        isFoliage: true,
      },
    }),
  ]);
  console.log(`✅ ${flowers.length} flowers created`);

  // Demo season
  await prisma.season.upsert({
    where: { id: "000000000000000000000010" },
    update: {},
    create: {
      name: "San Valentín 2026",
      startDate: new Date("2026-02-10"),
      endDate: new Date("2026-02-15"),
      multiplier: 1.5,
      targetUnits: 100,
    },
  });
  console.log("✅ Demo season created");

  console.log("\n🎉 Seed complete!");
  console.log("   Login: admin@floreria.com / Admin1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
