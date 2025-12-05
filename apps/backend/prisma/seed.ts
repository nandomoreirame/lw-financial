import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateUniqueAccountCode } from '../src/bank/services/account-code.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  console.log('Cleaning database...');
  await prisma.transaction.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleaned successfully!');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('admin123', saltRounds);
  const userPasswordHash = await bcrypt.hash('user123', saltRounds);

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

  console.log('Admin user created:', {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
  });

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

  console.log('Regular user created:', {
    id: regularUser.id,
    email: regularUser.email,
    name: regularUser.name,
  });

  const existingAdminAccount = await prisma.bankAccount.findFirst({
    where: { userId: adminUser.id },
  });

  const adminAccountCode = await generateUniqueAccountCode();
  const adminBankAccount = existingAdminAccount
    ? await prisma.bankAccount.update({
        where: { id: existingAdminAccount.id },
        data: {
          balance: 100000.0,
          code: existingAdminAccount.code || adminAccountCode,
        },
      })
    : await prisma.bankAccount.create({
        data: {
          userId: adminUser.id,
          balance: 100000.0,
          code: adminAccountCode,
        },
      });

  console.log('Admin bank account created/updated:', {
    id: adminBankAccount.id,
    userId: adminBankAccount.userId,
    code: adminBankAccount.code,
    balance: adminBankAccount.balance.toString(),
  });

  const existingUserAccount = await prisma.bankAccount.findFirst({
    where: { userId: regularUser.id },
  });

  const userAccountCode = await generateUniqueAccountCode();
  const userBankAccount = existingUserAccount
    ? await prisma.bankAccount.update({
        where: { id: existingUserAccount.id },
        data: {
          balance: 100000.0,
          code: existingUserAccount.code || userAccountCode,
        },
      })
    : await prisma.bankAccount.create({
        data: {
          userId: regularUser.id,
          balance: 100000.0,
          code: userAccountCode,
        },
      });

  console.log('User bank account created/updated:', {
    id: userBankAccount.id,
    userId: userBankAccount.userId,
    code: userBankAccount.code,
    balance: userBankAccount.balance.toString(),
  });

  console.log('\nCredentials for testing:');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('  Account Code:', adminBankAccount.code);
  console.log('  Balance: R$ 100.000,00');
  console.log('\nUser:');
  console.log('  Username: user');
  console.log('  Password: user123');
  console.log('  Account Code:', userBankAccount.code);
  console.log('  Balance: R$ 100.000,00');
  console.log('\nSeed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
