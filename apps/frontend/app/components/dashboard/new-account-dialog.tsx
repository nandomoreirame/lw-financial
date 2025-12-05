/**
 * New account dialog component
 * Wraps NewAccountForm in a Shadcn Dialog
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@lw-financial/ui';
import { Plus } from 'lucide-react';
import * as React from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { NewAccountForm } from './new-account-form';

export interface NewAccountDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Dialog component for creating a new bank account
 * Opens a dialog with the new account form when triggered
 */
export function NewAccountDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: NewAccountDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const handleSuccess = React.useCallback(
    (accountCode: string | null) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      if (accountCode) {
        navigate(`/conta/${accountCode}`, { replace: true });
      } else {
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
        const accounts = queryClient.getQueryData(['accounts']) as
          | Array<{ id: string; code: string | null }>
          | undefined;
        if (accounts && accounts.length > 0) {
          const lastAccount = accounts[accounts.length - 1];
          if (lastAccount?.code) {
            navigate(`/conta/${lastAccount.code}`, { replace: true });
          }
        }
      }

      setOpen(false);
    },
    [navigate, queryClient, setOpen]
  );

  const defaultTrigger = (
    <button className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium">
      <Plus className="h-4 w-4" />
      Nova conta
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Conta</DialogTitle>
          <DialogDescription>
            Crie uma nova conta bancária. Você pode adicionar um saldo inicial
            opcional.
          </DialogDescription>
        </DialogHeader>
        <NewAccountForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
