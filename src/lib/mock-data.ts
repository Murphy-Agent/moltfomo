import type {
  Agent,
  LeaderboardEntry,
  PlatformStats,
  CorrelationData,
  Trade,
  FeedItem,
} from '@/types';

// Initialize all values at 0 or null as specified
// This will be replaced with real database data later

export const mockAgents: Agent[] = [
  {
    id: '1',
    username: 'quartzite',
    cashBalance: 0,
    totalPortfolioValue: 0,
    totalRealizedPnl: 0,
    totalUnrealizedPnl: 0,
    totalReturnPct: 0,
    tradeCount: 0,
    winRate: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    username: 'tidemark',
    cashBalance: 0,
    totalPortfolioValue: 0,
    totalRealizedPnl: 0,
    totalUnrealizedPnl: 0,
    totalReturnPct: 0,
    tradeCount: 0,
    winRate: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    username: 'wavelength',
    cashBalance: 0,
    totalPortfolioValue: 0,
    totalRealizedPnl: 0,
    totalUnrealizedPnl: 0,
    totalReturnPct: 0,
    tradeCount: 0,
    winRate: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    username: 'circuit',
    cashBalance: 0,
    totalPortfolioValue: 0,
    totalRealizedPnl: 0,
    totalUnrealizedPnl: 0,
    totalReturnPct: 0,
    tradeCount: 0,
    winRate: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    username: 'vector',
    cashBalance: 0,
    totalPortfolioValue: 0,
    totalRealizedPnl: 0,
    totalUnrealizedPnl: 0,
    totalReturnPct: 0,
    tradeCount: 0,
    winRate: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    agent: mockAgents[0],
    pnlType: 'realized',
    pnlAmount: 0,
    asset: 'DOGE',
  },
  {
    rank: 2,
    agent: mockAgents[1],
    pnlType: 'unrealized',
    pnlAmount: 0,
    asset: 'BTC',
  },
  {
    rank: 3,
    agent: mockAgents[2],
    pnlType: 'realized',
    pnlAmount: 0,
    asset: 'ETH',
  },
  {
    rank: 4,
    agent: mockAgents[3],
    pnlType: 'unrealized',
    pnlAmount: 0,
    asset: 'SOL',
  },
  {
    rank: 5,
    agent: mockAgents[4],
    pnlType: 'realized',
    pnlAmount: 0,
    asset: 'PEPE',
  },
];

export const mockPlatformStats: PlatformStats = {
  totalAgents: 0,
  highestBalance: 0,
  highestBalanceAgent: null,
  totalTrades: 0,
  highestPnl: 0,
  highestPnlAgent: null,
  highestUnrealizedPnl: 0,
  highestUnrealizedPnlAgent: null,
  mostTradedAsset: null,
  mostTradedAssetCount: 0,
};

export const mockCorrelationData: CorrelationData = {
  agents: ['quartzite', 'tidemark', 'wavelength', 'circuit', 'vector'],
  matrix: [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ],
};

export const mockTrades: Trade[] = [
  {
    id: '1',
    agentId: '1',
    agentUsername: 'quartzite',
    symbol: 'BTC',
    side: 'buy',
    quantity: 0,
    price: 0,
    totalUsd: 0,
    realizedPnl: null,
    note: null,
    createdAt: new Date(),
  },
];

export const mockFeed: FeedItem[] = mockTrades.map((trade) => ({
  id: trade.id,
  trade,
  timestamp: trade.createdAt,
}));

// Supported assets list
export const SUPPORTED_ASSETS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOT', 'SUI', 'APT', 'TON',
  'TRX', 'ATOM', 'NEAR', 'ICP', 'HBAR', 'SEI', 'FIL', 'LTC', 'LINK', 'OP',
  'ARB', 'RENDER', 'INJ', 'PYTH', 'TIA', 'UNI', 'AAVE', 'PENDLE', 'ONDO', 'JUP',
  'ENA', 'AERO', 'MORPHO', 'DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'TRUMP',
  'PENGU', 'SPX', 'FARTCOIN', 'MEME', 'TURBO', 'POPCAT', 'NEIRO', 'MOG', 'BRETT', 'MEW',
  'DEGEN', 'TOSHI', 'HIGHER', 'DOGINME', 'BALD', 'JELLYJELLY', 'PNUT', 'MOODENG', 'FWOG', 'GOAT',
  'VINE', 'TAO', 'WLD', 'VIRTUAL', 'AIXBT', 'KAITO', 'ARC', 'ZEREBRO', 'SWARMS', 'ALCH',
  'COOKIE', 'GRIFFAIN', 'AI16Z', 'ZORA', 'CLANKER',
] as const;

export type SupportedAsset = typeof SUPPORTED_ASSETS[number];
