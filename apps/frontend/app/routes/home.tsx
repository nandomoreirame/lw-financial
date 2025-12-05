/**
 * Home route - Redirects to first account
 * This route redirects authenticated users to their first account page
 */

import * as React from 'react';
import { redirect, useNavigate } from 'react-router';
import { getFirstAccount, useAccounts } from '../hooks/use-accounts';
import {
  checkAuthentication,
  requireAuth,
} from '../middleware/protected-route';
import type { Route } from './+types/home';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'LW Financial' },
    { name: 'description', content: 'Sistema bancário' },
  ];
}

/**
 * Loader for home route
 * Validates authentication and allows client-side redirect
 */
export async function loader({ request }: Route.LoaderArgs) {
  const isServerSide = typeof window === 'undefined';
  const authCheck = checkAuthentication(request);

  if (isServerSide && !authCheck.isAuthenticated) {
    return {
      needsClientAuth: true,
    };
  }

  if (!authCheck.isAuthenticated) {
    return redirect('/login');
  }

  requireAuth(request);

  return {
    needsClientAuth: false,
  };
}

/**
 * Home page component
 * Redirects to first account on client-side
 */
export default function Home({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { accounts, isLoading: isLoadingAccounts, refetch } = useAccounts();
  const [retryCount, setRetryCount] = React.useState(0);
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 1500;

  React.useEffect(() => {
    if (loaderData?.needsClientAuth) {
      const mockRequest = new Request(window.location.href);
      const authCheck = checkAuthentication(mockRequest);

      if (!authCheck.isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }
    }

    if (!isLoadingAccounts && accounts.length > 0) {
      const firstAccount = getFirstAccount(accounts);
      if (firstAccount?.code) {
        navigate(`/conta/${firstAccount.code}`, { replace: true });
        return;
      }

      if (retryCount < MAX_RETRIES) {
        const timer = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          refetch();
        }, RETRY_DELAY_MS);
        return () => clearTimeout(timer);
      }
    }

    if (!isLoadingAccounts && accounts.length === 0) {
      navigate('/login', { replace: true });
    }
  }, [
    accounts,
    isLoadingAccounts,
    navigate,
    loaderData?.needsClientAuth,
    retryCount,
    refetch,
  ]);

  if (!isLoadingAccounts && accounts.length > 0 && !accounts[0]?.code) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-6 dark:bg-yellow-950 dark:border-yellow-600">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <svg
                  className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                  Conta em Processamento
                </h2>
                <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  Sua conta está sendo configurada. Aguarde enquanto geramos o
                  código da sua conta bancária.
                </p>
                {retryCount > 0 && (
                  <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                    Tentativa {retryCount} de {MAX_RETRIES}
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setRetryCount(0);
                      refetch();
                    }}
                    className="text-sm font-medium text-yellow-800 hover:text-yellow-900 hover:underline dark:text-yellow-200 dark:hover:text-yellow-100"
                  >
                    Atualizar agora
                  </button>
                  {retryCount >= MAX_RETRIES && (
                    <a
                      href="/"
                      className="text-sm font-medium text-yellow-800 hover:text-yellow-900 hover:underline dark:text-yellow-200 dark:hover:text-yellow-100"
                    >
                      Recarregar página
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="container mx-auto max-w-4xl">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-center text-muted-foreground">
            Redirecionando...
          </div>
        </div>
      </div>
    </div>
  );
}
