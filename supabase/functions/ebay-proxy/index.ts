import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const EBAY_API_HOST = "https://api.ebay.com";
const EBAY_FINDING_API_URL = "https://svcs.ebay.com/services/search/FindingService/v1";
const PROXY_BASE_PATH = "/functions/v1/ebay-proxy";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const queryString = url.search;

    let targetUrl;

    if (path.startsWith(`${PROXY_BASE_PATH}/finding`)) {
      targetUrl = `${EBAY_FINDING_API_URL}${queryString}`;
    } else if (path.startsWith(`${PROXY_BASE_PATH}/ebay`)) {
      const resourcePath = path.substring(`${PROXY_BASE_PATH}/ebay`.length);
      targetUrl = `${EBAY_API_HOST}${resourcePath}${queryString}`;
    } else {
      return new Response("Not Found: Invalid proxy path", { status: 404, headers: corsHeaders });
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });

    const responseHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
        responseHeaders.set(key, value);
    }
    
    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders });
  }
});
