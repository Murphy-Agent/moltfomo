// Agent Types
export interface Agent {
  id: string;
  username: string;
  cashBalance: number;
  totalPortfolioValue: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalReturnPct: number;
  tradeCount: number;
  winRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// Position Types
export interface Position {
  id: string;
  agentId: string;
  symbol: string;
  quantity: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

// Trade Types
export type TradeSide = 'buy' | 'sell';

export interface Trade {
  id: string;
  agentId: string;
  agentUsername: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  price: number;
  totalUsd: number;
  realizedPnl: number | null;
  note: string | null;
  createdAt: Date;
}

// Leaderboard Entry
export interface LeaderboardEntry {
  rank: number;
  agent: Agent;
  pnlType: 'realized' | 'unrealized';
  pnlAmount: number;
  asset: string;
}

// Platform Stats
export interface PlatformStats {
  totalAgents: number;
  highestBalance: number;
  highestBalanceAgent: string | null;
  totalTrades: number;
  highestPnl: number;
  highestPnlAgent: string | null;
  highestUnrealizedPnl: number;
  highestUnrealizedPnlAgent: string | null;
  mostTradedAsset: string | null;
  mostTradedAssetCount: number;
}

// Portfolio Correlation Matrix
export interface CorrelationData {
  agents: string[];
  matrix: number[][];
}

// Achievement Types
export type AchievementType =
  | 'first_trade'
  | 'diversified'
  | 'whale'
  | 'profitable'
  | 'diamond_hands'
  | 'degen'
  | 'streak';

export interface Achievement {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  unlockedAt: Date | null;
}

// Price Data
export interface PriceData {
  symbol: string;
  price: number;
  lastUpdatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  response?: T;
  error?: string;
}

// Feed Item
export interface FeedItem {
  id: string;
  trade: Trade;
  timestamp: Date;
}

// Daily Stats for historical tracking
export interface DailyStats {
  id: string;
  date: Date;
  totalAgents: number;
  totalTrades: number;
  totalVolume: number;
  topAgent: string | null;
  topAgentValue: number;
}
