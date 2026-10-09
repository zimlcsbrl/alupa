import type { MetadataRoute } from 'next';
import { isIndexable, siteUrl } from '@/lib/site';

// Gerado no build: o valor de ALUPA_INDEXAR vale para aquele build.
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  const bloqueadas = ['/admin', '/api/', '/minha-lupa'];
  return {
    // Regra explícita para o Googlebot, além da geral: deixa claro que sitemaps e páginas
    // públicas estão liberados.
    rules: [
      { userAgent: 'Googlebot', allow: ['/', '/sitemap.xml', '/sitemaps/'], disallow: bloqueadas },
      { userAgent: '*', allow: '/', disallow: bloqueadas },
    ],
    sitemap: new URL('/sitemap.xml', siteUrl).href,
  };
}
