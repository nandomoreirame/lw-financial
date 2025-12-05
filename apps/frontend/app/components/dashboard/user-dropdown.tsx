/**
 * User dropdown component for dashboard
 * Displays user name, email, and logout option
 */

import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lw-financial/ui';
import { ArrowDown, ArrowRightLeft, ArrowUp, LogOut, User } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { useAccounts } from '../../hooks/use-accounts';
import { useAuth } from '../../hooks/use-auth';
import { useBalance } from '../../hooks/use-balance';
import { decodeToken, getToken } from '../../lib/auth';
import { DepositDialog } from './deposit-dialog';
import { TransferDialog } from './transfer-dialog';
import { WithdrawDialog } from './withdraw-dialog';

/**
 * Gets user initials from name
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * User dropdown component
 * Shows user info and logout option
 */
export function UserDropdown() {
  const { logout } = useAuth();
  const token = getToken();
  const { accounts } = useAccounts();
  const currentAccount = accounts[0];
  const { balance } = useBalance(currentAccount?.code || undefined);
  const [depositOpen, setDepositOpen] = React.useState(false);
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);

  const userInfo = token ? decodeToken(token) : null;
  const userName = userInfo?.username || 'Usuário';
  const userEmail = userInfo?.email || '';

  const handleLogout = () => {
    logout();
  };

  const handleDepositClick = () => {
    setDepositOpen(true);
  };

  const handleWithdrawClick = () => {
    setWithdrawOpen(true);
  };

  const handleTransferClick = () => {
    setTransferOpen(true);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(userName)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{userName}</span>
            {userEmail && (
              <span className="text-xs text-muted-foreground">{userEmail}</span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{userName}</span>
            {userEmail && (
              <span className="text-xs font-normal text-muted-foreground">
                {userEmail}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDepositClick}>
          <ArrowDown className="mr-2 h-4 w-4" />
          Depositar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWithdrawClick}>
          <ArrowUp className="mr-2 h-4 w-4" />
          Sacar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTransferClick}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transferir
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => toast.info('Funcionalidade ainda não implementada')}
        >
          <User className="mr-2 h-4 w-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
      <DepositDialog
        accountId={currentAccount?.id || null}
        accountCode={currentAccount?.code || undefined}
        open={depositOpen}
        onOpenChange={setDepositOpen}
        trigger={<div style={{ display: 'none' }} />}
      />
      <WithdrawDialog
        accountId={currentAccount?.id || null}
        accountCode={currentAccount?.code || undefined}
        currentBalance={balance}
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        trigger={<div style={{ display: 'none' }} />}
      />
      <TransferDialog
        originAccountCode={currentAccount?.code || undefined}
        currentBalance={balance}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        trigger={<div style={{ display: 'none' }} />}
      />
    </DropdownMenu>
  );
}
