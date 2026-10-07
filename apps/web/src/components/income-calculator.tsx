'use client';

import {
  faixasDeRenda,
  lerValorEmReais,
  posicaoNaDistribuicao,
  rendaPorPessoa,
  type FaixaDeRenda,
} from '@alupa/domain';
import { useId, useState, type FormEvent } from 'react';
import { distribuicoesDeRenda, type TipoDeRenda } from '@/content/distribuicao-renda';

const reais = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
const pct = (n: number) => `${n.toLocaleString('pt-BR')}%`;
const pessoas = (n: number) =>
  `${(n / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} milhões`;

function rotuloDaFaixa(faixa: FaixaDeRenda) {
  if (faixa.rendaMinima === null) return `Até ${reais.format(faixa.rendaMaxima!)}`;
  if (faixa.rendaMaxima === null) return `Acima de ${reais.format(faixa.rendaMinima)}`;
  return `${reais.format(faixa.rendaMinima)} a ${reais.format(faixa.rendaMaxima)}`;
}

interface Resultado {
  tipo: TipoDeRenda;
  renda: number;
  indice: number;
  faixa: FaixaDeRenda;
  destaque: string;
}

export function IncomeCalculator() {
  const id = useId();
  const [tipo, setTipo] = useState<TipoDeRenda>('domiciliar');
  const [valor, setValor] = useState('');
  const [moradores, setMoradores] = useState('1');
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const distribuicao = distribuicoesDeRenda[tipo];
  const faixas = faixasDeRenda(distribuicao.limites);
  const faixaDestacada = resultado?.tipo === tipo ? resultado.indice : null;
  const escala = Math.max(...Object.values(distribuicao.populacao.porInicioDaFaixa));

  function trocarTipo(novo: TipoDeRenda) {
    setTipo(novo);
    setResultado(null);
    setErro(null);
  }

  function calcular(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const informado = lerValorEmReais(valor);
    if (informado === null) {
      setResultado(null);
      setErro('Digite um valor em reais, por exemplo 3.000 ou 2.500,50.');
      return;
    }

    let renda = informado;
    if (tipo === 'domiciliar') {
      const pessoas = Number(moradores);
      if (!Number.isInteger(pessoas) || pessoas < 1 || pessoas > 30) {
        setResultado(null);
        setErro('Informe quantas pessoas moram na casa, contando você (de 1 a 30).');
        return;
      }
      renda = rendaPorPessoa(informado, pessoas);
    }

    setErro(null);
    setResultado({ tipo, renda, ...posicaoNaDistribuicao(renda, distribuicao.limites) });
  }

  return (
    <>
      <div className="calculator-tool">
        <form onSubmit={calcular} noValidate>
          <fieldset className="choice-group">
            <legend>O que você quer comparar?</legend>
            <label>
              <input
                type="radio"
                name={`${id}-tipo`}
                checked={tipo === 'domiciliar'}
                onChange={() => trocarTipo('domiciliar')}
              />
              <span>
                <strong>Renda por pessoa da casa</strong>
                Compara os moradores do Brasil.
              </span>
            </label>
            <label>
              <input
                type="radio"
                name={`${id}-tipo`}
                checked={tipo === 'individual'}
                onChange={() => trocarTipo('individual')}
              />
              <span>
                <strong>Minha renda do trabalho</strong>
                Compara ocupados com renda do trabalho.
              </span>
            </label>
          </fieldset>

          <label htmlFor={`${id}-valor`}>
            {tipo === 'domiciliar'
              ? 'Renda total da casa por mês, somando todos os moradores'
              : 'Sua renda mensal de todos os trabalhos'}
          </label>
          <input
            id={`${id}-valor`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex.: 3.000"
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              setResultado(null);
              setErro(null);
            }}
            aria-describedby={`${id}-dica`}
            aria-invalid={erro !== null && lerValorEmReais(valor) === null}
          />
          <p id={`${id}-dica`} className="field-hint">
            {tipo === 'domiciliar'
              ? 'Use valores brutos, antes dos descontos. Some salários, aposentadorias, pensões, aluguéis e benefícios de todos os moradores.'
              : 'Use o valor bruto, antes dos descontos, somando todos os seus trabalhos. Não inclua aposentadorias, aluguéis ou benefícios.'}
          </p>

          {tipo === 'domiciliar' && (
            <>
              <label htmlFor={`${id}-moradores`}>
                Quantas pessoas moram na casa, contando você?
              </label>
              <input
                id={`${id}-moradores`}
                type="number"
                inputMode="numeric"
                min={1}
                max={30}
                step={1}
                value={moradores}
                onChange={(e) => {
                  setMoradores(e.target.value);
                  setResultado(null);
                  setErro(null);
                }}
              />
            </>
          )}

          <button className="button" type="submit">
            Ver minha posição
          </button>
          <p className="data-note">
            O cálculo acontece no seu navegador. Nenhum valor é enviado ou guardado.
          </p>
        </form>

        <div className="calculator-result" aria-live="polite">
          {erro && (
            <p className="form-error" role="alert">
              {erro}
            </p>
          )}
          {resultado && (
            <>
              {resultado.tipo === 'domiciliar' && (
                <p className="per-capita">
                  Renda por pessoa da casa: <strong>{reais.format(resultado.renda)}</strong> por mês
                </p>
              )}
              <p className="result-headline">
                Você está <strong>{resultado.destaque}</strong>
                {resultado.tipo === 'domiciliar' ? ' do Brasil.' : ' entre quem trabalha.'}
              </p>
              <p className="result-population">
                Cerca de{' '}
                <strong>
                  {pessoas(distribuicao.populacao.porInicioDaFaixa[resultado.faixa.de])} de pessoas
                </strong>{' '}
                estão nesta faixa de renda: {rotuloDaFaixa(resultado.faixa)}.
              </p>
              <p>
                {resultado.faixa.rendaMinima === null
                  ? `${pct(100 - resultado.faixa.ate)} das pessoas têm renda acima de ${reais.format(resultado.faixa.rendaMaxima!)}.`
                  : resultado.faixa.rendaMaxima === null
                    ? `${pct(resultado.faixa.de)} das pessoas têm renda de até ${reais.format(resultado.faixa.rendaMinima)}.`
                    : `${pct(resultado.faixa.de)} das pessoas têm renda de até ${reais.format(resultado.faixa.rendaMinima)}, e ${pct(100 - resultado.faixa.ate)} têm mais de ${reais.format(resultado.faixa.rendaMaxima)}.`}
              </p>
            </>
          )}
        </div>
      </div>

      <figure className="income-distribution">
        <figcaption>
          <strong>Como a renda se distribui</strong>
          {tipo === 'domiciliar' ? ' · por pessoa da casa' : ' · do trabalho'} · {distribuicao.ano}
          <span>As barras comparam quantas pessoas estão em cada faixa de renda mensal.</span>
        </figcaption>
        <ol>
          {faixas.map((faixa, indice) => (
            <li key={faixa.de} aria-current={indice === faixaDestacada ? 'true' : undefined}>
              <span className="band-label">{rotuloDaFaixa(faixa)}</span>
              <span className="band-share">
                <strong>≈ {pessoas(distribuicao.populacao.porInicioDaFaixa[faixa.de])}</strong>
                <span>
                  {pct(
                    Number(
                      (
                        (distribuicao.populacao.porInicioDaFaixa[faixa.de] /
                          distribuicao.populacao.total) *
                        100
                      ).toFixed(1),
                    ),
                  )}{' '}
                  das pessoas
                </span>
              </span>
              <span className="bar-track" aria-hidden="true">
                <span
                  style={{
                    width: `${(distribuicao.populacao.porInicioDaFaixa[faixa.de] / escala) * 100}%`,
                  }}
                />
              </span>
              {indice === faixaDestacada && <span className="band-you">Você está aqui</span>}
            </li>
          ))}
        </ol>
        <p className="data-note">
          Base: cerca de {pessoas(distribuicao.populacao.total)} de pessoas em {distribuicao.ano}.
          Quantidades estimadas pelo IBGE, arredondadas na exibição.{' '}
          <a href={distribuicao.populacao.url}>
            Pessoas por faixa · Tabela {distribuicao.populacao.tabela} ↗
          </a>
        </p>
        <details className="income-methodology">
          <summary>Fonte e como interpretar</summary>
          <p className="data-note">
            {distribuicao.universo} {distribuicao.conceito} Valores nominais de {distribuicao.ano};
            rendas de hoje podem parecer um pouco mais altas por causa da inflação. Faixas definidas
            pelos limites publicados pelo IBGE.{' '}
            <a href={distribuicao.fonte.url}>{distribuicao.fonte.nome} ↗</a>
            As parcelas observadas podem diferir das classes teóricas de 5% ou 10% por empates de
            renda e arredondamentos.
          </p>
        </details>
      </figure>
    </>
  );
}
