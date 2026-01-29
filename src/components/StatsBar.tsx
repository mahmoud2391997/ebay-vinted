import { TrendingUp, DollarSign, Package, Clock } from 'lucide-react';
import { EbayItem, formatPrice } from '@/lib/api/ebay';

interface StatsBarProps {
  items: EbayItem[];
}

export function StatsBar({ items }: StatsBarProps) {
  if (items.length === 0) return null;

  const prices = items.map(item => parseFloat(item.price.value)).filter(p => !isNaN(p));
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const freeShippingCount = items.filter(item => 
    item.shippingOptions?.some(opt => 
      opt.shippingCostType === 'FREE' || 
      (opt.shippingCost && parseFloat(opt.shippingCost.value) === 0)
    )
  ).length;

  const stats = [
    {
      icon: TrendingUp,
      label: 'Avg Price',
      value: formatPrice({ value: avgPrice.toFixed(2), currency: 'USD' }),
      color: 'text-primary',
    },
    {
      icon: DollarSign,
      label: 'Price Range',
      value: `${formatPrice({ value: minPrice.toFixed(2), currency: 'USD' })} - ${formatPrice({ value: maxPrice.toFixed(2), currency: 'USD' })}`,
      color: 'text-info',
    },
    {
      icon: Package,
      label: 'Free Shipping',
      value: `${freeShippingCount} listings`,
      color: 'text-success',
    },
    {
      icon: Clock,
      label: 'Showing',
      value: `${items.length} results`,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="glass-panel p-4 opacity-0 animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-semibold text-sm">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
