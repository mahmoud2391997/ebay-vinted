import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fetch from "node-fetch";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  dotenv.config();

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.post("/api/ebay/identity/v1/oauth2/token", async (req, res) => {
    try {
      const appId = process.env.EBAY_APP_ID;
      const certId = process.env.EBAY_CERT_ID;

      if (!appId || !certId) {
        return res
          .status(500)
          .json({ error: "eBay credentials not provided in .env file" });
      }

      const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");

      const response = await fetch(
        "https://api.ebay.com/identity/v1/oauth2/token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`,
          },
          body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error) {
      console.error("Token error:", error);
      res.status(500).json({ error: "Failed to get OAuth token" });
    }
  });

  app.get("/api/ebay/buy/browse/v1/item_summary/search", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({ error: "Authorization token required" });
      }

      const queryString = new URLSearchParams(req.query).toString();
      const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${queryString}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
          "X-EBAY-C-ENDUSERCTX": "contextualLocation=country%3DUS",
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error) {
      console.error("Browse API error:", error);
      res.status(500).json({ error: "Failed to fetch from eBay Browse API" });
    }
  });

  app.get("/api/finding", async (req, res) => {
    try {
      const appId = process.env.EBAY_APP_ID;

      if (!appId) {
        return res
          .status(500)
          .json({ error: "eBay App ID not provided in .env file" });
      }

      const modifiedQuery = { ...req.query, "SECURITY-APPNAME": appId };
      const queryString = new URLSearchParams(modifiedQuery).toString();
      const url = `https://svcs.ebay.com/services/search/FindingService/v1?${queryString}`;

      const response = await fetch(url, {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json(data);
      }

      res.json(data);
    } catch (error) {
      console.error("Finding API error:", error);
      res.status(500).json({ error: "Failed to fetch from eBay Finding API" });
    }
  });

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on("proxyReq", (proxyReq, req, res) => {
              app(req, res);
            });
          },
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(
      Boolean
    ),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
