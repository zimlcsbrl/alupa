import 'server-only';
import { schema } from '@alupa/db';
import { and, asc, count, desc, eq, inArray, sql, sum } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from './db';

const {
  bemDeclarado,
  candidatura,
  contatoPublico,
  contratacao,
  enteFederativo,
  mandato,
  materiaImprensa,
  materiaPessoa,
  organizacao,
  orgao,
  participacaoSocietaria,
  pessoa,
} = schema;

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
    cargo === 'deputado_federal' || cargo === 'senador' || cargo === 'deputado_estadual'
      ? eq(mandato.cargo, cargo)
      : undefined,
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

  const candidaturas = await db()
    .select()
    .from(candidatura)
    .where(eq(candidatura.pessoaId, p.id))
    .orderBy(desc(candidatura.ano));

  const bens = candidaturas.length
    ? await db()
        .select()
        .from(bemDeclarado)
        .where(
          inArray(
            bemDeclarado.candidaturaId,
            candidaturas.map((c) => c.id),
          ),
        )
        .orderBy(asc(bemDeclarado.ordem))
    : [];

  const materias = await db()
    .select({
      id: materiaImprensa.id,
      url: materiaImprensa.url,
      titulo: materiaImprensa.titulo,
      veiculo: materiaImprensa.veiculo,
      publicadaEm: materiaImprensa.publicadaEm,
      resumo: materiaImprensa.resumo,
    })
    .from(materiaImprensa)
    .innerJoin(materiaPessoa, eq(materiaPessoa.materiaId, materiaImprensa.id))
    .where(and(eq(materiaPessoa.pessoaId, p.id), eq(materiaImprensa.situacao, 'publicado')))
    .orderBy(desc(materiaImprensa.publicadaEm))
    .limit(30);

  // Participações do mês de referência mais recente da Receita.
  const participacoes = await db()
    .select({
      id: participacaoSocietaria.id,
      cnpjBasico: participacaoSocietaria.cnpjBasico,
      razaoSocial: participacaoSocietaria.razaoSocial,
      nomeNaFonte: participacaoSocietaria.nomeNaFonte,
      cpfParcial: participacaoSocietaria.cpfParcial,
      qualificacao: participacaoSocietaria.qualificacao,
      entradaEm: participacaoSocietaria.entradaEm,
      confianca: participacaoSocietaria.confianca,
      metodo: participacaoSocietaria.metodo,
      referencia: participacaoSocietaria.referencia,
      empresa: {
        slug: organizacao.slug,
        cnpj: organizacao.cnpj,
        nomeFantasia: organizacao.nomeFantasia,
        naturezaJuridica: organizacao.naturezaJuridica,
        capitalSocial: organizacao.capitalSocial,
        porte: organizacao.porte,
        situacaoCadastral: organizacao.situacaoCadastral,
        inicioAtividade: organizacao.inicioAtividade,
        cnaePrincipalDescricao: organizacao.cnaePrincipalDescricao,
        endereco: organizacao.endereco,
        municipioNome: organizacao.municipioNome,
        siglaUf: organizacao.siglaUf,
        enderecoProtegido: organizacao.enderecoProtegido,
      },
    })
    .from(participacaoSocietaria)
    .leftJoin(organizacao, eq(organizacao.id, participacaoSocietaria.organizacaoId))
    .where(
      and(
        eq(participacaoSocietaria.pessoaId, p.id),
        sql`${participacaoSocietaria.referencia} = (SELECT max(referencia) FROM core.participacao_societaria WHERE pessoa_id = ${p.id})`,
      ),
    )
    .orderBy(desc(participacaoSocietaria.entradaEm));

  return {
    ...p,
    mandatos,
    contatos,
    participacoes,
    candidaturas: candidaturas.map((c) => ({
      ...c,
      bens: bens.filter((b) => b.candidaturaId === c.id),
    })),
    materias,
  };
}

