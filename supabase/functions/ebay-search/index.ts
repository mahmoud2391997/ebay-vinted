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

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 30,        // Max requests per window
  windowMs: 60 * 1000,    // 1 minute window
  maxQueryLength: 200,    // Max search query length
  maxLimit: 50,           // Max items per request
  minRequestInterval: 500, // Min ms between requests per IP
};

// In-memory rate limit store (resets on cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();
const lastRequestTime = new Map<string, number>();

let tokenCache: TokenCache | null = null;

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('cf-connecting-ip') || 
         'anonymous';
}

function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIP);

  // Check minimum interval between requests
  const lastRequest = lastRequestTime.get(clientIP) || 0;
  if (now - lastRequest < RATE_LIMIT.minRequestInterval) {
    return { allowed: false, remaining: 0, resetIn: RATE_LIMIT.minRequestInterval - (now - lastRequest) };
  }

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(clientIP, {
      count: 1,
      resetAt: now + RATE_LIMIT.windowMs,
    });
    lastRequestTime.set(clientIP, now);
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetIn: RATE_LIMIT.windowMs };
  }

  // Check if limit exceeded
  if (entry.count >= RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  // Increment count
  entry.count++;
  lastRequestTime.set(clientIP, now);
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - entry.count, resetIn: entry.resetAt - now };
}

function validateInput(body: SearchRequest): { valid: boolean; error?: string } {
  // Query validation
  if (!body.query || typeof body.query !== 'string') {
    return { valid: false, error: 'Query is required and must be a string' };
  }

  const query = body.query.trim();
  if (query.length === 0) {
    return { valid: false, error: 'Query cannot be empty' };
  }

  if (query.length > RATE_LIMIT.maxQueryLength) {
    return { valid: false, error: `Query must be less than ${RATE_LIMIT.maxQueryLength} characters` };
  }

  // Check for potentially malicious input
  if (/[<>{}]/.test(query)) {
    return { valid: false, error: 'Query contains invalid characters' };
  }

  // Limit validation
  if (body.limit !== undefined) {
    if (typeof body.limit !== 'number' || body.limit < 1 || body.limit > RATE_LIMIT.maxLimit) {
      return { valid: false, error: `Limit must be between 1 and ${RATE_LIMIT.maxLimit}` };
    }
  }

  // Offset validation
  if (body.offset !== undefined) {
    if (typeof body.offset !== 'number' || body.offset < 0 || body.offset > 10000) {
      return { valid: false, error: 'Offset must be between 0 and 10000' };
    }
  }

  // Sort validation
  const validSorts = ['price', '-price', 'newlyListed', 'endingSoonest'];
  if (body.sort && !validSorts.includes(body.sort)) {
    return { valid: false, error: `Sort must be one of: ${validSorts.join(', ')}` };
  }

  return { valid: true };
}

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
  
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  console.log('OAuth token obtained successfully');
  return data.access_token;
}

async function searchEbay(token: string, params: SearchRequest) {
  const query = params.query.trim();
  const limit = Math.min(params.limit || 50, RATE_LIMIT.maxLimit);
  const offset = Math.min(params.offset || 0, 10000);
  
  const searchParams = new URLSearchParams({
    q: query,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  if (params.filter) {
    searchParams.set('filter', params.filter);
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

  const clientIP = getClientIP(req);

  // Check rate limit
  const rateLimit = checkRateLimit(clientIP);
  
  const rateLimitHeaders = {
    'X-RateLimit-Limit': RATE_LIMIT.maxRequests.toString(),
    'X-RateLimit-Remaining': rateLimit.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
  };

  if (!rateLimit.allowed) {
    console.log(`Rate limit exceeded for ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait before making more requests.',
        retryAfter: Math.ceil(rateLimit.resetIn / 1000),
      }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          ...rateLimitHeaders,
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
        } 
      }
    );
  }

  try {
    const body: SearchRequest = await req.json();

    // Validate input
    const validation = validateInput(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth token
    const token = await getApplicationToken();

    // Search eBay
    const results = await searchEbay(token, body);

    console.log(`Found ${results.total || 0} results`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, ...rateLimitHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
