/**
 * Component for displaying login error messages
 */

import { cn } from '@lw-financial/ui';

export interface LoginErrorProps {
  error?: string | null;
  className?: string;
}

/**
 * Displays authentication error messages
 * Does not expose sensitive system information (SC-006)
 */
export function LoginError({ error, className }: LoginErrorProps) {
  if (!error) {
    return null;
  }

  const getErrorMessage = (err: string): string => {
    if (err.toLowerCase().includes('invalid credentials')) {
      return 'Credenciais inválidas. Verifique seu username e senha.';
    }
    if (
      err.toLowerCase().includes('network') ||
      err.toLowerCase().includes('fetch')
    ) {
      return 'Erro de conexão. Verifique sua internet e tente novamente.';
    }
    if (err.toLowerCase().includes('internal')) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    return 'Erro ao fazer login. Tente novamente.';
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