/** Pessoas com candidaturas que batem com a busca, para quem ainda não tem mandato cadastrado. */
export async function buscarCandidatos(termo: string, siglaUf: string) {
  if (termo.length < 3) return [];
  return db()
    .selectDistinctOn([pessoa.id], {
      slug: pessoa.slug,
      nome: pessoa.nome,
      fotoUrl: pessoa.fotoUrl,
      ano: candidatura.ano,
      cargo: candidatura.cargo,
      partido: candidatura.partido,
      siglaUf: candidatura.siglaUf,
      unidade: candidatura.unidadeEleitoralNome,
    })
    .from(candidatura)
    .innerJoin(pessoa, eq(pessoa.id, candidatura.pessoaId))
    .where(
      and(
        sql`(${contem(pessoa.nome, termo)} OR ${contem(candidatura.nomeUrna, termo)})`,
        siglaUf ? eq(candidatura.siglaUf, siglaUf) : undefined,
        sql`NOT EXISTS (SELECT 1 FROM core.mandato m WHERE m.pessoa_id = ${pessoa.id})`,
      ),
    )
    .orderBy(pessoa.id, desc(candidatura.ano))
    .limit(12);
}

export async function listarUfs() {
  return db()
    .select({ sigla: enteFederativo.siglaUf, nome: enteFederativo.nome })
    .from(enteFederativo)
    .where(sql`length(${enteFederativo.codigoIbge}) = 2`)
    .orderBy(asc(enteFederativo.nome));
}

// ---------- Eleições ----------

export const ANOS_ELEICAO = [2026, 2024, 2022] as const;

/** Candidaturas por eleição e cargo, para o índice de eleições. */
export async function resumoEleicoes() {
  return db()
    .select({
      ano: candidatura.ano,
      codigoCargo: candidatura.codigoCargo,
      cargo: candidatura.cargo,
      candidaturas: count(),
      ufs: sql<number>`count(distinct ${candidatura.siglaUf})`.mapWith(Number),
    })
    .from(candidatura)
    .groupBy(candidatura.ano, candidatura.codigoCargo, candidatura.cargo)
    .orderBy(desc(candidatura.ano), asc(candidatura.codigoCargo));
}

/** Municípios (unidades eleitorais) com candidaturas em uma eleição municipal. */
export async function unidadesDaEleicao(ano: number, siglaUf: string) {
  return db()
    .selectDistinct({
      codigo: candidatura.unidadeEleitoral,
      nome: candidatura.unidadeEleitoralNome,
    })
    .from(candidatura)
    .where(and(eq(candidatura.ano, ano), siglaUf ? eq(candidatura.siglaUf, siglaUf) : undefined))
    .orderBy(asc(candidatura.unidadeEleitoralNome));
}

export async function listarCandidaturas({
  ano,
  codigoCargo,
  siglaUf,
  unidade,
  termo,
  pagina,
}: {
  ano: number;
  codigoCargo: number | null;
  siglaUf: string;
  unidade: string;
  termo: string;
  pagina: number;
}) {
  const linhas = await db()
    .select({
      slug: pessoa.slug,
      nome: candidatura.nomeUrna,
      numero: candidatura.numero,
      partido: candidatura.partido,
      cargo: candidatura.cargo,
      unidade: candidatura.unidadeEleitoralNome,
      siglaUf: candidatura.siglaUf,
      situacao: candidatura.situacaoCandidatura,
      resultado: candidatura.resultado,
      totalBens: candidatura.totalBensDeclarados,
      quantidadeBens: candidatura.quantidadeBens,
    })
    .from(candidatura)
    .innerJoin(pessoa, eq(pessoa.id, candidatura.pessoaId))
    .where(
      and(
        eq(candidatura.ano, ano),
        codigoCargo ? eq(candidatura.codigoCargo, codigoCargo) : undefined,
        siglaUf ? eq(candidatura.siglaUf, siglaUf) : undefined,
        unidade ? eq(candidatura.unidadeEleitoral, unidade) : undefined,
        termo
          ? sql`(${contem(candidatura.nomeUrna, termo)} OR ${contem(pessoa.nome, termo)})`
          : undefined,
      ),
    )
    // Eleitos e quem disputa o 2º turno primeiro; depois, ordem alfabética.
    .orderBy(
      sql`CASE WHEN ${candidatura.resultado} = '2º TURNO' THEN 0
               WHEN ${candidatura.resultado} LIKE 'ELEITO%' THEN 1 ELSE 2 END`,
      asc(sql`pub.f_unaccent(${candidatura.nomeUrna})`),
    )
    .limit(POR_PAGINA + 1)
    .offset((pagina - 1) * POR_PAGINA);

  return { candidaturas: linhas.slice(0, POR_PAGINA), haMais: linhas.length > POR_PAGINA };
}
