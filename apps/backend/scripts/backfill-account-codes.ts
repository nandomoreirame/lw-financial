/**
 * Backfill script for existing accounts without codes
 * Generates unique account codes for all accounts that don't have one
 *
 * Usage:
 *   bun run scripts/backfill-account-codes.ts
 *
 * Or with tsx:
 *   tsx scripts/backfill-account-codes.ts
 */

import { generateUniqueAccountCode } from '../src/bank/services/account-code.service';
import { prisma } from '../src/db/prisma';

/**
 * Main function to backfill account codes
 * Processes all accounts without codes and generates unique codes for them
 */
async function backfillAccountCodes() {
  console.log('Starting account code backfill...');

  try {
    const accountsWithoutCode = await prisma.bankAccount.findMany({
      where: {
        code: null,
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (accountsWithoutCode.length === 0) {
      console.log('No accounts without codes found. Nothing to do.');
      return;
    }

    console.log(
      `Found ${accountsWithoutCode.length} account(s) without codes.`
    );

    let successCount = 0;
    let errorCount = 0;

    for (const account of accountsWithoutCode) {
      try {
        const code = await generateUniqueAccountCode();

        await prisma.bankAccount.update({
          where: { id: account.id },
          data: { code },
        });

        console.log(
          `✓ Generated code ${code} for account ${account.id} (user: ${account.userId || 'N/A'})`
        );
        successCount++;
      } catch (error) {
        console.error(
          `✗ Failed to generate code for account ${account.id}:`,
          error instanceof Error ? error.message : error
        );
        errorCount++;
      }
    }

    console.log('\n=== Backfill Summary ===');
    console.log(`Total accounts processed: ${accountsWithoutCode.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.warn(
        '\n⚠ Some accounts could not be updated. Please review the errors above.'
      );
      process.exit(1);
    } else {
      console.log(
        '\n✓ All accounts have been successfully updated with codes.'
      );
    }
  } catch (error) {
    console.error('Fatal error during backfill:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfillAccountCodes().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
