
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Token } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Star, StarOff, AlertCircle, ChevronDown, Loader2, Zap, TrendingUp } from 'lucide-react';
import TokenIcon from './TokenIcon';
import { TokenSearchResult } from '@/services/realTimeTokenSearchService';
import { useToast } from '@/hooks/use-toast';

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  label?: string;
  required?: boolean;
  showBalance?: boolean;
  allowCustomTokens?: boolean;
  placeholder?: string;
  error?: string;
}

interface TokenFilter {
  hideZeroBalances: boolean;
  favoritesOnly: boolean;
  searchQuery: string;
}

const EnhancedTokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  selectedToken,
  onSelectToken,
  label = 'Select Token',
  required = false,
  showBalance = true,
  allowCustomTokens = false,
  placeholder = 'Search tokens...',
  error
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<TokenFilter>({
    hideZeroBalances: false,
    favoritesOnly: false,
    searchQuery: ''
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [isLoadingCustomToken, setIsLoadingCustomToken] = useState(false);

  // Enhanced real-time search state
  const [searchResults, setSearchResults] = useState<TokenSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string>('');
  const [popularTokens, setPopularTokens] = useState<TokenSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('tokenFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  // Load popular tokens on component mount - DISABLED to prevent API calls
  useEffect(() => {
    // Disable popular tokens loading to prevent blocking API calls
    // This was causing performance issues on Send/Receive pages
    console.log('TokenSelector: Popular tokens loading disabled for performance');
    setPopularTokens([]);
  }, []);

  // Optimized search function - use local filtering instead of API calls
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      // Use local token filtering instead of API calls for better performance
      const filteredTokens = tokens.filter(token =>
        token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        token.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20).map(token => ({
        id: token.id,
        symbol: token.symbol,
        name: token.name,
        logo: token.logo,
        price: token.price || 0,
        marketCap: token.market_cap,
        contractAddress: undefined,
        network: 'ethereum',
        verified: true,
        source: 'local' as const
      }));

      setSearchResults(filteredTokens);
      setShowSearchResults(true);

      if (filteredTokens.length === 0) {
        setSearchError('No tokens found. Try a different search term.');
      }

    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [tokens]);

  // Optimized search input handler - no API calls, only local filtering
  const handleSearchChange = useCallback((query: string) => {
    setFilter(prev => ({ ...prev, searchQuery: query }));

    // Clear existing timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Use immediate local filtering instead of debounced API calls
    performSearch(query);
  }, [searchDebounceTimer, performSearch]);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites: Set<string>) => {
    localStorage.setItem('tokenFavorites', JSON.stringify(Array.from(newFavorites)));
    setFavorites(newFavorites);
  };

  // Toggle favorite status
  const toggleFavorite = (tokenId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(tokenId)) {
      newFavorites.delete(tokenId);
    } else {
      newFavorites.add(tokenId);
    }
    saveFavorites(newFavorites);
  };

  // Filter tokens based on current filters
  const filteredTokens = tokens.filter(token => {
    // Search filter
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      const matchesSearch =
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Zero balance filter
    if (filter.hideZeroBalances) {
      const balance = parseFloat(token.balance || '0');
      if (balance === 0) return false;
    }

    // Favorites filter
    if (filter.favoritesOnly) {
      if (!favorites.has(token.id)) return false;
    }

    return true;
  });

  // Sort tokens: favorites first, then by balance, then alphabetically
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    // Favorites first
    const aIsFavorite = favorites.has(a.id);
    const bIsFavorite = favorites.has(b.id);
    if (aIsFavorite && !bIsFavorite) return -1;
    if (!aIsFavorite && bIsFavorite) return 1;

    // Then by balance (highest first)
    const aBalance = parseFloat(a.balance || '0') * (a.price || 0);
    const bBalance = parseFloat(b.balance || '0') * (b.price || 0);
    if (aBalance !== bBalance) return bBalance - aBalance;

    // Finally alphabetically
    return a.symbol.localeCompare(b.symbol);
  });

  // Convert search result to Token format
  const convertSearchResultToToken = (searchResult: TokenSearchResult): Token => {
    return {
      id: searchResult.id,
      symbol: searchResult.symbol,
      name: searchResult.name,
      logo: searchResult.logo || `/crypto-icons/${searchResult.symbol.toLowerCase()}.svg`,
      decimals: 18, // Default decimals
      balance: '0', // New tokens start with 0 balance
      price: searchResult.price,
      priceChange24h: 0 // Not available from search
    };
  };

  // Handle token selection from search results
  const handleSelectSearchResult = (searchResult: TokenSearchResult) => {
    const token = convertSearchResultToToken(searchResult);

    // Add to user's token preferences if it's a new token
    if (!tokens.find(t => t.id === token.id)) {
      toast({
        title: "Token Added",
        description: `${token.symbol} has been added to your token list`,
      });
    }

    onSelectToken(token);
    setOpen(false);
    setFilter(prev => ({ ...prev, searchQuery: '' }));
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setOpen(false);
    setFilter(prev => ({ ...prev, searchQuery: '' }));
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleCustomTokenAdd = async () => {
    if (!customTokenAddress.trim()) return;

    setIsLoadingCustomToken(true);
    try {
      // In a real implementation, this would validate the token address
      // and fetch token metadata from the blockchain
      console.log('Adding custom token:', customTokenAddress);

      // For now, create a placeholder token
      const customToken: Token = {
        id: `custom-${Date.now()}`,
        symbol: 'CUSTOM',
        name: 'Custom Token',
        logo: '/assets/icons/placeholder.svg',
        decimals: 18,
        balance: '0',
        price: 0
      };

      handleSelectToken(customToken);
      setCustomTokenAddress('');
    } catch (error) {
      console.error('Error adding custom token:', error);
    } finally {
      setIsLoadingCustomToken(false);
    }
  };

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between h-12 px-4 bg-dex-secondary/10 border-dex-secondary/30 text-white hover:bg-dex-secondary/20 ${
              error ? 'border-red-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              {selectedToken ? (
                <>
                  <TokenIcon token={selectedToken} size="sm" />
                  <div className="text-left">
                    <div className="font-medium">{selectedToken.symbol}</div>
                    {showBalance && selectedToken.balance && (
                      <div className="text-xs text-gray-400">
                        Balance: {parseFloat(selectedToken.balance).toFixed(4)}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-gray-400">
                  <AlertCircle size={16} />
                  <span>{required ? 'Select a token *' : 'Select a token'}</span>
                </div>
              )}
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg text-white bg-dex-dark border-dex-secondary/30 max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-white">{label}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Enhanced Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              {isSearching && (
                <Loader2 size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dex-primary animate-spin" />
              )}
              <Input
                placeholder={placeholder}
                value={filter.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10 bg-dex-secondary/10 border-dex-secondary/30 text-white placeholder-gray-400"
              />
            </div>

            {/* Search Error */}
            {searchError && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle size={14} />
                <span>{searchError}</span>
              </div>
            )}

            {/* Filter Options */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hideZero"
                  checked={filter.hideZeroBalances}
                  onCheckedChange={(checked) =>
                    setFilter(prev => ({ ...prev, hideZeroBalances: checked as boolean }))
                  }
                />
                <label htmlFor="hideZero" className="text-sm text-gray-300">
                  Hide zero balances
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favoritesOnly"
                  checked={filter.favoritesOnly}
                  onCheckedChange={(checked) =>
                    setFilter(prev => ({ ...prev, favoritesOnly: checked as boolean }))
                  }
                />
                <label htmlFor="favoritesOnly" className="text-sm text-gray-300">
                  Favorites only
                </label>
              </div>
            </div>

            <Separator className="bg-dex-secondary/20" />

            {/* Enhanced Token List with Search Results */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {/* Search Results Section */}
              {showSearchResults && searchResults.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wide">
                    <Zap size={14} />
                    Search Results
                  </div>
                  {searchResults.map(result => (
                    <div
                      key={`search-${result.id}`}
                      className="flex items-center justify-between p-3 bg-dex-primary/10 border border-dex-primary/30 rounded-lg hover:bg-dex-primary/15 transition-colors cursor-pointer"
                      onClick={() => handleSelectSearchResult(result)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dex-secondary/20 flex items-center justify-center">
                          {result.logo ? (
                            <img src={result.logo} alt={result.symbol} className="w-6 h-6 rounded-full" />
                          ) : (
                            <span className="text-xs font-bold text-white">{result.symbol.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {result.symbol}
                            {result.verified && (
                              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">{result.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          ${result.price.toFixed(4)}
                        </div>
                        {result.marketCap && (
                          <div className="text-xs text-gray-400">
                            MC: ${(result.marketCap / 1e9).toFixed(2)}B
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Separator className="bg-dex-secondary/20" />
                </>
              )}

              {/* Popular Tokens Section (when no search) */}
              {!showSearchResults && filter.searchQuery.length === 0 && popularTokens.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wide">
                    <TrendingUp size={14} />
                    Popular Tokens
                  </div>
                  {popularTokens.slice(0, 5).map(popular => (
                    <div
                      key={`popular-${popular.id}`}
                      className="flex items-center justify-between p-3 bg-dex-secondary/5 border border-dex-secondary/10 rounded-lg hover:bg-dex-secondary/10 transition-colors cursor-pointer"
                      onClick={() => handleSelectSearchResult(popular)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dex-secondary/20 flex items-center justify-center">
                          {popular.logo ? (
                            <img src={popular.logo} alt={popular.symbol} className="w-6 h-6 rounded-full" />
                          ) : (
                            <span className="text-xs font-bold text-white">{popular.symbol.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">{popular.symbol}</div>
                          <div className="text-sm text-gray-400">{popular.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          ${popular.price.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Separator className="bg-dex-secondary/20" />
                </>
              )}

              {/* User's Token List */}
              {sortedTokens.length > 0 ? (
                <>
                  {(showSearchResults || (popularTokens.length > 0 && filter.searchQuery.length === 0)) && (
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-400 uppercase tracking-wide">
                      Your Tokens
                    </div>
                  )}
                  {sortedTokens.map(token => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between p-3 bg-dex-secondary/10 border border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/15 transition-colors cursor-pointer"
                      onClick={() => handleSelectToken(token)}
                    >
                      <div className="flex items-center gap-3">
                        <TokenIcon token={token} size="sm" />
                        <div>
                          <div className="font-medium text-white">{token.symbol}</div>
                          <div className="text-sm text-gray-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {showBalance && (
                          <div className="text-right">
                            <div className="text-white font-medium">
                              {parseFloat(token.balance || '0').toFixed(4)}
                            </div>
                            {token.price && (
                              <div className="text-xs text-gray-400">
                                ${(parseFloat(token.balance || '0') * token.price).toFixed(2)}
                              </div>
                            )}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(token.id);
                          }}
                        >
                          {favorites.has(token.id) ? (
                            <Star size={16} className="text-yellow-500 fill-current" />
                          ) : (
                            <StarOff size={16} className="text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              ) : !showSearchResults && (
                <div className="text-center py-8 text-gray-400">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No tokens found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              )}
            </div>

            {/* Custom Token Section */}
            {allowCustomTokens && (
              <>
                <Separator className="bg-dex-secondary/20" />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white">Add Custom Token</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Token contract address"
                      value={customTokenAddress}
                      onChange={(e) => setCustomTokenAddress(e.target.value)}
                      className="bg-dex-secondary/10 border-dex-secondary/30 text-white placeholder-gray-400"
                    />
                    <Button
                      onClick={handleCustomTokenAdd}
                      disabled={!customTokenAddress.trim() || isLoadingCustomToken}
                      className="bg-dex-primary hover:bg-dex-primary/80"
                    >
                      {isLoadingCustomToken ? 'Adding...' : 'Add'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Token Info */}
      {selectedToken && showBalance && (
        <div className="text-xs text-gray-400">
          Available: {parseFloat(selectedToken.balance || '0').toFixed(4)} {selectedToken.symbol}
          {selectedToken.price && (
            <span className="ml-2">
              (${(parseFloat(selectedToken.balance || '0') * selectedToken.price).toFixed(2)})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(EnhancedTokenSelector);
