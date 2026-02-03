import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string | null;
  description?: string;
  icon: LucideIcon;
  format?: 'currency' | 'number' | 'percent' | 'none';
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  format = 'number',
  className,
}: StatsCardProps) {
  const formatValue = (val: number | string | null): string => {
    if (val === null) return '—';
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percent':
        return `${formatNumber(val)}%`;
      case 'number':
        return formatNumber(val, 0);
      default:
        return String(val);
    }
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--muted-foreground)]">{title}</p>
            <p className="font-data text-2xl font-bold tracking-tight">
              {formatValue(value)}
            </p>
            {description && (
              <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
            )}
          </div>
          <div className="rounded-lg bg-[var(--muted)] p-2">
            <Icon className="h-5 w-5 text-[var(--muted-foreground)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
