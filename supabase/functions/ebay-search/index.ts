const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchRequest {
  query: string;
  limit?: number;
  offset?: number;
  sort?: string;
  filter?: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getApplicationToken(): Promise<string> {
  // Check if we have a valid cached token
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    console.log('Using cached token');
    return tokenCache.token;
  }

  const appId = Deno.env.get('EBAY_APP_ID');
  const certId = Deno.env.get('EBAY_CERT_ID');

  if (!appId || !certId) {
    throw new Error('eBay credentials not configured');
  }

  console.log('Fetching new OAuth token...');

  // Base64 encode credentials
  const credentials = btoa(`${appId}:${certId}`);

  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token fetch failed:', errorText);
    throw new Error(`Failed to get OAuth token: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the token (expires_in is in seconds, subtract 60s buffer)
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  console.log('OAuth token obtained successfully');
  return data.access_token;
}

async function searchEbay(token: string, params: SearchRequest) {
  const { query, limit = 50, offset = 0, sort, filter } = params;
  
  // Build query parameters
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

  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${searchParams.toString()}`;
  console.log('Searching eBay:', url);

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
    console.error('Search failed:', errorText);
    throw new Error(`eBay search failed: ${response.status}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SearchRequest = await req.json();

    if (!body.query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth token
    const token = await getApplicationToken();

    // Search eBay
    const results = await searchEbay(token, body);

    console.log(`Found ${results.total || 0} results`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
