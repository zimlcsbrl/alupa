import { cargoTse, emReais, emReaisInteiros, resultadoTse } from '@/lib/formatos';

interface Bem {
  id: string;
  ordem: number;
  tipo: string;
  descricao: string | null;
  valor: string;
}

interface Candidatura {
  id: string;
  ano: number;
  cargo: string;
  unidadeEleitoralNome: string | null;
  siglaUf: string;
  partido: string | null;
  resultado: string | null;
  totalBensDeclarados: string | null;
  quantidadeBens: number;
  fonteUrl: string;
  geradoNaFonteEm: string | null;
  bens: Bem[];
}

const pct = (n: number) =>
  `${n > 0 ? '+' : ''}${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/** Soma por tipo de bem, do maior para o menor. */
function porTipo(bens: Bem[]) {
  const somas = new Map<string, number>();
  for (const b of bens) somas.set(b.tipo, (somas.get(b.tipo) ?? 0) + Number(b.valor));
  return [...somas].sort((a, b) => b[1] - a[1]);
}

export function PatrimonioDeclarado({ candidaturas }: { candidaturas: Candidatura[] }) {
  const comBens = candidaturas.filter((c) => c.quantidadeBens > 0);
  const [recente, anterior] = comBens;
  const variacao =
    recente && anterior
      ? Number(recente.totalBensDeclarados) - Number(anterior.totalBensDeclarados)
      : null;

  return (
    <>
      {recente && anterior && variacao !== null && (
        <div className="asset-comparison">
          <div>
            <span className="eyebrow">{anterior.ano}</span>
            <strong>{emReaisInteiros(Number(anterior.totalBensDeclarados))}</strong>
            <span>{cargoTse(anterior.cargo)}</span>
          </div>
          <span className="asset-arrow" aria-hidden="true">
            →
          </span>
          <div>
            <span className="eyebrow">{recente.ano}</span>
            <strong>{emReaisInteiros(Number(recente.totalBensDeclarados))}</strong>
            <span>{cargoTse(recente.cargo)}</span>
          </div>
          <p>
            Diferença de <strong>{emReais(variacao)}</strong> (
            {pct((variacao / Number(anterior.totalBensDeclarados)) * 100)}) entre as declarações, em
            valores nominais, sem correção pela inflação.
          </p>
        </div>
      )}

      <ul className="candidacy-list">
        {candidaturas.map((c) => {
          const tipos = porTipo(c.bens);
          const total = Number(c.totalBensDeclarados ?? 0);
          return (
            <li key={c.id}>
              <div className="candidacy-heading">
                <div>
                  <strong>
                    {c.ano} · {cargoTse(c.cargo)}
                  </strong>
                  <span>
                    {c.unidadeEleitoralNome ?? c.siglaUf} · {c.partido ?? 'partido não informado'} ·{' '}
                    {resultadoTse(c.resultado)}
                  </span>
                </div>
                <div className="candidacy-total">
                  <span>Bens declarados</span>
                  <strong>{c.quantidadeBens > 0 ? emReais(total) : 'Nenhum bem declarado'}</strong>
                </div>
              </div>

              {tipos.length > 0 && (
                <ul className="asset-types" aria-label={`Bens declarados em ${c.ano}, por tipo`}>
                  {tipos.map(([tipo, soma]) => (
                    <li key={tipo}>
                      <span>{tipo}</span>
                      <span className="bar-track" aria-hidden="true">
                        <span style={{ width: `${total > 0 ? (soma / total) * 100 : 0}%` }} />
                      </span>
                      <strong>{emReaisInteiros(soma)}</strong>
                    </li>
                  ))}
                </ul>
              )}

              {c.bens.length > 0 && (
                <details className="asset-items">
                  <summary>Ver os {c.bens.length} itens como declarados ao TSE</summary>
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Tipo</th>
                        <th scope="col">Descrição informada</th>
                        <th scope="col">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.bens.map((b) => (
                        <tr key={b.id}>
                          <td>{b.tipo}</td>
                          <td>{b.descricao ?? '—'}</td>
                          <td>{emReais(b.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}

              <a className="source-link" href={c.fonteUrl}>
                Fonte: TSE, dados abertos de candidaturas {c.ano}
                {c.geradoNaFonteEm ? ` (arquivo gerado em ${c.geradoNaFonteEm})` : ''} ↗
              </a>
            </li>
          );
        })}
      </ul>

      <div className="method-note">
        <p className="eyebrow">COMO LER ESSES VALORES</p>
        <ul>
          <li>
            Os bens são <strong>declarados pelo próprio candidato</strong> ao registrar a
            candidatura. A A Lupa reproduz o que o TSE publica, sem verificação independente.
          </li>
          <li>
            Os valores costumam seguir a declaração de Imposto de Renda, que registra o{' '}
            <strong>custo de aquisição</strong>, e não o valor de mercado atual.
          </li>
          <li>
            Diferenças entre declarações podem vir de compra e venda, rendimentos, mudança na forma
            de declarar ou correção de erros. Uma variação, sozinha, não indica irregularidade.
          </li>
        </ul>
      </div>
    </>
  );
}
