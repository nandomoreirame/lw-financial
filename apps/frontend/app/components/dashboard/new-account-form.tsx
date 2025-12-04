/**
 * New account form component for creating a new bank account
 * Uses Shadcn UI Form component with react-hook-form and CurrencyInput for currency input
 */

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  cn,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@lw-financial/ui';
import { z } from '@lw-financial/shared';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createAccount } from '../../lib/api';
import { CurrencyInput } from './currency-input';

/**
 * Schema for new account form
 * Amount is optional (can be undefined to skip)
 * If provided, must be a valid positive number
 */
const newAccountFormSchema = z.object({
  initialBalance: z
    .number({
      invalid_type_error: 'Valor deve ser um número',
    })
    .min(0, 'Valor mínimo é R$ 0,00')
    .max(999999.99, 'Valor máximo é R$ 999.999,99')
    .refine(
      (value) => {
        const valueStr = value.toString();
        if (valueStr.includes('e') || valueStr.includes('E')) {
          return value >= 0 && value <= 999999.99;
        }
        const decimalPlaces = (valueStr.split('.')[1] || '').length;
        return decimalPlaces <= 2;
      },
      {
        message: 'Valor deve ter no máximo 2 casas decimais',
      }
    )
    .optional()
    .or(z.undefined()),
});

type NewAccountFormData = z.infer<typeof newAccountFormSchema>;

export interface NewAccountFormProps {
  className?: string;
  onSuccess?: (accountCode: string | null) => void;
}

/**
 * Form component for creating a new bank account
 * Uses Shadcn UI Form with CurrencyInput for currency input with R$ prefix
 */
export function NewAccountForm({ className, onSuccess }: NewAccountFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<NewAccountFormData>({
    resolver: zodResolver(newAccountFormSchema),
    defaultValues: {
      initialBalance: undefined,
    },
  });

  const onSubmit = async (data: NewAccountFormData) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const initialBalance = data.initialBalance || 0;
      const newAccount = await createAccount(initialBalance);

      toast.success('Conta criada com sucesso!');
      form.reset();
      onSuccess?.(newAccount.code || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erro ao criar conta. Tente novamente.';
      toast.error(errorMessage);
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
            name="initialBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Saldo inicial (opcional)</FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    error={!!form.formState.errors.initialBalance}
                    aria-label="Saldo inicial em reais"
                  />
                </FormControl>
                <FormDescription>
                  Você pode adicionar um saldo inicial agora ou deixar em R$
                  0,00
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full gap-2"
            aria-label="Criar conta"
          >
            {isSubmitting ? (
              <>
                <span
                  className="h-4 w-4 inline-block animate-spin"
                  aria-hidden="true"
                >
                  ↻
                </span>
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
