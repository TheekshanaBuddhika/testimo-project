import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This is an API-only Next.js app. All UI is in the separate Vite frontend.
  // CORS headers are handled dynamically in middleware.ts to support multiple origins.
};

export default nextConfig;
