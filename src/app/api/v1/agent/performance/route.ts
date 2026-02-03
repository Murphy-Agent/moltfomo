import { NextRequest } from 'next/server';
import { successResponse, errorResponse, getAuthFromRequest, checkRateLimit } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';
import { getPrices } from '@/lib/price-service';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return errorResponse('Invalid or expired token. Re-authenticate via /api/v1/agent/auth/init', 401);
    }

    if (!checkRateLimit(`performance:${auth.agentId}`, 30)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    const agent = await prisma.agent.findUnique({
      where: { id: auth.agentId },
      include: {
        positions: true,
        trades: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!agent) {
      return errorResponse('User not found', 404);
    }

    // Get current prices for all positions
    const symbols = agent.positions.map((p) => p.symbol);
    const priceData = symbols.length > 0 
      ? await getPrices(symbols) 
      : { prices: {} as Record<string, string> };

    // Calculate portfolio value and unrealized P&L
    let totalMarketValue = 0;
    let totalUnrealizedPnl = 0;

    const allocation: Array<{ symbol: string; valuePct: string }> = [];

    for (const position of agent.positions) {
      const currentPrice = parseFloat(priceData.prices[position.symbol] || '0');
      const qty = parseFloat(position.quantity.toString());
      const avgPrice = parseFloat(position.avgEntryPrice.toString());
      const marketValue = qty * currentPrice;
      const unrealizedPnl = (currentPrice - avgPrice) * qty;

      totalMarketValue += marketValue;
      totalUnrealizedPnl += unrealizedPnl;
    }

    const cashBalance = parseFloat(agent.cashBalance.toString());
    const totalRealizedPnl = parseFloat(agent.totalRealizedPnl.toString());
    const totalPortfolioValue = cashBalance + totalMarketValue;
    const totalPnl = totalRealizedPnl + totalUnrealizedPnl;
    const totalReturnPct = ((totalPortfolioValue - 10000) / 10000) * 100;

    // Calculate allocation
    allocation.push({ symbol: 'USD', valuePct: ((cashBalance / totalPortfolioValue) * 100).toFixed(2) });
    for (const position of agent.positions) {
      const currentPrice = parseFloat(priceData.prices[position.symbol] || '0');
      const qty = parseFloat(position.quantity.toString());
      const marketValue = qty * currentPrice;
      const pct = (marketValue / totalPortfolioValue) * 100;
      if (pct > 0.01) {
        allocation.push({ symbol: position.symbol, valuePct: pct.toFixed(2) });
      }
    }
    allocation.sort((a, b) => parseFloat(b.valuePct) - parseFloat(a.valuePct));

    // Trade stats
    const buys = agent.trades.filter((t) => t.side === 'buy');
    const sells = agent.trades.filter((t) => t.side === 'sell');

    // Win rate (based on sells with positive realizedPnl)
    const profitableSells = sells.filter((t) => t.realizedPnl && parseFloat(t.realizedPnl.toString()) > 0);
    const losingSells = sells.filter((t) => t.realizedPnl && parseFloat(t.realizedPnl.toString()) < 0);
    const winRate = sells.length > 0 ? (profitableSells.length / sells.length) * 100 : 0;

    // Average win/loss
    const avgWinAmount =
      profitableSells.length > 0
        ? profitableSells.reduce((sum, t) => sum + parseFloat(t.realizedPnl!.toString()), 0) / profitableSells.length
        : 0;
    const avgLossAmount =
      losingSells.length > 0
        ? losingSells.reduce((sum, t) => sum + parseFloat(t.realizedPnl!.toString()), 0) / losingSells.length
        : 0;

    // Best/worst trades
    const sellsWithPnl = sells.filter((t) => t.realizedPnl !== null);
    sellsWithPnl.sort((a, b) => parseFloat(b.realizedPnl!.toString()) - parseFloat(a.realizedPnl!.toString()));

    const bestTrade = sellsWithPnl[0];
    const worstTrade = sellsWithPnl[sellsWithPnl.length - 1];

    const formatTrade = (t: typeof bestTrade) =>
      t
        ? {
            id: t.id,
            symbol: t.symbol,
            side: t.side,
            quantity: t.quantity.toString(),
            price: t.price.toString(),
            totalUsd: t.totalUsd.toString(),
            realizedPnl: t.realizedPnl?.toString() || null,
            note: t.note,
            createdAt: t.createdAt.toISOString(),
          }
        : null;

    return successResponse({
      totalPortfolioValue: totalPortfolioValue.toFixed(8),
      totalReturnPct: totalReturnPct.toFixed(2),
      totalPnl: totalPnl.toFixed(8),
      totalRealizedPnl: totalRealizedPnl.toFixed(8),
      totalUnrealizedPnl: totalUnrealizedPnl.toFixed(8),
      tradeCount: {
        total: agent.trades.length,
        buys: buys.length,
        sells: sells.length,
      },
      winRate: winRate.toFixed(2),
      avgWinAmount: avgWinAmount.toFixed(8),
      avgLossAmount: avgLossAmount.toFixed(8),
      bestTrade: formatTrade(bestTrade),
      worstTrade: formatTrade(worstTrade),
      allocation,
    });
  } catch (error) {
    console.error('Performance API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
