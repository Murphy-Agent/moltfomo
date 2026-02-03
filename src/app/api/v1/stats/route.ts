import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';
import { getPrices } from '@/lib/price-service';

export async function GET(request: NextRequest) {
  try {
    // Get all agents with positions
    const agents = await prisma.agent.findMany({
      include: {
        positions: true,
        _count: {
          select: { trades: true },
        },
      },
    });

    // Get total trades
    const totalTrades = await prisma.trade.count();

    // Calculate stats
    let highestBalance = 0;
    let highestBalanceAgent: string | null = null;
    let highestPnl = 0;
    let highestPnlAgent: string | null = null;
    let highestUnrealizedPnl = 0;
    let highestUnrealizedPnlAgent: string | null = null;

    // Get all symbols for price lookup
    const allSymbols = new Set<string>();
    agents.forEach((agent) => {
      agent.positions.forEach((p) => allSymbols.add(p.symbol));
    });

    const priceData = allSymbols.size > 0 
      ? await getPrices(Array.from(allSymbols)) 
      : { prices: {} as Record<string, string> };

    for (const agent of agents) {
      const cashBalance = parseFloat(agent.cashBalance.toString());
      const realizedPnl = parseFloat(agent.totalRealizedPnl.toString());

      // Calculate unrealized P&L
      let unrealizedPnl = 0;
      let marketValue = 0;
      for (const position of agent.positions) {
        const currentPrice = parseFloat(priceData.prices[position.symbol] || '0');
        const qty = parseFloat(position.quantity.toString());
        const avgPrice = parseFloat(position.avgEntryPrice.toString());
        marketValue += qty * currentPrice;
        unrealizedPnl += (currentPrice - avgPrice) * qty;
      }

      const totalValue = cashBalance + marketValue;

      if (totalValue > highestBalance) {
        highestBalance = totalValue;
        highestBalanceAgent = agent.username;
      }

      if (realizedPnl > highestPnl) {
        highestPnl = realizedPnl;
        highestPnlAgent = agent.username;
      }

      if (unrealizedPnl > highestUnrealizedPnl) {
        highestUnrealizedPnl = unrealizedPnl;
        highestUnrealizedPnlAgent = agent.username;
      }
    }

    // Most traded asset
    const tradesByAsset = await prisma.trade.groupBy({
      by: ['symbol'],
      _count: { symbol: true },
      orderBy: { _count: { symbol: 'desc' } },
      take: 1,
    });

    const mostTradedAsset = tradesByAsset[0]?.symbol || null;
    const mostTradedAssetCount = tradesByAsset[0]?._count.symbol || 0;

    return successResponse({
      totalAgents: agents.length,
      highestBalance,
      highestBalanceAgent,
      totalTrades,
      highestPnl,
      highestPnlAgent,
      highestUnrealizedPnl,
      highestUnrealizedPnlAgent,
      mostTradedAsset,
      mostTradedAssetCount,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Also support POST for consistency
export async function POST(request: NextRequest) {
  return GET(request);
}
