import { Search, PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  type: 'initial' | 'no-results';
  query?: string;
}

export function EmptyState({ type, query }: EmptyStateProps) {
  if (type === 'initial') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Search className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Start Searching</h2>
        <p className="text-muted-foreground max-w-md">
          Enter a search term above to find listings from eBay. You can search for products, brands, categories, and more.
        </p>
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {['iPhone 15 Pro', 'Nike Air Max', 'Pokemon Cards', 'MacBook Pro', 'Vintage Watch'].map((term) => (
            <span key={term} className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground">
              {term}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <PackageOpen className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
      <p className="text-muted-foreground max-w-md">
        No listings found for "<span className="text-primary font-medium">{query}</span>". Try adjusting your search terms or check for typos.
      </p>
    </div>
  );
}
