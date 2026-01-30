import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EbayItem } from '@/lib/api/ebay';
import {
  Star,
  ThumbsUp,
  MessageCircle,
  MapPin,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListingCardProps {
  item: EbayItem;
  index: number;
  isSold: boolean;
}

export function ListingCard({ item, isSold }: ListingCardProps) {
  const imageUrl = item.image?.imageUrl;
  const price = item.price.value;
  const currency = item.price.currency;
  const shippingCost = item.shippingOptions?.[0]?.shippingCostType === 'CALCULATED' ? 'Calculated' : item.shippingOptions?.[0]?.shippingCost?.value ? `+$${item.shippingOptions[0].shippingCost.value}` : 'Free';

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row p-4 gap-4">
      {imageUrl && (
        <div className="relative w-full md:w-48 flex-shrink-0">
          <img
            src={imageUrl}
            alt={item.title}
            className="w-full h-48 object-cover rounded-lg"
          />
          {isSold && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
              Sold
            </Badge>
          )}
        </div>
      )}
      <div className="flex flex-col flex-grow">
        <CardHeader className="p-0">
          <a href={item.itemWebUrl} target="_blank" rel="noopener noreferrer">
            <CardTitle className="text-lg font-semibold hover:text-primary transition-colors">
              {item.title}
            </CardTitle>
          </a>
        </CardHeader>
        <CardContent className="p-0 mt-2 flex-grow">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(price))}
            </p>
            {!isSold && <p className="text-sm text-muted-foreground">{shippingCost} shipping</p>}
          </div>

          <div className="text-sm text-muted-foreground mt-2">
            <p><strong>Condition:</strong> {item.condition}</p>
            {item.itemLocation && <p className="flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {item.itemLocation.country}</p>}
          </div>

          {item.seller && (
            <div className="text-xs text-muted-foreground flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
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
        </CardContent>
        <CardFooter className="p-0 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
            <div className="flex flex-wrap gap-2">
              {item.categories && item.categories.length > 0 && (
                <Badge variant="outline">{item.categories[0].categoryName}</Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`${!isSold && 'hover:bg-primary hover:text-primary-foreground hover:border-primary'} transition-all`}
              onClick={() => window.open(item.itemWebUrl, '_blank')}
            >
              View on eBay
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
