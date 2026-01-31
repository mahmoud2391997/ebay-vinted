import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api/ebay': {
        target: 'https://api.ebay.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ebay/, ''),
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      },
      '/api/finding': {
        target: 'https://svcs.ebay.com/services/search/FindingService/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/finding/, ''),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
