import { useState, useRef } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  isThrottled?: boolean;
}

const MAX_QUERY_LENGTH = 200;
const MIN_SEARCH_INTERVAL = 1000; // 1 second between searches

export function SearchBar({ onSearch, isLoading, isThrottled }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const lastSearchTime = useRef<number>(0);

  const validateQuery = (q: string): string | null => {
    if (q.length > MAX_QUERY_LENGTH) {
      return `Query must be less than ${MAX_QUERY_LENGTH} characters`;
    }
    if (/[<>{}]/.test(q)) {
      return 'Query contains invalid characters';
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    const validationError = validateQuery(value);
    setError(validationError);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Client-side throttling
    const now = Date.now();
    if (now - lastSearchTime.current < MIN_SEARCH_INTERVAL) {
      setError('Please wait a moment before searching again');
      return;
    }

    const validationError = validateQuery(trimmedQuery);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    lastSearchTime.current = now;
    onSearch(trimmedQuery);
  };

  const isDisabled = isLoading || isThrottled || !query.trim() || !!error;
  const charCount = query.length;
  const isNearLimit = charCount > MAX_QUERY_LENGTH * 0.8;

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search eBay listings... (e.g., iPhone 15 Pro, Nike Air Max, Vintage Watch)"
            value={query}
            onChange={handleChange}
            maxLength={MAX_QUERY_LENGTH + 10}
            className={`pl-12 pr-16 h-14 text-lg bg-secondary/50 border-border/50 focus:border-primary focus:ring-primary/20 placeholder:text-muted-foreground/60 ${error ? 'border-destructive focus:border-destructive' : ''}`}
          />
          {isNearLimit && (
            <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono ${charCount > MAX_QUERY_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
              {charCount}/{MAX_QUERY_LENGTH}
            </span>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isDisabled}
          className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground glow-effect transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Searching...
            </>
          ) : isThrottled ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Wait...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Search
            </>
          )}
        </Button>
      </div>
      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}
