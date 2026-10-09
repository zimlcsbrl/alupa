import 'server-only';
import { schema } from '@alupa/db';
import { asc, count, eq, inArray } from 'drizzle-orm';
import { db } from './db';
import { ANOS_ELEICAO } from './dados';
import { SITEMAP_SIZE } from './sitemap-xml';

const { pessoa, orgao, organizacao, contratacao, candidatura } = schema;
export const tiposSitemap = ['politicos', 'orgaos', 'contratacoes'] as const;
export type TipoSitemap = (typeof tiposSitemap)[number];

// Mesmos joins das páginas: órgãos sem organização não têm página pública válida.
function registros(tipo: TipoSitemap) {
  switch (tipo) {
    case 'politicos':
      return db().select({ chave: pessoa.slug }).from(pessoa).orderBy(asc(pessoa.slug));
    case 'orgaos':
      return db()
        .select({ chave: orgao.slug })
        .from(orgao)
        .innerJoin(organizacao, eq(organizacao.id, orgao.organizacaoId))
        .orderBy(asc(orgao.slug));
    case 'contratacoes':
      return db()
        .select({ chave: contratacao.id })
        .from(contratacao)
        .innerJoin(orgao, eq(orgao.id, contratacao.orgaoId))
        .innerJoin(organizacao, eq(organizacao.id, orgao.organizacaoId))
        .orderBy(asc(contratacao.id));
  }
}

export async function contarPaginasSitemap(tipo: TipoSitemap) {
  const [row] = await db().select({ total: count() }).from(registros(tipo).as('registros'));
  return Math.ceil((row?.total ?? 0) / SITEMAP_SIZE);
}

export async function caminhosSitemap(tipo: TipoSitemap, pagina: number) {
  const rows = await registros(tipo)
    .limit(SITEMAP_SIZE)
    .offset(pagina * SITEMAP_SIZE);
  return rows.map(({ chave }) => `/${tipo}/${encodeURIComponent(chave)}`);
}

export async function caminhosEleicoes() {
  const rows = await db()
    .selectDistinct({ ano: candidatura.ano })
    .from(candidatura)
    .where(inArray(candidatura.ano, [...ANOS_ELEICAO]))
    .orderBy(asc(candidatura.ano));
  return rows.map(({ ano }) => `/eleicoes/${ano}`);
}
