import { describe, expect, it } from 'vitest';
import {
  camposReceita,
  dataReceita,
  lerLinhaEmpresa,
  lerLinhaEstabelecimento,
  lerLinhaSocio,
} from './receita';

// Linha no leiaute real (valores fictícios).
const linha =
  '"12345678";"2";"FULANO DE TAL";"***456789**";"49";"20190315";"";"***000000**";"";"00";"5"';

describe('lerLinhaSocio', () => {
  it('lê as colunas do leiaute da Receita', () => {
    expect(lerLinhaSocio(linha)).toEqual({
      cnpjBasico: '12345678',
      identificador: 2,
      nome: 'FULANO DE TAL',
      documento: '***456789**',
      qualificacao: 49,
      entrada: '20190315',
      faixaEtaria: 5,
    });
  });

  it('recusa linhas fora do leiaute', () => {
    expect(lerLinhaSocio('cabecalho;inesperado')).toBeNull();
    expect(lerLinhaSocio('"ABC";"2";"X";"y";"1";"2";"3";"4";"5";"6";"7"')).toBeNull();
  });
});

describe('dataReceita', () => {
  it('converte AAAAMMDD', () => {
    expect(dataReceita('20190315')).toBe('2019-03-15');
    expect(dataReceita('00000000')).toBeNull();
    expect(dataReceita('')).toBeNull();
  });
});

describe('camposReceita', () => {
  it('não desalinha campos com ponto e vírgula dentro', () => {
    expect(camposReceita('"1";"LOJA A; FILIAL";"3"')).toEqual(['1', 'LOJA A; FILIAL', '3']);
  });
});

describe('lerLinhaEmpresa', () => {
  it('lê razão social, natureza, capital e porte', () => {
    const l = '"12345678";"EMPRESA EXEMPLO; LTDA";"2062";"49";"150000,00";"03";""';
    expect(lerLinhaEmpresa(l)).toEqual({
      cnpjBasico: '12345678',
      razaoSocial: 'EMPRESA EXEMPLO; LTDA',
      naturezaJuridica: 2062,
      capitalSocial: '150000.00',
      porte: '03',
    });
  });
});

describe('lerLinhaEstabelecimento', () => {
  it('lê a matriz com endereço e situação, sem contatos', () => {
    const c = Array(30).fill('');
    Object.assign(c, {
      0: '12345678',
      1: '0001',
      2: '95',
      3: '1',
      4: 'FANTASIA',
      5: '02',
      6: '20200101',
      10: '20190315',
      11: '4711302',
      13: 'RUA',
      14: 'DAS FLORES; BLOCO B',
      15: '10',
      17: 'CENTRO',
      18: '20000000',
      19: 'RJ',
      20: '6001',
      21: '21',
      22: '999999999',
      27: 'contato@exemplo.com',
    });
    const r = lerLinhaEstabelecimento(c.map((v) => `"${v}"`).join(';'));
    expect(r).toMatchObject({
      cnpj: '12345678000195',
      matriz: true,
      situacaoCadastral: '02',
      inicioAtividade: '2019-03-15',
      logradouro: 'DAS FLORES; BLOCO B',
      uf: 'RJ',
      municipioReceita: '6001',
    });
    expect(JSON.stringify(r)).not.toContain('contato@exemplo.com');
  });
});
