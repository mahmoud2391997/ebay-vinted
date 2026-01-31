import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  let targetUrl = '';
  const url = new URL(req.url);
  if (url.pathname.includes('/ebay-finding')) {
      targetUrl = `https://svcs.ebay.com${url.pathname.replace('/functions/v1/ebay-proxy/ebay-finding', '')}`;
  } else if (url.pathname.includes('/ebay')) {
      targetUrl = `https://api.ebay.com${url.pathname.replace('/functions/v1/ebay-proxy/ebay', '')}`;
  }

  if (!targetUrl) {
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  }

  const response = await fetch(`${targetUrl}?${url.searchParams.toString()}`, {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  const data = await response.text();
  
  return new Response(data, {
    headers: { ...response.headers, ...corsHeaders },
    status: response.status
  });
});
