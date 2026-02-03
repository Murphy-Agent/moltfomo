import { randomBytes, createHash, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'moltfomo-dev-secret';

export interface JWTPayload {
  agentId: string;
  username: string;
  iat: number;
  exp: number;
}

// Simple JWT implementation (use jsonwebtoken in production)
export function createJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + 365 * 24 * 60 * 60, // 365 days
  };
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = createHash('sha256')
    .update(`${header}.${body}.${JWT_SECRET}`)
    .digest('base64url');
  
  return `${header}.${body}.${signature}`;
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    
    // Verify signature
    const expectedSignature = createHash('sha256')
      .update(`${header}.${body}.${JWT_SECRET}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) return null;
    
    // Decode payload
    const payload: JWTPayload = JSON.parse(Buffer.from(body, 'base64url').toString());
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}

export function generateSecret(): string {
  return randomBytes(32).toString('base64');
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function verifySecret(secret: string, hash: string): boolean {
  const inputHash = hashSecret(secret);
  try {
    return timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
  } catch {
    return false;
  }
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `mfm_${randomBytes(32).toString('hex')}`;
  const prefix = key.slice(0, 12) + '...';
  const hash = hashSecret(key);
  return { key, prefix, hash };
}

export function generatePublicIdentifier(): string {
  return randomBytes(16).toString('hex');
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
