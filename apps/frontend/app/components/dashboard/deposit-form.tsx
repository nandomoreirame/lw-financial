/**
 * Deposit form component for depositing money into account
 * Handles form validation, submission, loading states, and success/error messages
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@lw-financial/ui';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { CurrencyInput } from './currency-input';
import { useDeposit } from '../../hooks/use-deposit';
import { depositFormSchema, type DepositFormData } from '../../lib/validation';
import { cn } from '../../lib/utils';

export interface DepositFormProps {
  accountId: string | null;
  className?: string;
}

/**
 * Form component for depositing money
 * Validates amount (R$ 0,01 to R$ 999.999,99), handles loading states, and displays feedback
 */
export function DepositForm({ accountId, className }: DepositFormProps) {
  const { deposit, isLoading, isSuccess, error, reset } = useDeposit(accountId);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
    watch,
    setValue,
  } = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
  });

  const amountValue = watch('amount');

  // Reset success message after 5 seconds
  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        reset();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, reset]);

  // Clear form after successful deposit
  React.useEffect(() => {
    if (isSuccess) {
      resetForm();
    }
  }, [isSuccess, resetForm]);

  const onSubmit = async (data: DepositFormData) => {
    // Prevent duplicate submissions
    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deposit(data.amount);
    } catch (err) {
      // Error is handled by the hook and displayed below
      // Only log in development to avoid exposing sensitive information
      if (import.meta.env.DEV) {
        console.error('Deposit error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Depositar</h3>
        <p className="text-sm text-muted-foreground">
          Adicione dinheiro à sua conta (R$ 0,01 a R$ 999.999,99)
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="deposit-amount"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Valor (R$)
          </label>
          <CurrencyInput
            id="deposit-amount"
            value={amountValue}
            onChange={(value) =>
              setValue('amount', value || 0, { shouldValidate: true })
            }
            error={!!errors.amount}
            disabled={isLoading || isSubmitting}
            aria-label="Valor do depósito em reais"
          />
          <input
            type="hidden"
            {...register('amount', {
              valueAsNumber: true,
            })}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="w-full gap-2"
          aria-label="Depositar"
        >
          {isLoading ? (
            <>
              <span
                className="h-4 w-4 inline-block animate-spin"
                aria-hidden="true"
              >
                ↻
              </span>
              Processando...
            </>
          ) : (
            'Depositar'
          )}
        </Button>
      </form>

      {/* Success message */}
      {showSuccess && (
        <div
          className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200"
          role="alert"
        >
          Depósito realizado com sucesso!
        </div>
      )}

      {/* Error message */}
      {error && !showSuccess && (
        <div
          className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error.message || 'Erro ao realizar depósito. Tente novamente.'}
        </div>
      )}
    </div>
  );
}
