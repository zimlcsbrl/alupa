import { REGRAS_SINAIS, regraSinal } from '@alupa/domain';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftNotice } from '@/components/draft-notice';
import { EmpresasLigadasLink } from '@/components/empresas-ligadas-link';
import { InfoTip } from '@/components/info-tip';
import { Pagination } from '@/components/pagination';
import { listarSinais, painelEmpresasLigadas, resumoSinais } from '@/lib/dados';
import {
  emReais,
  formatarCnpj,
  formatarData,
  formatarDataHora,
  lerPagina,
  lerTexto,
  numero,
} from '@/lib/formatos';
import { contactEmail } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Em foco: sinais para verificação',
  description:
    'Achados automáticos que cruzam candidaturas, empresas e contratos públicos. Cada sinal depende de avaliação e não representa, por si só, uma irregularidade.',
  alternates: { canonical: '/em-foco' },
  robots: { index: false, follow: true },
};

// Lê o banco a cada acesso: o build não depende de conexão com o banco.
export const dynamic = 'force-dynamic';

const SITUACOES: Record<string, { rotulo: string; descricao: string }> = {
  nao_verificado: {
    rotulo: 'Não verificado',
    descricao: 'Levantado pela regra automática. Ninguém da equipe avaliou ainda.',
  },
  em_verificacao: {
    rotulo: 'Em verificação',
    descricao: 'Estamos conferindo documentos e ouvindo os envolvidos.',
  },
  explicado: {
    rotulo: 'Explicado',
    descricao: 'Há uma explicação documentada. O sinal continua visível, com a explicação.',
  },
  descartado: {
    rotulo: 'Descartado',
    descricao: 'Erro de dado ou de correspondência. Deixa de ser exibido.',
  },
  virou_caso: {
    rotulo: 'Virou reportagem',
    descricao: 'A verificação resultou em matéria publicada no Editorial.',
  },
};

type Evidencia = Record<string, unknown> & {
  contrato?: { orgao?: string; valorGlobal?: string; assinadoEm?: string };
};

/** Frase curta com os números que dispararam a regra, sem adjetivos. */
function descreverEvidencia(regra: string, e: Evidencia) {
  const contrato = e.contrato
    ? `Contrato com ${e.contrato.orgao ?? 'órgão não informado'}, ${emReais(e.contrato.valorGlobal ?? null)}${e.contrato.assinadoEm ? `, assinado em ${formatarData(e.contrato.assinadoEm)}` : ''}.`
    : '';
  switch (regra) {
    case 'participacao-nao-declarada':
      return [
        `${e.qualificacao ?? 'Sócio'} desde ${formatarData(e.entradaEm as string)}, segundo a Receita.`,
        e.nenhumBemDeclarado
          ? `Na candidatura de ${e.ano} (${String(e.cargo).toLowerCase()}), nenhum bem foi declarado ao TSE.`
          : `Na candidatura de ${e.ano} (${String(e.cargo).toLowerCase()}), ${numero(Number(e.bensDeclarados))} bens declarados ao TSE, nenhum de cotas ou participação.`,
      ];
    case 'mandato-e-contrato-publico':
      return [
        contrato,
        `${e.qualificacao ?? 'Sócio'} da empresa com mandato vigente na assinatura.`,
      ];
    case 'contrato-desproporcional-capital':
      return [
        contrato,
        `Capital social de ${emReais(e.capitalSocial as string)}: o contrato equivale a ${numero(Number(e.proporcao))} vezes o capital.`,
      ];
    case 'empresa-recente':
      return [
        contrato,
        `Início de atividade em ${formatarData(e.inicioAtividade as string)}, ${numero(Number(e.diasAteContrato))} dias antes da assinatura.`,
      ];
    case 'empresa-situacao-irregular':
      return [
        contrato,
        `Situação cadastral "${e.situacaoCadastral}" na Receita (referência ${e.referenciaReceita}).`,
      ];
    default:
      return [];
  }
}

