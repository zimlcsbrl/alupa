import { contarPaginasSitemap, tiposSitemap } from '@/lib/sitemap-dados';
import { sitemapResponse } from '@/lib/sitemap-xml';

// Consulta em tempo de requisição: não exige banco durante o build.
export const dynamic = 'force-dynamic';

export async function GET() {
  const grupos = await Promise.all(
    tiposSitemap.map(async (tipo) => {
      const paginas = await contarPaginasSitemap(tipo);
      return Array.from({ length: paginas }, (_, pagina) => `/sitemaps/${tipo}/${pagina}.xml`);
    }),
  );
  return sitemapResponse(['/sitemaps/paginas/0.xml', ...grupos.flat()], true);
}
