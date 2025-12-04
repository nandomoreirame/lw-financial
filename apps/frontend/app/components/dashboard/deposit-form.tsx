/**
 * Deposit form component for depositing money into account
 * Uses Shadcn UI Form component with react-hook-form and CurrencyInput for currency input
 */

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  cn,
  depositFormSchema,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  type DepositFormData,
} from '@lw-financial/ui';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useDeposit } from '../../hooks/use-deposit';
import { CurrencyInput } from './currency-input';

export interface DepositFormProps {
  accountId: string | null;
  accountCode?: string;
  className?: string;
  onSuccess?: () => void;
}

/**
 * Form component for depositing money
 * Uses Shadcn UI Form with CurrencyInput for currency input with R$ prefix
 */
export function DepositForm({
  accountId,
  accountCode,
  className,
  onSuccess,
}: DepositFormProps) {
  const { deposit, isLoading, isSuccess, error, reset } = useDeposit(
    accountId,
    accountCode
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Depósito realizado com sucesso!');
      form.reset();
      reset();
      onSuccess?.();
    }
  }, [isSuccess, form, reset, onSuccess]);

  React.useEffect(() => {
    if (error) {
      toast.error(
        error.message || 'Erro ao realizar depósito. Tente novamente.'
      );
    }
  }, [error]);

  const onSubmit = async (data: DepositFormData) => {
    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deposit(data.amount);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Deposit error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
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
                    disabled={isLoading || isSubmitting}
                    error={!!form.formState.errors.amount}
                    aria-label="Valor do depósito em reais"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
      </Form>
    </div>
  );
}
