import { describe, expect, it } from 'vitest';
import { contratacaoSchema, contratoSchema, dataPncp, urlContratacoesPublicadas } from './pncp';

// Registro real do PNCP (29/09/2026), reduzido aos campos usados.
const exemplo = {
  valorTotalHomologado: null,
  orgaoEntidade: {
    cnpj: '83021808000182',
    razaoSocial: 'MUNICIPIO DE CHAPECO',
    esferaId: 'M',
    poderId: 'N',
  },
  situacaoCompraId: 1,
  situacaoCompraNome: 'Divulgada no PNCP',
  dataAberturaProposta: '2026-09-28T17:00:01',
  dataEncerramentoProposta: '2026-10-13T08:55:01',
  dataPublicacaoPncp: '2026-09-29T00:00:28',
  dataAtualizacaoGlobal: '2026-09-29T00:01:09',
  unidadeOrgao: {
    ufNome: 'Santa Catarina',
    ufSigla: 'SC',
    municipioNome: 'Chapecó',
    codigoIbge: '4204202',
    codigoUnidade: '1',
    nomeUnidade: 'Prefeitura Municipal de Chapecó',
  },
  orgaoSubRogado: null,
  amparoLegal: { nome: 'Lei 14.133/2021, Art. 28, I', descricao: 'pregão', codigo: 1 },
  linkSistemaOrigem: null,
  anoCompra: 2026,
  srp: false,
  sequencialCompra: 617,
  emendaParlamentar: null,
  numeroCompra: '398',
  processo: '398/2026',
  objetoCompra: 'AQUISIÇÃO DE MÁQUINAS PARA RENOVAÇÃO E AMPLIAÇÃO DA FROTA',
  informacaoComplementar: null,
  numeroControlePNCP: '83021808000182-1-000617/2026',
  valorTotalEstimado: 656540.0,
  modalidadeId: 6,
  modalidadeNome: 'Pregão - Eletrônico',
  modoDisputaId: 1,
  modoDisputaNome: 'Aberto',
};

describe('contratacaoSchema', () => {
  it('aceita um registro real', () => {
    const r = contratacaoSchema.parse(exemplo);
    expect(r.numeroControlePNCP).toBe('83021808000182-1-000617/2026');
    expect(r.valorTotalHomologado).toBeNull();
  });

  it('aceita situacaoCompraId como texto, como diz a documentação', () => {
    expect(contratacaoSchema.parse({ ...exemplo, situacaoCompraId: '2' }).situacaoCompraId).toBe(2);
  });

  it('recusa registro sem número de controle', () => {
    const { numeroControlePNCP: _, ...semNumero } = exemplo;
    expect(contratacaoSchema.safeParse(semNumero).success).toBe(false);
  });
});

describe('dataPncp', () => {
  it('interpreta horário sem fuso como Brasília', () => {
    expect(dataPncp('2026-09-29T00:00:28')?.toISOString()).toBe('2026-09-29T03:00:28.000Z');
  });

  it('respeita fuso explícito e trata vazios', () => {
    expect(dataPncp('2026-09-29T00:00:28Z')?.toISOString()).toBe('2026-09-29T00:00:28.000Z');
    expect(dataPncp(null)).toBeNull();
    expect(dataPncp('não é data')).toBeNull();
  });
});

describe('urlContratacoesPublicadas', () => {
  it('monta a consulta no formato da API', () => {
    expect(urlContratacoesPublicadas('2026-09-29', 6, 2)).toBe(
      'https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao?dataInicial=20260929&dataFinal=20260929&codigoModalidadeContratacao=6&pagina=2&tamanhoPagina=50',
    );
  });
});

describe('contratoSchema', () => {
  it('aceita um contrato real reduzido', () => {
    const c = contratoSchema.parse({
      numeroControlePNCP: '83820894000193-2-000004/2026',
      numeroControlePncpCompra: '83102277000152-1-000428/2026',
      anoContrato: 2026,
      sequencialContrato: 4,
      tipoPessoa: 'PJ',
      niFornecedor: '62590358000179',
      nomeRazaoSocialFornecedor: 'CRAVA CONSTRUÇÕES E ENGENHARIA LTDA',
      valorInicial: 61000,
      valorGlobal: 61000,
      dataAssinatura: '2026-09-11',
      dataVigenciaInicio: '2026-09-11',
      dataVigenciaFim: '2027-01-09',
      emendaParlamentar: null,
      tipoContrato: { id: 1, nome: 'Contrato (termo inicial)' },
      categoriaProcesso: { id: 8, nome: 'Serviços' },
      dataPublicacaoPncp: '2026-09-15T10:00:00',
      orgaoEntidade: {
        cnpj: '83820894000193',
        razaoSocial: 'MUNICIPIO X',
        poderId: 'E',
        esferaId: 'M',
      },
      unidadeOrgao: { ufSigla: 'SC', codigoIbge: '4204202', nomeUnidade: 'Prefeitura' },
    });
    expect(c.niFornecedor).toBe('62590358000179');
  });
});
