import { NextRequest } from 'next/server';
import { successResponse, errorResponse, getAuthFromRequest, checkRateLimit } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';
import { SUPPORTED_ASSETS } from '@/lib/mock-data';

interface TradesRequest {
  cursor?: string;
  limit?: number;
  symbol?: string;
  side?: 'buy' | 'sell';
  startDate?: string;
  endDate?: string;
  sort?: 'asc' | 'desc';
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return errorResponse('Invalid or expired token. Re-authenticate via /api/v1/agent/auth/init', 401);
    }

    if (!checkRateLimit(`trades:${auth.agentId}`, 60)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    let body: TradesRequest = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK, use defaults
    }

    // Validate and set defaults
    const limit = Math.min(Math.max(body.limit || 50, 1), 100);
    const sort = body.sort === 'asc' ? 'asc' : 'desc';

    // Build query
    const where: Record<string, unknown> = { agentId: auth.agentId };

    if (body.symbol) {
      if (!SUPPORTED_ASSETS.includes(body.symbol as typeof SUPPORTED_ASSETS[number])) {
        return errorResponse(`Invalid request: unsupported symbol "${body.symbol}"`);
      }
      where.symbol = body.symbol;
    }

    if (body.side) {
      if (body.side !== 'buy' && body.side !== 'sell') {
        return errorResponse('Invalid request: side must be "buy" or "sell"');
      }
      where.side = body.side;
    }

    if (body.startDate) {
      const start = new Date(body.startDate);
      if (isNaN(start.getTime())) {
        return errorResponse('Invalid request: invalid startDate format');
      }
      where.createdAt = { ...(where.createdAt as object || {}), gte: start };
    }

    if (body.endDate) {
      const end = new Date(body.endDate);
      if (isNaN(end.getTime())) {
        return errorResponse('Invalid request: invalid endDate format');
      }
      where.createdAt = { ...(where.createdAt as object || {}), lte: end };
    }

    // Cursor-based pagination
    if (body.cursor) {
      where.id = sort === 'desc' ? { lt: body.cursor } : { gt: body.cursor };
    }

    const trades = await prisma.trade.findMany({
      where,
      orderBy: { createdAt: sort },
      take: limit + 1, // Fetch one extra to check for more
    });

    const hasMore = trades.length > limit;
    if (hasMore) {
      trades.pop();
    }

    const nextCursor = trades.length > 0 ? trades[trades.length - 1].id : null;

    return successResponse({
      trades: trades.map((t) => ({
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        quantity: t.quantity.toString(),
        price: t.price.toString(),
        totalUsd: t.totalUsd.toString(),
        realizedPnl: t.realizedPnl?.toString() || null,
        note: t.note,
        createdAt: t.createdAt.toISOString(),
      })),
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    });
  } catch (error) {
    console.error('Trades API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
