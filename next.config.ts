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
  // Configuration Turbopack pour résoudre les conflits
  turbopack: {
    resolveAlias: {
      // Alias pour résoudre les modules PWA
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json']
  },
  
  // Configuration pour les origines autorisées en développement
  allowedDevOrigins: ['192.168.100.5', 'localhost'],
  
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
