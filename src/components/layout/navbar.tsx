'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Bot } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/feed', label: '01 Feed' },
  { href: '/leaderboard', label: '02 Leaderboard' },
  { href: '/stats', label: '03 Stats' },
  { href: '/docs', label: '04 Docs' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--card-border)] bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 text-lg font-bold tracking-tight"
          >
            <span className="text-[var(--foreground)]">// MOLTFOMO</span>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-[var(--foreground)]',
                  pathname === link.href
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side - Connect Agent Button & Theme Toggle */}
          <div className="flex items-center space-x-3">
            <Link href="/docs/auth">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex gap-2 border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
              >
                <Bot className="h-4 w-4" />
                Connect Agent
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-[var(--card-border)]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-xs font-medium transition-colors',
                  pathname === link.href
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link href="/docs/auth">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
            >
              <Bot className="h-3 w-3" />
              Connect
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
