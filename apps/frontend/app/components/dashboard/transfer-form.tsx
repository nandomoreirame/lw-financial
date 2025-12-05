/**
 * Transfer form component for transferring money between accounts
 * Uses Shadcn UI Form component with react-hook-form and CurrencyInput for currency input
 * Includes client-side balance check before submission
 */

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  cn,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  transferFormSchema,
  type TransferFormData,
} from '@lw-financial/ui';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTransfer } from '../../hooks/use-transfer';
import { CurrencyInput } from './currency-input';

export interface TransferFormProps {
  originAccountCode?: string;
  currentBalance: number | undefined;
  className?: string;
  onSuccess?: () => void;
}

/**
 * Form component for transferring money between accounts
 * Uses Shadcn UI Form with CurrencyInput for currency input with R$ prefix
 * Validates amount (R$ 0,01 to R$ 999.999,99), checks balance, handles loading states, and displays feedback
 */
export function TransferForm({
  originAccountCode,
  currentBalance,
  className,
  onSuccess,
}: TransferFormProps) {
  const { transfer, isLoading, isSuccess, error, reset } =
    useTransfer(originAccountCode);
  const [insufficientFundsError, setInsufficientFundsError] = React.useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TransferFormData>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      destinationAccountCode: '',
      amount: undefined,
    },
  });

  React.useEffect(() => {
    if (isSuccess) {
      toast.success('Transferência realizada com sucesso!');
      form.reset();
      setInsufficientFundsError(null);
      reset();
      onSuccess?.();
    }
  }, [isSuccess, form, reset, onSuccess]);

  React.useEffect(() => {
    if (error && !insufficientFundsError) {
      toast.error(
        error.message || 'Erro ao realizar transferência. Tente novamente.'
      );
    }
  }, [error, insufficientFundsError]);

  const amountValue = form.watch('amount');
  const destinationCode = form.watch('destinationAccountCode');
  React.useEffect(() => {
    if (insufficientFundsError && (amountValue !== undefined || error)) {
      setInsufficientFundsError(null);
    }
  }, [amountValue, error, insufficientFundsError]);

  React.useEffect(() => {
    if (
      destinationCode &&
      originAccountCode &&
      destinationCode === originAccountCode
    ) {
      form.setError('destinationAccountCode', {
        type: 'manual',
        message: 'A conta de destino não pode ser a mesma da origem',
      });
    } else {
      form.clearErrors('destinationAccountCode');
    }
  }, [destinationCode, originAccountCode, form]);

  const onSubmit = async (data: TransferFormData) => {
    if (isSubmitting || isLoading) {
      return;
    }

    setInsufficientFundsError(null);

    if (!originAccountCode) {
      const errorMessage = 'Conta de origem não identificada';
      toast.error(errorMessage);
      return;
    }

    if (data.destinationAccountCode === originAccountCode) {
      const errorMessage = 'A conta de destino não pode ser a mesma da origem';
      form.setError('destinationAccountCode', {
        type: 'manual',
        message: errorMessage,
      });
      toast.error(errorMessage);
      return;
    }

    if (currentBalance === undefined) {
      const errorMessage =
        'Aguarde o carregamento do saldo antes de realizar a transferência';
      setInsufficientFundsError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (data.amount > currentBalance) {
      const errorMessage = 'Saldo insuficiente para transferência';
      setInsufficientFundsError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      await transfer(data.destinationAccountCode, data.amount);
    } catch (err) {
      if (err instanceof Error && err.message.includes('insuficiente')) {
        setInsufficientFundsError(err.message);
        toast.error(err.message);
      }
      if (import.meta.env.DEV) {
        console.error('Transfer error:', err);
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
            name="destinationAccountCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta de Destino</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="XXXX-X"
                    disabled={isLoading || isSubmitting}
                    aria-label="Código da conta de destino"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    aria-label="Valor da transferência em reais"
                  />
                </FormControl>
                {insufficientFundsError && (
                  <p className="text-destructive text-sm font-medium">
                    {insufficientFundsError}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={
              isLoading ||
              isSubmitting ||
              currentBalance === undefined ||
              !originAccountCode
            }
            className="w-full gap-2"
            aria-label="Transferir"
          >
            {isLoading ? (
              <>
                <span
                  className="inline-block h-4 w-4 animate-spin"
                  aria-hidden="true"
                >
                  ↻
                </span>
                Processando...
              </>
            ) : (
              'Transferir'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
