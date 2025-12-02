/**
 * Currency formatting utilities for Brazilian Real (R$)
 */

/**
 * Formats a number as Brazilian Real currency
 * Format: R$ X.XXX,XX
 *
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  // Validate input to handle NaN, Infinity, and invalid numbers
  if (!Number.isFinite(value)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
