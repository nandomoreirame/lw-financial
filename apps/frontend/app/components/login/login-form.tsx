/**
 * Login form component with username and password fields
 * Based on shadcn/ui login-01 block
 */

import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@lw-financial/shared';
import { Button } from '@lw-financial/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { login as loginAPI } from '../../lib/api';
import { storeToken } from '../../lib/auth';
import { LoginError } from './login-error';

// Login form schema matching backend validation
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
      // Call login API directly from client
      const response = await loginAPI(data.username, data.password);

      // Store token in sessionStorage
      storeToken(response.token);

      // Use window.location.href to force full page reload
      // This ensures the loader runs on the client where sessionStorage is available
      // After SSR, the loader will run on the client and can access sessionStorage
      window.location.href = '/dashboard';
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-6', className)}
      noValidate
    >
      <div className="space-y-2 text-center">
        <div className="flex justify-center mb-2">
          <img src="/bank.svg" alt="Bank icon" className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">LW Financial</h1>
        <p className="text-balance text-muted-foreground">
          Faça login para acessar sua conta
        </p>
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
          aria-describedby={errors.username ? 'username-error' : undefined}
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
          aria-describedby={errors.password ? 'password-error' : undefined}
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
    </form>
  );
}
