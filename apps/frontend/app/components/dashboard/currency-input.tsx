/**
 * Currency input component with Brazilian Real formatting
 * Formats input as user types (R$ 1.234,56)
 * Handles keyboard navigation and accessibility
 */

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface CurrencyInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange'
> {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: boolean;
}

/**
 * Currency input component that formats Brazilian Real currency
 * Formats as user types: R$ 1.234,56
 * Supports keyboard navigation (Enter to submit, Tab to navigate)
 */
export function CurrencyInput({
  value,
  onChange,
  error,
  className,
  disabled,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>('');
  const [isUserTyping, setIsUserTyping] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Initialize display value from numeric value
  // Only format when value comes from props (not from user typing)
  React.useEffect(() => {
    if (!isUserTyping && value !== undefined && value !== null) {
      // Format as Brazilian Real: R$ 1.234,56
      const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
      setDisplayValue(formatted);
    } else if (!isUserTyping && (value === undefined || value === null)) {
      setDisplayValue('');
    }
  }, [value, isUserTyping]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUserTyping(true);
    const inputValue = e.target.value;

    // Allow empty input
    if (inputValue === '') {
      setDisplayValue('');
      onChange(undefined);
      setIsUserTyping(false);
      return;
    }

    // Remove all non-digit characters except comma and dot
    const cleaned = inputValue.replace(/[^\d,.-]/g, '');

    // Validate format: reject multiple dots or commas
    const hasMultipleDots = (cleaned.match(/\./g) || []).length > 1;
    const hasMultipleCommas = (cleaned.match(/,/g) || []).length > 1;

    if (hasMultipleDots || hasMultipleCommas) {
      // Invalid format, keep previous display value
      setIsUserTyping(false);
      return;
    }

    // Update display value to allow free typing
    setDisplayValue(cleaned);

    // Replace comma with dot for parsing
    const normalized = cleaned.replace(',', '.');

    // Parse as number
    const numValue = parseFloat(normalized);

    // If valid number, update value
    if (!isNaN(numValue) && isFinite(numValue) && numValue >= 0) {
      onChange(numValue);
    } else {
      // Invalid input, set to undefined but keep display
      onChange(undefined);
    }

    setIsUserTyping(false);
  };

  const handleBlur = () => {
    // Format on blur if value exists
    if (value !== undefined && value !== null) {
      const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
      setDisplayValue(formatted);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow Enter to submit form (default behavior)
    // Allow Tab for navigation (default behavior)
    // Allow arrow keys, backspace, delete, etc.
    if (
      e.key === 'Enter' ||
      e.key === 'Tab' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      return;
    }

    // Allow numbers, comma, dot, minus
    if (/^[0-9,.-]$/.test(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    // Prevent other keys
    e.preventDefault();
  };

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="0,00"
      disabled={disabled}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      aria-label={props['aria-label'] || 'Valor em reais'}
    />
  );
}
