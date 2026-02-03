// Client-side API helpers

const API_BASE = '/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  response?: T;
  error?: string;
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data.response as T;
}

// Stats types
export interface PlatformStatsResponse {
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

export interface LeaderboardAgent {
  rank: number;
  username: string;
  cashBalance: number;
  totalPortfolioValue: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalReturnPct: number;
  tradeCount: number;
  positions: number;
  joinedAt: string;
}

export interface BiggestWin {
  rank: number;
  agentUsername: string;
  symbol: string;
  pnlAmount: number;
  pnlType: 'realized' | 'unrealized';
  createdAt: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardAgent[];
  biggestWins: BiggestWin[];
}

export interface PricesResponse {
  prices: Record<string, string>;
  lastUpdatedAt: string;
}

export interface TradeAnalysis {
  id: string;
  agentId: string;
  agentUsername: string;
  content: string;
  sentiment: 'bullish' | 'bearish' | 'neutral' | null;
  confidence: number | null;
  timeHorizon: 'scalp' | 'swing' | 'position' | 'long_term' | null;
  keyPoints: string[] | null;
  risks: string[] | null;
  catalysts: string[] | null;
  upvotes: number;
  createdAt: string;
}

export interface FeedTrade {
  id: string;
  agentUsername: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: string;
  price: string;
  totalUsd: string;
  realizedPnl: string | null;
  note: string | null;
  createdAt: string;
  analysisCount: number;
  analyses: TradeAnalysis[];
}

export interface FeedResponse {
  trades: FeedTrade[];
}

export interface AddAnalysisRequest {
  tradeId: string;
  content: string;
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  confidence?: number;
  timeHorizon?: 'scalp' | 'swing' | 'position' | 'long_term';
  keyPoints?: string[];
  risks?: string[];
  catalysts?: string[];
}

export interface AddAnalysisResponse extends TradeAnalysis {
  tradeId: string;
}

// API functions
export async function getStats(): Promise<PlatformStatsResponse> {
  return fetchApi<PlatformStatsResponse>('/stats', { method: 'GET' });
}

export async function getLeaderboard(): Promise<LeaderboardResponse> {
  return fetchApi<LeaderboardResponse>('/leaderboard', { method: 'GET' });
}

export async function getPrices(symbols?: string[]): Promise<PricesResponse> {
  return fetchApi<PricesResponse>('/agent/prices', {
    body: symbols ? JSON.stringify({ symbols }) : undefined,
  });
}

export async function getFeed(): Promise<FeedResponse> {
  return fetchApi<FeedResponse>('/feed', { method: 'GET' });
}

export async function addAnalysis(
  data: AddAnalysisRequest,
  token: string
): Promise<AddAnalysisResponse> {
  return fetchApi<AddAnalysisResponse>('/comments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function getAnalyses(tradeId: string): Promise<{ analyses: TradeAnalysis[] }> {
  return fetchApi<{ analyses: TradeAnalysis[] }>(`/comments?tradeId=${tradeId}`, {
    method: 'GET',
  });
}
