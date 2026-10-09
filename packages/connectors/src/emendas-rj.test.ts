import { describe, expect, it } from 'vitest';
import { lerCsv, lerDetalhamento, lerExecucao, lerProcessos, lerValor } from './emendas-rj';

describe('lerCsv', () => {
  it('aceita aspas com ";" e quebra de linha dentro do campo', () => {
    expect(lerCsv('a;"b;c\nd";e\r\nf;g')).toEqual([
      ['a', 'b;c\nd', 'e'],
      ['f', 'g'],
    ]);
  });
});

describe('lerValor', () => {
  it('lê os formatos das planilhas do RJ', () => {
    expect(lerValor(' R$ 50.000,00 ')).toBe(50000);
    expect(lerValor('267.781,00 ')).toBe(267781);
    expect(lerValor(' - ')).toBe(0);
    expect(lerValor('(1.000,50)')).toBe(-1000.5);
  });
});

describe('lerDetalhamento', () => {
  it('usa o identificador e o CNPJ quando existem', () => {
    const csv = [
      ' Emenda;Identificador;Autor; Valor ; UP ; UO ;Ação;Função;Subfunção;Grupo de gasto;Grupo de despesa;Objeto;Justificativa;Beneficiário;Município;CNPJ;Converj; Modalidade ;Categoria;Obs;;',
      '22;11202600221;Carlos Minc; R$ 50.000,00 ; 18010-SEEDUC ; 18010-SEEDUC ;2312-Atividades;12-Educação;368-Básica;L4;33;OBJETO;"JUSTIFICATIVA\nLONGA";Instituto X;Rio de Janeiro;12.345.678/0001-90;;1 - Execução Direta;;;;',
    ].join('\n');
    const [e] = lerDetalhamento(csv, 2026);
    expect(e).toMatchObject({
      codigo: '11202600221',
      autor: 'Carlos Minc',
      valor: 50000,
      unidadeOrcamentaria: '18010-SEEDUC',
      justificativa: 'JUSTIFICATIVA LONGA',
      cnpjBeneficiario: '12345678000190',
      modalidade: '1 - Execução Direta',
    });
  });

  it('em 2024, sem identificador, monta o código pelo número', () => {
    const csv = [
      'Número Emenda;Autor;Valor;UP;UO;Nome emenda;Justificativa;Ação;Grupo de gasto;Grupo de despesa;Função;Subfunção;Município',
      '1.010;Douglas Ruas;R$ 416.194,00;29010-SES;29610-FES;ARCO CIRÚRGICO;AQUISIÇÃO;1094 - Constr;L5;44;10-Saúde;302-Hospitalar;ESTADO',
    ].join('\n');
    expect(lerDetalhamento(csv, 2024)[0]).toMatchObject({
      codigo: '2024-1010',
      numero: '1010',
      objeto: 'ARCO CIRÚRGICO',
      municipio: 'ESTADO',
      valor: 416194,
    });
  });
});

describe('lerExecucao', () => {
  it('liga as notas de empenho à emenda anterior e ignora totais', () => {
    const csv = [
      ';;;;;;;;;;;Dados;;;',
      'Posição;Sigla UO;Cod Ação;Tit Ação;Ano Fonte;Fonte RJ;Fonte STN;Deputado;Cod. Emenda;Nº Empenho;Descrição; Dotação Inicial; Empenhado; Liquidado; Pago',
      '12 / 2025;ACADEPOL;4773;Capacitação;1;148;500;Delegado Carlos Augusto;18202523431; - ; - ;R$ 293.802,00;R$ 0,00;R$ 0,00;R$ 0,00',
      ';;;;;;;;;2025NE00001;Curso FGV;R$ 0,00;R$ 286.828,81;R$ 286.828,81;R$ 181.966,67',
      ';ACADEPOL Total;;;;;;;;;;R$ 293.802,00;R$ 286.828,81;R$ 286.828,81;R$ 181.966,67',
    ].join('\n');
    const r = lerExecucao(csv);
    expect(r.posicao).toBe('12 / 2025');
    expect(r.dotacoes.get('18202523431')).toEqual({
      autor: 'Delegado Carlos Augusto',
      dotacao: 293802,
    });
    expect(r.empenhos).toEqual([
      {
        codigoEmenda: '18202523431',
        numeroEmpenho: '2025NE00001',
        descricao: 'Curso FGV',
        empenhado: 286828.81,
        liquidado: 286828.81,
        pago: 181966.67,
      },
    ]);
  });
});

describe('lerProcessos', () => {
  it('mapeia identificador para processo SEI', () => {
    const csv = [
      ' Emenda;Identificador;Autor; Valor ; UP ; UO ;Ação; Modalidade ;Nº PROCESSO;;',
      '20;11202600201;Carlos Minc; R$ 50.000,00 ; 18010-SEEDUC ; 18010-SEEDUC ;2312;1 - Execução Direta;SEI-030001/046187/2026;;',
    ].join('\n');
    expect(lerProcessos(csv).get('11202600201')).toBe('SEI-030001/046187/2026');
  });
});
