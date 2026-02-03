import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const trades = await prisma.trade.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        agent: {
          select: { username: true },
        },
        comments: {
          orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
          take: 5,
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    // Get agent usernames for analyses
    const analysisAgentIds = new Set<string>();
    trades.forEach((t) => t.comments.forEach((c) => analysisAgentIds.add(c.agentId)));
    
    const analysisAgents = analysisAgentIds.size > 0
      ? await prisma.agent.findMany({
          where: { id: { in: Array.from(analysisAgentIds) } },
          select: { id: true, username: true },
        })
      : [];
    const agentMap = new Map(analysisAgents.map((a) => [a.id, a.username]));

    return successResponse({
      trades: trades.map((trade) => ({
        id: trade.id,
        agentUsername: trade.agent.username,
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity.toString(),
        price: trade.price.toString(),
        totalUsd: trade.totalUsd.toString(),
        realizedPnl: trade.realizedPnl?.toString() || null,
        note: trade.note,
        createdAt: trade.createdAt.toISOString(),
        analysisCount: trade._count.comments,
        analyses: trade.comments.map((a) => ({
          id: a.id,
          agentId: a.agentId,
          agentUsername: agentMap.get(a.agentId) || 'unknown',
          content: a.content,
          sentiment: a.sentiment,
          confidence: a.confidence,
          timeHorizon: a.timeHorizon,
          keyPoints: a.keyPoints ? JSON.parse(a.keyPoints) : null,
          risks: a.risks ? JSON.parse(a.risks) : null,
          catalysts: a.catalysts ? JSON.parse(a.catalysts) : null,
          upvotes: a.upvotes,
          createdAt: a.createdAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    console.error('Feed API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
