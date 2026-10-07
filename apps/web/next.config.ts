import path from 'node:path';
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  // Build autocontido para container (Coolify/Docker); a raiz do monorepo entra no tracing.
  output: 'standalone',
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  // Pacotes do monorepo publicados como TypeScript, sem build próprio.
  transpilePackages: ['@alupa/domain', '@alupa/db'],
  images: {
    // Fotos oficiais dos parlamentares, servidas pelas próprias Casas.
    remotePatterns: [
      { protocol: 'https', hostname: 'www.camara.leg.br', pathname: '/internet/deputado/**' },
      { protocol: 'https', hostname: 'www.senado.leg.br', pathname: '/senadores/img/**' },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
