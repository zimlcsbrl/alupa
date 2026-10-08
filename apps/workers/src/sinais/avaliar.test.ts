import { describe, expect, it } from 'vitest';
import { avaliarSinais, type Ligacao } from './avaliar';

const ligacao = (extra: Partial<Ligacao> = {}): Ligacao => ({
  pessoaId: 'p1',
  organizacaoId: 'o1',
  qualificacao: 'Sócio-Administrador',
  entradaEm: '2015-01-10',
  naturezaCodigo: 2062,
  capitalSocial: '10000.00',
  situacaoCadastral: 'Ativa',
  inicioAtividade: '2015-01-10',
  referencia: '2026-09',
  confianca: 'possivel',
  ...extra,
});

const contrato = {
  id: 'c1',
  organizacaoId: 'o1',
  valorGlobal: '600000.00',
  assinadoEm: '2026-08-01',
  orgaoNome: 'ÓRGÃO X',
  numeroControlePncp: '00000000000000-2-000001/2026',
};

const regras = (r: ReturnType<typeof avaliarSinais>) => r.map((a) => a.regra).sort();

describe('avaliarSinais', () => {
  it('não acende nada para uma empresa comum sem contrato desproporcional', () => {
    expect(
      avaliarSinais({
        ligacoes: [ligacao({ capitalSocial: '100000.00' })],
        contratos: [{ ...contrato, valorGlobal: '200000.00' }],
        mandatos: [],
        candidaturas: [],
      }),
    ).toEqual([]);
  });

  it('acende capital desproporcional só para empresas, não para associações', () => {
    const base = { contratos: [contrato], mandatos: [], candidaturas: [] };
    expect(regras(avaliarSinais({ ...base, ligacoes: [ligacao()] }))).toEqual([
      'contrato-desproporcional-capital',
    ]);
    expect(avaliarSinais({ ...base, ligacoes: [ligacao({ naturezaCodigo: 3999 })] })).toEqual([]);
  });

  it('acende a regra do art. 54 só com mandato vigente na data do contrato', () => {
    const mandato = {
      pessoaId: 'p1',
      cargo: 'deputado_estadual',
      inicio: '2023-02-01',
      fim: '2027-01-31',
    };
    const base = {
      ligacoes: [ligacao({ capitalSocial: '1000000.00' })],
      contratos: [contrato],
      candidaturas: [],
    };
    expect(regras(avaliarSinais({ ...base, mandatos: [mandato] }))).toEqual([
      'mandato-e-contrato-publico',
    ]);
    expect(avaliarSinais({ ...base, mandatos: [{ ...mandato, fim: '2026-01-31' }] })).toEqual([]);
  });

  it('participação não declarada exige entrada antes do registro e nenhuma cota na declaração', () => {
    const cand = {
      id: 'k',
      pessoaId: 'p1',
      ano: 2022,
      cargo: 'DEPUTADO ESTADUAL',
      tiposDeBem: ['Caderneta de poupança'],
    };
    const base = { contratos: [], mandatos: [] };
    expect(regras(avaliarSinais({ ...base, ligacoes: [ligacao()], candidaturas: [cand] }))).toEqual(
      ['participacao-nao-declarada'],
    );
    // Declarou cotas: sem sinal.
    expect(
      avaliarSinais({
        ...base,
        ligacoes: [ligacao()],
        candidaturas: [{ ...cand, tiposDeBem: ['Quotas ou quinhões de capital'] }],
      }),
    ).toEqual([]);
    // Entrou depois do registro: sem sinal.
    expect(
      avaliarSinais({
        ...base,
        ligacoes: [ligacao({ entradaEm: '2023-03-01' })],
        candidaturas: [cand],
      }),
    ).toEqual([]);
    // Só administrador (sem cotas): sem sinal.
    expect(
      avaliarSinais({
        ...base,
        ligacoes: [ligacao({ qualificacao: 'Administrador' })],
        candidaturas: [cand],
      }),
    ).toEqual([]);
  });

  it('empresa recente e cadastro irregular', () => {
    const r = avaliarSinais({
      ligacoes: [
        ligacao({
          inicioAtividade: '2026-03-01',
          situacaoCadastral: 'Inapta',
          capitalSocial: '100000.00',
        }),
      ],
      contratos: [contrato],
      mandatos: [],
      candidaturas: [],
    });
    expect(regras(r)).toEqual(['empresa-recente', 'empresa-situacao-irregular']);
  });
});

describe('deduplicação', () => {
  it('conta cada achado uma vez mesmo com a pessoa repetida na empresa', () => {
    const r = avaliarSinais({
      ligacoes: [ligacao(), ligacao({ qualificacao: 'Sócio' })],
      contratos: [contrato],
      mandatos: [],
      candidaturas: [],
    });
    expect(r.filter((a) => a.regra === 'contrato-desproporcional-capital')).toHaveLength(1);
  });
});
