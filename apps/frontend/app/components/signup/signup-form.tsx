/**
 * Signup form component with username, email, name and password fields
 * Based on shadcn/ui login-01 block
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupRequest } from '@lw-financial/shared';
import {
  Button,
  Card,
  CardContent,
  cn,
  Input,
  Label,
  Separator,
} from '@lw-financial/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { signup as signupAPI } from '../../lib/api';
import { storeToken } from '../../lib/auth';
import { LoginError } from '../login/login-error';

type SignupFormData = SignupRequest;

export interface SignupFormProps {
  className?: string;
}

/**
 * Signup form component
 * Handles form validation, submission, and error display
 */
export function SignupForm({ className }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await signupAPI(
        data.username,
        data.email,
        data.name,
        data.pass
      );

      storeToken(response.token);

      window.location.href = '/';
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao criar conta';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('w-full max-w-sm', className)}>
      <div className="space-y-2 text-center mb-8">
        <div className="flex justify-center mb-2">
          <img src="/bank.svg" alt="Bank icon" className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">LW Financial</h1>
        <p className="text-balance text-muted-foreground">
          Crie sua conta para começar
        </p>
      </div>

      <Card>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className={cn('space-y-6', className)}
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Digite seu nome completo"
                {...register('name')}
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p
                  id="name-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Digite seu email"
                {...register('email')}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Digite seu username"
                {...register('username')}
                aria-invalid={errors.username ? 'true' : 'false'}
                aria-describedby={
                  errors.username ? 'username-error' : undefined
                }
              />
              {errors.username && (
                <p
                  id="username-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="Digite sua senha"
                {...register('pass')}
                aria-invalid={errors.pass ? 'true' : 'false'}
                aria-describedby={errors.pass ? 'password-error' : undefined}
              />
              {errors.pass && (
                <p
                  id="password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.pass.message}
                </p>
              )}
            </div>

            <LoginError error={error} />

            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full"
            >
              {isSubmitting || isLoading ? 'Criando conta...' : 'Criar conta'}
            </Button>

            <Separator />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Faça login
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
