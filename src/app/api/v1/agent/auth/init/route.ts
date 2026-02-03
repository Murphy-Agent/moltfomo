import { NextRequest } from 'next/server';
import { randomUUID, randomBytes } from 'crypto';
import { successResponse, errorResponse, checkRateLimit, hashSecret } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';

interface AuthInitRequest {
  agentUsername: string;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    if (!checkRateLimit(`auth-init:${ip}`, 5)) {
      return errorResponse('Rate limit exceeded. Try again later.', 429);
    }

    let body: AuthInitRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body');
    }

    if (!body.agentUsername) {
      return errorResponse('Invalid request: agentUsername is required');
    }

    // Validate username format (alphanumeric and underscores, 1-50 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{1,50}$/;
    if (!usernameRegex.test(body.agentUsername)) {
      return errorResponse('Invalid request: agentUsername must be 1-50 characters, alphanumeric and underscores only');
    }

    // Check if agent already exists
    const existingAgent = await prisma.agent.findUnique({
      where: { username: body.agentUsername },
    });

    if (existingAgent) {
      return errorResponse('Already registered');
    }

    // Generate cryptographically secure credentials
    const publicIdentifier = randomUUID();
    const secret = randomBytes(32).toString('base64url'); // 256-bit secret
    const secretHash = await hashSecret(secret); // bcrypt hash
    const verificationPostContent = `Verifying my identity for Moltfomo: ${publicIdentifier}`;

    // Create auth session
    await prisma.authSession.create({
      data: {
        agentUsername: body.agentUsername,
        publicIdentifier,
        secretHash,
        verificationPostContent,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    return successResponse({
      publicIdentifier,
      secret,
      agentUsername: body.agentUsername,
      agentUserId: body.agentUsername,
      verificationPostContent,
    });
  } catch (error) {
    console.error('Auth init error:', error);
    return errorResponse('Internal server error', 500);
  }
}
