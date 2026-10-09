import {
  caminhosEleicoes,
  caminhosSitemap,
  tiposSitemap,
  type TipoSitemap,
} from '@/lib/sitemap-dados';
import { publishedRoutes } from '@/lib/site';
import { sitemapResponse } from '@/lib/sitemap-xml';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tipo: string; pagina: string }> },
) {
  const { tipo, pagina } = await params;
  if (!/^(0|[1-9]\d*)\.xml$/.test(pagina)) return new Response(null, { status: 404 });
  const numero = Number(pagina.slice(0, -4));
  if (!Number.isSafeInteger(numero) || numero > 214748) return new Response(null, { status: 404 });
  if (tipo === 'paginas') {
    if (numero !== 0) return new Response(null, { status: 404 });
    return sitemapResponse([...publishedRoutes, ...(await caminhosEleicoes())]);
  }
  if (!tiposSitemap.includes(tipo as TipoSitemap)) return new Response(null, { status: 404 });
  const paths = await caminhosSitemap(tipo as TipoSitemap, numero);
  return paths.length ? sitemapResponse(paths) : new Response(null, { status: 404 });
}
