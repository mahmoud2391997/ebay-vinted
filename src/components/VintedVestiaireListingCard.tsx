import { ExternalLink, Tag, Ruler, Building } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface VintedVestiaireItem {
  Title: string;
  Price: string;
  Brand: string;
  Size: string;
  Image: string;
  Link: string;
}

interface VintedVestiaireListingCardProps {
  item: VintedVestiaireItem;
  index: number;
  platform: 'Vinted' | 'Vestiaire';
}

export function VintedVestiaireListingCard({ item, index, platform }: VintedVestiaireListingCardProps) {
  return (
    <Card 
      className="glass-panel overflow-hidden group hover:border-primary/30 transition-all duration-300 hover:scale-[1.01] opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {item.Image ? (
            <img
              src={item.Image}
              alt={item.Title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title */}
          <h3 className="font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {item.Title}
          </h3>

          {/* Brand & Size */}
          <div className="flex flex-wrap gap-2 mb-2">
            {item.Brand && item.Brand !== 'N/A' && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Building className="h-3 w-3" />
                {item.Brand}
              </Badge>
            )}
            {item.Size && item.Size !== 'N/A' && (
              <Badge variant="outline" className="text-xs text-muted-foreground flex items-center gap-1">
                <Ruler className="h-3 w-3" />
                {item.Size}
              </Badge>
            )}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 min-w-[140px]">
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text">
              {item.Price}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => window.open(item.Link, '_blank')}
          >
            View on {platform}
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
