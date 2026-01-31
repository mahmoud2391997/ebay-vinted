import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// eBay OAuth token endpoint
app.post('/api/ebay/identity/v1/oauth2/token', async (req, res) => {
  try {
    const { appId, certId } = req.body;
    
    if (!appId || !certId) {
      return res.status(500).json({ error: 'eBay credentials not provided' });
    }

    const credentials = Buffer.from(`${appId}:${certId}`).toString('base64');
    
    const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).json({ error: 'Failed to get OAuth token' });
  }
});

// eBay Browse API endpoint
app.get('/api/ebay/buy/browse/v1/item_summary/search', async (req, res) => {
  try {
    console.log('Browse API request received:', req.url);
    console.log('Query params:', req.query);
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const queryString = new URLSearchParams(req.query).toString();
    const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${queryString}`;

    console.log('Forwarding to eBay:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country%3DUS',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.log('eBay API error:', data);
      return res.status(response.status).json(data);
    }

    console.log('eBay API success, returning results');
    res.json(data);
  } catch (error) {
    console.error('Browse API error:', error);
    res.status(500).json({ error: 'Failed to fetch from eBay Browse API' });
  }
});

// eBay Finding API endpoint
app.get('/api/finding', async (req, res) => {
  try {
    const appId = req.query['SECURITY-APPNAME'];
    
    if (!appId) {
      return res.status(500).json({ error: 'eBay App ID not provided' });
    }

    const queryString = new URLSearchParams(req.query).toString();
    const url = `https://svcs.ebay.com/services/search/FindingService/v1?${queryString}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Finding API error:', error);
    res.status(500).json({ error: 'Failed to fetch from eBay Finding API' });
  }
});

app.listen(PORT, () => {
  console.log(`eBay API proxy server running on http://localhost:${PORT}`);
  console.log('Make sure to set VITE_EBAY_APP_ID and VITE_EBAY_CERT_ID in your .env file');
});
