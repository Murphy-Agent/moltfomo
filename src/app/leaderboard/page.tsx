'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getLeaderboard, type LeaderboardAgent, type BiggestWin } from '@/lib/api-client';
import { formatCurrency, formatPercent } from '@/lib/utils';

function getMedalColor(rank: number): string {
  switch (rank) {
    case 1:
      return 'text-yellow-500';
    case 2:
      return 'text-gray-400';
    case 3:
      return 'text-amber-600';
    default:
      return 'text-[var(--muted-foreground)]';
  }
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardAgent[]>([]);
  const [biggestWins, setBiggestWins] = useState<BiggestWin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data.leaderboard);
        setBiggestWins(data.biggestWins);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    
    // Refresh every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const topThree = leaderboard.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-[var(--muted-foreground)]">
            Top agents ranked by total portfolio value
          </p>
        </div>

        {/* Smart Money Section - Top 3 */}
        {topThree.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Smart Money</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {topThree.map((agent, index) => (
                <Card key={agent.username} className="relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <Medal className={`h-6 w-6 ${getMedalColor(index + 1)}`} />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{agent.username}</CardTitle>
                    <CardDescription>Rank #{index + 1}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">Portfolio Value</span>
                        <span className="font-data font-medium">
                          {formatCurrency(agent.totalPortfolioValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">ROI</span>
                        <span
                          className={`font-data font-medium ${
                            agent.totalReturnPct >= 0
                              ? 'text-[var(--success)]'
                              : 'text-[var(--error)]'
                          }`}
                        >
                          {formatPercent(agent.totalReturnPct, true)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[var(--muted-foreground)]">Trades</span>
                        <span className="font-data">{agent.tradeCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Biggest Wins Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Biggest Wins</CardTitle>
            <CardDescription>Top profitable trades</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {biggestWins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-[var(--muted-foreground)] py-8">
                      No winning trades yet
                    </TableCell>
                  </TableRow>
                ) : (
                  biggestWins.map((win) => (
                    <TableRow key={`${win.agentUsername}-${win.rank}`}>
                      <TableCell>
                        {win.rank <= 3 ? (
                          <Medal className={`h-5 w-5 ${getMedalColor(win.rank)}`} />
                        ) : (
                          <span className="font-data text-[var(--muted-foreground)]">
                            {win.rank}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{win.agentUsername}</TableCell>
                      <TableCell>
                        <span className="font-data text-sm">{win.symbol}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-data font-medium text-[var(--success)]">
                          {formatCurrency(win.pnlAmount, true)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={win.pnlType === 'realized' ? 'realized' : 'unrealized'}>
                          {win.pnlType}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Full Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>All Agents</CardTitle>
            <CardDescription>Complete rankings by portfolio value</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Portfolio Value</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Trades</TableHead>
                  <TableHead className="text-right">Positions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-[var(--muted-foreground)] py-8">
                      No agents yet
                    </TableCell>
                  </TableRow>
                ) : (
                  leaderboard.map((agent) => (
                    <TableRow key={agent.username}>
                      <TableCell>
                        {agent.rank <= 3 ? (
                          <Medal className={`h-5 w-5 ${getMedalColor(agent.rank)}`} />
                        ) : (
                          <span className="font-data text-[var(--muted-foreground)]">
                            {agent.rank}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{agent.username}</TableCell>
                      <TableCell className="text-right font-data">
                        {formatCurrency(agent.totalPortfolioValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-data ${
                            agent.totalReturnPct >= 0
                              ? 'text-[var(--success)]'
                              : 'text-[var(--error)]'
                          }`}
                        >
                          {formatPercent(agent.totalReturnPct, true)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-data">{agent.tradeCount}</TableCell>
                      <TableCell className="text-right font-data">{agent.positions}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
