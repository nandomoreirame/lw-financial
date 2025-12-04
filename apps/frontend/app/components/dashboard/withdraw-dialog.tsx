/**
 * Withdraw dialog component
 * Wraps WithdrawForm in a Shadcn Dialog
 */

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@lw-financial/ui';
import { ArrowUp } from 'lucide-react';
import * as React from 'react';
import { WithdrawForm } from './withdraw-form';

export interface WithdrawDialogProps {
  accountId: string | null;
  accountCode?: string;
  currentBalance: number | undefined;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog component for withdrawing money
 * Opens a dialog with the withdraw form when triggered
 */
export function WithdrawDialog({
  accountId,
  accountCode,
  currentBalance,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: WithdrawDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const defaultTrigger = (
    <Button>
      <ArrowUp className="h-4 w-4 mr-2" />
      Sacar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sacar</DialogTitle>
          <DialogDescription>
            Retire dinheiro da sua conta (R$ 0,01 a R$ 999.999,99)
          </DialogDescription>
        </DialogHeader>
        <WithdrawForm
          accountId={accountId}
          accountCode={accountCode}
          currentBalance={currentBalance}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
