-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'TRANSFER');

-- CreateTable
CREATE TABLE "bank_account" (
    "id" TEXT NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "originAccountId" TEXT,
    "destinationAccountId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bank_account_userId_idx" ON "bank_account"("userId");

-- CreateIndex
CREATE INDEX "transaction_originAccountId_idx" ON "transaction"("originAccountId");

-- CreateIndex
CREATE INDEX "transaction_destinationAccountId_idx" ON "transaction"("destinationAccountId");

-- CreateIndex
CREATE INDEX "transaction_createdAt_idx" ON "transaction"("createdAt");

-- CreateIndex
CREATE INDEX "transaction_userId_idx" ON "transaction"("userId");

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_originAccountId_fkey" FOREIGN KEY ("originAccountId") REFERENCES "bank_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "bank_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
