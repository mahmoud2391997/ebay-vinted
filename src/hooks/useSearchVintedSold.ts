import { useState, useCallback } from 'react';
import { searchVintedSold } from '@/lib/api/fashion';
import { useToast } from '@/hooks/use-toast';

interface SearchOptions {
  page?: number;
  itemsPerPage?: number;
  maxPrice?: number;
  country?: string;
}

interface UseSearchVintedSoldReturn {
  searchSoldItems: (query: string, options?: SearchOptions) => Promise<any>;
  isLoading: boolean;
  error: string | null;
}

export const useSearchVintedSold = (): UseSearchVintedSoldReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const searchSoldItems = useCallback(async (query: string, options: SearchOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await searchVintedSold(query, options);
      
      if (!results.success) {
        const errorMessage = results.error || 'Failed to fetch sold items from Vinted';
        setError(errorMessage);
        toast({ 
          title: 'Vinted Sold Items Search Failed', 
          description: errorMessage, 
          variant: 'destructive' 
        });
        return { success: false, error: errorMessage };
      }

      if (results.data.length === 0) {
        toast({ 
          title: 'No sold results', 
          description: `No sold listings found for "${query}"` 
        });
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ 
        title: 'Search Failed', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    searchSoldItems,
    isLoading,
    error
  };
};
