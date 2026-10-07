import 'server-only';
import { schema } from '@alupa/db';
import { and, asc, count, desc, eq, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from './db';

const { contatoPublico, contratacao, enteFederativo, mandato, organizacao, orgao, pessoa } = schema;

export const POR_PAGINA = 30;

const uf = alias(enteFederativo, 'uf');

/** Busca sem acento e sem diferenciar maiúsculas, aproveitando os índices trigram. */
const contem = (coluna: unknown, termo: string) =>
  sql`pub.f_unaccent(${coluna}) ILIKE pub.f_unaccent(${`%${termo.replace(/[%_\\]/g, '\\$&')}%`})`;

// ---------- Órgãos ----------

export async function listarOrgaos({ termo, pagina }: { termo: string; pagina: number }) {
  const filtro = termo ? contem(organizacao.razaoSocial, termo) : undefined;
  const linhas = await db()
    .select({
      slug: orgao.slug,
      nome: orgao.nome,
      poder: orgao.poder,
      cnpj: organizacao.cnpj,
      ente: enteFederativo.nome,
      siglaUf: enteFederativo.siglaUf,
      esfera: enteFederativo.esfera,
      contratacoes: count(contratacao.id),
      valorEstimado: sum(contratacao.valorEstimado),
    })
    .from(orgao)
    .innerJoin(organizacao, eq(organizacao.id, orgao.organizacaoId))
    .innerJoin(enteFederativo, eq(enteFederativo.id, orgao.enteId))
    .leftJoin(contratacao, eq(contratacao.orgaoId, orgao.id))
    .where(filtro)
    .groupBy(orgao.id, organizacao.cnpj, enteFederativo.id)
    .orderBy(desc(count(contratacao.id)), asc(orgao.nome))
    .limit(POR_PAGINA + 1)
    .offset((pagina - 1) * POR_PAGINA);

  return { orgaos: linhas.slice(0, POR_PAGINA), haMais: linhas.length > POR_PAGINA };
}

export async function buscarOrgao(slug: string) {
  const [linha] = await db()
    .select({
      id: orgao.id,
      slug: orgao.slug,
      nome: orgao.nome,
      poder: orgao.poder,
      cnpj: organizacao.cnpj,
      ente: enteFederativo.nome,
      siglaUf: enteFederativo.siglaUf,
      esfera: enteFederativo.esfera,
      atualizadoEm: orgao.atualizadoEm,
    })
    .from(orgao)
    .innerJoin(organizacao, eq(organizacao.id, orgao.organizacaoId))
    .innerJoin(enteFederativo, eq(enteFederativo.id, orgao.enteId))
    .where(eq(orgao.slug, slug));
  if (!linha) return null;

  const [totais] = await db()
    .select({
      contratacoes: count(),
      valorEstimado: sum(contratacao.valorEstimado),
      // Agregações em SQL puro voltam como texto; mapWith aplica o tipo da coluna.
      primeira: sql<Date | null>`min(${contratacao.publicadaEm})`.mapWith(contratacao.publicadaEm),
      ultima: sql<Date | null>`max(${contratacao.publicadaEm})`.mapWith(contratacao.publicadaEm),
    })
    .from(contratacao)
    .where(eq(contratacao.orgaoId, linha.id));

  const recentes = await db()
    .select({
      id: contratacao.id,
      objeto: contratacao.objeto,
      modalidade: contratacao.modalidadeNome,
      situacao: contratacao.situacaoNome,
      valorEstimado: contratacao.valorEstimado,
      publicadaEm: contratacao.publicadaEm,
      encerramento: contratacao.encerramentoPropostasEm,
    })
    .from(contratacao)
    .where(eq(contratacao.orgaoId, linha.id))
    .orderBy(desc(contratacao.publicadaEm))
    .limit(50);

  return { ...linha, totais: totais!, recentes };
}

// ---------- Contratações ----------

export async function buscarContratacao(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [linha] = await db()
    .select({
      c: contratacao,
      orgaoNome: orgao.nome,
      orgaoSlug: orgao.slug,
      cnpj: organizacao.cnpj,
      ente: enteFederativo.nome,
      siglaUf: enteFederativo.siglaUf,
    })
    .from(contratacao)
    .innerJoin(orgao, eq(orgao.id, contratacao.orgaoId))
    .innerJoin(organizacao, eq(organizacao.id, orgao.organizacaoId))
    .innerJoin(enteFederativo, eq(enteFederativo.id, contratacao.enteId))
    .where(eq(contratacao.id, id));
  return linha ?? null;
}

/** Endereço da contratação no portal do PNCP, a partir do número de controle. */
export function urlPncp(c: { numeroControlePncp: string; ano: number; sequencial: number }) {
  const cnpj = c.numeroControlePncp.slice(0, 14);
  return `https://pncp.gov.br/app/editais/${cnpj}/${c.ano}/${c.sequencial}`;
}

// ---------- Políticos ----------

export async function listarPoliticos({
  termo,
  siglaUf,
  cargo,
  pagina,
}: {
  termo: string;
  siglaUf: string;
  cargo: string;
  pagina: number;
}) {
  const filtros = and(
    termo ? contem(pessoa.nome, termo) : undefined,
    siglaUf ? eq(uf.siglaUf, siglaUf) : undefined,
    cargo === 'deputado_federal' || cargo === 'senador' ? eq(mandato.cargo, cargo) : undefined,
  );
  const linhas = await db()
    .select({
      slug: pessoa.slug,
      nome: pessoa.nome,
      fotoUrl: pessoa.fotoUrl,
      cargo: mandato.cargo,
      partido: mandato.partido,
      siglaUf: uf.siglaUf,
    })
    .from(mandato)
    .innerJoin(pessoa, eq(pessoa.id, mandato.pessoaId))
    .leftJoin(uf, eq(uf.id, mandato.ufId))
    .where(filtros)
    .orderBy(asc(sql`pub.f_unaccent(${pessoa.nome})`))
    .limit(POR_PAGINA + 1)
    .offset((pagina - 1) * POR_PAGINA);

  return { politicos: linhas.slice(0, POR_PAGINA), haMais: linhas.length > POR_PAGINA };
}

export async function buscarPolitico(slug: string) {
  const [p] = await db().select().from(pessoa).where(eq(pessoa.slug, slug));
  if (!p) return null;

  const mandatos = await db()
    .select({
      cargo: mandato.cargo,
      partido: mandato.partido,
      siglaUf: uf.siglaUf,
      ufNome: uf.nome,
      inicio: mandato.inicio,
      fim: mandato.fim,
      situacao: mandato.situacao,
      fonteUrl: mandato.fonteUrl,
      verificadoEm: mandato.verificadoEm,
    })
    .from(mandato)
    .leftJoin(uf, eq(uf.id, mandato.ufId))
    .where(eq(mandato.pessoaId, p.id))
    .orderBy(desc(mandato.inicio));

  const contatos = await db()
    .select()
    .from(contatoPublico)
    .where(and(eq(contatoPublico.entidadeTipo, 'pessoa'), eq(contatoPublico.entidadeId, p.id)))
    .orderBy(asc(contatoPublico.canal));

  return { ...p, mandatos, contatos };
}

export async function listarUfs() {
  return db()
    .select({ sigla: enteFederativo.siglaUf, nome: enteFederativo.nome })
    .from(enteFederativo)
    .where(sql`length(${enteFederativo.codigoIbge}) = 2`)
    .orderBy(asc(enteFederativo.nome));
}
