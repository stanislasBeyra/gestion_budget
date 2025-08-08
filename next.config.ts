import type { NextConfig } from 'next';

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  buildExcludes: [/app-build-manifest\.json$/],
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, 
      handler: 'CacheFirst',
      options: {
        cacheName: 'budget-app-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 * 30 // 30 days
        }
      }
    }
  ]
});

const nextConfig: NextConfig = {
  
  // Temporairement désactivé pour Bubblewrap
  // async redirects() {
  //   return [
  //     {
  //       source: '/((?!mobile-only|api|_next|favicon.ico).*)',
  //       has: [
  //         {
  //           type: 'header',
  //           key: 'user-agent',
  //           value: '(?!.*Mobile)(?!.*Android)(?!.*iPhone).*'
  //         }
  //       ],
  //       destination: '/mobile-only',
  //       permanent: false
  //     }
  //   ];
  // },
  
  // Headers pour PWA
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ];
  }
};

module.exports = withPWA(nextConfig);
