import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Limpar banco de dados antes de popular
  // Ordem de deleção: primeiro as tabelas dependentes, depois as independentes
  // Session e Account serão deletados automaticamente com User (onDelete: Cascade)
  console.log('Cleaning database...');
  await prisma.transaction.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany(); // Deleta Session e Account automaticamente (onDelete: Cascade)
  console.log('Database cleaned successfully!');

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

  console.log('Admin user created:', {
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

  console.log('Regular user created:', {
    id: regularUser.id,
    email: regularUser.email,
    name: regularUser.name,
  });

  // Criar ou atualizar conta bancária para admin com saldo inicial
  const existingAdminAccount = await prisma.bankAccount.findFirst({
    where: { userId: adminUser.id },
  });

  const adminBankAccount = existingAdminAccount
    ? await prisma.bankAccount.update({
        where: { id: existingAdminAccount.id },
        data: { balance: 100000.0 },
      })
    : await prisma.bankAccount.create({
        data: {
          userId: adminUser.id,
          balance: 100000.0,
        },
      });

  console.log('Admin bank account created/updated:', {
    id: adminBankAccount.id,
    userId: adminBankAccount.userId,
    balance: adminBankAccount.balance.toString(),
  });

  // Criar ou atualizar conta bancária para usuário comum com saldo inicial
  const existingUserAccount = await prisma.bankAccount.findFirst({
    where: { userId: regularUser.id },
  });

  const userBankAccount = existingUserAccount
    ? await prisma.bankAccount.update({
        where: { id: existingUserAccount.id },
        data: { balance: 100000.0 },
      })
    : await prisma.bankAccount.create({
        data: {
          userId: regularUser.id,
          balance: 100000.0,
        },
      });

  console.log('User bank account created/updated:', {
    id: userBankAccount.id,
    userId: userBankAccount.userId,
    balance: userBankAccount.balance.toString(),
  });

  console.log('\nCredentials for testing:');
  console.log('Admin:');
  console.log('  Username: admin');
  console.log('  Password: admin123');
  console.log('  Balance: R$ 100.000,00');
  console.log('\nUser:');
  console.log('  Username: user');
  console.log('  Password: user123');
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
