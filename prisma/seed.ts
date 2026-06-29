import "dotenv/config";

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: "modern-edu" },
    update: {},
    create: {
      name: "Modern Edu",
      slug: "modern-edu",
    },
  });

  const username = (process.env.SEED_ADMIN_USERNAME ?? "admin").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!";
  const fullName = process.env.SEED_ADMIN_FULL_NAME ?? "Modern Edu Admin";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: {
      organizationId_username: {
        organizationId: organization.id,
        username,
      },
    },
    update: {
      fullName,
      passwordHash,
      role: UserRole.ADMIN,
      status: "ACTIVE",
    },
    create: {
      organizationId: organization.id,
      fullName,
      username,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log("Seed admin user is ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
