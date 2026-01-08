/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Local dev backend
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/api/**',
      },
      // Production (same origin through Nginx)
      {
        protocol: 'http',
        hostname: '43.167.176.123',
        pathname: '/api/**',
      },
      {
        protocol: 'https',
        hostname: '43.167.176.123',
        pathname: '/api/**',
      },
      // Docker internal backend (SSR/server-side image fetches)
      {
        protocol: 'http',
        hostname: 'backend',
        port: '8000',
        pathname: '/api/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Do NOT default to localhost in production builds.
  // In production behind Nginx, the frontend should call same-origin '/api'.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  },
  async rewrites() {
    // In local dev, proxy /api -> local backend.
    // In Docker/production, Nginx handles this at the edge, so no rewrite needed here.
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
    {
      source: '/_next/static/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
  transpilePackages: ['antd'],
};

module.exports = nextConfig;
