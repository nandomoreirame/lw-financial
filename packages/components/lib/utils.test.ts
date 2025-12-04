/**
 * Unit tests for utils utility
 * Tests cn() function for merging class names with clsx and tailwind-merge
 */

import { describe, expect, test } from 'bun:test';
import { cn } from './utils';

describe('cn function', () => {
  describe('Happy path - valid class names', () => {
    test('should merge single class name', () => {
      const result = cn('text-red-500');
      expect(result).toBe('text-red-500');
    });

    test('should merge multiple class names', () => {
      const result = cn('text-red-500', 'bg-blue-500', 'p-4');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('p-4');
    });

    test('should handle empty string', () => {
      const result = cn('');
      expect(result).toBe('');
    });

    test('should handle undefined values', () => {
      const result = cn('text-red-500', undefined);
      expect(result).toBe('text-red-500');
    });

    test('should handle null values', () => {
      const result = cn('text-red-500', null);
      expect(result).toBe('text-red-500');
    });

    test('should handle false values', () => {
      const result = cn('text-red-500', false);
      expect(result).toBe('text-red-500');
    });

    test('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('text-red-500', isActive && 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    test('should handle conditional classes with false condition', () => {
      const isActive = false;
      const result = cn('text-red-500', isActive && 'bg-blue-500');
      expect(result).toBe('text-red-500');
      expect(result).not.toContain('bg-blue-500');
    });
  });

  describe('Tailwind merge - conflicting classes', () => {
    test('should merge conflicting padding classes', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
    });

    test('should merge conflicting margin classes', () => {
      const result = cn('m-2', 'm-4');
      expect(result).toBe('m-4');
    });

    test('should merge conflicting text color classes', () => {
      const result = cn('text-red-500', 'text-blue-500');
      expect(result).toBe('text-blue-500');
    });

    test('should merge conflicting background color classes', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    test('should keep non-conflicting classes', () => {
      const result = cn('p-4', 'text-red-500', 'm-2');
      expect(result).toContain('p-4');
      expect(result).toContain('text-red-500');
      expect(result).toContain('m-2');
    });

    test('should handle multiple conflicts correctly', () => {
      const result = cn('p-2', 'p-4', 'p-8', 'text-red-500', 'text-blue-500');
      expect(result).toBe('p-8 text-blue-500');
    });
  });

  describe('Array and object inputs', () => {
    test('should handle array of class names', () => {
      const result = cn(['text-red-500', 'bg-blue-500']);
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    test('should handle object with boolean values', () => {
      const result = cn({
        'text-red-500': true,
        'bg-blue-500': false,
        'p-4': true,
      });
      expect(result).toContain('text-red-500');
      expect(result).not.toContain('bg-blue-500');
      expect(result).toContain('p-4');
    });

    test('should handle mixed array and string inputs', () => {
      const result = cn('text-red-500', ['bg-blue-500', 'p-4']);
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('p-4');
    });
  });

  describe('Edge cases', () => {
    test('should handle no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    test('should handle only undefined values', () => {
      const result = cn(undefined, undefined);
      expect(result).toBe('');
    });

    test('should handle only null values', () => {
      const result = cn(null, null);
      expect(result).toBe('');
    });

    test('should handle only false values', () => {
      const result = cn(false, false);
      expect(result).toBe('');
    });

    test('should handle empty strings', () => {
      const result = cn('', '', 'text-red-500');
      expect(result).toBe('text-red-500');
    });

    test('should handle whitespace-only strings', () => {
      const result = cn('  ', 'text-red-500');
      expect(result).toContain('text-red-500');
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle component className prop pattern', () => {
      const baseClasses = 'flex items-center justify-center';
      const variantClasses = 'bg-blue-500 text-white';
      const isActive = true;
      const conditionalClasses = isActive ? 'hover:bg-blue-600' : '';
      const customClasses = 'p-4 rounded';

      const result = cn(
        baseClasses,
        variantClasses,
        conditionalClasses,
        customClasses
      );

      expect(result).toContain('flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-center');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
      expect(result).toContain('hover:bg-blue-600');
      expect(result).toContain('p-4');
      expect(result).toContain('rounded');
    });

    test('should handle className override pattern', () => {
      const defaultClasses = 'p-4 text-red-500';
      const overrideClasses = 'p-8 text-blue-500';

      const result = cn(defaultClasses, overrideClasses);

      expect(result).toBe('p-8 text-blue-500');
    });

    test('should handle conditional variant classes', () => {
      const variant = 'primary';
      const result = cn(
        'base-class',
        variant === 'primary' && 'bg-blue-500',
        variant === 'secondary' && 'bg-gray-500'
      );

      expect(result).toContain('base-class');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('bg-gray-500');
    });
  });

  describe('Consistency', () => {
    test('should produce consistent results for same inputs', () => {
      const classes = ['text-red-500', 'bg-blue-500', 'p-4'];
      const result1 = cn(...classes);
      const result2 = cn(...classes);
      const result3 = cn(...classes);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    test('should handle order independence for non-conflicting classes', () => {
      const result1 = cn('text-red-500', 'bg-blue-500');
      const result2 = cn('bg-blue-500', 'text-red-500');

      expect(result1.split(' ').sort().join(' ')).toBe(
        result2.split(' ').sort().join(' ')
      );
    });
  });
});
