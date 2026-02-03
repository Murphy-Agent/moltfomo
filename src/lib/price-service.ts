import { SUPPORTED_ASSETS } from './mock-data';

// CoinGecko ID mapping for supported assets
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  SUI: 'sui',
  APT: 'aptos',
  TON: 'the-open-network',
  TRX: 'tron',
  ATOM: 'cosmos',
  NEAR: 'near',
  ICP: 'internet-computer',
  HBAR: 'hedera-hashgraph',
  SEI: 'sei-network',
  FIL: 'filecoin',
  LTC: 'litecoin',
  LINK: 'chainlink',
  OP: 'optimism',
  ARB: 'arbitrum',
  RENDER: 'render-token',
  INJ: 'injective-protocol',
  PYTH: 'pyth-network',
  TIA: 'celestia',
  UNI: 'uniswap',
  AAVE: 'aave',
  PENDLE: 'pendle',
  ONDO: 'ondo-finance',
  JUP: 'jupiter-exchange-solana',
  ENA: 'ethena',
  AERO: 'aerodrome-finance',
  MORPHO: 'morpho',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  WIF: 'dogwifcoin',
  BONK: 'bonk',
  FLOKI: 'floki',
  TRUMP: 'official-trump',
  PENGU: 'pudgy-penguins',
  TAO: 'bittensor',
  WLD: 'worldcoin-wld',
  VIRTUAL: 'virtual-protocol',
  AI16Z: 'ai16z',
};

// In-memory price cache
let priceCache: Map<string, { price: number; timestamp: number }> = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Fallback mock prices for assets not on CoinGecko
const MOCK_PRICES: Record<string, number> = {
  SPX: 0.00012,
  FARTCOIN: 0.00003,
  MEME: 0.025,
  TURBO: 0.008,
  POPCAT: 0.45,
  NEIRO: 0.0008,
  MOG: 0.0000002,
  BRETT: 0.12,
  MEW: 0.006,
  DEGEN: 0.015,
  TOSHI: 0.0003,
  HIGHER: 0.003,
  DOGINME: 0.0001,
  BALD: 0.002,
  JELLYJELLY: 0.00005,
  PNUT: 0.00008,
  MOODENG: 0.0004,
  FWOG: 0.0002,
  GOAT: 0.35,
  VINE: 0.02,
  AIXBT: 0.15,
  KAITO: 0.08,
  ARC: 0.25,
  ZEREBRO: 0.05,
  SWARMS: 0.03,
  ALCH: 0.02,
  COOKIE: 0.04,
  GRIFFAIN: 0.01,
  ZORA: 0.005,
  CLANKER: 0.008,
};

export interface PriceData {
  symbol: string;
  price: number;
  lastUpdated: Date;
}

export interface PricesResponse {
  prices: Record<string, string>;
  lastUpdatedAt: string;
}

async function fetchFromCoinGecko(symbols: string[]): Promise<Record<string, number>> {
  const coinGeckoIds = symbols
    .map((s) => COINGECKO_IDS[s])
    .filter(Boolean);

  if (coinGeckoIds.length === 0) {
    return {};
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.join(',')}&vs_currencies=usd`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      console.error('CoinGecko API error:', response.status);
      return {};
    }

    const data = await response.json();
    const prices: Record<string, number> = {};

    for (const symbol of symbols) {
      const cgId = COINGECKO_IDS[symbol];
      if (cgId && data[cgId]?.usd) {
        prices[symbol] = data[cgId].usd;
      }
    }

    return prices;
  } catch (error) {
    console.error('Failed to fetch from CoinGecko:', error);
    return {};
  }
}

export async function getPrices(symbols?: string[]): Promise<PricesResponse> {
  const targetSymbols = symbols || [...SUPPORTED_ASSETS];
  const now = Date.now();
  const prices: Record<string, string> = {};
  const symbolsToFetch: string[] = [];

  // Check cache first
  for (const symbol of targetSymbols) {
    const cached = priceCache.get(symbol);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      prices[symbol] = cached.price.toFixed(8);
    } else {
      symbolsToFetch.push(symbol);
    }
  }

  // Fetch missing prices
  if (symbolsToFetch.length > 0) {
    // Try CoinGecko for supported assets
    const cgPrices = await fetchFromCoinGecko(symbolsToFetch);

    for (const symbol of symbolsToFetch) {
      let price: number;

      if (cgPrices[symbol]) {
        price = cgPrices[symbol];
      } else if (MOCK_PRICES[symbol]) {
        // Use mock price with slight random variation for demo
        price = MOCK_PRICES[symbol] * (1 + (Math.random() - 0.5) * 0.02);
      } else {
        // Default fallback
        price = 1.0;
      }

      prices[symbol] = price.toFixed(8);
      priceCache.set(symbol, { price, timestamp: now });
    }
  }

  return {
    prices,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getPrice(symbol: string): Promise<number | null> {
  const response = await getPrices([symbol]);
  const price = response.prices[symbol];
  return price ? parseFloat(price) : null;
}

// Utility to format price for display
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (price >= 1) {
    return price.toFixed(2);
  } else if (price >= 0.01) {
    return price.toFixed(4);
  } else {
    return price.toFixed(8);
  }
}
