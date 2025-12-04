/**
 * Home route - Protected route for displaying account balance
 * This is now the root route (/) and serves as the dashboard
 */

import * as React from 'react';
import { BalanceCard } from '../components/dashboard/balance-card';
import { DepositForm } from '../components/dashboard/deposit-form';
import { Header } from '../components/dashboard/header';
import { TransactionHistory } from '../components/dashboard/transaction-history';
import { WithdrawForm } from '../components/dashboard/withdraw-form';
import { useBalance } from '../hooks/use-balance';
import {
  checkAuthentication,
  requireAuth,
} from '../middleware/protected-route';
import type { Route } from './+types/home';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Dashboard - LW Financial' },
    { name: 'description', content: 'Visualize seu saldo bancário' },
  ];
}

/**
 * Loader for home route (dashboard)
 * Validates authentication and extracts account ID
 *
 * Note: On server-side, if token is not in cookie, we allow the component
 * to check authentication on the client where sessionStorage is available.
 * This handles the case where user just logged in and token is only in sessionStorage.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const isServerSide = typeof window === 'undefined';
  const authCheck = checkAuthentication(request);

  // On server-side, if no token in cookie, allow client-side check
  // This happens when user just logged in and token is only in sessionStorage
  if (isServerSide && !authCheck.isAuthenticated) {
    // Return null accountId to allow client-side check
    // The component will handle authentication check on the client
    return {
      accountId: null,
      needsClientAuth: true,
    };
  }

  // Require authentication - redirects to login if not authenticated
  requireAuth(request);

  // Get account ID from token
  if (!authCheck.accountId) {
    // If no account ID, redirect to login with error
    throw new Response('Account ID não encontrado', { status: 401 });
  }

  return {
    accountId: authCheck.accountId,
    needsClientAuth: false,
  };
}

/**
 * Home page component (Dashboard)
 * Displays account balance with loading and error states
 */
export default function Home({ loaderData }: Route.ComponentProps) {
  const [clientAccountId, setClientAccountId] = React.useState<string | null>(
    null
  );

  // Check authentication on client if needed (when token is only in sessionStorage)
  React.useEffect(() => {
    if (loaderData?.needsClientAuth) {
      // Create a mock request object for client-side check
      const mockRequest = new Request(window.location.href);
      const authCheck = checkAuthentication(mockRequest);

      if (!authCheck.isAuthenticated || !authCheck.accountId) {
        // Redirect to login with error
        const loginUrl = new URL('/login', window.location.origin);
        loginUrl.searchParams.set(
          'error',
          encodeURIComponent(authCheck.error || 'Token inválido')
        );
        window.location.href = loginUrl.toString();
        return;
      }

      setClientAccountId(authCheck.accountId);
    }
  }, [loaderData?.needsClientAuth]);

  // Use accountId from loader or client-side check
  const accountId = loaderData?.accountId || clientAccountId;
  const { balance, formattedBalance, isLoading, error, refetch } =
    useBalance(accountId);

  const handleRefresh = () => {
    refetch();
  };

  // Use isLoading from React Query to determine refreshing state
  // Only show refreshing if we already have a balance (not initial load)
  const isRefreshing = isLoading && balance !== undefined;

  // Show loading state while checking client-side authentication
  if (loaderData?.needsClientAuth && !clientAccountId) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">Verificando autenticação...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl p-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visualize seu saldo bancário
          </p>
        </div>

        <BalanceCard
          balance={balance}
          formattedBalance={formattedBalance}
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <DepositForm accountId={accountId} />
          <WithdrawForm accountId={accountId} currentBalance={balance} />
        </div>

        <TransactionHistory />
      </div>
    </div>
  );
}
