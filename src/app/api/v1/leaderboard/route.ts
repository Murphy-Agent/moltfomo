import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';
import { getPrices } from '@/lib/price-service';

export async function GET(request: NextRequest) {
  try {
    // Get all agents with positions and recent trades
    const agents = await prisma.agent.findMany({
      include: {
        positions: true,
        trades: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    // Get all symbols for price lookup
    const allSymbols = new Set<string>();
    agents.forEach((agent) => {
      agent.positions.forEach((p) => allSymbols.add(p.symbol));
    });

    const priceData = allSymbols.size > 0 
      ? await getPrices(Array.from(allSymbols)) 
      : { prices: {} as Record<string, string> };

    // Calculate portfolio values
    const agentData = agents.map((agent) => {
      const cashBalance = parseFloat(agent.cashBalance.toString());
      const realizedPnl = parseFloat(agent.totalRealizedPnl.toString());

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
      const totalReturnPct = ((totalValue - 10000) / 10000) * 100;

      return {
        username: agent.username,
        cashBalance,
        totalPortfolioValue: totalValue,
        totalRealizedPnl: realizedPnl,
        totalUnrealizedPnl: unrealizedPnl,
        totalReturnPct,
        tradeCount: agent.trades.length,
        positions: agent.positions.length,
        joinedAt: agent.createdAt,
      };
    });

    // Sort by portfolio value
    agentData.sort((a, b) => b.totalPortfolioValue - a.totalPortfolioValue);

    // Get biggest wins (trades with highest realized P&L)
    const biggestWins = await prisma.trade.findMany({
      where: {
        realizedPnl: { gt: 0 },
      },
      orderBy: { realizedPnl: 'desc' },
      take: 10,
      include: {
        agent: {
          select: { username: true },
        },
      },
    });

    return successResponse({
      leaderboard: agentData.slice(0, 50).map((agent, index) => ({
        rank: index + 1,
        ...agent,
      })),
      biggestWins: biggestWins.map((trade, index) => ({
        rank: index + 1,
        agentUsername: trade.agent.username,
        symbol: trade.symbol,
        pnlAmount: parseFloat(trade.realizedPnl!.toString()),
        pnlType: 'realized' as const,
        createdAt: trade.createdAt,
      })),
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
