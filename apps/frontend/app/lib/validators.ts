/**
 * Validation helper functions for account codes and other inputs
 */

/**
 * Validates account code format
 * Account code must be in format "XXXX-X" where X is a digit
 * @param code - Account code to validate
 * @returns true if code matches format, false otherwise
 */
export function isValidAccountCodeFormat(code: string): boolean {
  return /^\d{4}-\d$/.test(code);
}

/**
 * Validates account code format and returns error message if invalid
 * @param code - Account code to validate
 * @returns Error message if invalid, null if valid
 */
export function validateAccountCode(code: string): string | null {
  if (!code) {
    return 'Código de conta é obrigatório';
  }

  if (!isValidAccountCodeFormat(code)) {
    return 'Formato de código inválido. Use o formato XXXX-X (4 dígitos, hífen, 1 dígito)';
  }

  return null;
}
