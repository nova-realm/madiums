import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow importing JSON files directly from data/
  // (TypeScript resolveJsonModule is already true but this makes Next aware)
  reactStrictMode: true,

  // Security headers + clipboard permissions (same as the old vercel.json)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'clipboard-write=(self)',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
