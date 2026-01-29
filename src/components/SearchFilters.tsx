import { ArrowUpDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchFiltersProps {
  sort: string;
  onSortChange: (sort: string) => void;
  totalResults: number;
}

export function SearchFilters({ sort, onSortChange, totalResults }: SearchFiltersProps) {
  return (
    <div className="flex items-center justify-between glass-panel p-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">Found</span>
        <span className="font-mono text-lg font-semibold text-primary">
          {totalResults.toLocaleString()}
        </span>
        <span className="text-muted-foreground">listings</span>
      </div>

      <div className="flex items-center gap-3">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[200px] bg-secondary/50 border-border/50">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newlyListed">Newly Listed</SelectItem>
            <SelectItem value="price">Price: Low to High</SelectItem>
            <SelectItem value="-price">Price: High to Low</SelectItem>
            <SelectItem value="endingSoonest">Ending Soonest</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
