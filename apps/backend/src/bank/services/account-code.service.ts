import { prisma } from '../../db/prisma';

/**
 * Generates an account code in the format "XXXX-X" (4 digits, hyphen, 1 digit)
 * Uses a deterministic algorithm based on timestamp
 * @returns Account code string in format "XXXX-X"
 */
export function generateAccountCode(): string {
  const timestampPart = Date.now() % 10000;
  const firstPart = timestampPart.toString().padStart(4, '0');
  const counterPart = Math.floor(Date.now() / 1000) % 10;

  return `${firstPart}-${counterPart}`;
}

/**
 * Checks if an account code already exists in the database
 * @param code - The account code to check
 * @returns True if code exists, false otherwise
 */
export async function checkCodeExists(code: string): Promise<boolean> {
  const account = await prisma.bankAccount.findUnique({
    where: { code },
    select: { id: true },
  });

  return account !== null;
}

/**
 * Generates a unique account code with retry logic
 * Attempts to generate a unique code up to maxRetries times
 * Uses exponential backoff between retries
 * @param maxRetries - Maximum number of retry attempts (default: 10)
 * @returns A unique account code
 * @throws Error if unable to generate unique code after all retries
 */
export async function generateUniqueAccountCode(
  maxRetries: number = 10
): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateAccountCode();
    const exists = await checkCodeExists(code);

    if (!exists) {
      return code;
    }

    const delay = Math.pow(2, i) * 10;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(
    `Failed to generate unique account code after ${maxRetries} retries`
  );
}
