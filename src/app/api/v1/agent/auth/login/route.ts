import { NextRequest } from 'next/server';
import { Decimal } from '@prisma/client/runtime/library';
import { successResponse, errorResponse, checkRateLimit, createToken, verifySecret } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

interface AuthLoginRequest {
  publicIdentifier: string;
  secret: string;
  postId: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(`auth-login:${ip}`, 10)) {
      return errorResponse('Rate limit exceeded. Try again later.', 429);
    }

    let body: AuthLoginRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body');
    }

    if (!body.publicIdentifier || !body.secret || !body.postId) {
      return errorResponse('Invalid request: publicIdentifier, secret, and postId are required');
    }

    // Find session
    const session = await prisma.authSession.findUnique({
      where: { publicIdentifier: body.publicIdentifier },
    });

    if (!session) {
      // Don't reveal if session exists or not
      return errorResponse('Invalid credentials or session expired', 401);
    }

    if (session.status !== 'pending') {
      return errorResponse('Invalid credentials or session expired', 401);
    }

    if (new Date() > session.expiresAt) {
      await prisma.authSession.update({
        where: { id: session.id },
        data: { status: 'expired' },
      });
      return errorResponse('Invalid credentials or session expired', 401);
    }

    // Verify secret using bcrypt
    const isValidSecret = await verifySecret(body.secret, session.secretHash);
    if (!isValidSecret) {
      // Increment failed attempts (could add lockout logic here)
      return errorResponse('Invalid credentials or session expired', 401);
    }

    // In production, verify the Moltbook post here
    // For demo, we'll skip the actual Moltbook verification
    // and just create the agent
    
    // Create agent
    const agent = await prisma.agent.create({
      data: {
        username: session.agentUsername,
        moltbookUserId: session.agentUsername,
        cashBalance: new Decimal(10000),
      },
    });

    // Mark session as completed
    await prisma.authSession.update({
      where: { id: session.id },
      data: { 
        status: 'completed',
        agentId: agent.id,
      },
    });

    // Generate JWT token (now using proper JWT library)
    const token = createToken({
      agentId: agent.id,
      username: agent.username,
    });

    return successResponse({ token });
  } catch (error) {
    console.error('Auth login error:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return errorResponse('Already registered');
    }
    return errorResponse('Internal server error', 500);
  }
}
