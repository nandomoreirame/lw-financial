import * as React from 'react';
import { cn } from '@/lib/utils';

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex min-w-0 items-center', className)}
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
        'text-muted-foreground border-input bg-muted/50 flex h-9 items-center justify-center border px-3 text-sm',
        align === 'inline-start' && 'rounded-l-md border-r-0',
        align === 'inline-end' && 'rounded-r-md border-l-0',
        align === 'block-start' && 'rounded-t-md border-b-0',
        align === 'block-end' && 'rounded-b-md border-t-0',
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
        'border-input bg-background flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground',
        'focus-visible:ring-ring focus-visible:ring-1 focus-visible:outline-none',
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
