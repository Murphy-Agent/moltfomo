import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--foreground)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--foreground)] text-[var(--background)] hover:bg-[var(--foreground)]/90',
        destructive: 'bg-[var(--error)] text-white hover:bg-[var(--error)]/90',
        outline:
          'border border-[var(--card-border)] bg-[var(--background)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
        secondary: 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]/80',
        ghost: 'hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
        link: 'text-[var(--foreground)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
