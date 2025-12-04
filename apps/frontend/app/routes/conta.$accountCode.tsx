/**
 * Account route - Dynamic route for displaying account by code
 * Route: /conta/:accountCode
 */

import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import { BalanceCard } from '../components/dashboard/balance-card';
import { DashboardSidebar } from '../components/dashboard/dashboard-sidebar';
import { DepositDialog } from '../components/dashboard/deposit-dialog';
import { TransactionHistory } from '../components/dashboard/transaction-history';
import { WithdrawDialog } from '../components/dashboard/withdraw-dialog';
import { useAccountByCode } from '../hooks/use-account-by-code';
import { getFirstAccount, useAccounts } from '../hooks/use-accounts';
import { useBalance } from '../hooks/use-balance';
import { isValidAccountCodeFormat } from '../lib/validators';
import {
  checkAuthentication,
  requireAuth,
} from '../middleware/protected-route';
import type { Route } from './+types/conta.$accountCode';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Conta - LW Financial' },
    { name: 'description', content: 'Visualize sua conta bancária' },
  ];
}

/**
 * Loader for account route
 * Validates authentication and account code format
 */
export async function loader({ request, params }: Route.LoaderArgs) {
  const isServerSide = typeof window === 'undefined';
  const authCheck = checkAuthentication(request);
  const { accountCode } = params;

  if (accountCode && !isValidAccountCodeFormat(accountCode)) {
    throw new Response('Formato de código de conta inválido', { status: 400 });
  }

  if (isServerSide && !authCheck.isAuthenticated) {
    return {
      accountCode: accountCode || null,
      needsClientAuth: true,
    };
  }

  requireAuth(request);

  return {
    accountCode: accountCode || null,
    needsClientAuth: false,
  };
}

/**
 * Account page component
 * Displays account information by code
 */
export default function AccountPage({ loaderData }: Route.ComponentProps) {
  const { accountCode } = useParams<{ accountCode: string }>();
  const navigate = useNavigate();
  const [clientAccountId, setClientAccountId] = React.useState<string | null>(
    null
  );

  const { accounts, isLoading: isLoadingAccounts } = useAccounts();
  React.useEffect(() => {
    if (!accountCode && !isLoadingAccounts) {
      const firstAccount = getFirstAccount(accounts);
      if (firstAccount?.code) {
        navigate(`/conta/${firstAccount.code}`, { replace: true });
      }
    }
  }, [accountCode, accounts, isLoadingAccounts, navigate]);

  React.useEffect(() => {
    if (loaderData?.needsClientAuth) {
      const mockRequest = new Request(window.location.href);
      const authCheck = checkAuthentication(mockRequest);

      if (!authCheck.isAuthenticated || !authCheck.accountId) {
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

  const isValidCode = accountCode
    ? isValidAccountCodeFormat(accountCode)
    : false;

  const {
    account,
    isLoading: isLoadingAccount,
    error: accountError,
  } = useAccountByCode(isValidCode ? accountCode : undefined);

  const accountId = account?.id || clientAccountId;
  const {
    balance,
    formattedBalance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch,
  } = useBalance(accountCode);

  const handleRefresh = () => {
    refetch();
  };

  const handleAccountChange = (newAccountCode: string) => {
    navigate(`/conta/${newAccountCode}`);
  };

  const isRefreshing = isLoadingBalance && balance !== undefined;

  if (loaderData?.needsClientAuth && !clientAccountId) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center">Verificando autenticação...</div>
        </div>
      </div>
    );
  }

  if (accountCode && !isValidCode) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 p-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
              <h2 className="text-xl font-semibold text-destructive">
                Código de Conta Inválido
              </h2>
              <p className="mt-2 text-muted-foreground">
                O formato do código deve ser XXXX-X (4 dígitos, hífen, 1
                dígito).
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (accountError && accountError.message.includes('não encontrada')) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 p-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
              <h2 className="text-xl font-semibold text-destructive">
                Conta Não Encontrada
              </h2>
              <p className="mt-2 text-muted-foreground">
                A conta solicitada não foi encontrada ou você não tem permissão
                para acessá-la.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoadingAccount || isLoadingBalance) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <main className="ml-64 p-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">Carregando conta...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        selectedAccountCode={accountCode}
        onAccountChange={handleAccountChange}
      />
      <main className="ml-64 p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Conta {account?.code}</h1>
            <p className="text-muted-foreground mt-2">
              Visualize sua conta bancária
            </p>
          </div>

          <BalanceCard
            balance={balance}
            formattedBalance={formattedBalance}
            isLoading={isLoadingBalance}
            error={balanceError}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            accountCode={accountCode}
          />

          <div className="flex gap-4">
            <DepositDialog accountId={accountId} accountCode={accountCode} />
            <WithdrawDialog
              accountId={accountId}
              accountCode={accountCode}
              currentBalance={balance}
            />
          </div>

          <TransactionHistory
            accountCode={accountCode}
            accountId={accountId || undefined}
          />
        </div>
      </main>
    </div>
  );
}
