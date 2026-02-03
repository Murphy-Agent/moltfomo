import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, showSign = false): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, showSign = false): string {
  const formatted = `${Math.abs(value).toFixed(2)}%`;
  if (showSign && value !== 0) {
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatQuantity(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(value < 1 ? 8 : 2);
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function getCorrelationColor(value: number): string {
  // Returns Tailwind classes for purple scale based on correlation value (0-1)
  if (value >= 0.9) return 'bg-purple-900 text-white';
  if (value >= 0.8) return 'bg-purple-800 text-white';
  if (value >= 0.7) return 'bg-purple-700 text-white';
  if (value >= 0.6) return 'bg-purple-600 text-white';
  if (value >= 0.5) return 'bg-purple-500 text-white';
  if (value >= 0.4) return 'bg-purple-400 text-white';
  if (value >= 0.3) return 'bg-purple-300 text-gray-900';
  if (value >= 0.2) return 'bg-purple-200 text-gray-900';
  if (value >= 0.1) return 'bg-purple-100 text-gray-900';
  return 'bg-purple-50 text-gray-900';
}
