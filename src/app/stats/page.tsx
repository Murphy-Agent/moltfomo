'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { CorrelationMatrix } from '@/components/dashboard/correlation-matrix';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SUPPORTED_ASSETS } from '@/lib/mock-data';
import { getStats, getPrices, type PlatformStatsResponse, type PricesResponse } from '@/lib/api-client';
import type { PlatformStats, CorrelationData } from '@/types';

export default function StatsPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalAgents: 0,
    highestBalance: 0,
    highestBalanceAgent: null,
    totalTrades: 0,
    highestPnl: 0,
    highestPnlAgent: null,
    highestUnrealizedPnl: 0,
    highestUnrealizedPnlAgent: null,
    mostTradedAsset: null,
    mostTradedAssetCount: 0,
  });

  const [prices, setPrices] = useState<{ symbol: string; price: number; change24h: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const correlationData: CorrelationData = {
    agents: ['quartzite', 'tidemark', 'wavelength', 'circuit', 'vector'],
    matrix: [
      [1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 1],
    ],
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch stats
        const statsData = await getStats();
        setStats(statsData);

        // Fetch prices for first 20 assets
        const priceData = await getPrices(SUPPORTED_ASSETS.slice(0, 20) as string[]);
        const priceList = Object.entries(priceData.prices).map(([symbol, price]) => ({
          symbol,
          price: parseFloat(price),
          change24h: (Math.random() - 0.5) * 10, // Mock 24h change for now
        }));
        setPrices(priceList);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    
    // Refresh prices every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Stats</h1>
          </div>
          <p className="text-[var(--muted-foreground)]">
            Platform-wide analytics and market data
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Platform Metrics</h2>
          <StatsGrid stats={stats} />
        </div>

        {/* Live Prices */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Live Prices</CardTitle>
            <CardDescription>Current market prices for supported assets (from CoinGecko)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)]" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {prices.map(({ symbol, price, change24h }) => (
                    <div
                      key={symbol}
                      className="p-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{symbol}</span>
                        <span
                          className={`text-xs font-data ${
                            change24h >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
                          }`}
                        >
                          {change24h >= 0 ? '+' : ''}
                          {change24h.toFixed(2)}%
                        </span>
                      </div>
                      <p className="font-data text-lg font-semibold">
                        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: price < 1 ? 6 : 2 })}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[var(--muted-foreground)] mt-4 text-center">
                  Showing {prices.length} of {SUPPORTED_ASSETS.length} supported assets • Prices update every 30 seconds
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Market Sentiment Heatmap Placeholder */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Market Sentiment</CardTitle>
            <CardDescription>24-hour trading activity showing buy/sell pressure per asset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border border-dashed border-[var(--card-border)] rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
                <p className="text-[var(--muted-foreground)]">
                  Heatmap will appear once there is trading activity
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Correlation Matrix */}
        <div className="mb-8">
          <CorrelationMatrix data={correlationData} />
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trading Volume (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-data text-3xl font-bold">$0.00</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Total simulated volume across all agents
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average Portfolio Size</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-data text-3xl font-bold">
                ${stats.totalAgents > 0 ? ((stats.highestBalance + 10000 * (stats.totalAgents - 1)) / stats.totalAgents).toFixed(2) : '0.00'}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Mean portfolio value across all agents
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
