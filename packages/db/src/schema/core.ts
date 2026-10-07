import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  check,
  customType,
  date,
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
    // Cadastro da Receita Federal (dados abertos do CNPJ), quando já enriquecido.
    naturezaJuridicaCodigo: integer(),
    naturezaJuridica: text(),
    capitalSocial: numeric({ precision: 18, scale: 2 }),
    porte: text(),
    situacaoCadastral: text(),
    situacaoCadastralEm: date(),
    inicioAtividade: date(),
    cnaePrincipal: text(),
    cnaePrincipalDescricao: text(),
    /** Endereço da matriz. Para empresário individual/MEI fica nulo: tende a ser residencial. */
    endereco: text(),
    cep: text(),
    municipioNome: text(),
    siglaUf: text(),
    /** True quando o endereço foi omitido para proteger a residência do titular. */
    enderecoProtegido: boolean().notNull().default(false),
    /** Mês do arquivo da Receita usado, ex.: "2026-09". */
    referenciaReceita: text(),
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

export const cargo = core.enum('cargo', ['deputado_federal', 'senador', 'deputado_estadual']);

export const tipoContato = core.enum('tipo_contato', [
  'gabinete',
  'assessoria',
  'institucional',
  'atendimento',
  'outro',
]);

export const canalContato = core.enum('canal_contato', ['email', 'telefone', 'site']);

export const situacaoContato = core.enum('situacao_contato', [
  'publicado',
  'desatualizado',
  'invalido',
  'nao_encontrado',
]);

/**
 * Pessoa com atuação pública (por ora, parlamentares).
 * CPF e outros dados pessoais não são armazenados: não são necessários para o perfil público.
 */
export const pessoa = core.table(
  'pessoa',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /** Nome público (parlamentar ou eleitoral). */
    nome: text().notNull(),
    nomeCompleto: text(),
    slug: text().notNull().unique(),
    fotoUrl: text(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('pessoa_nome_trgm').using('gin', sql`pub.f_unaccent(${t.nome}) gin_trgm_ops`)],
);

/** Mandato com vigência: responsabilidades sempre consideram as datas. */
export const mandato = core.table(
  'mandato',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    pessoaId: uuid()
      .notNull()
      .references(() => pessoa.id),
    cargo: cargo().notNull(),
    /** Ente em que o mandato é exercido (a União, para mandatos no Congresso). */
    enteId: uuid()
      .notNull()
      .references(() => enteFederativo.id),
    /** UF representada. */
    ufId: uuid().references(() => enteFederativo.id),
    partido: text(),
    inicio: date().notNull(),
    fim: date(),
    situacao: text(),
    /** Identificador do mandato na fonte, ex.: "camara:57:204379" ou "senado:596". */
    idNaFonte: text().notNull().unique(),
    fonteUrl: text(),
    verificadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.pessoaId), index().on(t.cargo, t.ufId)],
);

/** Contato público de uma pessoa ou órgão, sempre com fonte e data de verificação. */
export const contatoPublico = core.table(
  'contato_publico',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    /** "pessoa" ou "orgao". */
    entidadeTipo: text().notNull(),
    entidadeId: uuid().notNull(),
    tipo: tipoContato().notNull(),
    canal: canalContato().notNull(),
    valor: text().notNull(),
    /** Titular ou unidade atendida, ex.: "Gabinete 414, Anexo IV". */
    rotulo: text(),
    fonteUrl: text().notNull(),
    verificadoEm: timestamp({ withTimezone: true }).notNull(),
    situacao: situacaoContato().notNull().default('publicado'),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.entidadeTipo, t.entidadeId, t.canal, t.valor),
    index().on(t.entidadeTipo, t.entidadeId),
    check('contato_entidade_tipo', sql`${t.entidadeTipo} IN ('pessoa', 'orgao')`),
  ],
);

/**
 * Candidatura registrada no TSE. Uma pessoa tem uma candidatura por eleição;
 * a ligação entre anos usa a chave de identidade (HMAC do CPF), nunca o CPF.
 */
export const candidatura = core.table(
  'candidatura',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    pessoaId: uuid()
      .notNull()
      .references(() => pessoa.id),
    ano: integer().notNull(),
    /** Sequencial do candidato no TSE (SQ_CANDIDATO), único por eleição. */
    sqCandidato: text().notNull(),
    codigoEleicao: text().notNull(),
    turno: integer(),
    cargo: text().notNull(),
    codigoCargo: integer().notNull(),
    siglaUf: text().notNull(),
    /** Unidade eleitoral: UF, "BR" ou código TSE do município. */
    unidadeEleitoral: text().notNull(),
    unidadeEleitoralNome: text(),
    numero: text(),
    nomeUrna: text().notNull(),
    partido: text(),
    ocupacao: text(),
    situacaoCandidatura: text(),
    resultado: text(),
    /** Total declarado, calculado na importação a partir dos bens. */
    totalBensDeclarados: reais(),
    quantidadeBens: integer().notNull().default(0),
    fonteUrl: text().notNull(),
    geradoNaFonteEm: text(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('candidatura_tse_unica').on(t.ano, t.sqCandidato),
    index().on(t.pessoaId, t.ano),
    index().on(t.ano, t.codigoCargo, t.siglaUf),
  ],
);

