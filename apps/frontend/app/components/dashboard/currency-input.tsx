/**
 * Currency input component with Brazilian Real formatting
 * Uses InputGroup from Shadcn UI with R$ prefix
 * Treats last 2 digits as cents (centavos)
 * - User types "199" → displays "R$ 1,99"
 * - User types "199998" → displays "R$ 1.999,98"
 */

import { InputGroup, InputGroupAddon, InputGroupInput } from '@lw-financial/ui';
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
 * Uses InputGroup with R$ prefix
 * Treats all numeric input as cents (last 2 digits are always cents)
 */
export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(function CurrencyInput(
  { value, onChange, error, className, disabled, ...props },
  ref
) {
  const [internalCentsValue, setInternalCentsValue] = React.useState<
    number | undefined
  >();

  React.useEffect(() => {
    if (
      value !== undefined &&
      value !== null &&
      !isNaN(value) &&
      isFinite(value)
    ) {
      const cents = Math.round(value * 100);
      if (internalCentsValue !== cents) {
        setInternalCentsValue(cents);
      }
    } else if (internalCentsValue !== undefined) {
      setInternalCentsValue(undefined);
    }
  }, [value, internalCentsValue]);

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      if (inputValue === '' || inputValue === undefined) {
        setInternalCentsValue(undefined);
        onChange(undefined);
        return;
      }

      const digitsOnly = inputValue.replace(/\D/g, '');

      if (digitsOnly === '') {
        setInternalCentsValue(undefined);
        onChange(undefined);
        return;
      }

      const centsValue = parseInt(digitsOnly, 10);

      if (isNaN(centsValue) || !isFinite(centsValue) || centsValue < 0) {
        setInternalCentsValue(undefined);
        onChange(undefined);
        return;
      }

      setInternalCentsValue(centsValue);

      const realValue = centsValue / 100;
      onChange(realValue);
    },
    [onChange]
  );

  const displayValue = React.useMemo(() => {
    if (internalCentsValue === undefined || internalCentsValue === null) {
      return '';
    }
    const realValue = internalCentsValue / 100;
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(realValue);
  }, [internalCentsValue]);

  return (
    <InputGroup>
      <InputGroupAddon align="inline-start">R$</InputGroupAddon>
      <InputGroupInput
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder="0,00"
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        aria-label={props['aria-label'] || 'Valor em reais'}
      />
    </InputGroup>
  );
});
