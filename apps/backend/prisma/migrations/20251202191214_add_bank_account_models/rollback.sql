-- Rollback script for migration 20251202191214_add_bank_account_models
-- This script reverses the changes made by the migration
-- WARNING: This will delete all data in the transaction and bank_account tables

-- Drop foreign keys first (in reverse order)
ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "transaction_userId_fkey";
ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "transaction_destinationAccountId_fkey";
ALTER TABLE "transaction" DROP CONSTRAINT IF EXISTS "transaction_originAccountId_fkey";
ALTER TABLE "bank_account" DROP CONSTRAINT IF EXISTS "bank_account_userId_fkey";

-- Drop indexes
DROP INDEX IF EXISTS "transaction_userId_idx";
DROP INDEX IF EXISTS "transaction_createdAt_idx";
DROP INDEX IF EXISTS "transaction_destinationAccountId_idx";
DROP INDEX IF EXISTS "transaction_originAccountId_idx";
DROP INDEX IF EXISTS "bank_account_userId_idx";

-- Drop tables (transaction first due to foreign key dependencies)
DROP TABLE IF EXISTS "transaction";
DROP TABLE IF EXISTS "bank_account";

-- Drop enum type (must be last as it might be referenced)
DROP TYPE IF EXISTS "TransactionType";

