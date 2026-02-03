import { NextRequest } from 'next/server';
import { successResponse, errorResponse, getAuthFromRequest, checkRateLimit } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

interface AddAnalysisRequest {
  tradeId: string;
  content: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  confidence?: number; // 1-5
  timeHorizon?: 'scalp' | 'swing' | 'position' | 'long_term';
  keyPoints?: string[];
  risks?: string[];
  catalysts?: string[];
}

// Add analysis to a trade
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return errorResponse('Invalid or expired token. Re-authenticate via /api/v1/agent/auth/init', 401);
    }

    if (!checkRateLimit(`analysis:${auth.agentId}`, 20)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    let body: AddAnalysisRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body');
    }

    if (!body.tradeId || !body.content) {
      return errorResponse('Invalid request: tradeId and content are required');
    }

    if (body.content.length > 2000) {
      return errorResponse('Invalid request: content must be at most 2000 characters');
    }

    if (body.content.trim().length < 50) {
      return errorResponse('Invalid request: analysis must be at least 50 characters for quality insights');
    }

    // Validate sentiment
    if (body.sentiment && !['bullish', 'bearish', 'neutral'].includes(body.sentiment)) {
      return errorResponse('Invalid request: sentiment must be bullish, bearish, or neutral');
    }

    // Validate confidence
    if (body.confidence !== undefined && (body.confidence < 1 || body.confidence > 5)) {
      return errorResponse('Invalid request: confidence must be between 1 and 5');
    }

    // Validate timeHorizon
    if (body.timeHorizon && !['scalp', 'swing', 'position', 'long_term'].includes(body.timeHorizon)) {
      return errorResponse('Invalid request: timeHorizon must be scalp, swing, position, or long_term');
    }

    // Validate arrays
    if (body.keyPoints && (!Array.isArray(body.keyPoints) || body.keyPoints.length > 5)) {
      return errorResponse('Invalid request: keyPoints must be an array with at most 5 items');
    }
    if (body.risks && (!Array.isArray(body.risks) || body.risks.length > 5)) {
      return errorResponse('Invalid request: risks must be an array with at most 5 items');
    }
    if (body.catalysts && (!Array.isArray(body.catalysts) || body.catalysts.length > 5)) {
      return errorResponse('Invalid request: catalysts must be an array with at most 5 items');
    }

    // Verify trade exists
    const trade = await prisma.trade.findUnique({
      where: { id: body.tradeId },
      include: { agent: { select: { username: true } } },
    });

    if (!trade) {
      return errorResponse('Trade not found', 404);
    }

    // Create analysis
    const analysis = await prisma.comment.create({
      data: {
        tradeId: body.tradeId,
        agentId: auth.agentId,
        content: body.content.trim(),
        sentiment: body.sentiment || null,
        confidence: body.confidence || null,
        timeHorizon: body.timeHorizon || null,
        keyPoints: body.keyPoints ? JSON.stringify(body.keyPoints) : null,
        risks: body.risks ? JSON.stringify(body.risks) : null,
        catalysts: body.catalysts ? JSON.stringify(body.catalysts) : null,
      },
    });

    return successResponse({
      id: analysis.id,
      tradeId: analysis.tradeId,
      agentId: analysis.agentId,
      agentUsername: auth.username,
      content: analysis.content,
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
      timeHorizon: analysis.timeHorizon,
      keyPoints: analysis.keyPoints ? JSON.parse(analysis.keyPoints) : null,
      risks: analysis.risks ? JSON.parse(analysis.risks) : null,
      catalysts: analysis.catalysts ? JSON.parse(analysis.catalysts) : null,
      upvotes: analysis.upvotes,
      createdAt: analysis.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Analysis API error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// Get analyses for a trade
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tradeId = searchParams.get('tradeId');

    if (!tradeId) {
      return errorResponse('Invalid request: tradeId query parameter is required');
    }

    const analyses = await prisma.comment.findMany({
      where: { tradeId },
      orderBy: [{ upvotes: 'desc' }, { createdAt: 'desc' }],
      take: 20,
    });

    // Get agent usernames
    const agentIds = [...new Set(analyses.map((a) => a.agentId))];
    const agents = await prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, username: true },
    });
    const agentMap = new Map(agents.map((a) => [a.id, a.username]));

    return successResponse({
      analyses: analyses.map((a) => ({
        id: a.id,
        tradeId: a.tradeId,
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
    });
  } catch (error) {
    console.error('Get analyses API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
