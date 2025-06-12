// Currency conversion service with Open Exchange Rates API integration
// Implements caching with 1-hour TTL to avoid rate limits

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number;
}

export interface ExchangeRatesResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

export interface CurrencyCache {
  rates: Record<string, number>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Supported currencies with their display information
export const SUPPORTED_CURRENCIES: Record<string, Omit<CurrencyRate, 'rate'>> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' }
};

// Fallback rates in case API fails
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  INR: 83.5,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35
};

class CurrencyService {
  private readonly API_KEY = 'b614d6698a904c61a7eba2085fb1cbed';
  private readonly API_URL = 'https://openexchangerates.org/api/latest.json';
  private readonly CACHE_KEY = 'currency_rates_cache';
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

  private cache: CurrencyCache | null = null;

  constructor() {
    this.loadCacheFromStorage();
  }

  /**
   * Load cached rates from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (cached) {
        const parsedCache: CurrencyCache = JSON.parse(cached);
        
        // Check if cache is still valid
        if (Date.now() - parsedCache.timestamp < parsedCache.ttl) {
          this.cache = parsedCache;
          console.log('💰 Currency rates loaded from cache');
        } else {
          console.log('💰 Currency cache expired, will fetch fresh rates');
          localStorage.removeItem(this.CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading currency cache:', error);
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  /**
   * Save rates to localStorage cache
   */
  private saveCacheToStorage(rates: Record<string, number>): void {
    try {
      const cacheData: CurrencyCache = {
        rates,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      };
      
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      this.cache = cacheData;
      console.log('💰 Currency rates cached successfully');
    } catch (error) {
      console.error('Error saving currency cache:', error);
    }
  }

  /**
   * Fetch fresh exchange rates from API
   */
  private async fetchExchangeRates(): Promise<Record<string, number>> {
    try {
      console.log('💰 Fetching fresh currency rates from API...');
      
      const response = await fetch(`${this.API_URL}?app_id=${this.API_KEY}`);
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data: ExchangeRatesResponse = await response.json();
      
      // Filter only supported currencies
      const filteredRates: Record<string, number> = {};
      Object.keys(SUPPORTED_CURRENCIES).forEach(currency => {
        if (currency === 'USD') {
          filteredRates[currency] = 1.0; // Base currency
        } else if (data.rates[currency]) {
          filteredRates[currency] = data.rates[currency];
        } else {
          console.warn(`Rate not found for ${currency}, using fallback`);
          filteredRates[currency] = FALLBACK_RATES[currency];
        }
      });
      
      console.log('💰 Fresh currency rates fetched successfully');
      return filteredRates;
      
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      console.log('💰 Using fallback rates due to API error');
      return FALLBACK_RATES;
    }
  }

  /**
   * Get current exchange rates (from cache or API)
   */
  public async getExchangeRates(): Promise<Record<string, number>> {
    // Return cached rates if available and valid
    if (this.cache && Date.now() - this.cache.timestamp < this.cache.ttl) {
      console.log('💰 Using cached currency rates');
      return this.cache.rates;
    }

    // Fetch fresh rates
    const rates = await this.fetchExchangeRates();
    this.saveCacheToStorage(rates);
    return rates;
  }

  /**
   * Convert amount from USD to target currency
   */
  public async convertFromUSD(amountUSD: number, targetCurrency: string): Promise<number> {
    if (targetCurrency === 'USD') {
      return amountUSD;
    }

    try {
      const rates = await this.getExchangeRates();
      const rate = rates[targetCurrency];
      
      if (!rate) {
        console.warn(`Rate not found for ${targetCurrency}, using fallback`);
        return amountUSD * (FALLBACK_RATES[targetCurrency] || 1);
      }
      
      return amountUSD * rate;
    } catch (error) {
      console.error('Error converting currency:', error);
      return amountUSD * (FALLBACK_RATES[targetCurrency] || 1);
    }
  }

  /**
   * Format currency amount with proper symbol and decimals
   */
  public formatCurrency(amount: number, currencyCode: string): string {
    const currency = SUPPORTED_CURRENCIES[currencyCode];
    if (!currency) {
      return `${amount.toFixed(2)}`;
    }

    // Special formatting for different currencies
    let decimals = 2;
    if (currencyCode === 'JPY') {
      decimals = 0; // Japanese Yen doesn't use decimals
    } else if (currencyCode === 'INR' && amount > 1000) {
      decimals = 0; // Large INR amounts without decimals
    }

    const formattedAmount = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return `${currency.symbol}${formattedAmount}`;
  }

  /**
   * Get all supported currencies with current rates
   */
  public async getSupportedCurrencies(): Promise<CurrencyRate[]> {
    const rates = await this.getExchangeRates();
    
    return Object.keys(SUPPORTED_CURRENCIES).map(code => ({
      ...SUPPORTED_CURRENCIES[code],
      rate: rates[code] || FALLBACK_RATES[code] || 1
    }));
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  public clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
    this.cache = null;
    console.log('💰 Currency cache cleared');
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();

// Export utility function for easy use in components
export const convertPrice = async (priceUSD: number, targetCurrency: string): Promise<string> => {
  const convertedAmount = await currencyService.convertFromUSD(priceUSD, targetCurrency);
  return currencyService.formatCurrency(convertedAmount, targetCurrency);
};
