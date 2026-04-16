import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.harvest.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.culture.deleteMany();
  await prisma.parcel.deleteMany();
  await prisma.user.deleteMany();
  await prisma.farm.deleteMany();

  const farm = await prisma.farm.create({
    data: { name: "Ferme démo AgriGestion" },
  });

  const adminHash = await bcrypt.hash("admin123", 10);
  const farmerHash = await bcrypt.hash("farmer123", 10);

  await prisma.user.create({
    data: {
      email: "admin@agrigestion.local",
      passwordHash: adminHash,
      name: "Administrateur",
      role: "ADMIN",
      farmId: farm.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "agriculteur@agrigestion.local",
      passwordHash: farmerHash,
      name: "Jean Agriculteur",
      role: "FARMER",
      farmId: farm.id,
    },
  });

  const p1 = await prisma.parcel.create({
    data: {
      farmId: farm.id,
      name: "Parcelle Nord",
      city: "Meknès",
      soilType: "Limoneux",
    },
  });

  const p2 = await prisma.parcel.create({
    data: {
      farmId: farm.id,
      name: "Parcelle Sud",
      city: "Fès",
      soilType: "Argileux",
    },
  });

  const tomate = await prisma.culture.create({
    data: {
      parcelId: p1.id,
      plantType: "Tomate",
      seedType: "Hybride F1",
      sowingDate: new Date("2025-02-01"),
      notes: "Serre tunnel",
    },
  });

  const ble = await prisma.culture.create({
    data: {
      parcelId: p2.id,
      plantType: "Blé dur",
      seedType: "Variété locale",
      sowingDate: new Date("2024-11-15"),
    },
  });

  await prisma.harvest.createMany({
    data: [
      {
        cultureId: tomate.id,
        date: new Date("2025-06-10"),
        quantity: 1200,
        unit: "kg",
        quality: "A",
        salePrice: 4.5,
      },
      {
        cultureId: tomate.id,
        date: new Date("2025-07-05"),
        quantity: 950,
        unit: "kg",
        quality: "B",
        salePrice: 4.2,
      },
      {
        cultureId: ble.id,
        date: new Date("2025-06-20"),
        quantity: 35,
        unit: "tonnes",
        quality: "A",
        salePrice: 320,
      },
    ],
  });

  await prisma.expense.createMany({
    data: [
      {
        farmId: farm.id,
        cultureId: tomate.id,
        label: "Engrais NPK",
        category: "Engrais",
        amount: 4200,
        date: new Date("2025-03-01"),
      },
      {
        farmId: farm.id,
        cultureId: tomate.id,
        label: "Irrigation",
        category: "Eau",
        amount: 1800,
        date: new Date("2025-04-10"),
      },
      {
        farmId: farm.id,
        cultureId: ble.id,
        label: "Semences",
        category: "Semences",
        amount: 9500,
        date: new Date("2024-11-01"),
      },
      {
        farmId: farm.id,
        cultureId: null,
        label: "Réparation tracteur",
        category: "Matériel",
        amount: 6500,
        date: new Date("2025-01-15"),
      },
    ],
  });

  console.log("Seed OK — comptes démo :");
  console.log("  admin@agrigestion.local / admin123");
  console.log("  agriculteur@agrigestion.local / farmer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
