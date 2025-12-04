/**
 * Unit tests for format-date utility
 * Tests formatDateTime() function with various date formats and edge cases
 */

import { describe, expect, test } from 'bun:test';
import { formatDateTime } from './format-date';

describe('formatDateTime function', () => {
  describe('Happy path - valid dates', () => {
    test('should format Date object correctly', () => {
      const date = new Date('2025-12-03T14:30:00.000Z');
      const result = formatDateTime(date);
      expect(result).toBe('03/12/2025 14:30');
    });

    test('should format ISO 8601 date string correctly', () => {
      const dateString = '2025-12-03T14:30:00.000Z';
      const result = formatDateTime(dateString);
      expect(result).toBe('03/12/2025 14:30');
    });

    test('should format date with single digit day and month correctly', () => {
      const date = new Date('2025-01-05T09:05:00.000Z');
      const result = formatDateTime(date);
      expect(result).toBe('05/01/2025 09:05');
    });

    test('should format date at midnight correctly', () => {
      const date = new Date('2025-12-03T00:00:00.000Z');
      const result = formatDateTime(date);
      expect(result).toBe('03/12/2025 00:00');
    });

    test('should format date at end of day correctly', () => {
      const date = new Date('2025-12-03T23:59:59.000Z');
      const result = formatDateTime(date);
      expect(result).toBe('03/12/2025 23:59');
    });

    test('should format date with timezone offset correctly', () => {
      const date = new Date('2025-12-03T17:30:00.000Z');
      const result = formatDateTime(date);
      expect(result).toMatch(/03\/12\/2025 \d{2}:\d{2}/);
    });

    test('should format date with different timezones', () => {
      const date = new Date('2025-12-03T12:00:00-03:00');
      const result = formatDateTime(date);
      expect(result).toMatch(/03\/12\/2025 \d{2}:\d{2}/);
    });
  });

  describe('Edge cases - date boundaries', () => {
    test('should format first day of year correctly', () => {
      const date = new Date('2025-01-01T12:00:00.000Z');
      const result = formatDateTime(date);
      expect(result).toBe('01/01/2025 12:00');
    });

    test('should format last day of year correctly', () => {
      const date = new Date('2025-12-31T23:59:00.000Z');
      const result = formatDateTime(date);
      expect(result).toBe('31/12/2025 23:59');
    });

    test('should format leap year date correctly', () => {
      const date = new Date('2024-02-29T14:30:00.000Z');
      const result = formatDateTime(date);
      expect(result).toBe('29/02/2024 14:30');
    });

    test('should format date with different years correctly', () => {
      const date2020 = new Date('2020-12-03T14:30:00.000Z');
      expect(formatDateTime(date2020)).toBe('03/12/2020 14:30');

      const date2030 = new Date('2030-12-03T14:30:00.000Z');
      expect(formatDateTime(date2030)).toBe('03/12/2030 14:30');
    });

    test('should format first day of month correctly', () => {
      const date = new Date('2025-12-01T10:00:00.000Z');
      const result = formatDateTime(date);
      expect(result).toBe('01/12/2025 10:00');
    });

    test('should format last day of month correctly', () => {
      const date = new Date('2025-01-31T20:00:00.000Z');
      const result = formatDateTime(date);
      expect(result).toBe('31/01/2025 20:00');
    });
  });

  describe('Error cases - invalid dates', () => {
    test('should return error message for invalid date string', () => {
      const invalidDate = 'invalid-date-string';
      const result = formatDateTime(invalidDate);
      expect(result).toBe('Data inválida');
    });

    test('should return error message for empty string', () => {
      const emptyString = '';
      const result = formatDateTime(emptyString);
      expect(result).toBe('Data inválida');
    });

    test('should return error message for Invalid Date object', () => {
      const invalidDate = new Date('Invalid Date');
      const result = formatDateTime(invalidDate);
      expect(result).toBe('Data inválida');
    });

    test('should return error message for NaN date', () => {
      const nanDate = new Date(NaN);
      const result = formatDateTime(nanDate);
      expect(result).toBe('Data inválida');
    });

    test('should handle malformed date strings gracefully', () => {
      const malformed = '2025-13-45T99:99:99.000Z';
      const result = formatDateTime(malformed);
      expect(result).toBe('Data inválida');
    });

    test('should handle incomplete date strings', () => {
      const incomplete = '2025-12';
      const result = formatDateTime(incomplete);
      expect(result).toBeDefined();
    });

    test('should handle non-date strings', () => {
      const nonDate = 'hello world';
      const result = formatDateTime(nonDate);
      expect(result).toBe('Data inválida');
    });

    test('should handle null-like date strings', () => {
      const nullLike = 'null';
      const result = formatDateTime(nullLike);
      expect(result).toBe('Data inválida');
    });
  });

  describe('Format validation - Brazilian format', () => {
    test('should follow DD/MM/YYYY HH:mm format', () => {
      const date = new Date('2025-12-03T14:30:00.000Z');
      const result = formatDateTime(date);

      const formatRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
      expect(result).toMatch(formatRegex);
    });

    test('should pad day and month with zeros when needed', () => {
      const date = new Date('2025-01-05T09:05:00.000Z');
      const result = formatDateTime(date);

      expect(result.split('/')[0]).toMatch(/^\d{2}$/);
      expect(result.split('/')[1]).toMatch(/^\d{2}$/);
    });

    test('should pad hours and minutes with zeros when needed', () => {
      const date = new Date('2025-12-03T09:05:00.000Z');
      const result = formatDateTime(date);

      const timePart = result.split(' ')[1];
      const [hours, minutes] = timePart.split(':');

      expect(hours).toMatch(/^\d{2}$/);
      expect(minutes).toMatch(/^\d{2}$/);
    });

    test('should use 24-hour format', () => {
      const date = new Date('2025-12-03T14:30:00.000Z');
      const result = formatDateTime(date);

      const timePart = result.split(' ')[1];
      const hours = parseInt(timePart.split(':')[0]);

      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(23);
    });

    test('should always have 2-digit day', () => {
      const date = new Date('2025-12-03T14:30:00.000Z');
      const result = formatDateTime(date);
      const day = result.split('/')[0];
      expect(day).toHaveLength(2);
    });

    test('should always have 2-digit month', () => {
      const date = new Date('2025-12-03T14:30:00.000Z');
      const result = formatDateTime(date);
      const month = result.split('/')[1];
      expect(month).toHaveLength(2);
    });

    test('should always have 4-digit year', () => {
      const date = new Date('2025-12-03T14:30:00.000Z');
      const result = formatDateTime(date);
      const year = result.split('/')[2].split(' ')[0];
      expect(year).toHaveLength(4);
    });
  });

  describe('Consistency - same date different formats', () => {
    test('should produce same result for Date object and ISO string', () => {
      const dateString = '2025-12-03T14:30:00.000Z';
      const dateObject = new Date(dateString);

      const resultFromString = formatDateTime(dateString);
      const resultFromObject = formatDateTime(dateObject);

      expect(resultFromString).toBe(resultFromObject);
    });

    test('should handle dates with milliseconds correctly', () => {
      const dateWithMs = new Date('2025-12-03T14:30:00.123Z');
      const dateWithoutMs = new Date('2025-12-03T14:30:00.000Z');

      const resultWithMs = formatDateTime(dateWithMs);
      const resultWithoutMs = formatDateTime(dateWithoutMs);

      expect(resultWithMs).toBe(resultWithoutMs);
    });

    test('should handle different string formats of same date', () => {
      const isoString = '2025-12-03T14:30:00.000Z';
      const dateOnly = '2025-12-03';
      const dateObject = new Date(isoString);

      const resultIso = formatDateTime(isoString);
      const resultDateOnly = formatDateTime(dateOnly);
      const resultObject = formatDateTime(dateObject);

      expect(resultIso).toBe(resultObject);
      expect(resultDateOnly).toBeDefined();
    });
  });

  describe('Time handling', () => {
    test('should format time correctly for morning hours', () => {
      const date = new Date('2025-12-03T09:15:00.000Z');
      const result = formatDateTime(date);
      expect(result).toContain('09:15');
    });

    test('should format time correctly for afternoon hours', () => {
      const date = new Date('2025-12-03T15:45:00.000Z');
      const result = formatDateTime(date);
      expect(result).toContain('15:45');
    });

    test('should format time correctly for evening hours', () => {
      const date = new Date('2025-12-03T20:30:00.000Z');
      const result = formatDateTime(date);
      expect(result).toContain('20:30');
    });

    test('should format time correctly for single digit hours', () => {
      const date = new Date('2025-12-03T05:00:00.000Z');
      const result = formatDateTime(date);
      expect(result).toContain('05:00');
    });

    test('should format time correctly for single digit minutes', () => {
      const date = new Date('2025-12-03T14:05:00.000Z');
      const result = formatDateTime(date);
      expect(result).toContain('14:05');
    });
  });

  describe('Real-world scenarios', () => {
    test('should format transaction timestamp correctly', () => {
      const transactionDate = new Date('2025-12-03T14:30:00.000Z');
      const result = formatDateTime(transactionDate);
      expect(result).toBe('03/12/2025 14:30');
    });

    test('should format deposit timestamp correctly', () => {
      const depositDate = new Date('2025-12-03T10:15:00.000Z');
      const result = formatDateTime(depositDate);
      expect(result).toBe('03/12/2025 10:15');
    });

    test('should format withdrawal timestamp correctly', () => {
      const withdrawalDate = new Date('2025-12-03T16:45:00.000Z');
      const result = formatDateTime(withdrawalDate);
      expect(result).toBe('03/12/2025 16:45');
    });

    test('should format balance query timestamp correctly', () => {
      const balanceDate = new Date('2025-12-03T12:00:00.000Z');
      const result = formatDateTime(balanceDate);
      expect(result).toBe('03/12/2025 12:00');
    });
  });

  describe('Type handling', () => {
    test('should handle Date object type', () => {
      const date = new Date('2025-12-03T14:30:00.000Z');
      const result = formatDateTime(date);
      expect(typeof result).toBe('string');
      expect(result).toBe('03/12/2025 14:30');
    });

    test('should handle string type', () => {
      const dateString = '2025-12-03T14:30:00.000Z';
      const result = formatDateTime(dateString);
      expect(typeof result).toBe('string');
      expect(result).toBe('03/12/2025 14:30');
    });

    test('should return string type for all valid inputs', () => {
      const date = new Date('2025-12-03T14:30:00.000Z');
      const result = formatDateTime(date);
      expect(typeof result).toBe('string');
    });

    test('should return string type for invalid inputs', () => {
      const invalidDate = 'invalid';
      const result = formatDateTime(invalidDate);
      expect(typeof result).toBe('string');
      expect(result).toBe('Data inválida');
    });
  });
});
