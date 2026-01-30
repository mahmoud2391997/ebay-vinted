
import { ExternalLink, Tag, Ruler, Building } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  isSold?: boolean;
}

export function VintedVestiaireListingCard({ item, index, platform, isSold }: VintedVestiaireListingCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card 
      className={`glass-panel overflow-hidden group transition-all duration-300 opacity-0 animate-fade-in ${!isSold && 'hover:border-primary/30 hover:scale-[1.01]'}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 p-4`}>
        {/* Image */}
        <div className={`relative ${isMobile ? 'w-full h-48' : 'w-32 h-32'} flex-shrink-0 rounded-lg overflow-hidden bg-muted`}>
          {item.Image ? (
            <img
              src={item.Image}
              alt={item.Title}
              className={`w-full h-full object-cover transition-transform duration-300 ${!isSold && 'group-hover:scale-105'}`}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
          {isSold && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
              Sold
            </Badge>
          )}
        </div>

        {/* Content & Price Wrapper */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Top Info */}
            <div>
                <h3 className={`font-medium text-foreground line-clamp-2 mb-2 ${!isSold && 'group-hover:text-primary'} transition-colors`}>
                    {item.Title}
                </h3>
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
            <div className={`flex ${isMobile ? 'w-full flex-row justify-between items-end mt-4' : 'flex-col items-end'}`}>
                 <div className={isMobile ? 'text-left' : 'text-right'}>
                    <p className={`text-2xl font-bold ${isSold ? 'text-muted-foreground' : 'gradient-text'}`}>
                      {item.Price}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className={`${isMobile ? '' : 'mt-2'} ${!isSold && 'hover:bg-primary hover:text-primary-foreground hover:border-primary'} transition-all`}
                    onClick={() => window.open(item.Link, '_blank')}
                >
                    View on {platform}
                    <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
            </div>
        </div>
      </div>
    </Card>
  );
}
