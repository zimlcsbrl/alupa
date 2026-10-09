import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftNotice } from '@/components/draft-notice';
import { InfoTip } from '@/components/info-tip';
import { painelEmpresasLigadas } from '@/lib/dados';
import {
  descreverCobertura,
  emReais,
  emReaisInteiros,
  formatarCnpj,
  formatarData,
  numero,
} from '@/lib/formatos';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Empresas ligadas a políticos com contratos públicos',
  description:
    'Empresas em que políticos e candidatos aparecem como sócios e que receberam contratos publicados no PNCP, com totais por político e por órgão contratante.',
  alternates: { canonical: '/empresas-ligadas' },
};

// Lê o banco a cada acesso: o build não depende de conexão com o banco.
export const dynamic = 'force-dynamic';

const urlContrato = (c: { numeroControlePncp: string; ano: number; sequencial: number }) =>
  `https://pncp.gov.br/app/contratos/${c.numeroControlePncp.slice(0, 14)}/${c.ano}/${c.sequencial}`;

export default async function EmpresasLigadasPage() {
  const { totais, porPolitico, porOrgao, porEmpresa, cobertura } = await painelEmpresasLigadas();
  const periodo = descreverCobertura(cobertura);

  return (
    <main id="conteudo" className={`records-page ${styles.page}`}>
      <header className="page-heading">
        <Link className="back-link" href="/">
          Início <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">O CAMINHO DO DINHEIRO</p>
        <h1>
          Empresas de políticos <em>com contratos públicos.</em>
        </h1>
        <p className="lead">
          Empresas em que políticos e candidatos aparecem como sócios na Receita Federal e que
          receberam contratos publicados no Portal Nacional de Contratações Públicas.
        </p>
        {totais.contratos > 0 && (
          <nav className={styles.navigation} aria-label="Explorar empresas ligadas">
            <a href="#por-politico">
              Por político <span aria-hidden="true">↓</span>
            </a>
            <a href="#por-orgao">
              Por órgão <span aria-hidden="true">↓</span>
            </a>
            <a href="#por-empresa">
              Empresas e contratos <span aria-hidden="true">↓</span>
            </a>
          </nav>
        )}
      </header>

      <dl className={styles.overview} aria-label="Abrangência da base coletada">
        <div>
          <dt>Empresas</dt>
          <dd>{numero(totais.empresas)}</dd>
        </div>
        <div>
          <dt>Políticos ligados</dt>
          <dd>{numero(totais.politicos)}</dd>
        </div>
        <div>
          <dt>Órgãos contratantes</dt>
          <dd>{numero(totais.orgaos)}</dd>
        </div>
      </dl>

      <DraftNotice>
        Por enquanto: pessoas com candidatura no RJ (2022, 2024 e 2026) e contratos publicados no
        PNCP {periodo ?? 'no período já coletado'}.
      </DraftNotice>

      <div className={styles.method} role="note">
        <p className="eyebrow">ANTES DE LER</p>
        <ul>
          <li>
            A ligação pessoa–empresa é uma <strong>possível correspondência</strong>: nome civil e 6
            dígitos do CPF coincidem nas bases do TSE e da Receita. <InfoTip tema="empresas" />
          </li>
          <li>
            O quadro de sócios é o <strong>atual</strong>. Quando o contrato foi assinado antes de a
            pessoa entrar na sociedade, isso é indicado.
          </li>
          <li>
            Valores são o <strong>valor global contratado</strong> informado no PNCP, não o valor
            pago. <InfoTip tema="contratos" />
          </li>
          <li>
            Ser sócio de empresa que contrata com o poder público <strong>não é ilegal</strong>.
            Este painel mostra relações a conhecer e verificar, não irregularidades.
          </li>
        </ul>
      </div>

      {totais.contratos === 0 ? (
        <p className="empty-state">
          Nenhum contrato encontrado para empresas ligadas a políticos nos contratos publicados no
          PNCP {periodo ?? 'já coletados'}. Isso não significa que não existam: a coleta ainda cobre
          um período curto.
        </p>
      ) : (
        <>
          <section className={`stat-grid ${styles.totals}`} aria-label="Totais">
            <article className="stat-card">
              <p className="eyebrow">Contratos</p>
              <p className="stat-value">{numero(totais.contratos)}</p>
              <p>
                De {numero(totais.empresas)} empresas ligadas a {numero(totais.politicos)}{' '}
                políticos, firmados com {numero(totais.orgaos)} órgãos.
              </p>
            </article>
            <article className="stat-card">
              <p className="eyebrow">Valor global contratado</p>
              <p className="stat-value">{emReaisInteiros(totais.valor)}</p>
              <p>
                Cada contrato contado uma vez, mesmo quando a empresa tem mais de um político como
                sócio.
                {totais.comEmenda > 0 &&
                  ` ${numero(totais.comEmenda)} contrato(s) informados como pagos com emenda parlamentar.`}
              </p>
            </article>
          </section>

          <section className="data-section" aria-labelledby="por-politico">
            <p className="eyebrow">QUEM ESTÁ LIGADO</p>
            <h2 id="por-politico">Por político</h2>
            <p className="data-note">
              Consulte as empresas e os contratos associados a cada pessoa. Clique no nome para ver
              seu perfil.
            </p>
            <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="por-politico">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Político</th>
                    <th scope="col">Empresas</th>
                    <th scope="col">Contratos</th>
                    <th scope="col">Valor global</th>
                  </tr>
                </thead>
                <tbody>
                  {porPolitico.map((p) => (
                    <tr key={p.slug}>
                      <th scope="row">
                        <Link href={`/politicos/${p.slug}#empresas`}>{p.nome}</Link>
                        {p.anterioresAEntrada > 0 && (
                          <span className="table-note">
                            {p.anterioresAEntrada} anterior(es) à entrada na sociedade
                          </span>
                        )}
                      </th>
                      <td>{numero(p.empresas)}</td>
                      <td>{numero(p.contratos)}</td>
                      <td>{emReais(p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="data-note">
              Quando uma empresa tem vários políticos como sócios, seus contratos aparecem no total
              de cada um deles. Por isso, a soma desta tabela pode superar o total geral.
            </p>
          </section>

          <section className="data-section" aria-labelledby="por-orgao">
            <p className="eyebrow">QUEM CONTRATA</p>
            <h2 id="por-orgao">Por órgão contratante</h2>
            <p className="data-note">
              Veja como os contratos se distribuem entre os órgãos públicos da base.
            </p>
            <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="por-orgao">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Órgão</th>
                    <th scope="col">UF</th>
                    <th scope="col">Contratos</th>
                    <th scope="col">Políticos ligados</th>
                    <th scope="col">Valor global</th>
                  </tr>
                </thead>
                <tbody>
                  {porOrgao.map((o) => (
                    <tr key={o.cnpj}>
                      <th scope="row">
                        {o.nome}
                        <span className="table-note">CNPJ {formatarCnpj(o.cnpj)}</span>
                      </th>
                      <td>{o.siglaUf ?? '—'}</td>
                      <td>{numero(o.contratos)}</td>
                      <td>{numero(o.politicos)}</td>
                      <td>{emReais(o.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="data-section" aria-labelledby="por-empresa">
            <p className="eyebrow">CONSULTE OS DOCUMENTOS</p>
            <h2 id="por-empresa">Empresas e contratos</h2>
            <p className="data-note">
              Abra os contratos de cada empresa para consultar datas, valores e documentos no PNCP.
            </p>
            <ul className="company-list">
              {porEmpresa.map((e) => (
                <li key={e.cnpj}>
                  <div className="company-heading">
                    <div>
                      <strong>{e.nome}</strong>
                      <span>CNPJ {formatarCnpj(e.cnpj)}</span>
                    </div>
                    <span className="tag tag-warning">Possível correspondência</span>
                  </div>
                  <div className={styles.people}>
                    <p className="eyebrow">Sócios acompanhados</p>
                    <ul>
                      {e.politicos.map((p) => (
                        <li key={p.slug}>
                          <Link href={`/politicos/${p.slug}#empresas`}>{p.nome}</Link> (
                          {p.qualificacao ?? 'qualificação não informada'}
                          {p.entradaEm ? `, desde ${formatarData(p.entradaEm)}` : ''})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <details className={`company-contracts ${styles.contracts}`}>
                    <summary>
                      <span>
                        Ver {numero(e.contratos.length)}{' '}
                        {e.contratos.length === 1 ? 'contrato' : 'contratos'}
                      </span>
                      <strong>
                        {emReais(e.valor)} <span>valor global contratado</span>
                      </strong>
                    </summary>
                    <ul>
                      {e.contratos.map((c) => (
                        <li key={c.contratoId}>
                          <a href={urlContrato(c)}>
                            {c.orgaoNome}
                            {c.siglaUf ? ` (${c.siglaUf})` : ''} ↗
                          </a>
                          <span>
                            {c.assinadoEm ? `${formatarData(c.assinadoEm)} · ` : ''}
                            {emReais(c.valorGlobal)}
                            {c.emendaParlamentar ? ' · pago com emenda parlamentar' : ''}
                            {c.anteriorAEntrada ? ' · assinado antes da entrada do sócio' : ''}
                          </span>
                          {c.objeto && <span className="data-note">{c.objeto}</span>}
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="data-note">
        Fontes: TSE (candidaturas e CPF), Receita Federal (quadro de sócios e cadastro de empresas)
        e PNCP (contratos). <Link href="/metodologia/amparo-legal">Amparo legal e método</Link> ·{' '}
        <Link href="/em-foco">Sinais para verificação</Link>.
      </p>
    </main>
  );
}
