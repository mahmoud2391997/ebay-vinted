
import { useState, useRef, useEffect } from 'react';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { VintedVestiaireListingCard, VintedVestiaireItem } from '@/components/VintedVestiaireListingCard';
import { SearchFilters } from '@/components/SearchFilters';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { searchVinted, type VintedSearchResult } from '@/lib/api/fashion';
import { useSearchVintedSold } from '@/hooks/useSearchVintedSold';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/PaginationControls';
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
    minPrice: undefined as number | undefined,
    country: 'fr',
    showSold: false,
  });

  const [isInitialMount, setIsInitialMount] = useState(true);

  const [priceInputs, setPriceInputs] = useState({
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
  });

  const [items, setItems] = useState<VintedVestiaireItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThrottled, setIsThrottled] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cache, setCache] = useState<
    Map<
      string,
      { items: VintedVestiaireItem[]; totalResults: number; hasMore: boolean }
    >
  >(new Map());
  
  const { searchSoldItems } = useSearchVintedSold();
  const lastSearchTime = useRef<number>(0);
  const { toast } = useToast();
  
  // Debounce search state to prevent excessive API calls
  const debouncedSearchState = useDebounce(searchState, 800);

  const getCacheKey = (state: typeof searchState) => {
    const { query, page, itemsPerPage, maxPrice, minPrice, country, showSold } = state;
    return `${query}-${page}-${itemsPerPage}-${maxPrice || 'none'}-${minPrice || 'none'}-${country}-${showSold}`;
  };

  useEffect(() => {
    // Skip initial mount to prevent empty search
    if (isInitialMount) {
      setIsInitialMount(false);
      console.log('Skipping initial mount search');
      return;
    }

    if (!debouncedSearchState.query || debouncedSearchState.query.trim() === '') {
      console.log('Skipping search - empty query');
      return;
    }

    console.log('Performing search for:', debouncedSearchState.query);

    const performSearch = async () => {
      const now = Date.now();
      if (now - lastSearchTime.current < THROTTLE_DELAY && debouncedSearchState.page === 1) {
        setIsThrottled(true);
        setTimeout(() => setIsThrottled(false), THROTTLE_DELAY);
        return;
      }

      const cacheKey = getCacheKey(debouncedSearchState);
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
      if (debouncedSearchState.page === 1) setItems([]);
      lastSearchTime.current = now;

      try {
        const apiOptions = {
          page: debouncedSearchState.page,
          itemsPerPage: debouncedSearchState.itemsPerPage,
          maxPrice: debouncedSearchState.maxPrice,
          minPrice: debouncedSearchState.minPrice,
          country: debouncedSearchState.country,
        };

        console.log('Vinted search - showSold:', debouncedSearchState.showSold, 'query:', debouncedSearchState.query);
        const results: VintedSearchResult = debouncedSearchState.showSold
          ? await searchSoldItems(debouncedSearchState.query, apiOptions)
          : await searchVinted(debouncedSearchState.query, apiOptions);

        if (results.success) {
          const resultData = {
            items: (results.data || []) as VintedVestiaireItem[],
            totalResults: debouncedSearchState.showSold
              ? results.count || results.data?.length || 0
              : results.count || 0,
            hasMore: results.pagination?.has_more || false,
          };
          setCache(prev => new Map(prev).set(cacheKey, resultData));
          setItems(resultData.items);
          setTotalResults(resultData.totalResults);
          setHasMore(resultData.hasMore);
          if (!results.data || results.data.length === 0) {
            toast({ title: 'No results', description: `No listings found for "${debouncedSearchState.query}"` });
          }
        } else {
          setError(results.error || 'Failed to fetch from Vinted.');
          toast({ title: 'Vinted Search Failed', description: results.error, variant: 'destructive' });
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
  }, [debouncedSearchState, cache, toast, searchSoldItems, isInitialMount]);

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
      minPrice: undefined,
    }));
    setPriceInputs({
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchState(prevState => ({ ...prevState, page: newPage }));
  };

  const handleItemsPerPageChange = (newValue: number) => {
    setSearchState(prevState => ({ ...prevState, itemsPerPage: newValue, page: 1 }));
  };

  const handleMinPriceChange = (newValue: number | undefined) => {
    setPriceInputs(prev => ({ ...prev, minPrice: newValue }));
  };

  const handleMaxPriceChange = (newValue: number | undefined) => {
    setPriceInputs(prev => ({ ...prev, maxPrice: newValue }));
  };
  
  const handleApplyPriceChange = () => {
    setSearchState(prevState => ({ 
      ...prevState, 
      minPrice: priceInputs.minPrice,
      maxPrice: priceInputs.maxPrice,
      page: 1 
    }));
  };

  const handleCountryChange = (newCountry: string) => {
    setSearchState(prevState => ({ ...prevState, country: newCountry, page: 1 }));
  };

  const handleShowSoldChange = (checked: boolean) => {
    setSearchState(prevState => ({ ...prevState, showSold: checked, page: 1 }));
  };

  const handleExport = async () => {
    if (!items.length) {
      toast({ title: 'No data to export', description: 'Please perform a search first.' });
      return;
    }
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(items);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Listings");
    const fileName = `listings_vinted_${new Date().toISOString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast({ title: 'Export Successful', description: `Downloaded ${items.length} listings to ${fileName}` });
  };
  
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Vinted Scraper</h1>
              <p className="text-xs text-muted-foreground">Search Vinted listings in real time</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 px-4">
        <div className="max-w-4xl mx-auto mb-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3 gradient-text">Scrape Vinted</h2>
            <p className="text-muted-foreground text-lg">
              Search millions of products in real-time
            </p>
          </div>

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
                  maxPrice={priceInputs.maxPrice}
                  onMaxPriceChange={handleMaxPriceChange}
                  minPrice={priceInputs.minPrice}
                  onMinPriceChange={handleMinPriceChange}
                  onApplyPriceChange={handleApplyPriceChange}
                  country={searchState.country}
                  onCountryChange={handleCountryChange}
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
            Scraping Vinted listings
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
              {items.map((item, index) => (
                <VintedVestiaireListingCard
                  key={index}
                  item={item as VintedVestiaireItem}
                  index={index}
                  platform="Vinted"
                  isSold={searchState.showSold}
                />
              ))}
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
          <p>Powered by the Vinted API</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
