
interface EbayItem {
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

interface SearchResponse {
  total: number;
  limit: number;
  offset: number;
  itemSummaries?: EbayItem[];
  error?: string;
}

interface SearchParams {
  query: string;
  limit?: number;
  offset?: number;
  sort?: 'price' | '-price' | 'newlyListed' | 'endingSoonest';
  filter?: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

const getApiUrl = (path: string) => {
  if (import.meta.env.PROD) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("VITE_SUPABASE_URL not configured in production environment");
    }
    return `${supabaseUrl}/functions/v1/ebay-proxy${path}`;
  } else {
    return `/api${path}`;
  }
};

async function getApplicationToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const appId = import.meta.env.VITE_EBAY_APP_ID;
  const certId = import.meta.env.VITE_EBAY_CERT_ID;

  if (!appId || !certId) {
    throw new Error('eBay credentials not configured in .env file');
  }

  const credentials = btoa(`${appId}:${certId}`);
  const url = getApiUrl('/ebay/identity/v1/oauth2/token');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get OAuth token: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function searchEbay(params: SearchParams): Promise<SearchResponse> {
    try {
        const token = await getApplicationToken();
        const { query, limit = 50, offset = 0, sort, filter } = params;

        const searchParams = new URLSearchParams({
            q: query,
            limit: limit.toString(),
            offset: offset.toString(),
        });

        if (sort) {
            searchParams.set('sort', sort);
        }

        if (filter) {
            searchParams.set('filter', filter);
        }

        const url = getApiUrl(`/ebay/buy/browse/v1/item_summary/search?${searchParams.toString()}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
                'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country%3DUS',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('eBay search failed:', errorText);
            throw new Error(`eBay search failed: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('eBay search function error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to perform eBay search';
        return { total: 0, limit: 0, offset: 0, error: errorMessage };
    }
}

export async function searchEbaySold(params: SearchParams): Promise<SearchResponse> {
    try {
        const appId = import.meta.env.VITE_EBAY_APP_ID;
        if (!appId) {
            throw new Error('eBay App ID not configured');
        }

        const { query, limit = 50, offset = 0 } = params;

        const searchParams = new URLSearchParams({
            'OPERATION-NAME': 'findCompletedItems',
            'SERVICE-VERSION': '1.0.0',
            'SECURITY-APPNAME': appId,
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': '',
            'keywords': query,
            'paginationInput.entriesPerPage': limit.toString(),
            'paginationInput.pageNumber': (Math.floor(offset / limit) + 1).toString(),
            'itemFilter(0).name': 'SoldItemsOnly',
            'itemFilter(0).value': 'true',
        });

        const url = getApiUrl(`/ebay-finding/services/search/FindingService/v1?${searchParams.toString()}`);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch from eBay Finding API: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        const searchResult = data.findCompletedItemsResponse[0].searchResult[0];
        const items = searchResult.item || [];

        const transformedItems = items.map((item: any) => ({
            itemId: item.itemId[0],
            title: item.title[0],
            image: { imageUrl: item.galleryURL?.[0] || '' },
            price: {
                value: item.sellingStatus[0].currentPrice[0].__value__,
                currency: item.sellingStatus[0].currentPrice[0]['@currencyId'],
            },
            itemWebUrl: item.viewItemURL[0],
            condition: item.condition?.[0].conditionDisplayName[0],
        }));

        return {
            total: parseInt(searchResult["@count"]),
            limit,
            offset,
            itemSummaries: transformedItems,
        };

    } catch (error) {
        console.error('eBay sold search function error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to perform eBay sold search';
        return { total: 0, limit: 0, offset: 0, error: errorMessage };
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
