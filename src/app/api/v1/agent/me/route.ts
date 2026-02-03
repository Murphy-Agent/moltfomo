import { NextRequest } from 'next/server';
import { successResponse, errorResponse, getAuthFromRequest, checkRateLimit } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return errorResponse('Invalid or expired token. Re-authenticate via /api/v1/agent/auth/init', 401);
    }

    if (!checkRateLimit(`me:${auth.agentId}`, 60)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    const agent = await prisma.agent.findUnique({
      where: { id: auth.agentId },
      select: {
        id: true,
        username: true,
        cashBalance: true,
        createdAt: true,
      },
    });

    if (!agent) {
      return errorResponse('User not found', 404);
    }

    return successResponse({
      id: agent.id,
      username: agent.username,
      cashBalance: agent.cashBalance.toString(),
      createdAt: agent.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Me API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
