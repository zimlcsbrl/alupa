import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  customType,
  index,
  integer,
  numeric,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { documentoOriginal } from './raw';

const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

/** Valores monetários em reais, sem perda de precisão (o driver devolve texto). */
const reais = () => numeric({ precision: 18, scale: 2 });

/** Camada normalizada: entidades com identificadores próprios e estáveis. */
export const core = pgSchema('core');

export const esfera = core.enum('esfera', ['federal', 'estadual', 'distrital', 'municipal']);

export const poder = core.enum('poder', [
  'executivo',
  'legislativo',
  'judiciario',
  'ministerio_publico',
  'defensoria',
  'tribunal_de_contas',
  'outro',
]);

/**
 * União, estados, Distrito Federal e municípios.
 * Códigos IBGE: 2 dígitos para UF, 7 para município; a União não tem código.
 */
export const enteFederativo = core.table(
  'ente_federativo',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    esfera: esfera().notNull(),
    codigoIbge: text().unique(),
    nome: text().notNull(),
    /** Sigla da UF do ente; nula apenas para a União. */
    siglaUf: text(),
    /** UF à qual o município pertence. */
    ufId: uuid().references((): AnyPgColumn => enteFederativo.id),
    /** Slug legível e único, ex.: "sp" ou "sao-paulo-sp". */
    slug: text().notNull().unique(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.siglaUf),
    index('ente_federativo_nome_trgm').using('gin', sql`pub.f_unaccent(${t.nome}) gin_trgm_ops`),
    check(
      'ente_codigo_ibge_formato',
      sql`${t.codigoIbge} IS NULL OR ${t.codigoIbge} ~ '^[0-9]{2}([0-9]{5})?$'`,
    ),
  ],
);

/** Pessoa jurídica identificada por CNPJ: órgãos, fornecedores, beneficiários. */
export const organizacao = core.table(
  'organizacao',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /** CNPJ somente com dígitos. */
    cnpj: text().unique(),
    razaoSocial: text().notNull(),
    nomeFantasia: text(),
    slug: text().notNull().unique(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('organizacao_razao_social_trgm').using(
      'gin',
      sql`pub.f_unaccent(${t.razaoSocial}) gin_trgm_ops`,
    ),
    check('organizacao_cnpj_formato', sql`${t.cnpj} IS NULL OR ${t.cnpj} ~ '^[0-9]{14}$'`),
  ],
);

/** Órgão ou entidade da administração pública, vinculado a um ente e a um poder. */
export const orgao = core.table(
  'orgao',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizacaoId: uuid().references(() => organizacao.id),
    enteId: uuid()
      .notNull()
      .references(() => enteFederativo.id),
    poder: poder().notNull(),
    nome: text().notNull(),
    slug: text().notNull().unique(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  // Um órgão por CNPJ: as unidades administrativas ficam na contratação.
  (t) => [index().on(t.enteId), unique('orgao_organizacao_unica').on(t.organizacaoId)],
);

/**
 * Todo identificador vindo de uma fonte externa, com sua origem.
 * Permite achar a entidade própria a partir de qualquer código oficial.
 */
export const identificadorExterno = core.table(
  'identificador_externo',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /** Sistema de origem, ex.: "ibge", "pncp", "siafi", "camara". */
    sistema: text().notNull(),
    valor: text().notNull(),
    /** Tabela da entidade, ex.: "ente_federativo", "organizacao". */
    entidadeTipo: text().notNull(),
    entidadeId: uuid().notNull(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.sistema, t.valor, t.entidadeTipo),
    index().on(t.entidadeTipo, t.entidadeId),
  ],
);

/**
 * Contratação pública (licitação, dispensa, inexigibilidade etc.), como publicada no PNCP.
 * Chave natural: o número de controle do PNCP. Os valores guardam a etapa que representam.
 */
export const contratacao = core.table(
  'contratacao',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    numeroControlePncp: text().notNull().unique(),
    orgaoId: uuid()
      .notNull()
      .references(() => orgao.id),
    /** Ente da unidade que conduz a contratação (município, UF ou União). */
    enteId: uuid()
      .notNull()
      .references(() => enteFederativo.id),
    unidadeCodigo: text(),
    unidadeNome: text(),
    ano: integer().notNull(),
    sequencial: integer().notNull(),
    numero: text(),
    processo: text(),
    objeto: text(),
    informacaoComplementar: text(),
    modalidadeId: integer().notNull(),
    modalidadeNome: text(),
    modoDisputaId: integer(),
    modoDisputaNome: text(),
    amparoLegalCodigo: integer(),
    amparoLegalNome: text(),
    situacaoId: integer().notNull(),
    situacaoNome: text(),
    registroDePrecos: boolean(),
    /** Etapa "estimado": valor previsto pelo órgão. */
    valorEstimado: reais(),
    /** Etapa "homologado": valor do resultado, quando houver. */
    valorHomologado: reais(),
    aberturaPropostasEm: timestamp({ withTimezone: true }),
    encerramentoPropostasEm: timestamp({ withTimezone: true }),
    publicadaEm: timestamp({ withTimezone: true }).notNull(),
    /** Última atualização informada pela fonte; decide se um registro novo substitui o atual. */
    atualizadaNaFonteEm: timestamp({ withTimezone: true }),
    linkSistemaOrigem: text(),
    /** Página da API de onde o registro foi lido. */
    documentoOriginalId: uuid().references(() => documentoOriginal.id),
    busca: tsvector().generatedAlwaysAs(
      sql`to_tsvector('public.portuguese_unaccent', coalesce(objeto, '') || ' ' || coalesce(numero, '') || ' ' || coalesce(processo, ''))`,
    ),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.orgaoId),
    index().on(t.enteId, t.publicadaEm),
    index().on(t.modalidadeId, t.publicadaEm),
    index().on(t.encerramentoPropostasEm),
    index('contratacao_busca').using('gin', t.busca),
  ],
);
