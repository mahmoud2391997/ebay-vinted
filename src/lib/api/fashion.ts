
const API_BASE_URL = '/api/vinted';

interface SearchOptions {
  page?: number;
  itemsPerPage?: number;
  maxPrice?: number;
  minPrice?: number;
  country?: string;
}

export type VintedPagination = {
  has_more?: boolean;
};

export type VintedSearchResult<TItem = unknown> = {
  success: boolean;
  data: TItem[];
  count?: number;
  pagination?: VintedPagination;
  error?: string;
};

export const searchVinted = async (
  query: string,
  options: SearchOptions = {},
): Promise<VintedSearchResult> => {
    const params = new URLSearchParams({
        search: query,
        page: String(options.page || 1),
        items_per_page: String(options.itemsPerPage || 25),
    });
    if (options.maxPrice) {
        params.append('max_price', String(options.maxPrice));
    }
    if (options.minPrice) {
        params.append('min_price', String(options.minPrice));
    }
    if (options.country) {
        params.append('country', options.country);
    }

    const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
    if (!response.ok) {
        const errorData = await response.json();
        return { success: false, data: [], error: errorData.detail || 'Failed to fetch from Vinted' };
    }
    return response.json() as Promise<VintedSearchResult>;
};

export const searchVintedSold = async (
  query: string,
  options: SearchOptions = {},
): Promise<VintedSearchResult> => {
    const params = new URLSearchParams({
        search: query,
        page: String(options.page || 1),
        items_per_page: String(options.itemsPerPage || 25),
    });

    if (options.maxPrice) {
        params.append('max_price', String(options.maxPrice));
    }
    if (options.minPrice) {
        params.append('min_price', String(options.minPrice));
    }
    if (options.country) {
        params.append('country', options.country);
    }

    const response = await fetch(`${API_BASE_URL}/sold?${params.toString()}`);
    if (!response.ok) {
        const errorData = await response.json();
        return { success: false, data: [], error: errorData.detail || 'Failed to fetch sold items from Vinted' };
    }
    return response.json() as Promise<VintedSearchResult>;
};
