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
  soldItemsOnly?: boolean;
}

// Browser-compatible eBay API client
class EbayBrowserClient {
  private appId: string;
  private certId: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private proxyUrl: string;

  constructor(appId: string, certId: string, proxyUrl: string = 'https://ebay.hendt.workers.dev/') {
    this.appId = appId;
    this.certId = certId;
    this.proxyUrl = proxyUrl;
  }

  private async getAuthToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch(`${this.proxyUrl}identity/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.appId}:${this.certId}`)}`,
        },
        body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
      });

      if (!response.ok) {
        throw new Error(`Failed to get auth token: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
      
      return this.token;
    } catch (error) {
      console.error('Auth token error:', error);
      throw error;
    }
  }

  async searchBuyApi(params: any): Promise<any> {
    const token = await this.getAuthToken();
    
    const searchParams = new URLSearchParams({
      q: params.q,
      limit: params.limit?.toString() || '50',
      offset: params.offset?.toString() || '0',
    });

    if (params.sort) {
      searchParams.set('sort', params.sort);
    }

    if (params.filter) {
      searchParams.set('filter', params.filter);
    }

    const response = await fetch(`${this.proxyUrl}buy/browse/v1/item_summary/search?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country%3DUS',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Buy API search failed: ${response.status}`);
    }

    return response.json();
  }

  async searchFindingApi(params: any): Promise<any> {
    const findingParams = new URLSearchParams({
      'OPERATION-NAME': 'findCompletedItems',
      'SERVICE-VERSION': '1.0.0',
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': params.keywords,
      'paginationInput.entriesPerPage': params.paginationInput.entriesPerPage.toString(),
      'paginationInput.pageNumber': params.paginationInput.pageNumber.toString(),
      'itemFilter(0).name': 'SoldItemsOnly',
      'itemFilter(0).value': 'true',
    });

    const response = await fetch(`${this.proxyUrl}finding?${findingParams.toString()}`, {
      headers: {
        'X-EBAY-SOA-SECURITY-APPNAME': this.appId,
        'X-EBAY-SOA-OPERATION-NAME': 'findCompletedItems',
        'X-EBAY-SOA-SERVICE-VERSION': '1.13.0',
        'X-EBAY-SOA-REQUEST-DATA-FORMAT': 'JSON',
        'X-EBAY-SOA-GLOBAL-ID': 'EBAY-US',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Finding API search failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }
}

// Initialize eBay client
const eBayClient = new EbayBrowserClient(
  import.meta.env.VITE_EBAY_APP_ID || '',
  import.meta.env.VITE_EBAY_CERT_ID || '',
  import.meta.env.VITE_EBAY_PROXY_URL || 'https://ebay.hendt.workers.dev/'
);

export async function searchEbaySDK(params: SearchParams): Promise<SearchResponse> {
  try {
    const { query, limit = 50, offset = 0, sort, filter, soldItemsOnly } = params;

    console.log('eBay browser client search called with params:', params);

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

    const trimmedQuery = query.trim();

    if (soldItemsOnly) {
      // Use Finding API for sold items
      return await searchEbaySoldSDK(params);
    }

    // Use Buy API for regular search
    const searchParams: any = {
      q: trimmedQuery,
      limit: limit,
      offset: offset,
    };

    if (sort) {
      searchParams.sort = sort;
    }

    if (filter) {
      searchParams.filter = filter;
    }

    console.log('Making eBay browser client request to Buy API:', searchParams);

    const response = await eBayClient.searchBuyApi(searchParams);
    
    console.log('eBay browser client response:', response);

    // Transform response to match our interface
    const transformedItems = response.itemSummaries?.map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      image: item.image ? { imageUrl: item.image.imageUrl } : undefined,
      price: {
        value: item.price.value,
        currency: item.price.currency,
      },
      condition: item.condition,
      seller: item.seller ? {
        username: item.seller.username,
        feedbackPercentage: item.seller.feedbackPercentage,
        feedbackScore: item.seller.feedbackScore,
      } : undefined,
      itemWebUrl: item.itemWebUrl,
      shippingOptions: item.shippingOptions,
      categories: item.categories,
      itemLocation: item.itemLocation,
      buyingOptions: item.buyingOptions,
    })) || [];

    return {
      total: response.total || 0,
      limit: limit,
      offset: offset,
      itemSummaries: transformedItems,
    };

  } catch (error) {
    console.error('eBay browser client search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform eBay search';
    return { total: 0, limit: 0, offset: 0, error: errorMessage };
  }
}

export async function searchEbaySoldSDK(params: SearchParams): Promise<SearchResponse> {
  try {
    const { query, limit = 50, offset = 0 } = params;

    console.log('eBay browser client sold items search for:', query);

    // Use Finding API for sold items
    const findingParams = {
      keywords: query.trim(),
      paginationInput: {
        entriesPerPage: limit,
        pageNumber: Math.floor(offset / limit) + 1,
      },
    };

    console.log('Making eBay browser client request to Finding API:', findingParams);

    const response = await eBayClient.searchFindingApi(findingParams);
    
    console.log('eBay browser client Finding API response:', response);

    // Transform Finding API response to match our interface
    const items = response.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item || [];
    
    const transformedItems = items.map((item: any) => ({
      itemId: item.itemId?.[0] || item.itemId,
      title: item.title?.[0] || item.title || '',
      image: item.galleryURL?.[0] ? { imageUrl: item.galleryURL[0] } : undefined,
      price: {
        value: item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || '0',
        currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || 'USD',
      },
      itemWebUrl: item.viewItemURL?.[0] || item.viewItemURL || '',
      condition: item.condition?.[0]?.conditionDisplayName?.[0],
      seller: item.sellerInfo?.[0] ? {
        username: item.sellerInfo[0]?.sellerUserName?.[0] || '',
        feedbackScore: item.sellerInfo[0]?.feedbackScore?.[0] ? parseInt(item.sellerInfo[0].feedbackScore[0]) : undefined,
        feedbackPercentage: item.sellerInfo[0]?.positiveFeedbackPercent?.[0],
      } : undefined,
      categories: item.primaryCategory?.[0] ? [{
        categoryId: item.primaryCategory[0]?.categoryId?.[0] || '',
        categoryName: item.primaryCategory[0]?.categoryName?.[0] || '',
      }] : undefined,
      itemLocation: {
        country: item.location?.[0] || '',
      },
    }));

    return {
      total: parseInt(response.findCompletedItemsResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0] || '0'),
      limit: limit,
      offset: offset,
      itemSummaries: transformedItems,
    };

  } catch (error) {
    console.error('eBay browser client sold search error:', error);
    
    // Check for rate limit error and fall back to regular search
    if (error instanceof Error && (error.message.includes('10001') || error.message.includes('exceeded the number of times'))) {
      console.log('Sold items API rate limit reached, falling back to regular search');
      const regularParams = { ...params, soldItemsOnly: false };
      return await searchEbaySDK(regularParams);
    }
    
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
