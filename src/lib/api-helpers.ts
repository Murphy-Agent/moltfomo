import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface ApiResponse<T = unknown> {
  success: boolean;
  response?: T;
  error?: string;
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, response: data } satisfies ApiResponse<T>,
    { status }
  );
}

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message } satisfies ApiResponse,
    { status }
  );
}

export function parseBody<T>(body: unknown): T | null {
  if (body && typeof body === 'object') {
    return body as T;
  }
  return null;
}

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '365d'; // 1 year for agent tokens

if (!JWT_SECRET || JWT_SECRET === 'moltfomo-dev-secret-change-in-production') {
  console.warn('WARNING: JWT_SECRET is not set or using default. Set a secure secret in production!');
}

const getJwtSecret = (): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return JWT_SECRET;
};

export function createToken(payload: { agentId: string; username: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): { agentId: string; username: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { agentId: string; username: string };
    return { agentId: decoded.agentId, username: decoded.username };
  } catch {
    return null;
  }
}

export function getAuthFromRequest(request: Request): { agentId: string; username: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// Password/Secret Hashing
const SALT_ROUNDS = 12;

export async function hashSecret(secret: string): Promise<string> {
  return bcrypt.hash(secret, SALT_ROUNDS);
}

export async function verifySecret(secret: string, hash: string): Promise<boolean> {
  return bcrypt.compare(secret, hash);
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(key: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= limit) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute
