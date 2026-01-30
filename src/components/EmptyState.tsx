import { Search, PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  type: 'initial' | 'no-results';
  query?: string;
  onSearch?: (query: string) => void;
  initialSearchTerms?: string[];
}

export function EmptyState({ type, query, onSearch, initialSearchTerms = [] }: EmptyStateProps) {
  if (type === 'initial') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Search className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Start Searching</h2>
        <p className="text-muted-foreground max-w-md">
          Enter a search term above to find listings from eBay and Vinted. You can also click on the suggestions below.
        </p>
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {initialSearchTerms.map((term) => (
            <button
              key={term}
              className="px-3 py-1 rounded-full bg-secondary text-sm text-muted-foreground hover:bg-secondary/80 transition-colors"
              onClick={() => onSearch?.(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <PackageOpen className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
      <p className="text-muted-foreground max-w-md">
        Your search for <span className="font-semibold text-primary">\"{query}\"</span> did not return any results. Try a different search term.
      </p>
    </div>
  );
}
