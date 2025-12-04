/**
 * Component for displaying authentication error messages
 * Used for both login and signup forms
 */

import { cn } from '@lw-financial/ui';

export interface LoginErrorProps {
  error?: string | null;
  className?: string;
  defaultMessage?: string;
}

/**
 * Displays authentication error messages
 * Does not expose sensitive system information (SC-006)
 */
export function LoginError({
  error,
  className,
  defaultMessage = 'Erro ao fazer login. Tente novamente.',
}: LoginErrorProps) {
  if (!error) {
    return null;
  }

  const getErrorMessage = (err: string): string => {
    const lowerErr = err.toLowerCase();

    if (lowerErr.includes('invalid credentials')) {
      return 'Credenciais inválidas. Verifique seu username e senha.';
    }
    if (lowerErr.includes('network') || lowerErr.includes('fetch')) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    if (lowerErr.includes('internal')) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }

    const isGenericError =
      lowerErr.includes('erro ao') ||
      lowerErr.includes('error') ||
      lowerErr === 'erro' ||
      lowerErr === 'error';

    if (isGenericError) {
      return defaultMessage;
    }

    return err;
  };

  return (
    <div
      className={cn(
        'rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <p>{getErrorMessage(error)}</p>
    </div>
  );
}
