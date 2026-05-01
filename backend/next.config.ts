import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // This is an API-only Next.js app. All UI is in the separate Vite frontend.
  // We disable the default Next.js page routes to keep things clean.

  // Allow the backend to be called cross-origin from the Vite frontend (and Vercel frontend domain)
  async headers() {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',      value: frontendUrl },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods',     value: 'GET,POST,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers',     value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
