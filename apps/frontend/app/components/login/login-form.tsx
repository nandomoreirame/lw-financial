/**
 * Login form component with username and password fields
 * Based on shadcn/ui login-01 block
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@lw-financial/shared';
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
import { login as loginAPI } from '../../lib/api';
import { storeToken } from '../../lib/auth';
import { LoginError } from './login-error';

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username é obrigatório')
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(20, 'Username deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'Username deve conter apenas letras e números'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  className?: string;
}

/**
 * Login form component
 * Handles form validation, submission, and error display
 */
export function LoginForm({ className }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginAPI(data.username, data.password);

      storeToken(response.token);

      window.location.href = '/';
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao fazer login';
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
          Faça login para acessar sua conta
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
                autoComplete="current-password"
                placeholder="Digite sua senha"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
              />
              {errors.password && (
                <p
                  id="password-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <LoginError error={error} />

            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full"
            >
              {isSubmitting || isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <Separator />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link to="/signup" className="text-primary hover:underline">
                  Registre-se
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
