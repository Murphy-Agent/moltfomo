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
  TRUMP: 'maga',
  PENGU: 'pudgy-penguins',
  TAO: 'bittensor',
  WLD: 'worldcoin-wld',
  VIRTUAL: 'virtual-protocol',
  AIXBT: 'aixbt',
  AI16Z: 'ai16z',
};

// Fallback prices when API is unavailable (approximate)
const FALLBACK_PRICES: Record<string, number> = {
  BTC: 100000,
  ETH: 3300,
  SOL: 200,
  XRP: 2.5,
  ADA: 0.9,
  AVAX: 35,
  DOT: 7,
  SUI: 4,
  APT: 10,
  TON: 5,
  TRX: 0.25,
  ATOM: 8,
  NEAR: 5,
  ICP: 12,
  HBAR: 0.3,
  SEI: 0.5,
  FIL: 5,
  LTC: 100,
  LINK: 25,
  OP: 2,
  ARB: 1,
  RENDER: 8,
  INJ: 25,
  PYTH: 0.4,
  TIA: 5,
  UNI: 12,
  AAVE: 300,
  PENDLE: 5,
  ONDO: 1.5,
  JUP: 1,
  ENA: 0.5,
  AERO: 1.5,
  MORPHO: 3,
  DOGE: 0.35,
  SHIB: 0.00002,
  PEPE: 0.00001,
  WIF: 2,
  BONK: 0.00003,
  FLOKI: 0.0002,
  TRUMP: 15,
  PENGU: 0.03,
  TAO: 500,
  WLD: 2,
  VIRTUAL: 3,
  AIXBT: 0.5,
  AI16Z: 1,
};

// In-memory price cache
let priceCache: Record<string, { price: number; updatedAt: Date }> = {};
let lastFetchTime = 0;
const CACHE_DURATION_MS = 30000; // 30 seconds

export interface PriceData {
  symbol: string;
  price: number;
  lastUpdatedAt: Date;
}

export async function fetchPricesFromCoinGecko(symbols?: string[]): Promise<Record<string, number>> {
  const targetSymbols = symbols || SUPPORTED_ASSETS.slice(0, 50); // Limit to 50 for free API
  
  // Map symbols to CoinGecko IDs
  const ids = targetSymbols
    .map(s => COINGECKO_IDS[s])
    .filter(Boolean)
    .join(',');
  
  if (!ids) {
    return {};
  }
  
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    );
    
    if (!response.ok) {
      console.error('CoinGecko API error:', response.status);
      return {};
    }
    
    const data = await response.json();
    
    // Map back to our symbols
    const prices: Record<string, number> = {};
    for (const symbol of targetSymbols) {
      const geckoId = COINGECKO_IDS[symbol];
      if (geckoId && data[geckoId]?.usd) {
        prices[symbol] = data[geckoId].usd;
      }
    }
    
    return prices;
  } catch (error) {
    console.error('Failed to fetch prices from CoinGecko:', error);
    return {};
  }
}

export async function getPrices(symbols?: string[]): Promise<Record<string, number>> {
  const now = Date.now();
  const targetSymbols = symbols || Object.keys(FALLBACK_PRICES);
  
  // Check if cache is still valid
  if (now - lastFetchTime < CACHE_DURATION_MS) {
    const cachedPrices: Record<string, number> = {};
    let allCached = true;
    
    for (const symbol of targetSymbols) {
      if (priceCache[symbol]) {
        cachedPrices[symbol] = priceCache[symbol].price;
      } else {
        allCached = false;
      }
    }
    
    if (allCached) {
      return cachedPrices;
    }
  }
  
  // Fetch fresh prices
  const freshPrices = await fetchPricesFromCoinGecko(targetSymbols);
  
  // Update cache with fresh prices
  const updatedAt = new Date();
  for (const [symbol, price] of Object.entries(freshPrices)) {
    priceCache[symbol] = { price, updatedAt };
  }
  lastFetchTime = now;
  
  // Merge with fallback prices for missing symbols
  const result: Record<string, number> = {};
  for (const symbol of targetSymbols) {
    if (freshPrices[symbol]) {
      result[symbol] = freshPrices[symbol];
    } else if (priceCache[symbol]) {
      result[symbol] = priceCache[symbol].price;
    } else if (FALLBACK_PRICES[symbol]) {
      result[symbol] = FALLBACK_PRICES[symbol];
    }
  }
  
  return result;
}

export async function getPrice(symbol: string): Promise<number | null> {
  const prices = await getPrices([symbol]);
  return prices[symbol] || FALLBACK_PRICES[symbol] || null;
}

export function getAllPricesLastUpdated(): Date {
  const timestamps = Object.values(priceCache).map(p => p.updatedAt.getTime());
  if (timestamps.length === 0) return new Date();
  return new Date(Math.max(...timestamps));
}
