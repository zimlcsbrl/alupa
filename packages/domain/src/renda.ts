/**
 * Posição de uma renda mensal na distribuição publicada pelo IBGE.
 *
 * O IBGE divulga apenas os limites superiores de algumas classes de percentual (P5, P10, …, P99).
 * Por isso o resultado é sempre uma faixa entre dois limites, nunca um percentil exato.
 */

/** Limite superior da classe: `percentual`% das pessoas têm renda até `limite` reais. */
export interface LimitePercentil {
  percentual: number;
  limite: number;
}

export interface FaixaDeRenda {
  /** Percentual acumulado no início da faixa (0 na primeira). */
  de: number;
  /** Percentual acumulado no fim da faixa (100 na última). */
  ate: number;
  /** Renda mínima da faixa em reais; null na primeira faixa. */
  rendaMinima: number | null;
  /** Renda máxima da faixa em reais; null na última faixa (sem limite superior publicado). */
  rendaMaxima: number | null;
  /** Parcela das pessoas nesta faixa, em pontos percentuais. */
  parcela: number;
}

export interface PosicaoNaDistribuicao {
  faixa: FaixaDeRenda;
  indice: number;
  /** Frase curta para destaque, ex.: "entre os 10% com maior renda". */
  destaque: string;
}

/** Faixas formadas pelos limites publicados, da menor para a maior renda. */
export function faixasDeRenda(limites: readonly LimitePercentil[]): FaixaDeRenda[] {
  const ordenados = [...limites].sort((a, b) => a.percentual - b.percentual);
  const faixas: FaixaDeRenda[] = [];
  let anterior: LimitePercentil | null = null;

  for (const atual of ordenados) {
    const de = anterior?.percentual ?? 0;
    faixas.push({
      de,
      ate: atual.percentual,
      rendaMinima: anterior?.limite ?? null,
      rendaMaxima: atual.limite,
      parcela: atual.percentual - de,
    });
    anterior = atual;
  }

  if (anterior) {
    faixas.push({
      de: anterior.percentual,
      ate: 100,
      rendaMinima: anterior.limite,
      rendaMaxima: null,
      parcela: 100 - anterior.percentual,
    });
  }
  return faixas;
}

/** "os 10%", mas "o 1%": o artigo concorda com o número. */
const osPct = (n: number) => `${n === 1 ? 'o' : 'os'} ${n.toLocaleString('pt-BR')}%`;

/**
 * Localiza a faixa da renda informada. O limite publicado pertence à faixa que ele fecha:
 * uma renda igual ao P50 fica na faixa que termina em 50%.
 */
export function posicaoNaDistribuicao(
  renda: number,
  limites: readonly LimitePercentil[],
): PosicaoNaDistribuicao {
  if (!Number.isFinite(renda) || renda < 0) {
    throw new RangeError('A renda deve ser um número maior ou igual a zero.');
  }
  const faixas = faixasDeRenda(limites);
  if (faixas.length === 0) throw new RangeError('Nenhum limite de percentil informado.');

  const indice = faixas.findIndex((f) => f.rendaMaxima === null || renda <= f.rendaMaxima);
  const faixa = faixas[indice]!;

  // Acima da mediana, a referência natural é o topo; abaixo, a base.
  const destaque =
    faixa.de >= 50
      ? `entre ${osPct(100 - faixa.de)} com maior renda`
      : `entre ${osPct(faixa.ate)} com menor renda`;

  return { faixa, indice, destaque };
}

/** Renda por pessoa da casa: total da casa dividido pelo número de moradores. */
export function rendaPorPessoa(rendaDaCasa: number, moradores: number): number {
  if (!Number.isInteger(moradores) || moradores < 1) {
    throw new RangeError('O número de moradores deve ser um inteiro maior ou igual a 1.');
  }
  return rendaDaCasa / moradores;
}

/**
 * Interpreta um valor em reais digitado livremente: "3000", "3.000", "3.000,50", "R$ 2.500,00".
 * Retorna null quando não for possível obter um número válido.
 */
export function lerValorEmReais(texto: string): number | null {
  const limpo = texto.replace(/\s|R\$/gi, '');
  if (!/^\d[\d.]*(,\d{1,2})?$/.test(limpo)) return null;
  // Ponto é separador de milhar; vírgula, de centavos.
  const valor = Number(limpo.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(valor) ? valor : null;
}
