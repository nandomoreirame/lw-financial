/**
 * Transfer dialog component
 * Wraps TransferForm in a Shadcn Dialog
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
import { ArrowRightLeft } from 'lucide-react';
import * as React from 'react';
import { TransferForm } from './transfer-form';

export interface TransferDialogProps {
  originAccountCode?: string;
  currentBalance: number | undefined;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog component for transferring money
 * Opens a dialog with the transfer form when triggered
 */
export function TransferDialog({
  originAccountCode,
  currentBalance,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TransferDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const defaultTrigger = (
    <Button>
      <ArrowRightLeft className="h-4 w-4 mr-2" />
      Transferir
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transferir</DialogTitle>
          <DialogDescription>
            Transfira dinheiro para outra conta (R$ 0,01 a R$ 999.999,99)
          </DialogDescription>
        </DialogHeader>
        <TransferForm
          originAccountCode={originAccountCode}
          currentBalance={currentBalance}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
