import eBayApi from 'ebay-api';

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

// Initialize eBay SDK
const eBay = new eBayApi({
  appId: import.meta.env.VITE_EBAY_APP_ID || process.env.EBAY_APP_ID,
  certId: import.meta.env.VITE_EBAY_CERT_ID || process.env.EBAY_CERT_ID,
  sandbox: false,
  siteId: eBayApi.SiteId.EBAY_US,
  marketplaceId: eBayApi.MarketplaceId.EBAY_US,
});

// Configure proxy for browser usage (CORS workaround)
if (typeof window !== 'undefined') {
  // Use a public proxy for development, replace with your own in production
  const proxyUrl = import.meta.env.VITE_EBAY_PROXY_URL || 'https://ebay.hendt.workers.dev/';
  
  eBay.req.instance.interceptors.request.use((request) => {
    request.url = proxyUrl + request.url;
    return request;
  });
}

export async function searchEbaySDK(params: SearchParams): Promise<SearchResponse> {
  try {
    const { query, limit = 50, offset = 0, sort, filter, soldItemsOnly } = params;

    console.log('eBay SDK search called with params:', params);

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
      limit: limit.toString(),
      offset: offset.toString(),
    };

    if (sort) {
      searchParams.sort = sort;
    }

    if (filter) {
      searchParams.filter = filter;
    }

    console.log('Making eBay SDK request to Buy API:', searchParams);

    const response = await eBay.buy.browse.search(searchParams);
    
    console.log('eBay SDK response:', response);

    // Transform SDK response to match our interface
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
    console.error('eBay SDK search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform eBay search';
    return { total: 0, limit: 0, offset: 0, error: errorMessage };
  }
}

export async function searchEbaySoldSDK(params: SearchParams): Promise<SearchResponse> {
  try {
    const { query, limit = 50, offset = 0 } = params;

    console.log('eBay SDK sold items search for:', query);

    // Use Finding API for sold items via traditional API
    const findingParams = {
      keywords: query.trim(),
      paginationInput: {
        entriesPerPage: limit,
        pageNumber: Math.floor(offset / limit) + 1,
      },
      itemFilter: [
        {
          name: 'SoldItemsOnly',
          value: 'true',
        },
      ],
      outputSelector: ['SellerInfo', 'GalleryInfo'],
    };

    console.log('Making eBay SDK request to Finding API:', findingParams);

    // Use the traditional Finding API
    const response = await eBay.finding.findCompletedItems(findingParams);
    
    console.log('eBay SDK Finding API response:', response);

    // Transform Finding API response to match our interface
    const items = response.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
    
    const transformedItems = items.map((item: any) => ({
      itemId: item.itemId?.[0] || item.itemId,
      title: item.title?.[0] || item.title || '',
      image: item.galleryURL?.[0] ? { imageUrl: item.galleryURL[0] } : undefined,
      price: {
        value: item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ || item.sellingStatus?.currentPrice?.value || '0',
        currency: item.sellingStatus?.[0]?.currentPrice?.[0]?.['@currencyId'] || item.sellingStatus?.currentPrice?.currency || 'USD',
      },
      itemWebUrl: item.viewItemURL?.[0] || item.viewItemURL || '',
      condition: item.condition?.[0]?.conditionDisplayName?.[0] || item.condition?.conditionDisplayName,
      seller: item.sellerInfo?.[0] ? {
        username: item.sellerInfo[0]?.sellerUserName?.[0] || item.sellerInfo?.sellerUserName,
        feedbackScore: item.sellerInfo[0]?.feedbackScore?.[0] ? parseInt(item.sellerInfo[0].feedbackScore[0]) : undefined,
        feedbackPercentage: item.sellerInfo[0]?.positiveFeedbackPercent?.[0] || item.sellerInfo?.positiveFeedbackPercent,
      } : undefined,
      categories: item.primaryCategory?.[0] ? [{
        categoryId: item.primaryCategory[0]?.categoryId?.[0] || item.primaryCategory?.categoryId,
        categoryName: item.primaryCategory[0]?.categoryName?.[0] || item.primaryCategory?.categoryName,
      }] : undefined,
      itemLocation: {
        country: item.location?.[0] || item.location || '',
      },
    }));

    return {
      total: parseInt(response.findItemsByKeywordsResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0] || '0'),
      limit: limit,
      offset: offset,
      itemSummaries: transformedItems,
    };

  } catch (error) {
    console.error('eBay SDK sold search error:', error);
    
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
