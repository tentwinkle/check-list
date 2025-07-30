import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('open123$$$', 10);

  const user = await prisma.user.create({
    data: {
      id: 'super-admin-001',
      email: 'Henrik@qrservice.dk',
      name: 'Henrik',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log({ user });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });