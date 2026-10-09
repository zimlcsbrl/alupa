import assert from 'node:assert/strict';
import { test } from 'node:test';
import { robotsDaListagem } from './indexacao';
import { isIndexable, publishedRoutes } from './site';
import { sitemapResponse, sitemapXml } from './sitemap-xml';

test('listagem sem filtros respeita o bloqueio do ambiente', () => {
  assert.deepEqual(robotsDaListagem({}), { index: isIndexable, follow: isIndexable });
  assert.deepEqual(robotsDaListagem({ q: '', uf: undefined }), {
    index: isIndexable,
    follow: isIndexable,
  });
});

test('buscas, paginação e filtros nunca são indexados', () => {
  for (const key of ['q', 'uf', 'cargo', 'municipio', 'pagina', 'regra']) {
    assert.deepEqual(robotsDaListagem({ [key]: '2' }), { index: false, follow: isIndexable });
    assert.deepEqual(robotsDaListagem({ [key]: ['', 'RJ'] }), {
      index: false,
      follow: isIndexable,
    });
  }
  assert.deepEqual(robotsDaListagem({ utm_source: 'newsletter' }), {
    index: isIndexable,
    follow: isIndexable,
  });
});

test('XML escapa URLs e diferencia índice de lista de páginas', async () => {
  const xml = sitemapXml(['/sobre?a=1&b=2']);
  assert.ok(xml.includes('<url><loc>https://alupa.app/sobre?a=1&amp;b=2</loc></url>'));
  assert.ok(xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  const response = sitemapResponse(['/sitemaps/politicos/0.xml'], true);
  assert.equal(response.headers.get('Content-Type'), 'application/xml; charset=utf-8');
  assert.ok(
    (await response.text()).includes(
      '<sitemap><loc>https://alupa.app/sitemaps/politicos/0.xml</loc></sitemap>',
    ),
  );
});

test('todas as páginas fixas de navegação pública estão no sitemap, sem duplicatas', () => {
  for (const path of ['/politicos', '/orgaos', '/eleicoes', '/empresas-ligadas', '/em-foco']) {
    assert.ok(publishedRoutes.includes(path));
  }
  assert.equal(new Set(publishedRoutes).size, publishedRoutes.length);
  assert.ok(publishedRoutes.every((path) => !/[?#]/.test(path)));
});
