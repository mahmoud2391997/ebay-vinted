import { useState, useCallback, useRef } from 'react';
import { ShoppingBag, Zap, AlertCircle, Shield } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { ListingCard } from '@/components/ListingCard';
import { SearchFilters } from '@/components/SearchFilters';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { StatsBar } from '@/components/StatsBar';
import { searchEbay, EbayItem } from '@/lib/api/ebay';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const THROTTLE_DELAY = 1500; // 1.5 seconds between requests

const Index = () => {
  const [items, setItems] = useState<EbayItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isThrottled, setIsThrottled] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [sort, setSort] = useState('newlyListed');
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; resetIn: number } | null>(null);
  const lastSearchTime = useRef<number>(0);
  const { toast } = useToast();

  const handleSearch = useCallback(async (query: string, selectedSort?: string) => {
    // Client-side throttling
    const now = Date.now();
    if (now - lastSearchTime.current < THROTTLE_DELAY) {
      setIsThrottled(true);
      toast({
        title: 'Please wait',
        description: 'Rate limit in effect. Try again in a moment.',
      });
      setTimeout(() => setIsThrottled(false), THROTTLE_DELAY);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setCurrentQuery(query);
    setError(null);
    lastSearchTime.current = now;

    try {
      const results = await searchEbay({
        query,
        limit: 50,
        sort: (selectedSort || sort) as any,
      });

      // Handle rate limit response
      if ('retryAfter' in results) {
        setError(`Rate limit exceeded. Please wait ${results.retryAfter} seconds.`);
        toast({
          title: 'Rate limit reached',
          description: `Too many requests. Please wait ${results.retryAfter}s before trying again.`,
          variant: 'destructive',
        });
        return;
      }

      setItems(results.itemSummaries || []);
      setTotalResults(results.total || 0);

      if (!results.itemSummaries || results.itemSummaries.length === 0) {
        toast({
          title: 'No results',
          description: `No listings found for "${query}"`,
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to search eBay';
      
      // Check for rate limit error
      if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        setError('Rate limit exceeded. Please wait before making more requests.');
      } else {
        setError(errorMessage);
      }
      
      toast({
        title: 'Search failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [sort, toast]);

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    if (currentQuery) {
      handleSearch(currentQuery, newSort);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">eBay Scraper</h1>
              <p className="text-xs text-muted-foreground">Search and analyze eBay listings</p>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs">
                <Shield className="h-3 w-3" />
                Rate Limited
              </Badge>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-success" />
                <span>API Connected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3">
              <span className="gradient-text">Scrape eBay</span> Listings
            </h2>
            <p className="text-muted-foreground text-lg">
              Search millions of products and analyze market trends in real-time
            </p>
          </div>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} isThrottled={isThrottled} />
          <p className="text-center text-xs text-muted-foreground mt-3">
            <Shield className="inline h-3 w-3 mr-1" />
            Rate limited: 30 requests per minute • Max 50 results per search
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {isLoading ? (
          <div className="max-w-4xl mx-auto">
            <LoadingSkeleton />
          </div>
        ) : hasSearched && items.length > 0 ? (
          <div className="max-w-4xl mx-auto">
            <StatsBar items={items} />
            <SearchFilters
              sort={sort}
              onSortChange={handleSortChange}
              totalResults={totalResults}
            />
            <div className="space-y-4">
              {items.map((item, index) => (
                <ListingCard key={item.itemId} item={item} index={index} />
              ))}
            </div>
          </div>
        ) : hasSearched && items.length === 0 ? (
          <EmptyState type="no-results" query={currentQuery} />
        ) : (
          <EmptyState type="initial" />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Powered by eBay Browse API • Data refreshed in real-time</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
