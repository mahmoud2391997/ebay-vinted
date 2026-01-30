
const API_BASE_URL = 'https://scraping-6z8n0y0ar-iti1.vercel.app';

interface SearchOptions {
  page?: number;
  itemsPerPage?: number;
  maxPrice?: number;
  country?: string;
}

export const searchVinted = async (query: string, options: SearchOptions = {}) => {
    const params = new URLSearchParams({
        search: query,
        page: String(options.page || 1),
        items_per_page: String(options.itemsPerPage || 25),
    });
    if (options.maxPrice) {
        params.append('price_to', String(options.maxPrice));
    }
    if (options.country) {
        params.append('country', options.country);
    }

    const response = await fetch(`${API_BASE_URL}/?${params.toString()}`);
    if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Failed to fetch from Vinted' };
    }
    return response.json();
};

export const searchVintedSold = async (query: string, options: SearchOptions = {}) => {
    const params = new URLSearchParams({
        search: query,
        page: String(options.page || 1),
        items_per_page: String(options.itemsPerPage || 25),
    });

    if (options.maxPrice) {
        params.append('price_to', String(options.maxPrice));
    }
    if (options.country) {
        params.append('country', options.country);
    }

    const response = await fetch(`${API_BASE_URL}/vinted/sold?${params.toString()}`);
    if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || 'Failed to fetch sold items from Vinted' };
    }
    return response.json();
};
