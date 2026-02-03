'use client';

import { cn } from '@/lib/utils';
import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, className, side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-1.5 text-xs font-medium bg-[var(--foreground)] text-[var(--background)] rounded-md whitespace-nowrap shadow-lg',
            positionClasses[side],
            className
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-[var(--foreground)] rotate-45',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 -mt-1',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 -mb-1',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 -ml-1',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 -mr-1'
            )}
          />
        </div>
      )}
    </div>
  );
}
