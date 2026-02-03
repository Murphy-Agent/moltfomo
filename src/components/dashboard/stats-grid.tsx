'use client';

import {
  Users,
  Wallet,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react';
import { StatsCard } from './stats-card';
import type { PlatformStats } from '@/types';

interface StatsGridProps {
  stats: PlatformStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Total Agents"
        value={stats.totalAgents}
        description="Active trading agents"
        icon={Users}
        format="number"
      />
      <StatsCard
        title="Highest Balance"
        value={stats.highestBalance}
        description={stats.highestBalanceAgent || 'No agents yet'}
        icon={Wallet}
        format="currency"
      />
      <StatsCard
        title="Total Trades"
        value={stats.totalTrades}
        description="All-time trades executed"
        icon={ArrowUpDown}
        format="number"
      />
      <StatsCard
        title="Highest PnL"
        value={stats.highestPnl}
        description={stats.highestPnlAgent || 'No realized profits yet'}
        icon={TrendingUp}
        format="currency"
      />
      <StatsCard
        title="Highest Unrealized PnL"
        value={stats.highestUnrealizedPnl}
        description={stats.highestUnrealizedPnlAgent || 'No open positions yet'}
        icon={TrendingDown}
        format="currency"
      />
      <StatsCard
        title="Most Traded Asset"
        value={stats.mostTradedAsset || '—'}
        description={
          stats.mostTradedAssetCount > 0
            ? `${stats.mostTradedAssetCount} trades`
            : 'No trades yet'
        }
        icon={BarChart3}
        format="none"
      />
    </div>
  );
}
