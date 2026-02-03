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

    if (!checkRateLimit(`portfolio:${auth.agentId}`, 60)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    const agent = await prisma.agent.findUnique({
      where: { id: auth.agentId },
      include: {
        positions: true,
      },
    });

    if (!agent) {
      return errorResponse('User not found', 404);
    }

    // Get current prices for all positions
    const symbols = agent.positions.map((p) => p.symbol);
    const priceData = symbols.length > 0 ? await getPrices(symbols) : { prices: {}, lastUpdatedAt: new Date().toISOString() };

    const positions: Array<{
      symbol: string;
      quantity: string;
      avgEntryPrice: string;
      currentPrice: string;
      marketValue: string;
      unrealizedPnl: string;
      unrealizedPnlPercent: string;
    }> = [];

    const priceUnavailable: string[] = [];
    let totalUnrealizedPnl = 0;
    let totalMarketValue = 0;

    for (const position of agent.positions) {
      const currentPrice = priceData.prices[position.symbol];
      
      if (!currentPrice) {
        priceUnavailable.push(position.symbol);
        continue;
      }

      const qty = parseFloat(position.quantity.toString());
      const avgPrice = parseFloat(position.avgEntryPrice.toString());
      const price = parseFloat(currentPrice);
      const marketValue = qty * price;
      const unrealizedPnl = (price - avgPrice) * qty;
      const unrealizedPnlPercent = avgPrice > 0 ? ((price - avgPrice) / avgPrice) * 100 : 0;

      totalUnrealizedPnl += unrealizedPnl;
      totalMarketValue += marketValue;

      positions.push({
        symbol: position.symbol,
        quantity: qty.toFixed(8),
        avgEntryPrice: avgPrice.toFixed(8),
        currentPrice: price.toFixed(8),
        marketValue: marketValue.toFixed(8),
        unrealizedPnl: unrealizedPnl.toFixed(8),
        unrealizedPnlPercent: unrealizedPnlPercent.toFixed(2),
      });
    }

    const cashBalance = parseFloat(agent.cashBalance.toString());
    const totalRealizedPnl = parseFloat(agent.totalRealizedPnl.toString());
    const totalPortfolioValue = cashBalance + totalMarketValue;

    const response: Record<string, unknown> = {
      cashBalance: cashBalance.toFixed(8),
      positions,
      totalUnrealizedPnl: totalUnrealizedPnl.toFixed(8),
      totalRealizedPnl: totalRealizedPnl.toFixed(8),
      totalPortfolioValue: totalPortfolioValue.toFixed(8),
      pricesAsOf: priceData.lastUpdatedAt,
    };

    if (priceUnavailable.length > 0) {
      response.priceUnavailable = priceUnavailable;
    }

    return successResponse(response);
  } catch (error) {
    console.error('Portfolio API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
