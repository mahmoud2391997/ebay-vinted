
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

interface SearchCache {
  data: SearchResponse;
  timestamp: number;
}

let tokenCache: TokenCache | null = null;
const searchCache = new Map<string, SearchCache>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Rate limiting
let lastApiCall = 0;
const MIN_API_INTERVAL = 1000; // 1 second between calls

// Clean up expired cache entries periodically
function cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of searchCache.entries()) {
        if (now - entry.timestamp > CACHE_DURATION) {
            searchCache.delete(key);
        }
    }
}

// Clean up cache every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

const getApiUrl = (path: string) => {
  return `/api${path}`;
};

async function getApplicationToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const url = getApiUrl('/ebay/identity/v1/oauth2/token');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
        const { query, limit = 50, offset = 0, sort, filter } = params;

        console.log('searchEbay called with params:', params);

        // Validate query parameter
        if (!query || query.trim() === '') {
            console.log('Empty query detected, returning error');
            return { 
                total: 0, 
                limit: 0, 
                offset: 0, 
                error: 'Search query is required' 
            };
        }

        const token = await getApplicationToken();

        const trimmedQuery = query.trim();
        const searchParams = new URLSearchParams({
            q: trimmedQuery,
            limit: limit.toString(),
            offset: offset.toString(),
        });

        if (sort) {
            searchParams.set('sort', sort);
        }

        if (filter) {
            searchParams.set('filter', filter);
        }

        const url = `${getApiUrl('/ebay/buy/browse/v1/item_summary/search')}?${searchParams.toString()}`;
        console.log('Making request to:', url);

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
        const { query, limit = 50, offset = 0 } = params;

        // Validate query parameter
        if (!query || query.trim() === '') {
            return { 
                total: 0, 
                limit: 0, 
                offset: 0, 
                error: 'Search query is required' 
            };
        }

        // Create cache key
        const cacheKey = `sold_${JSON.stringify(params)}`;
        
        // Check cache first
        const cached = searchCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Returning cached eBay sold results');
            return cached.data;
        }

        // Rate limiting - wait minimum interval between calls
        const now = Date.now();
        const timeSinceLastCall = now - lastApiCall;
        if (timeSinceLastCall < MIN_API_INTERVAL) {
            const delay = MIN_API_INTERVAL - timeSinceLastCall;
            console.log(`Rate limiting: waiting ${delay}ms before API call`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        lastApiCall = Date.now();

        const searchParams = new URLSearchParams({
            'OPERATION-NAME': 'findCompletedItems',
            'SERVICE-VERSION': '1.0.0',
            'RESPONSE-DATA-FORMAT': 'JSON',
            'REST-PAYLOAD': '',
            'keywords': query.trim(),
            'paginationInput.entriesPerPage': limit.toString(),
            'paginationInput.pageNumber': (Math.floor(offset / limit) + 1).toString(),
            'itemFilter(0).name': 'SoldItemsOnly',
            'itemFilter(0).value': 'true',
        });

        const url = `${getApiUrl('/finding')}?${searchParams.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("eBay Finding API Error:", errorText);
            let friendlyMessage = `Failed to fetch from eBay Finding API: ${response.status}`;
            
            // Handle CORS errors specifically
            if (errorText.includes('CORS') || errorText.includes('cross-origin')) {
                friendlyMessage = "CORS error: Cannot call eBay API directly from browser. You need a server-side proxy or use a browser extension to bypass CORS.";
            }
            
            try {
                const errorPayload = JSON.parse(errorText);
                const firstError = errorPayload?.errorMessage?.[0]?.error?.[0];
                if (firstError?.message?.[0]) {
                    if (firstError.errorId?.[0] === "10001") {
                        friendlyMessage = "You have exceeded the daily limit for searching sold items on eBay's Finding API. Please try again tomorrow or use active listings instead.";
                    } else {
                        friendlyMessage = firstError.message[0];
                    }
                }
            } catch (e) {}
            return { total: 0, limit: 0, offset: 0, error: friendlyMessage };
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

        const result = {
            total: parseInt(searchResult["@count"]),
            limit,
            offset,
            itemSummaries: transformedItems,
        };

        // Cache the result
        searchCache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        return result;

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
