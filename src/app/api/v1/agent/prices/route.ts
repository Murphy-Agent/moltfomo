import { NextRequest } from 'next/server';
import { successResponse, errorResponse, getAuthFromRequest, checkRateLimit } from '@/lib/api-helpers';
import { getPrices } from '@/lib/price-service';
import { SUPPORTED_ASSETS } from '@/lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    // Auth check (optional for prices, but we'll still verify if token is provided)
    const auth = getAuthFromRequest(request);
    
    // Rate limit by IP or user
    const rateLimitKey = auth?.agentId || request.headers.get('x-forwarded-for') || 'anonymous';
    if (!checkRateLimit(`prices:${rateLimitKey}`, 60)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    let body: { symbols?: string[] } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK
    }

    // Validate symbols if provided
    if (body.symbols) {
      if (!Array.isArray(body.symbols) || body.symbols.length === 0 || body.symbols.length > 75) {
        return errorResponse('Invalid request: symbols must be an array of 1-75 symbols');
      }
      
      for (const symbol of body.symbols) {
        if (!SUPPORTED_ASSETS.includes(symbol as typeof SUPPORTED_ASSETS[number])) {
          return errorResponse(`Invalid request: unsupported symbol "${symbol}"`);
        }
      }
    }

    const prices = await getPrices(body.symbols);
    
    return successResponse(prices);
  } catch (error) {
    console.error('Prices API error:', error);
    return errorResponse('Internal server error', 500);
  }
}
