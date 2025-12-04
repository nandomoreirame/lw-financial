/**
 * Withdraw form component for withdrawing money from account
 * Uses Shadcn UI Form component with react-hook-form and CurrencyInput for currency input
 * Includes client-side balance check before submission
 */

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@lw-financial/ui';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useWithdraw } from '../../hooks/use-withdraw';
import { cn } from '../../lib/utils';
import {
  withdrawFormSchema,
  type WithdrawFormData,
} from '../../lib/validation';
import { CurrencyInput } from './currency-input';

export interface WithdrawFormProps {
  accountId: string | null;
  currentBalance: number | undefined;
  className?: string;
}

/**
 * Form component for withdrawing money
 * Uses Shadcn UI Form with CurrencyInput for currency input with R$ prefix
 * Validates amount (R$ 0,01 to R$ 999.999,99), checks balance, handles loading states, and displays feedback
 */
export function WithdrawForm({
  accountId,
  currentBalance,
  className,
}: WithdrawFormProps) {
  const { withdraw, isLoading, isSuccess, error, reset } =
    useWithdraw(accountId);
  const [insufficientFundsError, setInsufficientFundsError] = React.useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Saque realizado com sucesso!');
      form.reset();
      setInsufficientFundsError(null);
      reset();
    }
  }, [isSuccess, form, reset]);

  React.useEffect(() => {
    if (error && !insufficientFundsError) {
      toast.error(error.message || 'Erro ao realizar saque. Tente novamente.');
    }
  }, [error, insufficientFundsError]);

  const amountValue = form.watch('amount');
  React.useEffect(() => {
    if (insufficientFundsError && (amountValue !== undefined || error)) {
      setInsufficientFundsError(null);
    }
  }, [amountValue, error, insufficientFundsError]);

  const onSubmit = async (data: WithdrawFormData) => {
    if (isSubmitting || isLoading) {
      return;
    }

    setInsufficientFundsError(null);

    if (currentBalance === undefined) {
      const errorMessage =
        'Aguarde o carregamento do saldo antes de realizar o saque';
      setInsufficientFundsError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (data.amount > currentBalance) {
      const errorMessage = 'Saldo insuficiente para saque';
      setInsufficientFundsError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      await withdraw(data.amount);
    } catch (err) {
      if (err instanceof Error && err.message.includes('insuficiente')) {
        setInsufficientFundsError(err.message);
        toast.error(err.message);
      }
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={
                      isLoading || isSubmitting || currentBalance === undefined
                    }
                    error={
                      !!form.formState.errors.amount || !!insufficientFundsError
                    }
                    aria-label="Valor do saque em reais"
                  />
                </FormControl>
                {insufficientFundsError && (
                  <p className="text-sm font-medium text-destructive">
                    {insufficientFundsError}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

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
      </Form>
    </div>
  );
}
