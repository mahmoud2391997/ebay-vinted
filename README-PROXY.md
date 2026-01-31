# eBay API Direct Integration Setup

This setup allows you to call eBay's API directly using your eBay App ID and Cert ID, bypassing Supabase.

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your eBay credentials:

```env
VITE_EBAY_APP_ID=your_ebay_app_id_here
VITE_EBAY_CERT_ID=your_ebay_cert_id_here
```

### 2. Install Proxy Server Dependencies

```bash
# Install dependencies for the proxy server
npm install --save-dev express cors node-fetch
```

Or use the provided package.json:

```bash
cp package-proxy.json package-proxy.json
npm install --prefix . --save-dev express cors node-fetch
```

### 3. Start the Proxy Server

```bash
# Start the proxy server
node proxy-server.js
```

The proxy server will run on `http://localhost:3001`

### 4. Start Your Application

In another terminal, start your main application:

```bash
npm run dev
```

## How It Works

1. **Proxy Server**: A simple Node.js server that handles CORS issues and forwards requests to eBay's API
2. **Direct API Calls**: Your application calls eBay's API directly through the local proxy
3. **Rate Limiting**: Built-in rate limiting and caching to avoid hitting eBay's API limits
4. **Security**: Your eBay credentials are sent to the proxy server, which handles the OAuth flow

## API Endpoints

The proxy server handles these endpoints:

- `POST /api/ebay/identity/v1/oauth2/token` - Get OAuth token
- `GET /api/ebay/buy/browse/v1/item_summary/search` - Search active listings
- `GET /api/finding` - Search sold items (Finding API)

## Benefits

- ✅ No Supabase dependency
- ✅ Direct eBay API access
- ✅ Better rate limiting control
- ✅ Local caching reduces API calls
- ✅ CORS issues resolved

## Troubleshooting

### Proxy Server Won't Start

Make sure Node.js is installed and the dependencies are installed:

```bash
node --version
npm install express cors node-fetch
```

### CORS Errors

Ensure the proxy server is running on `http://localhost:3001` before starting your application.

### eBay API Errors

Check that your eBay App ID and Cert ID are correct in the `.env` file.

### Rate Limiting

The application includes built-in rate limiting and caching. If you still hit limits, try:

1. Increase the cache duration in `ebay.ts`
2. Increase the rate limiting delay
3. Use active listings instead of sold items when possible

## Development

To modify the proxy server:

1. Edit `proxy-server.js`
2. Restart the proxy server
3. Refresh your application

The proxy server logs all API calls to help with debugging.
