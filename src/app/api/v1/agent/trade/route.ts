import { NextRequest } from 'next/server';
import { Decimal } from '@prisma/client/runtime/library';
import { successResponse, errorResponse, getAuthFromRequest, checkRateLimit } from '@/lib/api-helpers';
import prisma from '@/lib/prisma';
import { getPrice } from '@/lib/price-service';
import { SUPPORTED_ASSETS } from '@/lib/mock-data';

interface TradeRequest {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: string;
  note?: string;
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return errorResponse('Invalid or expired token. Re-authenticate via /api/v1/agent/auth/init', 401);
    }

    if (!checkRateLimit(`trade:${auth.agentId}`, 30)) {
      return errorResponse('Rate limit exceeded', 429);
    }

    let body: TradeRequest;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body');
    }

    // Validate request
    if (!body.symbol || !body.side || !body.quantity) {
      return errorResponse('Invalid request: symbol, side, and quantity are required');
    }

    if (!SUPPORTED_ASSETS.includes(body.symbol as typeof SUPPORTED_ASSETS[number])) {
      return errorResponse(`Invalid request: unsupported symbol "${body.symbol}"`);
    }

    if (body.side !== 'buy' && body.side !== 'sell') {
      return errorResponse('Invalid request: side must be "buy" or "sell"');
    }

    const quantity = parseFloat(body.quantity);
    if (isNaN(quantity) || quantity <= 0 || quantity > 100000) {
      return errorResponse('Invalid request: quantity must be positive and <= 100,000');
    }

    // Check decimal places
    const decimalPlaces = body.quantity.includes('.') ? body.quantity.split('.')[1].length : 0;
    if (decimalPlaces > 8) {
      return errorResponse('Invalid request: quantity must have at most 8 decimal places');
    }

    if (body.note && body.note.length > 280) {
      return errorResponse('Invalid request: note must be at most 280 characters');
    }

    // Get current price
    const price = await getPrice(body.symbol);
    if (!price) {
      return errorResponse('Price data temporarily unavailable', 503);
    }

    const totalUsd = quantity * price;

    // Execute trade in transaction
    const result = await prisma.$transaction(async (tx) => {
      const agent = await tx.agent.findUnique({
        where: { id: auth.agentId },
      });

      if (!agent) {
        throw new Error('User not found');
      }

      const cashBalance = parseFloat(agent.cashBalance.toString());
      let position = await tx.position.findUnique({
        where: {
          agentId_symbol: {
            agentId: auth.agentId,
            symbol: body.symbol,
          },
        },
      });

      let realizedPnl: number | null = null;

      if (body.side === 'buy') {
        // Check sufficient funds
        if (cashBalance < totalUsd) {
          throw new Error(`Insufficient funds: need $${totalUsd.toFixed(2)} but have $${cashBalance.toFixed(2)}`);
        }

        // Update or create position
        if (position) {
          const existingQty = parseFloat(position.quantity.toString());
          const existingAvgPrice = parseFloat(position.avgEntryPrice.toString());
          const newQty = existingQty + quantity;
          const newAvgPrice = (existingQty * existingAvgPrice + quantity * price) / newQty;

          position = await tx.position.update({
            where: { id: position.id },
            data: {
              quantity: new Decimal(newQty.toFixed(8)),
              avgEntryPrice: new Decimal(newAvgPrice.toFixed(8)),
            },
          });
        } else {
          position = await tx.position.create({
            data: {
              agentId: auth.agentId,
              symbol: body.symbol,
              quantity: new Decimal(quantity.toFixed(8)),
              avgEntryPrice: new Decimal(price.toFixed(8)),
            },
          });
        }

        // Deduct cash
        await tx.agent.update({
          where: { id: auth.agentId },
          data: {
            cashBalance: new Decimal((cashBalance - totalUsd).toFixed(8)),
          },
        });
      } else {
        // Sell
        if (!position) {
          throw new Error(`Insufficient position: want to sell ${quantity} but hold 0`);
        }

        const existingQty = parseFloat(position.quantity.toString());
        if (existingQty < quantity) {
          throw new Error(`Insufficient position: want to sell ${quantity} but hold ${existingQty}`);
        }

        const avgEntryPrice = parseFloat(position.avgEntryPrice.toString());
        realizedPnl = (price - avgEntryPrice) * quantity;
        const newQty = existingQty - quantity;

        if (newQty <= 0.00000001) {
          // Close position
          await tx.position.delete({ where: { id: position.id } });
          position = null;
        } else {
          position = await tx.position.update({
            where: { id: position.id },
            data: {
              quantity: new Decimal(newQty.toFixed(8)),
              realizedPnl: new Decimal(
                (parseFloat(position.realizedPnl.toString()) + realizedPnl).toFixed(8)
              ),
            },
          });
        }

        // Add cash and update realized PnL
        const currentRealizedPnl = parseFloat(agent.totalRealizedPnl.toString());
        await tx.agent.update({
          where: { id: auth.agentId },
          data: {
            cashBalance: new Decimal((cashBalance + totalUsd).toFixed(8)),
            totalRealizedPnl: new Decimal((currentRealizedPnl + realizedPnl).toFixed(8)),
          },
        });
      }

      // Create trade record
      const trade = await tx.trade.create({
        data: {
          agentId: auth.agentId,
          symbol: body.symbol,
          side: body.side,
          quantity: new Decimal(quantity.toFixed(8)),
          price: new Decimal(price.toFixed(8)),
          totalUsd: new Decimal(totalUsd.toFixed(8)),
          realizedPnl: realizedPnl !== null ? new Decimal(realizedPnl.toFixed(8)) : null,
          note: body.note || null,
        },
      });

      // Get updated agent
      const updatedAgent = await tx.agent.findUnique({
        where: { id: auth.agentId },
      });

      return { trade, position, cashBalance: updatedAgent!.cashBalance };
    });

    return successResponse({
      trade: {
        symbol: body.symbol,
        side: body.side,
        quantity: quantity.toFixed(8),
        price: price.toFixed(8),
        totalUsd: totalUsd.toFixed(8),
        realizedPnl: result.trade.realizedPnl?.toString() || null,
        note: result.trade.note,
      },
      position: result.position
        ? {
            symbol: result.position.symbol,
            quantity: result.position.quantity.toString(),
            avgEntryPrice: result.position.avgEntryPrice.toString(),
            realizedPnl: result.position.realizedPnl.toString(),
          }
        : null,
      cashBalance: result.cashBalance.toString(),
    });
  } catch (error) {
    console.error('Trade API error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Insufficient')) {
        return errorResponse(error.message);
      }
      if (error.message === 'User not found') {
        return errorResponse(error.message, 404);
      }
    }
    return errorResponse('Internal server error', 500);
  }
}
