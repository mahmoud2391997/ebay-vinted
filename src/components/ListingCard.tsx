import { ExternalLink, MapPin, Star, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EbayItem, formatPrice, getShippingInfo } from '@/lib/api/ebay';

interface ListingCardProps {
  item: EbayItem;
  index: number;
}

export function ListingCard({ item, index }: ListingCardProps) {
  const shippingInfo = getShippingInfo(item);
  const isFreeShipping = shippingInfo.toLowerCase().includes('free');
  const isAuction = item.buyingOptions?.includes('AUCTION');

  return (
    <Card 
      className="glass-panel overflow-hidden group hover:border-primary/30 transition-all duration-300 hover:scale-[1.01] opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {item.image?.imageUrl ? (
            <img
              src={item.image.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/50" />
            </div>
          )}
          {isAuction && (
            <Badge className="absolute top-2 left-2 bg-info text-info-foreground text-xs">
              Auction
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title */}
          <h3 className="font-medium text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>

          {/* Condition & Category */}
          <div className="flex flex-wrap gap-2 mb-2">
            {item.condition && (
              <Badge variant="secondary" className="text-xs">
                {item.condition}
              </Badge>
            )}
            {item.categories?.[0] && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {item.categories[0].categoryName}
              </Badge>
            )}
          </div>

          {/* Location */}
          {item.itemLocation && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <MapPin className="h-3 w-3" />
              <span>{item.itemLocation.country}</span>
            </div>
          )}

          {/* Seller Info */}
          {item.seller && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{item.seller.username}</span>
              {item.seller.feedbackPercentage && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-primary fill-primary" />
                  {item.seller.feedbackPercentage}%
                </span>
              )}
              {item.seller.feedbackScore !== undefined && (
                <span className="text-muted-foreground/60">
                  ({item.seller.feedbackScore.toLocaleString()} reviews)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price & Actions */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 min-w-[140px]">
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text">
              {formatPrice(item.price)}
            </p>
            <p className={`text-sm ${isFreeShipping ? 'text-success font-medium' : 'text-muted-foreground'}`}>
              {shippingInfo}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
            onClick={() => window.open(item.itemWebUrl, '_blank')}
          >
            View on eBay
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
