import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface SearchFiltersProps {
  totalResults: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  maxPrice: number | undefined;
  onMaxPriceChange: (value: number | undefined) => void;
  country: string;
  onCountryChange: (value: string) => void;
  onApplyPriceChange: () => void;
}

export function SearchFilters({
  totalResults,
  itemsPerPage,
  onItemsPerPageChange,
  maxPrice,
  onMaxPriceChange,
  country,
  onCountryChange,
  onApplyPriceChange,
}: SearchFiltersProps) {
  return (
    <div className="flex items-center justify-between glass-panel p-4 mb-6">
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">Found</span>
        <span className="font-mono text-lg font-semibold text-primary">
          {totalResults.toLocaleString()}
        </span>
        <span className="text-muted-foreground">listings</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <Label>Country</Label>
            <Select value={country} onValueChange={onCountryChange}>
                <SelectTrigger className="w-[100px] bg-secondary/50 border-border/50">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="fr">France</SelectItem>
                    <SelectItem value="es">Spain</SelectItem>
                    <SelectItem value="it">Italy</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="uk">UK</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center gap-2">
            <Label htmlFor="maxPrice">Max Price</Label>
            <Input
            id="maxPrice"
            type="number"
            value={maxPrice || ''}
            onChange={(e) => onMaxPriceChange(e.target.value ? Number(e.target.value) : undefined)}
            className="w-[100px] bg-secondary/50 border-border/50"
            placeholder="e.g., 500"
            />
            <Button onClick={onApplyPriceChange} size="sm">Apply</Button>
        </div>
        <div className="flex items-center gap-2">
            <Label>Per Page</Label>
            <Select value={String(itemsPerPage)} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
                <SelectTrigger className="w-[80px] bg-secondary/50 border-border/50">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
    </div>
  );
}