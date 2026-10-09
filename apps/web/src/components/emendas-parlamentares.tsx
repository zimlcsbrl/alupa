import { emReais, formatarCnpj, numero } from '@/lib/formatos';

interface Emenda {
  id: string;
  ano: number;
  codigo: string;
  numero: string | null;
  valor: string;
  unidadeOrcamentaria: string | null;
  funcao: string | null;
  objeto: string | null;
  beneficiario: string | null;
  beneficiarioCnpj: string | null;
  municipio: string | null;
  modalidade: string | null;
  processoSei: string | null;
  empenhado: string | null;
  liquidado: string | null;
  pago: string | null;
  posicaoExecucao: string | null;
  fonteUrl: string;
  autorNome: string;
}

const soma = (xs: Emenda[], k: 'valor' | 'empenhado' | 'pago') =>
  xs.reduce((s, x) => s + Number(x[k] ?? 0), 0);

/** Tira o código do órgão ("18010-SEEDUC" → "SEEDUC"). */
const orgao = (uo: string | null) => uo?.replace(/^\d+\s*-\s*/, '') ?? null;

const porcentagem = (parte: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((parte / total) * 100)) : 0;

/**
 * Emendas impositivas estaduais, por ano, com as etapas do dinheiro: destinado (valor da
 * emenda), empenhado e pago. Em 2024 o governo publicou a execução sem identificar a emenda.
 */
export function EmendasParlamentares({ emendas }: { emendas: Emenda[] }) {
  if (emendas.length === 0) {
    return (
      <p>
        Nenhuma emenda encontrada nas bases já importadas (por enquanto, emendas impositivas ao
        orçamento do Estado do RJ, 2024 a 2026).
      </p>
    );
  }
  const anos = [...new Set(emendas.map((e) => e.ano))].sort((a, b) => b - a);
  const nomes = [...new Set(emendas.map((e) => e.autorNome))];

  return (
    <div className="amendments">
      {anos.map((ano, i) => {
        const doAno = emendas.filter((e) => e.ano === ano);
        const destinado = soma(doAno, 'valor');
        const comExecucao = doAno.some((e) => e.posicaoExecucao);
        const empenhado = soma(doAno, 'empenhado');
        const pago = soma(doAno, 'pago');
        const posicao = doAno.find((e) => e.posicaoExecucao)?.posicaoExecucao;
        return (
          <details key={ano} className="amendment-year" open={i === 0}>
            <summary>
              <span className="amendment-year-title">
                {ano} · {numero(doAno.length)} {doAno.length === 1 ? 'emenda' : 'emendas'}
              </span>
              <span className="amendment-year-total">{emReais(String(destinado))} destinados</span>
            </summary>

            {comExecucao ? (
              <dl className="money-stages">
                <div>
                  <dt>Destinado</dt>
                  <dd>{emReais(String(destinado))}</dd>
                </div>
                <div>
                  <dt>Empenhado</dt>
                  <dd>
                    {emReais(String(empenhado))}{' '}
                    <span>{porcentagem(empenhado, destinado)}%</span>
                  </dd>
                </div>
                <div>
                  <dt>Pago</dt>
                  <dd>
                    {emReais(String(pago))} <span>{porcentagem(pago, destinado)}%</span>
                  </dd>
                </div>
                <p className="data-note">Execução até a posição {posicao} do relatório estadual.</p>
              </dl>
            ) : (
              <p className="data-note">
                Para {ano}, o governo do RJ publicou a execução por programa de trabalho, sem
                identificar cada emenda. Por isso mostramos só o valor destinado, não o pago.
              </p>
            )}

            <ul className="amendment-list">
              {doAno.map((e) => {
                const valor = Number(e.valor);
                return (
                  <li key={e.id}>
                    <div className="amendment-heading">
                      <strong>{e.objeto ?? 'Objeto não informado'}</strong>
                      <span className="amendment-value">{emReais(e.valor)}</span>
                    </div>
                    <p className="amendment-meta">
                      {[
                        orgao(e.unidadeOrcamentaria),
                        e.municipio && e.municipio.toUpperCase() !== 'ESTADO'
                          ? e.municipio
                          : 'Abrangência estadual',
                        e.funcao?.replace(/^\d+\s*-\s*/, ''),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {e.beneficiario && (
                      <p className="amendment-meta">
                        Beneficiário: {e.beneficiario}
                        {e.beneficiarioCnpj ? ` · CNPJ ${formatarCnpj(e.beneficiarioCnpj)}` : ''}
                      </p>
                    )}
                    {e.posicaoExecucao && (
                      <div
                        className="amendment-progress"
                        role="img"
                        aria-label={`Empenhado ${porcentagem(Number(e.empenhado), valor)}%, pago ${porcentagem(Number(e.pago), valor)}% do valor destinado`}
                      >
                        <span
                          className="amendment-progress-committed"
                          style={{ width: `${porcentagem(Number(e.empenhado), valor)}%` }}
                        />
                        <span
                          className="amendment-progress-paid"
                          style={{ width: `${porcentagem(Number(e.pago), valor)}%` }}
                        />
                      </div>
                    )}
                    <p className="data-note">
                      {e.posicaoExecucao
                        ? `Empenhado ${emReais(e.empenhado)} · pago ${emReais(e.pago)}`
                        : 'Execução não identificada por emenda'}
                      {e.processoSei ? ` · processo ${e.processoSei}` : ''} · emenda nº{' '}
                      {e.numero ?? e.codigo}
                    </p>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
      <p className="data-note">
        Fonte: Secretaria de Estado de Planejamento do RJ (RedePlan), planilhas de detalhamento e de
        execução das emendas impositivas.{' '}
        {nomes.length > 0 && `Autor como publicado: ${nomes.join(', ')}. `}
        <a href="https://www.redeplan.planejamento.rj.gov.br/demaisprocessos/emendas.html">
          Planilhas originais ↗
        </a>
      </p>
    </div>
  );
}

