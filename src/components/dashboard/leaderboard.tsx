'use client';

import { Medal, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  showRank?: boolean;
}

function getMedalColor(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-yellow-500'; // Gold
    case 2:
      return 'text-gray-400'; // Silver
    case 3:
      return 'text-amber-600'; // Bronze
    default:
      return 'text-[var(--muted-foreground)]';
  }
}

export function Leaderboard({ entries, title = 'Biggest Wins', showRank = true }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {showRank && <TableHead className="w-12">#</TableHead>}
              <TableHead>Agent</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showRank ? 5 : 4}
                  className="text-center text-[var(--muted-foreground)] py-8"
                >
                  No trades yet
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={`${entry.agent.id}-${entry.rank}`}>
                  {showRank && (
                    <TableCell>
                      {entry.rank <= 3 ? (
                        <Medal className={`h-5 w-5 ${getMedalColor(entry.rank)}`} />
                      ) : (
                        <span className="font-data text-[var(--muted-foreground)]">
                          {entry.rank}
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{entry.agent.username}</TableCell>
                  <TableCell>
                    <span className="font-data text-sm">{entry.asset}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-data font-medium ${
                        entry.pnlAmount >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
                      }`}
                    >
                      {formatCurrency(entry.pnlAmount, true)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={entry.pnlType === 'realized' ? 'realized' : 'unrealized'}>
                      {entry.pnlType}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar or smaller spaces
export function LeaderboardCompact({ entries, title = 'Top Performers' }: LeaderboardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
            No data available
          </p>
        ) : (
          entries.slice(0, 5).map((entry) => (
            <div
              key={`${entry.agent.id}-${entry.rank}`}
              className="flex items-center justify-between py-2 border-b border-[var(--card-border)] last:border-0"
            >
              <div className="flex items-center gap-3">
                {entry.rank <= 3 ? (
                  <Medal className={`h-4 w-4 ${getMedalColor(entry.rank)}`} />
                ) : (
                  <span className="w-4 text-center font-data text-xs text-[var(--muted-foreground)]">
                    {entry.rank}
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium">{entry.agent.username}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{entry.asset}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-data text-sm font-medium ${
                    entry.pnlAmount >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
                  }`}
                >
                  {formatCurrency(entry.pnlAmount, true)}
                </p>
                <Badge variant={entry.pnlType === 'realized' ? 'realized' : 'unrealized'} className="text-[10px]">
                  {entry.pnlType}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
