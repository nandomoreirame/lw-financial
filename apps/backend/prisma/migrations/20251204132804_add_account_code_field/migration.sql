-- AlterTable
ALTER TABLE "bank_account" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bank_account_code_key" ON "bank_account"("code");

-- CreateIndex
CREATE INDEX "bank_account_code_idx" ON "bank_account"("code");

