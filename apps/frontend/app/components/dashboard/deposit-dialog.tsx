/**
 * Deposit dialog component
 * Wraps DepositForm in a Shadcn Dialog
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
import { ArrowDown } from 'lucide-react';
import * as React from 'react';
import { DepositForm } from './deposit-form';

export interface DepositDialogProps {
  accountId: string | null;
  accountCode?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog component for depositing money
 * Opens a dialog with the deposit form when triggered
 */
export function DepositDialog({
  accountId,
  accountCode,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: DepositDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const defaultTrigger = (
    <Button>
      <ArrowDown className="mr-2 h-4 w-4" />
      Depositar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Depositar</DialogTitle>
          <DialogDescription>
            Adicione dinheiro à sua conta (R$ 0,01 a R$ 999.999,99)
          </DialogDescription>
        </DialogHeader>
        <DepositForm
          accountId={accountId}
          accountCode={accountCode}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
