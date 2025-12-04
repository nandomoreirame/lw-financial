/**
 * Unit tests for format-currency utility
 * Tests formatCurrency() function with various numeric values and edge cases
 */

import { describe, expect, test } from 'bun:test';
import { formatCurrency } from './format-currency';

describe('formatCurrency function', () => {
  describe('Happy path - valid numbers', () => {
    test('should format zero correctly', () => {
      const result = formatCurrency(0);
      expect(result).toContain('R$');
      expect(result).toContain('0,00');
    });

    test('should format minimum value (0.01) correctly', () => {
      const result = formatCurrency(0.01);
      expect(result).toContain('R$');
      expect(result).toContain('0,01');
    });

    test('should format small amount correctly', () => {
      const result = formatCurrency(1.5);
      expect(result).toContain('R$');
      expect(result).toContain('1,50');
    });

    test('should format amount with cents correctly', () => {
      const result = formatCurrency(123.45);
      expect(result).toContain('R$');
      expect(result).toContain('123,45');
    });

    test('should format integer amount correctly', () => {
      const result = formatCurrency(100);
      expect(result).toContain('R$');
      expect(result).toContain('100,00');
    });

    test('should format large amount correctly', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('R$');
      expect(result).toContain('1.000,00');
    });

    test('should format very large amount correctly', () => {
      const result = formatCurrency(999999.99);
      expect(result).toContain('R$');
      expect(result).toContain('999.999,99');
    });

    test('should format amount with thousands separator correctly', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('R$');
      expect(result).toContain('1.234,56');
    });

    test('should format amount with multiple thousands correctly', () => {
      const result = formatCurrency(123456.78);
      expect(result).toContain('R$');
      expect(result).toContain('123.456,78');
    });
  });

  describe('Edge cases - boundary values', () => {
    test('should format very small decimal correctly', () => {
      const result = formatCurrency(0.01);
      expect(result).toContain('R$');
      expect(result).toContain('0,01');
    });

    test('should format maximum valid amount correctly', () => {
      const result = formatCurrency(999999.99);
      expect(result).toContain('R$');
      expect(result).toContain('999.999,99');
    });

    test('should format amount with single decimal place correctly', () => {
      const result = formatCurrency(10.5);
      expect(result).toContain('R$');
      expect(result).toContain('10,50');
    });

    test('should format amount with trailing zeros correctly', () => {
      const result = formatCurrency(100.0);
      expect(result).toContain('R$');
      expect(result).toContain('100,00');
    });
  });

  describe('Error cases - invalid numbers', () => {
    test('should return default value for NaN', () => {
      const result = formatCurrency(NaN);
      expect(result).toContain('R$');
      expect(result).toContain('0,00');
    });

    test('should return default value for Infinity', () => {
      const result = formatCurrency(Infinity);
      expect(result).toContain('R$');
      expect(result).toContain('0,00');
    });

    test('should return default value for negative Infinity', () => {
      const result = formatCurrency(-Infinity);
      expect(result).toContain('R$');
      expect(result).toContain('0,00');
    });

    test('should handle very large numbers that become Infinity', () => {
      const result = formatCurrency(Number.MAX_VALUE);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('Format validation - Brazilian currency format', () => {
    test('should follow R$ X.XXX,XX format', () => {
      const result = formatCurrency(1234.56);
      expect(result).toMatch(/^R\$\s\d{1,3}(\.\d{3})*,\d{2}$/);
    });

    test('should always include currency symbol', () => {
      const result = formatCurrency(100);
      expect(result).toContain('R$');
    });

    test('should always include comma as decimal separator', () => {
      const result = formatCurrency(123.45);
      expect(result).toContain(',');
    });

    test('should always include period as thousands separator for large numbers', () => {
      const result = formatCurrency(1000);
      expect(result).toContain('.');
    });

    test('should always have 2 decimal places', () => {
      const result = formatCurrency(100);
      const decimalPart = result.split(',')[1];
      expect(decimalPart).toHaveLength(2);
    });
  });

  describe('Consistency - same input same output', () => {
    test('should produce consistent results for repeated calls', () => {
      const value = 123.45;
      const result1 = formatCurrency(value);
      const result2 = formatCurrency(value);
      const result3 = formatCurrency(value);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    test('should handle different representations of same value consistently', () => {
      const result1 = formatCurrency(100.0);
      const result2 = formatCurrency(100);
      const result3 = formatCurrency(100.0);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('Real-world scenarios', () => {
    test('should format typical deposit amount correctly', () => {
      const result = formatCurrency(50.75);
      expect(result).toContain('R$');
      expect(result).toContain('50,75');
    });

    test('should format typical withdraw amount correctly', () => {
      const result = formatCurrency(25.5);
      expect(result).toContain('R$');
      expect(result).toContain('25,50');
    });

    test('should format balance amount correctly', () => {
      const result = formatCurrency(1500.0);
      expect(result).toContain('R$');
      expect(result).toContain('1.500,00');
    });

    test('should format transaction amount correctly', () => {
      const result = formatCurrency(99.99);
      expect(result).toContain('R$');
      expect(result).toContain('99,99');
    });
  });
});
