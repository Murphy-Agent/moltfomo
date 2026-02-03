import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type HTMLAttributes } from 'react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--foreground)] text-[var(--background)]',
        secondary: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
        success: 'bg-[var(--success-light)] text-green-800',
        destructive: 'bg-[var(--error-light)] text-red-800',
        outline: 'border border-[var(--card-border)] text-[var(--foreground)]',
        realized: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
        unrealized: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
