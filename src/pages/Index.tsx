import { useState } from 'react';
import { ShoppingBag, Zap, AlertCircle } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { ListingCard } from '@/components/ListingCard';
import { SearchFilters } from '@/components/SearchFilters';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { StatsBar } from '@/components/StatsBar';
import { searchEbay, EbayItem } from '@/lib/api/ebay';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const [items, setItems] = useState<EbayItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [sort, setSort] = useState('newlyListed');
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (query: string, selectedSort?: string) => {
    setIsLoading(true);
    setHasSearched(true);
    setCurrentQuery(query);
    setError(null);

    try {
      const results = await searchEbay({
        query,
        limit: 50,
        sort: (selectedSort || sort) as any,
      });

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
      setError(errorMessage);
      toast({
        title: 'Search failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-success" />
              <span>API Connected</span>
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
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
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
