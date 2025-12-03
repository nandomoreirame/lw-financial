import * as React from 'react';
import { cn } from '@/lib/utils';

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex items-center min-w-0', className)}
      {...props}
    />
  );
});
InputGroup.displayName = 'InputGroup';

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'inline-start' | 'inline-end' | 'block-start' | 'block-end';
  }
>(({ className, align = 'inline-start', ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="input-group-addon"
      className={cn(
        'flex items-center justify-center px-3 text-sm text-muted-foreground border border-input bg-muted/50 h-9',
        align === 'inline-start' && 'border-r-0 rounded-l-md',
        align === 'inline-end' && 'border-l-0 rounded-r-md',
        align === 'block-start' && 'border-b-0 rounded-t-md',
        align === 'block-end' && 'border-t-0 rounded-b-md',
        className
      )}
      {...props}
    />
  );
});
InputGroupAddon.displayName = 'InputGroupAddon';

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      data-slot="input-group-control"
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&:has(+[data-slot="input-group-addon"])]:rounded-r-none [&:has(+[data-slot="input-group-addon"])]:border-r-0',
        '[[data-slot="input-group-addon"]+&]:rounded-l-none [[data-slot="input-group-addon"]+&]:border-l-0',
        className
      )}
      {...props}
    />
  );
});
InputGroupInput.displayName = 'InputGroupInput';

export { InputGroup, InputGroupAddon, InputGroupInput };
