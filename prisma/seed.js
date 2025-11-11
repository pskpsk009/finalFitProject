const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { username: 'User' },
    update: {},
    create: {
      username: 'User',
      password: 'password123', // Default password
      weight: 70, // Default weight in kg
      height: 170, // Default height in cm
    },
  });
  console.log('Seeded user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });