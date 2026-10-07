import type { MetadataRoute } from 'next';
import { isIndexable, siteUrl } from '@/lib/site';

// Gerado no build: o valor de ALUPA_INDEXAR vale para aquele build.
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/minha-lupa'] },
    sitemap: new URL('/sitemap.xml', siteUrl).href,
  };
}
