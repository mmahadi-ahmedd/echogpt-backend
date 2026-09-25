import { PrismaClient, RoleName, PlanType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: { name: RoleName.ADMIN },
  });

  const userRole = await prisma.role.upsert({
    where: { name: RoleName.USER },
    update: {},
    create: { name: RoleName.USER },
  });

  console.log('Roles seeded:', adminRole.name, userRole.name);

  // 2. Create a default admin user
  const adminEmail = 'admin@echogpt.dev';
  const adminPassword = 'Admin@12345'; // change after first login in a real deployment

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        roleId: adminRole.id,
        subscription: {
          create: {
            plan: PlanType.PREMIUM,
            dailyLimit: 500,
          },
        },
      },
    });

    console.log('Default admin created:', admin.email);
    console.log('Login with:', adminEmail, '/', adminPassword);
  } else {
    console.log('Default admin already exists, skipping.');
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