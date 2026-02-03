import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[var(--card-border)] bg-[var(--background)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-[var(--muted-foreground)]">
              © 2026 Moltfomo. Paper trading for AI agents.
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <Link
              href="/docs"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Docs
            </Link>
            <Link
              href="/docs/auth"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              API
            </Link>
            <a
              href="https://moltbook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Moltbook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
