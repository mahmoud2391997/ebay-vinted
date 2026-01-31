
import { useState, useCallback, useRef, useEffect } from 'react';
import { ShoppingBag, Zap, AlertCircle, Shield, Shirt, Search } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { ListingCard } from '@/components/ListingCard';
import { VintedVestiaireListingCard, VintedVestiaireItem } from '@/components/VintedVestiaireListingCard';
import { SearchFilters } from '@/components/SearchFilters';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { searchEbay, EbayItem } from '@/lib/api/ebay';
import { searchVinted } from '@/lib/api/fashion';
import { useSearchVintedSold } from '@/hooks/useSearchVintedSold';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaginationControls } from '@/components/PaginationControls';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';

const THROTTLE_DELAY = 1500;

const initialSearchTerms = [
  'Dior women bags',
  'Louis Vuitton women bags',
  'Prada women bags',
  'Gucci women bags',
  'Christian Dior women bags',
  'Michael Kors women bags',
  'Coach women bags',
];

const Index = () => {
  const [searchState, setSearchState] = useState({
    query: '',
    page: 1,
    itemsPerPage: 25,
    maxPrice: undefined as number | undefined,
    country: 'fr',
    showSold: false,
  });

  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThrottled, setIsThrottled] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState('ebay');
  const [hasMore, setHasMore] = useState(false);
  const [cache, setCache] = useState<Map<string, any>>(new Map());
  
  const { searchSoldItems } = useSearchVintedSold();
  const lastSearchTime = useRef<number>(0);
  const { toast } = useToast();

  const getCacheKey = (platform: string, state: typeof searchState) => {
    const { query, page, itemsPerPage, maxPrice, country, showSold } = state;
    return `${platform}-${query}-${page}-${itemsPerPage}-${maxPrice || 'none'}-${country}-${showSold}`;
  };

  useEffect(() => {
    if (!searchState.query) {
      return;
    }

    const performSearch = async () => {
      const now = Date.now();
      if (now - lastSearchTime.current < THROTTLE_DELAY && searchState.page === 1) {
        setIsThrottled(true);
        toast({ title: 'Please wait', description: 'Rate limit in effect. Try again in a moment.' });
        setTimeout(() => setIsThrottled(false), THROTTLE_DELAY);
        return;
      }

      const cacheKey = getCacheKey(platform, searchState);
      const cachedData = cache.get(cacheKey);

      if (cachedData) {
        setItems(cachedData.items);
        setTotalResults(cachedData.totalResults);
        setHasMore(cachedData.hasMore);
        setHasSearched(true);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      setError(null);
      if (searchState.page === 1) setItems([]);
      lastSearchTime.current = now;

      try {
        let results;
        const apiOptions = {
          page: searchState.page,
          itemsPerPage: searchState.itemsPerPage,
          maxPrice: searchState.maxPrice,
          country: searchState.country,
        };

        if (platform === 'vinted') {
          results = searchState.showSold
            ? await searchSoldItems(searchState.query, apiOptions)
            : await searchVinted(searchState.query, apiOptions);

          if (results.success) {
            const resultData = {
              items: results.data || [],
              totalResults: searchState.showSold ? results.count || results.data?.length || 0 : results.count || 0,
              hasMore: results.pagination?.has_more || false,
            };
            setCache(prev => new Map(prev).set(cacheKey, resultData));
            setItems(resultData.items);
            setTotalResults(resultData.totalResults);
            setHasMore(resultData.hasMore);
            if (!results.data || results.data.length === 0) {
              toast({ title: 'No results', description: `No listings found for "${searchState.query}"` });
            }
          } else {
            setError(results.error || 'Failed to fetch from Vinted.');
            toast({ title: 'Vinted Search Failed', description: results.error, variant: 'destructive' });
          }
        } else { // eBay
          const offset = (searchState.page - 1) * searchState.itemsPerPage;
          const ebayOptions: any = { query: searchState.query, limit: searchState.itemsPerPage, offset };
          const filters = [];
          if (searchState.showSold) filters.push('soldItemsOnly:true');
          if (searchState.maxPrice) filters.push(`price:[..${searchState.maxPrice}],priceCurrency:USD`);
          if (filters.length > 0) ebayOptions.filter = filters.join(',');

          results = await searchEbay(ebayOptions);

          if ('retryAfter' in results) {
            const errorMsg = `Rate limit exceeded. Please wait ${results.retryAfter} seconds.`;
            setError(errorMsg);
            toast({ title: 'Rate limit reached', description: `Please wait ${results.retryAfter}s.`, variant: 'destructive' });
          } else {
            const resultData = {
              items: results.itemSummaries || [],
              totalResults: results.total || 0,
              hasMore: (results.offset || 0) + (results.itemSummaries?.length || 0) < (results.total || 0),
            };
            setCache(prev => new Map(prev).set(cacheKey, resultData));
            setItems(resultData.items);
            setTotalResults(resultData.totalResults);
            setHasMore(resultData.hasMore);
            if (!results.itemSummaries || results.itemSummaries.length === 0) {
              toast({ title: 'No results', description: `No listings found for "${searchState.query}" on eBay` });
            }
          }
        }
      } catch (err) {
        console.error('Search error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        toast({ title: 'Search Failed', description: errorMessage, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [searchState, platform, cache, toast, searchSoldItems]);

  const handleQuerySearch = (query: string) => {
    setSearchState(prevState => ({ ...prevState, query, page: 1 }));
  };
  
  const handleInitialTermSearch = (term: string) => {
    setSearchState(prevState => ({
      ...prevState,
      query: term,
      page: 1,
      showSold: false, // Reset filters for a new search
      maxPrice: undefined,
    }));
  };

  const handlePageChange = (newPage: number) => {
    setSearchState(prevState => ({ ...prevState, page: newPage }));
  };

  const handleItemsPerPageChange = (newValue: number) => {
    setSearchState(prevState => ({ ...prevState, itemsPerPage: newValue, page: 1 }));
  };

  const handleMaxPriceChange = (newValue: number | undefined) => {
    setSearchState(prevState => ({ ...prevState, maxPrice: newValue }));
  };
  
  const handleApplyPriceChange = () => {
    setSearchState(prevState => ({ ...prevState, page: 1 }));
  };

  const handleCountryChange = (newCountry: string) => {
    setSearchState(prevState => ({ ...prevState, country: newCountry, page: 1 }));
  };

  const handleShowSoldChange = (checked: boolean) => {
    setSearchState(prevState => ({ ...prevState, showSold: checked, page: 1 }));
  };

  const handleExport = () => {
    if (!items.length) {
      toast({ title: 'No data to export', description: 'Please perform a search first.' });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Listings");
    const fileName = `listings_${platform}_${new Date().toISOString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast({ title: 'Export Successful', description: `Downloaded ${items.length} listings to ${fileName}` });
  };

  const handlePlatformChange = (newPlatform: string) => {
    setPlatform(newPlatform);
    setItems([]); // Clear items to prevent showing stale data from the other platform
    setTotalResults(0);
    setHasMore(false);
  };
  
  const platformConfig = {
    ebay: { title: "eBay", gradient: "gradient-text", icon: <ShoppingBag className="h-6 w-6 text-primary" /> },
    vinted: { title: "Vinted", gradient: "gradient-text-vinted", icon: <Shirt className="h-6 w-6 text-green-500" /> },
  }

  const currentPlatformConfig = platformConfig[platform as keyof typeof platformConfig] || platformConfig.ebay;
  
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Multi-Platform Scraper</h1>
              <p className="text-xs text-muted-foreground">Search across eBay and Vinted</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 px-4">
        <div className="max-w-4xl mx-auto mb-10">
          <div className="text-center mb-8">
             <h2 className={`text-4xl font-bold mb-3 ${currentPlatformConfig.gradient}`}>
                Scrape {currentPlatformConfig.title}
              </h2>
            <p className="text-muted-foreground text-lg">
              Search millions of products in real-time
            </p>
          </div>
          
          <Tabs defaultValue="ebay" onValueChange={handlePlatformChange} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ebay">eBay</TabsTrigger>
              <TabsTrigger value="vinted">Vinted</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <SearchBar onSearch={handleQuerySearch} isLoading={isLoading} isThrottled={isThrottled} />
          
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {initialSearchTerms.map((term) => (
              <Badge key={term} variant="outline" className="cursor-pointer" onClick={() => handleInitialTermSearch(term)}>
                {term}
              </Badge>
            ))}
          </div>

          {hasSearched && (
            <>
                <SearchFilters
                  totalResults={totalResults}
                  itemsPerPage={searchState.itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  maxPrice={searchState.maxPrice}
                  onMaxPriceChange={handleMaxPriceChange}
                  onApplyPriceChange={handleApplyPriceChange}
                  country={searchState.country}
                  onCountryChange={handleCountryChange}
                  platform={platform}
                  showSold={searchState.showSold}
                  onShowSoldChange={handleShowSoldChange}
                />
              <div className="flex justify-end mb-4">
                <Button onClick={handleExport} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                  Export to Excel
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground mt-3">
            <Shield className="inline h-3 w-3 mr-1" />
            {platform === 'ebay' ? 'Rate limited: 30 requests per minute' : 'No rate limits on this platform'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="max-w-4xl mx-auto"><LoadingSkeleton /></div>
        ) : hasSearched && items.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {items.map((item, index) =>
                platform === 'ebay' ? (
                  <ListingCard key={(item as EbayItem).itemId || index} item={item as EbayItem} index={index} isSold={searchState.showSold} />
                ) : (
                  <VintedVestiaireListingCard key={index} item={item as VintedVestiaireItem} index={index} platform={'Vinted'} isSold={searchState.showSold} />
                )
              )}
            </div>
            <PaginationControls currentPage={searchState.page} onPageChange={handlePageChange} hasMore={hasMore} />
          </div>
        ) : hasSearched && items.length === 0 ? (
          <EmptyState type="no-results" query={searchState.query} />
        ) : (
          <EmptyState type="initial" onSearch={handleInitialTermSearch} initialSearchTerms={initialSearchTerms} />
        )}
      </main>

      <footer className="border-t border-border/50 py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground px-4">
          <p>Powered by the Vinted and eBay APIs</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
