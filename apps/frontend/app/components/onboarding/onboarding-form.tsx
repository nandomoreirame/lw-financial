/**
 * Onboarding form component for setting initial bank account balance
 * Allows new users to add an initial deposit to their newly created account
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@lw-financial/shared';
import {
  Button,
  Card,
  CardContent,
  cn,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@lw-financial/ui';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createAccount, getAccounts } from '../../lib/api';
import { CurrencyInput } from '../dashboard/currency-input';

/**
 * Schema for onboarding form
 * Amount is optional (can be undefined to skip)
 * If provided, must be a valid positive number
 */
const onboardingFormSchema = z.object({
  amount: z
    .number({
      invalid_type_error: 'Valor deve ser um número',
    })
    .min(0.01, 'Valor mínimo é R$ 0,01')
    .max(999999.99, 'Valor máximo é R$ 999.999,99')
    .refine(
      (value) => {
        const valueStr = value.toString();
        if (valueStr.includes('e') || valueStr.includes('E')) {
          return value >= 0.01 && value <= 999999.99;
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

type OnboardingFormData = z.infer<typeof onboardingFormSchema>;

export interface OnboardingFormProps {
  className?: string;
}

/**
 * Onboarding form component
 * Handles initial deposit for newly created bank account
 */
export function OnboardingForm({ className }: OnboardingFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [skipDeposit, setSkipDeposit] = React.useState(false);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: {
      amount: undefined,
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);

    try {
      let newAccount: { code: string | null; id: string };

      if (skipDeposit || !data.amount) {
        newAccount = await createAccount(0);
      } else {
        newAccount = await createAccount(data.amount);
        toast.success('Conta criada com saldo inicial adicionado com sucesso!');
      }

      if (newAccount.code) {
        navigate(`/conta/${newAccount.code}`);
      } else {
        const accounts = await getAccounts();
        const account = accounts.find((acc) => acc.id === newAccount.id);
        if (account?.code) {
          navigate(`/conta/${account.code}`);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erro ao criar conta. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setSkipDeposit(true);
    form.handleSubmit(onSubmit)();
  };

  return (
    <div className={cn('w-full max-w-md', className)}>
      <div className="space-y-2 text-center mb-8">
        <div className="flex justify-center mb-2">
          <img src="/bank.svg" alt="Bank icon" className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">Configure sua conta bancária</h1>
        <p className="text-balance text-muted-foreground">
          Adicione um saldo inicial (opcional)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saldo inicial (opcional)</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isLoading || skipDeposit}
                          error={!!form.formState.errors.amount}
                          placeholder="R$ 0,00"
                          aria-label="Saldo inicial em reais"
                        />
                      </FormControl>
                      <FormDescription>
                        Você pode adicionar um saldo inicial agora ou pular esta
                        etapa e adicionar depois.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isLoading || skipDeposit}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <span
                        className="h-4 w-4 inline-block animate-spin mr-2"
                        aria-hidden="true"
                      >
                        ↻
                      </span>
                      Processando...
                    </>
                  ) : (
                    'Continuar'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isLoading || skipDeposit}
                  className="w-full"
                >
                  Pular e continuar sem saldo inicial
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
