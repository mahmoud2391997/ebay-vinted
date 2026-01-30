
import { supabase } from '@/integrations/supabase/client';

export interface EbayItem {
  itemId: string;
  title: string;
  image?: {
    imageUrl: string;
  };
  price: {
    value: string;
    currency: string;
  };
  condition?: string;
  seller?: {
    username: string;
    feedbackPercentage?: string;
    feedbackScore?: number;
  };
  itemWebUrl: string;
  shippingOptions?: Array<{
    shippingCostType: string;
    shippingCost?: {
      value: string;
      currency: string;
    };
  }>;
  categories?: Array<{
    categoryId: string;
    categoryName: string;
  }>;
  itemLocation?: {
    country: string;
    postalCode?: string;
  };
  buyingOptions?: string[];
}

export interface SearchResponse {
  total: number;
  limit: number;
  offset: number;
  itemSummaries?: EbayItem[];
  error?: string;
}

export interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
  sort?: 'price' | '-price' | 'newlyListed' | 'endingSoonest';
  filter?: string;
}

export async function searchEbay(params: SearchParams): Promise<SearchResponse> {
    const { data, error } = await supabase.functions.invoke('ebay-search', {
        body: params,
        responseType: 'text' 
    });

    if (error) {
        console.error('eBay search function invocation error:', error);
        throw new Error(error.message || 'Failed to invoke eBay search function');
    }

    try {
        return JSON.parse(data);
    } catch (e) {
        console.error('Failed to parse response from eBay search function. Response:', data);
        if (typeof data === 'string' && data.toLowerCase().includes('not found')) {
            throw new Error('The eBay search service is currently unavailable (Not Found). The Supabase function may not be deployed correctly.');
        }
        const responseHint = typeof data === 'string' ? data.substring(0, 200) : 'Non-string response';
        throw new Error(`Received an invalid response from the eBay search service. The service may be down or misconfigured. Response start: "${responseHint}"`);
    }
}

export function formatPrice(price: { value: string; currency: string }): string {
  const value = parseFloat(price.value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: price.currency || 'USD',
  }).format(value);
}

export function getShippingInfo(item: EbayItem): string {
  if (!item.shippingOptions || item.shippingOptions.length === 0) {
    return 'Shipping not specified';
  }

  const shipping = item.shippingOptions[0];
  
  if (shipping.shippingCostType === 'FIXED') {
    if (shipping.shippingCost) {
      const cost = parseFloat(shipping.shippingCost.value);
      if (cost === 0) {
        return 'Free shipping';
      }
      return formatPrice(shipping.shippingCost);
    }
  }
  
  if (shipping.shippingCostType === 'FREE') {
    return 'Free shipping';
  }

  return 'Calculated shipping';
}
