/**
 * Dashboard sidebar component
 * Displays navigation, account selector, and user dropdown
 */

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lw-financial/ui';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowRightLeft, ArrowUp, Plus } from 'lucide-react';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAccounts } from '../../hooks/use-accounts';
import { useBalance } from '../../hooks/use-balance';
import { DepositDialog } from './deposit-dialog';
import { NewAccountDialog } from './new-account-dialog';
import { TransferDialog } from './transfer-dialog';
import { UserDropdown } from './user-dropdown';
import { WithdrawDialog } from './withdraw-dialog';

export interface DashboardSidebarProps {
  selectedAccountId?: string | null;
  selectedAccountCode?: string | null;
  onAccountChange?: (accountId: string) => void;
}

/**
 * Formats account display name
 */
function formatAccountName(
  accountCode: string | null,
  accountId: string
): string {
  if (accountCode) {
    return `Conta ${accountCode}`;
  }
  const shortId = accountId.slice(-4);
  return `Conta ${shortId}`;
}

/**
 * Dashboard sidebar component
 * Provides navigation, account selection, and user menu
 */
export function DashboardSidebar({
  selectedAccountId,
  selectedAccountCode,
  onAccountChange,
}: DashboardSidebarProps) {
  const navigate = useNavigate();
  const params = useParams<{ accountCode?: string }>();
  const queryClient = useQueryClient();
  const { accounts, isLoading, error } = useAccounts();

  const urlAccountCode = params.accountCode || selectedAccountCode;
  const { balance } = useBalance(urlAccountCode || undefined);

  const currentAccount = urlAccountCode
    ? accounts.find((acc) => acc.code === urlAccountCode)
    : selectedAccountId
      ? accounts.find((acc) => acc.id === selectedAccountId)
      : accounts[0] || null;

  const handleAccountChange = React.useCallback(
    (value: string) => {
      const selectedAccount = accounts.find(
        (acc) => acc.code === value || acc.id === value
      );

      if (!selectedAccount) {
        return;
      }

      if (selectedAccount.code && selectedAccount.code !== urlAccountCode) {
        const newAccountCode = selectedAccount.code;

        if (selectedAccount.code) {
          const targetAccount = accounts.find(
            (acc) => acc.code === newAccountCode
          );

          if (targetAccount) {
            queryClient.setQueryData(['account-by-code', newAccountCode], {
              id: targetAccount.id,
              code: targetAccount.code,
              balance: targetAccount.balance,
            });

            queryClient.setQueryData(
              ['balance', newAccountCode],
              targetAccount.balance
            );
          }
        }

        navigate(`/conta/${newAccountCode}`, { replace: true });
      } else if (onAccountChange && selectedAccount.id) {
        onAccountChange(selectedAccount.id);
      }
    },
    [accounts, navigate, onAccountChange, urlAccountCode, queryClient]
  );

  const currentAccountCode = currentAccount?.code || urlAccountCode;

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <img src="/bank.svg" alt="Bank icon" className="h-6 w-6" />
          <h1 className="text-xl font-bold text-foreground">LW Financial</h1>
        </div>
        <div className="mt-4">
          {isLoading ? (
            <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
              Carregando contas...
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Erro ao carregar contas
            </div>
          ) : accounts.length === 0 ? (
            <div className="space-y-2">
              <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                Nenhuma conta encontrada
              </div>
              <NewAccountDialog
                trigger={
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar conta
                  </Button>
                }
              />
            </div>
          ) : accounts.length > 1 ? (
            <Select
              value={currentAccountCode || undefined}
              onValueChange={handleAccountChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isLoading ? 'Carregando...' : 'Selecione uma conta'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem
                    key={account.id}
                    value={account.code || account.id}
                  >
                    {formatAccountName(account.code, account.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : currentAccount ? (
            <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
              {formatAccountName(currentAccount.code, currentAccount.id)}
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <NewAccountDialog
            trigger={
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Nova conta
              </Button>
            }
          />
          <DepositDialog
            accountId={currentAccount?.id || null}
            accountCode={currentAccountCode || undefined}
            trigger={
              <Button variant="ghost" className="w-full justify-start gap-2">
                <ArrowDown className="h-4 w-4 text-emerald-600" />
                Depositar
              </Button>
            }
          />
          <WithdrawDialog
            accountId={currentAccount?.id || null}
            accountCode={currentAccountCode || undefined}
            currentBalance={balance}
            trigger={
              <Button variant="ghost" className="w-full justify-start gap-2">
                <ArrowUp className="h-4 w-4 text-red-600" />
                Sacar
              </Button>
            }
          />
          <TransferDialog
            originAccountCode={currentAccountCode || undefined}
            currentBalance={balance}
            trigger={
              <Button variant="ghost" className="w-full justify-start gap-2">
                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                Transferir
              </Button>
            }
          />
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <UserDropdown />
      </div>
    </aside>
  );
}