/** Bem declarado à Justiça Eleitoral, como publicado pelo TSE (valor informado pelo candidato). */
export const bemDeclarado = core.table(
  'bem_declarado',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    candidaturaId: uuid()
      .notNull()
      .references(() => candidatura.id, { onDelete: 'cascade' }),
    ordem: integer().notNull(),
    codigoTipo: integer(),
    tipo: text().notNull(),
    descricao: text(),
    valor: reais().notNull(),
    atualizadoNaFonteEm: text(),
  },
  (t) => [unique('bem_declarado_ordem').on(t.candidaturaId, t.ordem)],
);

export const situacaoEditorial = core.enum('situacao_editorial', [
  'rascunho',
  'publicado',
  'retirado',
]);

/**
 * Matéria de imprensa sobre um ou mais políticos, selecionada pela equipe editorial.
 * Guarda só referência (título, veículo, data, link) e resumo próprio: nunca o texto da matéria.
 */
export const materiaImprensa = core.table(
  'materia_imprensa',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    url: text().notNull().unique(),
    titulo: text().notNull(),
    veiculo: text().notNull(),
    publicadaEm: date().notNull(),
    /** Resumo escrito pela equipe, com as palavras da A Lupa. */
    resumo: text(),
    situacao: situacaoEditorial().notNull().default('rascunho'),
    /** Arquivo de origem no repositório, para rastrear quem incluiu e quando. */
    origem: text(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.situacao, t.publicadaEm)],
);

export const materiaPessoa = core.table(
  'materia_pessoa',
  {
    materiaId: uuid()
      .notNull()
      .references(() => materiaImprensa.id, { onDelete: 'cascade' }),
    pessoaId: uuid()
      .notNull()
      .references(() => pessoa.id),
  },
  (t) => [unique('materia_pessoa_unica').on(t.materiaId, t.pessoaId), index().on(t.pessoaId)],
);

export const confiancaVinculo = core.enum('confianca_vinculo', ['confirmada', 'possivel']);

/**
 * Participação de uma pessoa no quadro de sócios de uma empresa, segundo a Receita Federal.
 * A base aberta traz só nome e os 6 dígitos do meio do CPF: a ligação é "possível" até ser
 * confirmada por outra fonte. Uma linha por mês de referência (a base é uma foto mensal).
 */
export const participacaoSocietaria = core.table(
  'participacao_societaria',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    pessoaId: uuid()
      .notNull()
      .references(() => pessoa.id),
    /** 8 primeiros dígitos do CNPJ (a empresa, sem distinguir filiais). */
    cnpjBasico: text().notNull(),
    razaoSocial: text(),
    /** Empresa já enriquecida com o cadastro da Receita. */
    organizacaoId: uuid().references(() => organizacao.id),
    /** Nome do sócio exatamente como consta na Receita. */
    nomeNaFonte: text().notNull(),
    /** "***456789**", como publicado. */
    cpfParcial: text().notNull(),
    qualificacaoCodigo: integer().notNull(),
    qualificacao: text(),
    entradaEm: date(),
    faixaEtaria: integer(),
    metodo: text().notNull(),
    confianca: confiancaVinculo().notNull().default('possivel'),
    /** Mês do arquivo da Receita, ex.: "2026-09". */
    referencia: text().notNull(),
    documentoOriginalId: uuid().references(() => documentoOriginal.id),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('participacao_unica').on(t.pessoaId, t.cnpjBasico, t.qualificacaoCodigo, t.referencia),
    index().on(t.cnpjBasico),
    index().on(t.pessoaId),
  ],
);

/**
 * Contrato publicado no PNCP. Por ora a coleta é seletiva: só contratos cujo fornecedor é
 * uma empresa ligada (como possível correspondência) a uma pessoa acompanhada pela A Lupa.
 */
export const contrato = core.table(
  'contrato',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    numeroControlePncp: text().notNull().unique(),
    /** Contratação de origem, quando informada (liga ao edital). */
    numeroControlePncpCompra: text(),
    ano: integer().notNull(),
    sequencial: integer().notNull(),
    numero: text(),
    processo: text(),
    objeto: text(),
    orgaoCnpj: text().notNull(),
    orgaoNome: text().notNull(),
    unidadeNome: text(),
    siglaUf: text(),
    codigoIbgeMunicipio: text(),
    fornecedorTipo: text(),
    /** CNPJ completo do fornecedor (PJ). Fornecedores pessoa física não são guardados. */
    fornecedorCnpj: text(),
    fornecedorNome: text(),
    fornecedorId: uuid().references(() => organizacao.id),
    tipoContrato: text(),
    categoria: text(),
    /** Etapa "contratado": valor inicial e valor global (com aditivos) informados no PNCP. */
    valorInicial: reais(),
    valorGlobal: reais(),
    valorAcumulado: reais(),
    assinadoEm: date(),
    vigenciaInicio: date(),
    vigenciaFim: date(),
    emendaParlamentar: boolean(),
    publicadoEm: timestamp({ withTimezone: true }).notNull(),
    atualizadoNaFonteEm: timestamp({ withTimezone: true }),
    documentoOriginalId: uuid().references(() => documentoOriginal.id),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.fornecedorCnpj), index().on(t.fornecedorId), index().on(t.orgaoCnpj)],
);
