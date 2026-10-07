import type { MetadataRoute } from 'next';
import { publishedRoutes, siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  // Add proposed routes only after publishing their canonical content.
  return publishedRoutes.map((path) => ({ url: new URL(path, siteUrl).href }));
}
