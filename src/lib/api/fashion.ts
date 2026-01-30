
const API_BASE_URL = 'https://scraping-6z8n0y0ar-iti1.vercel.app';

const buildUrl = (basePath: string, query: string, options: any) => {
  const params = new URLSearchParams({
    search: query,
    page: options.page || 1,
    items_per_page: options.itemsPerPage || 24,
  });

  if (options.country) params.set('country', options.country);
  if (options.minPrice) params.set('min_price', options.minPrice);
  if (options.maxPrice) params.set('max_price', options.maxPrice);

  return `${basePath}/?${params.toString()}`;
};

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      return { success: false, error: errorJson.detail || 'An unknown error occurred' };
    } catch (e) {
      return { success: false, error: errorText || 'An unknown error occurred' };
    }
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return { success: true, ...await response.json() };
  } else {
    const text = await response.text();
    return { success: false, error: `Expected JSON, but got: ${text}` };
  }
}

export async function searchVinted(query: string, options: any = {}) {
  const url = buildUrl(API_BASE_URL, query, options);
  try {
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error searching Vinted:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function searchVestiaire(query: string, options: any = {}) {
  const url = buildUrl(`${API_BASE_URL}/vestiaire-collective`, query, options);
  try {
    const response = await fetch(url);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error searching Vestiaire Collective:', error);
    return { success: false, error: (error as Error).message };
  }
}
