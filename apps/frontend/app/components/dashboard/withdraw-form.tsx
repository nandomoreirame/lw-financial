/**
 * Withdraw form component for withdrawing money from account
 * Handles form validation, submission, loading states, and success/error messages
 * Includes client-side balance check before submission
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@lw-financial/ui';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { CurrencyInput } from './currency-input';
import { useWithdraw } from '../../hooks/use-withdraw';
import {
  withdrawFormSchema,
  type WithdrawFormData,
} from '../../lib/validation';
import { cn } from '../../lib/utils';

export interface WithdrawFormProps {
  accountId: string | null;
  currentBalance: number | undefined;
  className?: string;
}

/**
 * Form component for withdrawing money
 * Validates amount (R$ 0,01 to R$ 999.999,99), checks balance, handles loading states, and displays feedback
 */
export function WithdrawForm({
  accountId,
  currentBalance,
  className,
}: WithdrawFormProps) {
  const { withdraw, isLoading, isSuccess, error, reset } =
    useWithdraw(accountId);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [insufficientFundsError, setInsufficientFundsError] = React.useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
    watch,
    setValue,
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawFormSchema),
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

  // Clear form after successful withdrawal
  React.useEffect(() => {
    if (isSuccess) {
      resetForm();
      setInsufficientFundsError(null);
    }
  }, [isSuccess, resetForm]);

  // Clear insufficient funds error when amount changes or when other errors occur
  React.useEffect(() => {
    if (insufficientFundsError && (amountValue !== undefined || error)) {
      setInsufficientFundsError(null);
    }
  }, [amountValue, error, insufficientFundsError]);

  const onSubmit = async (data: WithdrawFormData) => {
    // Prevent duplicate submissions
    if (isSubmitting || isLoading) {
      return;
    }

    // Clear previous errors
    setInsufficientFundsError(null);

    // Client-side balance check before submission (UX only - backend always validates)
    // Prevent submission if balance is not yet loaded
    if (currentBalance === undefined) {
      setInsufficientFundsError(
        'Aguarde o carregamento do saldo antes de realizar o saque'
      );
      return;
    }

    // Check if amount exceeds available balance
    if (data.amount > currentBalance) {
      setInsufficientFundsError('Saldo insuficiente para realizar o saque');
      return;
    }

    setIsSubmitting(true);
    try {
      await withdraw(data.amount);
    } catch (err) {
      // Error is handled by the hook and displayed below
      // Check if it's an insufficient funds error
      if (err instanceof Error && err.message.includes('insuficiente')) {
        setInsufficientFundsError(err.message);
      }
      // Only log in development to avoid exposing sensitive information
      if (import.meta.env.DEV) {
        console.error('Withdraw error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('rounded-lg border bg-card p-6 space-y-4', className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Sacar</h3>
        <p className="text-sm text-muted-foreground">
          Retire dinheiro da sua conta (R$ 0,01 a R$ 999.999,99)
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="withdraw-amount"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Valor (R$)
          </label>
          <CurrencyInput
            id="withdraw-amount"
            value={amountValue}
            onChange={(value) =>
              setValue('amount', value || 0, { shouldValidate: true })
            }
            error={!!errors.amount || !!insufficientFundsError}
            disabled={isLoading || isSubmitting || currentBalance === undefined}
            aria-label="Valor do saque em reais"
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
          {insufficientFundsError && !errors.amount && (
            <p className="text-sm text-destructive">{insufficientFundsError}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || isSubmitting || currentBalance === undefined}
          className="w-full gap-2"
          aria-label="Sacar"
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
            'Sacar'
          )}
        </Button>
      </form>

      {/* Success message */}
      {showSuccess && (
        <div
          className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200"
          role="alert"
        >
          Saque realizado com sucesso!
        </div>
      )}

      {/* Error message */}
      {error && !showSuccess && !insufficientFundsError && (
        <div
          className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error.message || 'Erro ao realizar saque. Tente novamente.'}
        </div>
      )}
    </div>
  );
}
