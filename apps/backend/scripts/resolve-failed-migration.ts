#!/usr/bin/env tsx

/**
 * Script para resolver migrações falhadas do Prisma em produção
 *
 * Este script verifica se há migrações falhadas e tenta resolvê-las
 * verificando se as mudanças já foram aplicadas no banco de dados.
 *
 * Uso: bun run resolve-failed-migration
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

interface MigrationStatus {
  migration_name: string;
  finished_at: string | null;
  applied_steps_count: number;
}

/**
 * Verifica o estado das migrações no banco de dados
 */
async function checkMigrationStatus(): Promise<MigrationStatus[]> {
  try {
    const result = await prisma.$queryRaw<MigrationStatus[]>`
      SELECT 
        migration_name,
        finished_at,
        applied_steps_count
      FROM _prisma_migrations
      ORDER BY started_at DESC
    `;
    return result;
  } catch (error) {
    console.error('❌ Erro ao verificar status das migrações:', error);
    throw error;
  }
}

/**
 * Verifica se uma coluna existe na tabela
 */
async function columnExists(
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
          AND column_name = ${columnName}
      ) as exists
    `;
    return result[0]?.exists ?? false;
  } catch (error) {
    console.error(
      `❌ Erro ao verificar coluna ${columnName} na tabela ${tableName}:`,
      error
    );
    return false;
  }
}

/**
 * Verifica se um índice existe
 */
async function indexExists(indexName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = ${indexName}
      ) as exists
    `;
    return result[0]?.exists ?? false;
  } catch (error) {
    console.error(`❌ Erro ao verificar índice ${indexName}:`, error);
    return false;
  }
}

/**
 * Resolve migração falhada verificando se as mudanças já foram aplicadas
 */
async function resolveFailedMigration(migrationName: string): Promise<boolean> {
  console.log(`\n🔍 Verificando migração: ${migrationName}`);

  // Verifica se é a migração do campo code
  if (migrationName.includes('add_account_code_field')) {
    const codeColumnExists = await columnExists('bank_account', 'code');
    const uniqueIndexExists = await indexExists('bank_account_code_key');
    const regularIndexExists = await indexExists('bank_account_code_idx');

    console.log(`  - Coluna 'code' existe: ${codeColumnExists ? '✅' : '❌'}`);
    console.log(
      `  - Índice único 'bank_account_code_key' existe: ${uniqueIndexExists ? '✅' : '❌'}`
    );
    console.log(
      `  - Índice 'bank_account_code_idx' existe: ${regularIndexExists ? '✅' : '❌'}`
    );

    // Se todas as mudanças foram aplicadas, podemos marcar como resolvida
    if (codeColumnExists && uniqueIndexExists && regularIndexExists) {
      console.log(
        `\n✅ Migração ${migrationName} já foi aplicada. Marcando como resolvida...`
      );

      try {
        execSync(`npx prisma migrate resolve --applied ${migrationName}`, {
          stdio: 'inherit',
          cwd: process.cwd(),
        });
        console.log(`✅ Migração ${migrationName} marcada como resolvida!`);
        return true;
      } catch (error) {
        console.error(`❌ Erro ao marcar migração como resolvida:`, error);
        return false;
      }
    } else {
      console.log(
        `\n⚠️ Migração ${migrationName} não foi completamente aplicada.`
      );
      console.log(
        `   Você precisa aplicar manualmente as mudanças faltantes ou reverter.`
      );
      return false;
    }
  }

  // Para outras migrações, apenas marca como resolvida se o usuário confirmar
  console.log(`\n⚠️ Migração desconhecida: ${migrationName}`);
  console.log(`   Verifique manualmente se as mudanças foram aplicadas.`);
  return false;
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Verificando migrações falhadas...\n');

  try {
    const migrations = await checkMigrationStatus();

    const failedMigrations = migrations.filter(
      (m) => m.finished_at === null && m.applied_steps_count > 0
    );

    if (failedMigrations.length === 0) {
      console.log('✅ Nenhuma migração falhada encontrada.');
      return;
    }

    console.log(
      `⚠️ Encontradas ${failedMigrations.length} migração(ões) falhada(s):\n`
    );

    for (const migration of failedMigrations) {
      console.log(`  - ${migration.migration_name}`);
      console.log(`    Aplicado: ${migration.applied_steps_count} passo(s)`);
    }

    console.log('\n🔧 Tentando resolver migrações falhadas...\n');

    let resolvedCount = 0;
    for (const migration of failedMigrations) {
      if (await resolveFailedMigration(migration.migration_name)) {
        resolvedCount++;
      }
    }

    if (resolvedCount === failedMigrations.length) {
      console.log(`\n✅ Todas as migrações falhadas foram resolvidas!`);
      console.log(`   Você pode executar 'bun run prisma:deploy' novamente.`);
    } else {
      console.log(
        `\n⚠️ ${resolvedCount} de ${failedMigrations.length} migração(ões) resolvida(s).`
      );
      console.log(`   Verifique as migrações restantes manualmente.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erro ao processar migrações:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
