
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface SearchFiltersProps {
  totalResults: number;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  maxPrice?: number;
  onMaxPriceChange: (value: number | undefined) => void;
  minPrice?: number;
  onMinPriceChange: (value: number | undefined) => void;
  onApplyPriceChange: () => void;
  country: string;
  onCountryChange: (value: string) => void;
  platform: string;
  showSold: boolean;
  onShowSoldChange: (checked: boolean) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  totalResults,
  itemsPerPage,
  onItemsPerPageChange,
  maxPrice,
  onMaxPriceChange,
  minPrice,
  onMinPriceChange,
  onApplyPriceChange,
  country,
  onCountryChange,
  platform,
  showSold,
  onShowSoldChange
}) => {
  return (
    <div className="mt-6 p-4 border rounded-lg bg-background/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Results per page</Label>
          <Select value={String(itemsPerPage)} onValueChange={(val) => onItemsPerPageChange(Number(val))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map(val => (
                <SelectItem key={val} value={String(val)}>{val}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{totalResults} total results</p>
        </div>

        <div className="space-y-2">
          <Label>Price Range</Label>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              placeholder="Min" 
              value={minPrice ?? ''} 
              onChange={(e) => onMinPriceChange(e.target.value ? Number(e.target.value) : undefined)} 
            />
            <span>-</span>
            <Input 
              type="number" 
              placeholder="Max" 
              value={maxPrice ?? ''} 
              onChange={(e) => onMaxPriceChange(e.target.value ? Number(e.target.value) : undefined)} 
            />
            <Button onClick={onApplyPriceChange} size="sm">Apply</Button>
          </div>
        </div>
        
        {platform === 'vinted' && (
          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={country} onValueChange={onCountryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">France</SelectItem>
                <SelectItem value="es">Spain</SelectItem>
                <SelectItem value="it">Italy</SelectItem>
                <SelectItem value="de">Germany</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="us">United States</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-sold" 
                  checked={showSold} 
                  onCheckedChange={onShowSoldChange}
                  disabled={platform === 'vinted'}
                />
                <Label htmlFor="show-sold" className={`cursor-pointer ${platform === 'vinted' ? 'text-muted-foreground' : ''}`}>
                  Show sold items
                </Label>
              </div>
              {platform === 'vinted' && (
                <p className="text-xs text-muted-foreground">Sold items not available for Vinted</p>
              )}
      </div>
    </div>
  );
};
