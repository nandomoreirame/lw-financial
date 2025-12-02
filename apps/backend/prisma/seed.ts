import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash das senhas
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const userPasswordHash = await bcrypt.hash('user123', saltRounds);

  // Criar usuário admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@lwfinancial.com' },
    update: {},
    create: {
      email: 'admin@lwfinancial.com',
      name: 'Administrador',
      emailVerified: true,
      accounts: {
        create: {
          accountId: 'admin',
          providerId: 'credential',
          password: adminPasswordHash,
        },
      },
    },
    include: {
      accounts: true,
    },
  });

  console.log('✅ Admin user created:', {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
  });

  // Criar usuário comum
  const regularUser = await prisma.user.upsert({
    where: { email: 'user@lwfinancial.com' },
    update: {},
    create: {
      email: 'user@lwfinancial.com',
      name: 'Usuário Exemplo',
      emailVerified: true,
      accounts: {
        create: {
          accountId: 'user',
          providerId: 'credential',
          password: userPasswordHash,
        },
      },
    },
    include: {
      accounts: true,
    },
  });

  console.log('✅ Regular user created:', {
    id: regularUser.id,
    email: regularUser.email,
    name: regularUser.name,
  });

  console.log('\n📋 Credentials for testing:');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('\nUser:');
  console.log('  Username: user');
  console.log('  Password: user123');
  console.log('\n✨ Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
