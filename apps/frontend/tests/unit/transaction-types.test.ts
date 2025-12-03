/**
 * Unit tests for transaction-types utility
 * Tests getTransactionTypeLabel() function and TRANSACTION_TYPES constant
 */

import { describe, expect, test } from 'bun:test';
import {
  getTransactionTypeLabel,
  TRANSACTION_TYPES,
  type TransactionType,
} from '../../app/lib/transaction-types';

describe('transaction-types utility', () => {
  describe('TRANSACTION_TYPES constant', () => {
    test('should export TRANSACTION_TYPES array', () => {
      expect(TRANSACTION_TYPES).toBeDefined();
      expect(Array.isArray(TRANSACTION_TYPES)).toBe(true);
    });

    test('should contain all four transaction types', () => {
      expect(TRANSACTION_TYPES).toHaveLength(4);
      expect(TRANSACTION_TYPES).toContain('DEPOSIT');
      expect(TRANSACTION_TYPES).toContain('WITHDRAW');
      expect(TRANSACTION_TYPES).toContain('TRANSFER');
      expect(TRANSACTION_TYPES).toContain('INITIAL_BALANCE');
    });

    test('should contain only valid transaction types', () => {
      const validTypes: TransactionType[] = [
        'DEPOSIT',
        'WITHDRAW',
        'TRANSFER',
        'INITIAL_BALANCE',
      ];

      TRANSACTION_TYPES.forEach((type) => {
        expect(validTypes).toContain(type);
      });
    });

    test('should not contain duplicate values', () => {
      const uniqueTypes = new Set(TRANSACTION_TYPES);
      expect(uniqueTypes.size).toBe(TRANSACTION_TYPES.length);
    });
  });

  describe('getTransactionTypeLabel function', () => {
    describe('Happy path - valid transaction types', () => {
      test('should return "Depósito" for DEPOSIT type', () => {
        const result = getTransactionTypeLabel('DEPOSIT');
        expect(result).toBe('Depósito');
      });

      test('should return "Saque" for WITHDRAW type', () => {
        const result = getTransactionTypeLabel('WITHDRAW');
        expect(result).toBe('Saque');
      });

      test('should return "Transferência" for TRANSFER type', () => {
        const result = getTransactionTypeLabel('TRANSFER');
        expect(result).toBe('Transferência');
      });

      test('should return "Saldo Inicial" for INITIAL_BALANCE type', () => {
        const result = getTransactionTypeLabel('INITIAL_BALANCE');
        expect(result).toBe('Saldo Inicial');
      });
    });

    describe('Label format validation', () => {
      test('should return Portuguese labels for all types', () => {
        const labels = {
          DEPOSIT: getTransactionTypeLabel('DEPOSIT'),
          WITHDRAW: getTransactionTypeLabel('WITHDRAW'),
          TRANSFER: getTransactionTypeLabel('TRANSFER'),
          INITIAL_BALANCE: getTransactionTypeLabel('INITIAL_BALANCE'),
        };

        expect(labels.DEPOSIT).toBe('Depósito');
        expect(labels.WITHDRAW).toBe('Saque');
        expect(labels.TRANSFER).toBe('Transferência');
        expect(labels.INITIAL_BALANCE).toBe('Saldo Inicial');
      });

      test('should return non-empty strings for all types', () => {
        TRANSACTION_TYPES.forEach((type) => {
          const label = getTransactionTypeLabel(type);
          expect(label).toBeTruthy();
          expect(typeof label).toBe('string');
          expect(label.length).toBeGreaterThan(0);
        });
      });

      test('should return labels different from input type', () => {
        TRANSACTION_TYPES.forEach((type) => {
          const label = getTransactionTypeLabel(type);
          // Label should be in Portuguese, not English
          expect(label).not.toBe(type);
        });
      });
    });

    describe('Consistency - same input same output', () => {
      test('should return consistent labels for repeated calls', () => {
        const label1 = getTransactionTypeLabel('DEPOSIT');
        const label2 = getTransactionTypeLabel('DEPOSIT');
        const label3 = getTransactionTypeLabel('DEPOSIT');

        expect(label1).toBe(label2);
        expect(label2).toBe(label3);
        expect(label1).toBe('Depósito');
      });

      test('should handle all types consistently', () => {
        const results = TRANSACTION_TYPES.map((type) =>
          getTransactionTypeLabel(type)
        );

        // All results should be strings
        results.forEach((result) => {
          expect(typeof result).toBe('string');
        });

        // Results should match expected labels
        expect(results[TRANSACTION_TYPES.indexOf('DEPOSIT')]).toBe('Depósito');
        expect(results[TRANSACTION_TYPES.indexOf('WITHDRAW')]).toBe('Saque');
        expect(results[TRANSACTION_TYPES.indexOf('TRANSFER')]).toBe(
          'Transferência'
        );
        expect(results[TRANSACTION_TYPES.indexOf('INITIAL_BALANCE')]).toBe(
          'Saldo Inicial'
        );
      });
    });

    describe('Edge cases - type safety', () => {
      test('should handle type as TransactionType correctly', () => {
        const type: TransactionType = 'DEPOSIT';
        const result = getTransactionTypeLabel(type);
        expect(result).toBe('Depósito');
      });

      test('should handle all values from TRANSACTION_TYPES array', () => {
        TRANSACTION_TYPES.forEach((type) => {
          expect(() => getTransactionTypeLabel(type)).not.toThrow();
        });
      });
    });
  });

  describe('Integration - constant and function together', () => {
    test('should have label for every type in TRANSACTION_TYPES', () => {
      TRANSACTION_TYPES.forEach((type) => {
        const label = getTransactionTypeLabel(type);
        expect(label).toBeTruthy();
      });
    });

    test('should have unique labels for each transaction type', () => {
      const labels = TRANSACTION_TYPES.map((type) =>
        getTransactionTypeLabel(type)
      );
      const uniqueLabels = new Set(labels);

      // Each type should have a unique label
      expect(uniqueLabels.size).toBe(TRANSACTION_TYPES.length);
    });
  });
});
