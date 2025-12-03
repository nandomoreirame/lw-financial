/**
 * Unit tests for validation schemas
 * Tests transaction amount validation and deposit form schema
 */

import { describe, expect, test } from 'bun:test';
import {
  depositFormSchema,
  transactionAmountSchema,
} from '../../app/lib/validation';

describe('transactionAmountSchema', () => {
  describe('Happy path - valid amounts', () => {
    test('should accept minimum valid amount (0.01)', () => {
      const result = transactionAmountSchema.safeParse(0.01);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0.01);
      }
    });

    test('should accept maximum valid amount (999999.99)', () => {
      const result = transactionAmountSchema.safeParse(999999.99);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(999999.99);
      }
    });

    test('should accept amount with 1 decimal place', () => {
      const result = transactionAmountSchema.safeParse(100.5);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(100.5);
      }
    });

    test('should accept amount with 2 decimal places', () => {
      const result = transactionAmountSchema.safeParse(123.45);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(123.45);
      }
    });

    test('should accept integer amount', () => {
      const result = transactionAmountSchema.safeParse(100);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(100);
      }
    });

    test('should accept amount in middle of range', () => {
      const result = transactionAmountSchema.safeParse(50000.75);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(50000.75);
      }
    });
  });

  describe('Edge cases - boundary values', () => {
    test('should reject amount below minimum (0.009)', () => {
      const result = transactionAmountSchema.safeParse(0.009);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('mínimo');
      }
    });

    test('should reject amount above maximum (1000000)', () => {
      const result = transactionAmountSchema.safeParse(1000000);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('máximo');
      }
    });

    test('should reject amount with 3 decimal places', () => {
      const result = transactionAmountSchema.safeParse(100.123);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2 casas decimais');
      }
    });

    test('should reject amount with more than 3 decimal places', () => {
      const result = transactionAmountSchema.safeParse(100.1234);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2 casas decimais');
      }
    });
  });

  describe('Error cases - invalid inputs', () => {
    test('should reject zero', () => {
      const result = transactionAmountSchema.safeParse(0);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('maior que zero');
      }
    });

    test('should reject negative numbers', () => {
      const result = transactionAmountSchema.safeParse(-10);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('maior que zero');
      }
    });

    test('should reject NaN', () => {
      const result = transactionAmountSchema.safeParse(NaN);
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have error about invalid type or invalid value
        const messages = result.error.issues.map((i) => i.message);
        expect(
          messages.some((m) => m.includes('inválido') || m.includes('número'))
        ).toBe(true);
      }
    });

    test('should reject Infinity', () => {
      const result = transactionAmountSchema.safeParse(Infinity);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(
          messages.some((m) => m.includes('inválido') || m.includes('número'))
        ).toBe(true);
      }
    });

    test('should reject negative Infinity', () => {
      const result = transactionAmountSchema.safeParse(-Infinity);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(
          messages.some(
            (m) => m.includes('inválido') || m.includes('maior que zero')
          )
        ).toBe(true);
      }
    });

    test('should reject string input', () => {
      const result = transactionAmountSchema.safeParse('100' as any);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('número');
      }
    });

    test('should reject null', () => {
      const result = transactionAmountSchema.safeParse(null as any);
      expect(result.success).toBe(false);
      if (!result.success) {
        // null is treated as invalid type, not missing value
        expect(result.error.issues[0].message).toContain('número');
      }
    });

    test('should reject undefined', () => {
      const result = transactionAmountSchema.safeParse(undefined as any);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obrigatório');
      }
    });
  });

  describe('Scientific notation handling', () => {
    test('should accept valid amount in scientific notation within range', () => {
      // 1e-2 = 0.01 (minimum)
      const result = transactionAmountSchema.safeParse(1e-2);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(0.01);
      }
    });

    test('should reject scientific notation below minimum', () => {
      // 1e-3 = 0.001 (below minimum)
      const result = transactionAmountSchema.safeParse(1e-3);
      expect(result.success).toBe(false);
    });
  });
});

describe('depositFormSchema', () => {
  describe('Happy path - valid form data', () => {
    test('should accept valid deposit form data', () => {
      const result = depositFormSchema.safeParse({ amount: 100.5 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(100.5);
      }
    });

    test('should accept minimum amount', () => {
      const result = depositFormSchema.safeParse({ amount: 0.01 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(0.01);
      }
    });

    test('should accept maximum amount', () => {
      const result = depositFormSchema.safeParse({ amount: 999999.99 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(999999.99);
      }
    });
  });

  describe('Error cases - invalid form data', () => {
    test('should reject missing amount field', () => {
      const result = depositFormSchema.safeParse({} as any);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obrigatório');
      }
    });

    test('should reject invalid amount value', () => {
      const result = depositFormSchema.safeParse({ amount: -10 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('maior que zero');
      }
    });

    test('should reject amount with too many decimals', () => {
      const result = depositFormSchema.safeParse({ amount: 100.123 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2 casas decimais');
      }
    });

    test('should reject amount above maximum', () => {
      const result = depositFormSchema.safeParse({ amount: 1000000 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('máximo');
      }
    });
  });
});
