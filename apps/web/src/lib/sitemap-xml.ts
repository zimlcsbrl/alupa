import { siteUrl } from './site';

export const SITEMAP_SIZE = 10000;

function escapeXml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char]!,
  );
}

export function sitemapXml(paths: string[], index = false) {
  const root = index ? 'sitemapindex' : 'urlset';
  const entry = index ? 'sitemap' : 'url';
  const items = paths.map(
    (path) => `<${entry}><loc>${escapeXml(new URL(path, siteUrl).href)}</loc></${entry}>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<${root} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join('\n')}\n</${root}>\n`;
}

export function sitemapResponse(paths: string[], index = false) {
  return new Response(sitemapXml(paths, index), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=300',
    },
  });
}
