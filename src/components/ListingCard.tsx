import {
  ExternalLink,
  Tag,
  Star,
  ThumbsUp,
  MessageCircle,
  Truck,
  Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EbayItem, formatPrice, getShippingInfo } from '@/lib/api/ebay';
import { useIsMobile } from '@/hooks/use-mobile';

interface ListingCardProps {
  item: EbayItem;
  index: number;
  isSold?: boolean;
}

export function ListingCard({ item, index, isSold }: ListingCardProps) {
  const isMobile = useIsMobile();
  const shippingInfo = getShippingInfo(item);

  return (
    <Card
      className={`glass-panel overflow-hidden group transition-all duration-300 opacity-0 animate-fade-in ${!isSold && 'hover:border-primary/30 hover:scale-[1.01]'}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-4 p-4`}>
        {/* Image */}
        <div className={`relative ${isMobile ? 'w-full h-48' : 'w-32 h-32'} flex-shrink-0 rounded-lg overflow-hidden bg-muted`}>
          {item.image ? (
            <img
              src={item.image.imageUrl}
              alt={item.title}
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
              {item.title}
            </h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {item.condition && (
                <Badge variant="secondary" className="text-xs">{item.condition}</Badge>
              )}
              {item.categories?.map(cat => (
                <Badge key={cat.categoryId} variant="outline" className="text-xs text-muted-foreground">{cat.categoryName}</Badge>
              ))?.slice(0, 2) || null}
            </div>
          </div>

          {/* Seller Info */}
          {item.seller && (
            <div className="text-xs text-muted-foreground flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>{item.seller.username}</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                <span>{item.seller.feedbackPercentage}%</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span>({item.seller.feedbackScore})</span>
              </div>
            </div>
          )}

          {/* Price & Actions */}
          <div className={`flex ${isMobile ? 'w-full flex-row justify-between items-end mt-4' : 'flex-col items-end'}`}>
            <div className={isMobile ? 'text-left' : 'text-right'}>
              <p className={`text-2xl font-bold ${isSold ? 'text-muted-foreground' : 'gradient-text'}`}>{formatPrice(item.price)}</p>
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                    {shippingInfo.toLowerCase().includes('free') ? <Truck className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    <span>{shippingInfo}</span>
                </div>
                {item.itemLocation && (
                    <div className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        <span>{item.itemLocation.country}</span>
                    </div>
                )}
               </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`${isMobile ? '' : 'mt-2'} ${!isSold && 'hover:bg-primary hover:text-primary-foreground hover:border-primary'} transition-all`}
              onClick={() => window.open(item.itemWebUrl, '_blank')}
              disabled={isSold}
            >
              View on eBay
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