export default async function EmFocoPage({ searchParams }: PageProps<'/em-foco'>) {
  const params = await searchParams;
  const [{ linhas, atualizadoEm }, painel] = await Promise.all([
    resumoSinais(),
    painelEmpresasLigadas(),
  ]);

  const totalPorRegra = new Map<string, number>();
  const totalPorSituacao = new Map<string, number>();
  for (const l of linhas) {
    totalPorRegra.set(l.regra, (totalPorRegra.get(l.regra) ?? 0) + l.total);
    totalPorSituacao.set(l.situacao, (totalPorSituacao.get(l.situacao) ?? 0) + l.total);
  }
  const total = [...totalPorRegra.values()].reduce((s, n) => s + n, 0);

  const pedida = lerTexto(params.regra, 60);
  const regra =
    regraSinal(pedida) ??
    REGRAS_SINAIS.find((r) => (totalPorRegra.get(r.codigo) ?? 0) > 0) ??
    REGRAS_SINAIS[0]!;
  const termo = lerTexto(params.q);
  const pagina = lerPagina(params.pagina);
  const { sinais, haMais } = await listarSinais({ regra: regra.codigo, termo, pagina });

  return (
    <main id="conteudo" className="records-page focus-page">
      <header className="page-heading">
        <Link className="back-link" href="/">
          Início <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">EM FOCO</p>
        <h1>
          Sinais para verificação. <em>Não são conclusões.</em>
        </h1>
        <p className="lead">
          Cruzamos candidaturas, empresas e contratos públicos com regras objetivas e publicadas.
          Quando os números de uma regra batem, o caso aparece aqui como sinal: algo que merece ser
          conferido, não uma acusação.
        </p>
        <a className="button" href="#regras">
          Explorar os sinais <span aria-hidden="true">↓</span>
        </a>
      </header>

      <dl className="focus-overview" aria-label="Resumo da base">
        <div>
          <dt>Sinais ativos</dt>
          <dd>{numero(total)}</dd>
        </div>
        <div>
          <dt>Regras públicas</dt>
          <dd>{numero(REGRAS_SINAIS.length)}</dd>
        </div>
        <div>
          <dt>Último cálculo</dt>
          <dd>{atualizadoEm ? formatarDataHora(atualizadoEm) : 'Ainda não realizado'}</dd>
        </div>
      </dl>

      <DraftNotice>
        Por enquanto: pessoas com candidatura no RJ (2022, 2024 e 2026), quadro de sócios da Receita
        Federal e contratos publicados no PNCP no período já coletado.
      </DraftNotice>

      <div className="signal-warning" role="note">
        <p className="eyebrow">ANTES DE LER</p>
        <p>
          <strong>Um sinal não representa uma falha, uma irregularidade ou um crime.</strong>{' '}
          <InfoTip tema="sinais" /> É um achado automático que depende de avaliação: muitas vezes há
          uma explicação legítima, e listamos as mais comuns em cada regra. Os vínculos entre
          pessoas e empresas são <strong>possíveis correspondências</strong> (nome completo e seis
          dígitos do CPF), não identificações confirmadas. <InfoTip tema="empresas" />
        </p>
        <p>
          É citado em um sinal? Você pode enviar sua explicação ou apontar um erro para{' '}
          <a href={`mailto:${contactEmail}?subject=Sinal%20em%20foco`}>{contactEmail}</a>. A
          resposta é publicada junto do sinal.
        </p>
      </div>

      <EmpresasLigadasLink totais={painel.totais} />

      <details className="focus-method">
        <summary>
          <span>Como trabalhamos com sinais</span>
          <span className="focus-method-hint">Método e etapas de verificação</span>
        </summary>
        <div className="focus-method-body">
          <ol className="method-steps">
            <li>
              <strong>Regras públicas e objetivas.</strong> Cada regra compara dados de fontes
              oficiais (TSE, Receita Federal, PNCP) com um limiar fixo. O critério exato está
              escrito abaixo, para que qualquer pessoa consiga reproduzir o resultado.
            </li>
            <li>
              <strong>As mesmas regras para todos.</strong> Não escolhemos quem é examinado: a regra
              roda sobre todas as pessoas e empresas da base, de qualquer partido ou cargo.
            </li>
            <li>
              <strong>Sem ranking.</strong> Não somamos sinais nem ordenamos pessoas por quantidade
              de achados. A lista segue a ordem alfabética, e um nome com mais sinais não é “mais
              suspeito”.
            </li>
            <li>
              <strong>Todo sinal nasce “não verificado”.</strong> Só depois de conferir documentos e
              ouvir os envolvidos ele muda de situação. Quando a fonte corrige o dado, o sinal deixa
              de aparecer automaticamente.
            </li>
            <li>
              <strong>Fonte e explicação lado a lado.</strong> Cada sinal mostra os números que o
              dispararam, de onde vieram e as explicações legítimas mais frequentes.
            </li>
            <li>
              <strong>Direito de resposta.</strong> Explicações enviadas pelos citados são
              publicadas junto do sinal.
            </li>
          </ol>

          <dl className="signal-states">
            {Object.entries(SITUACOES).map(([codigo, s]) => (
              <div key={codigo}>
                <dt>
                  <span className={`tag ${codigo === 'nao_verificado' ? 'tag-warning' : ''}`}>
                    {s.rotulo}
                  </span>
                  {totalPorSituacao.get(codigo) ? (
                    <span className="table-note">{numero(totalPorSituacao.get(codigo)!)}</span>
                  ) : null}
                </dt>
                <dd>{s.descricao}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>

      <section className="data-section" aria-labelledby="regras">
        <p className="eyebrow">EXPLORE A BASE</p>
        <h2 id="regras">Escolha uma regra</h2>
        <p className="data-note">
          Selecione um critério para entender o cruzamento e consultar os sinais encontrados.
        </p>
        <ul className="signal-rules">
          {REGRAS_SINAIS.map((r) => {
            const n = totalPorRegra.get(r.codigo) ?? 0;
            return (
              <li key={r.codigo}>
                <Link
                  href={`/em-foco?regra=${r.codigo}#lista`}
                  aria-current={r.codigo === regra.codigo ? 'true' : undefined}
                >
                  <span className="focus-rule-status">
                    {r.codigo === regra.codigo ? 'Selecionada' : 'Ver sinais'}
                    <span aria-hidden="true">{r.codigo === regra.codigo ? '✓' : '↗'}</span>
                  </span>
                  <strong>{r.titulo}</strong>
                  <span className="focus-rule-count">
                    {numero(n)} <span>{n === 1 ? 'sinal' : 'sinais'}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="data-section focus-results" aria-labelledby="lista">
        <p className="eyebrow">REGRA SELECIONADA</p>
        <h2 id="lista">{regra.titulo}</h2>
        <dl className="legal-sheet">
          <div>
            <dt>O que verificamos</dt>
            <dd>{regra.verificamos}</dd>
          </div>
          <div>
            <dt>Por que importa</dt>
            <dd>{regra.porQueImporta}</dd>
          </div>
          <div>
            <dt>Explicações legítimas comuns</dt>
            <dd>
              <ul>
                {regra.explicacoesComuns.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt>Critério exato</dt>
            <dd>{regra.criterio}</dd>
          </div>
        </dl>

        <form className="filter-bar" role="search" action="/em-foco#lista">
          <input type="hidden" name="regra" value={regra.codigo} />
          <label htmlFor="q">Buscar nesta regra</label>
          <div>
            <input
              id="q"
              name="q"
              defaultValue={termo}
              placeholder="Nome da pessoa ou da empresa"
            />
            <button className="button" type="submit">
              Buscar
            </button>
          </div>
        </form>

        {sinais.length === 0 ? (
          <p className="empty-state">
            {termo
              ? `Nenhum sinal desta regra para “${termo}”.`
              : 'Nenhum sinal desta regra na base atual. Isso reflete a cobertura da coleta, não uma garantia de ausência.'}
          </p>
        ) : (
          <>
            {regra.codigo === 'participacao-nao-declarada' && (
              <p className="data-note">
                Candidaturas que declararam algum bem aparecem primeiro, por serem mais específicas;
                depois, as que não declararam bem nenhum. Dentro de cada grupo, ordem alfabética.
              </p>
            )}
            <ul className="company-list focus-signals">
              {sinais.map((s) => {
                const situacao = SITUACOES[s.situacao] ?? SITUACOES.nao_verificado!;
                return (
                  <li key={s.id}>
                    <div className="company-heading">
                      <div>
                        {s.pessoaSlug ? (
                          <Link href={`/politicos/${s.pessoaSlug}#empresas`}>
                            <strong>{s.pessoaNome}</strong>
                          </Link>
                        ) : (
                          <strong>{s.pessoaNome ?? 'Pessoa não identificada'}</strong>
                        )}
                        {s.empresaNome && (
                          <span>
                            {s.empresaNome} · CNPJ {formatarCnpj(s.empresaCnpj)}
                          </span>
                        )}
                      </div>
                      <div className="tag-stack">
                        <span
                          className={`tag ${s.situacao === 'nao_verificado' ? 'tag-warning' : ''}`}
                        >
                          {situacao.rotulo}
                        </span>
                        <span className="tag">Possível correspondência</span>
                      </div>
                    </div>
                    <ul className="signal-evidence">
                      {descreverEvidencia(regra.codigo, s.evidencia as Evidencia)
                        .filter(Boolean)
                        .map((frase) => (
                          <li key={frase}>{frase}</li>
                        ))}
                    </ul>
                    {s.notaEditorial && (
                      <p className="company-people">
                        <strong>Nota da redação:</strong> {s.notaEditorial}
                      </p>
                    )}
                    <p className="data-note">
                      Detectado em {formatarData(s.detectadoEm)} ·{' '}
                      <a
                        href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Sinal ${s.id}`)}`}
                      >
                        Enviar explicação ou correção
                      </a>
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <Pagination
          caminho="/em-foco"
          pagina={pagina}
          haMais={haMais}
          filtros={{ regra: regra.codigo, q: termo }}
        />
      </section>

      <p className="data-note">
        Fontes: TSE (candidaturas e declarações de bens), Receita Federal (quadro de sócios e
        cadastro de empresas) e PNCP (contratos). Veja também{' '}
        <Link href="/empresas-ligadas">empresas de políticos com contratos</Link> e o{' '}
        <Link href="/metodologia/amparo-legal">amparo legal e método</Link>.
      </p>
    </main>
  );
}
