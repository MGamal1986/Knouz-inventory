import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.admin.findUnique({ where: { username: "admin" } });

  if (!existing) {
    const passwordHash = await bcrypt.hash("0000", 10);
    await prisma.admin.create({
      data: {
        username: "admin",
        passwordHash,
        fullName: "Default Admin",
      },
    });
    console.log("Default admin created -> username: admin | password: 0000");
    console.log("IMPORTANT: log in and change this password immediately.");
  } else {
    console.log("Admin user already exists, skipping seed.");
  }

  // Seed a couple of starter categories if none exist yet
  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: [
        { name: "Rings", baseCode: "RNG", codeRangeStart: 1, codeRangeEnd: 9999 },
        { name: "Bracelets", baseCode: "BRC", codeRangeStart: 1, codeRangeEnd: 9999 },
        { name: "Necklaces", baseCode: "NCK", codeRangeStart: 1, codeRangeEnd: 9999 },
        { name: "Keychains", baseCode: "KCH", codeRangeStart: 1, codeRangeEnd: 9999 },
        { name: "Accessories", baseCode: "ACC", codeRangeStart: 1, codeRangeEnd: 9999 },
      ],
    });
    console.log("Seeded starter categories: Rings, Bracelets, Necklaces, Keychains, Accessories");
  }

  // Opening capital balance: recorded once as the first ledger movement.
  const initialCapital = await prisma.capitalMovement.findFirst({ where: { type: "INITIAL" } });
  if (!initialCapital) {
    await prisma.capitalMovement.create({
      data: { type: "INITIAL", amount: 950, description: "Opening capital balance" },
    });
    console.log("Seeded opening capital balance: EGP 950.00");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
