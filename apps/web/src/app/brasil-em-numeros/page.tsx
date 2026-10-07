import Link from 'next/link';
import { IncomeCalculator } from '@/components/income-calculator';
import { distribuicoesDeRenda } from '@/content/distribuicao-renda';
import {
  brazilIndicators,
  brazilSources,
  incomeExamples,
  upcomingTopics,
  urbanRural,
} from '@/content/brasil-em-numeros';
import { pageMetadata } from '@/lib/site';

export const metadata = pageMetadata({
  title: 'Brasil em números',
  description:
    'População, distribuição demográfica e renda no Brasil: um panorama inicial com dados do IBGE, contexto e fontes.',
  path: '/brasil-em-numeros',
});
const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

export default function BrasilEmNumeros() {
  return (
    <main id="conteudo" className="numbers-page">
      <header className="page-heading">
        <Link className="back-link" href="/">
          Início <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">UM PAÍS, MUITAS REALIDADES</p>
        <h1>
          Brasil <em>em números.</em>
        </h1>
        <p className="lead">
          Quem somos, onde vivemos e como a renda se distribui. Dados para enxergar o país além da
          média.
        </p>
        <p className="data-note">
          Panorama inicial · Censo 2022, renda de 2024 e calculadora com a PNAD Contínua 2025. Cada
          indicador tem seu próprio período de referência; estes números não são estimativas para
          2026.
        </p>
      </header>
      <nav className="section-nav" aria-label="Seções de Brasil em números">
        <a href="#panorama">Panorama</a>
        <a href="#populacao">População</a>
        <a href="#renda">Renda</a>
        <a href="#calculadora">Calculadora</a>
        <a href="#fontes">Fontes</a>
      </nav>
      <section id="panorama" aria-label="Indicadores do Brasil" className="stat-grid">
        {brazilIndicators.map((item) => (
          <article className="stat-card" key={item.label}>
            <p className="eyebrow">{item.label}</p>
            <p className="stat-value">
              {item.value}
              <span>{item.unit}</span>
            </p>
            <p>{item.description}</p>
            <a className="source-link" href={item.source.url}>
              {item.source.name} ↗
            </a>
          </article>
        ))}
      </section>
      <section id="populacao" className="data-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / DISTRIBUIÇÃO DEMOGRÁFICA</p>
            <h2>Onde a vida acontece.</h2>
          </div>
          <p>O retrato de um país também passa pela relação entre cidades e áreas rurais.</p>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <h3>População urbana e rural</h3>
            <span className="tag">Censo 2022</span>
          </div>
          <p>De cada 100 pessoas, aproximadamente 87 viviam em áreas urbanas.</p>
          <div className="population-bar" aria-hidden="true">
            {urbanRural.map((item) => (
              <span className={item.color} key={item.label} style={{ width: `${item.share}%` }} />
            ))}
          </div>
          <dl className="population-legend">
            {urbanRural.map((item) => (
              <div key={item.label}>
                <dt>
                  <i className={item.color} aria-hidden="true" />
                  {item.label}
                </dt>
                <dd>
                  <strong>{item.share.toLocaleString('pt-BR')}%</strong>
                  <span>{item.people} de pessoas</span>
                </dd>
              </div>
            ))}
          </dl>
          <a className="source-link" href={brazilSources.census.url}>
            Fonte: {brazilSources.census.name} ↗
          </a>
        </div>
      </section>
      <section id="renda" className="data-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / RENDA E DESIGUALDADE</p>
            <h2>A média não conta tudo.</h2>
          </div>
          <p>
            Renda por pessoa, renda do trabalho e salário são medidas diferentes. O contexto
            importa.
          </p>
        </div>
        <div className="income-grid">
          <div className="panel">
            <div className="panel-heading">
              <h3>Renda por pessoa da casa</h3>
              <span className="tag">2024</span>
            </div>
            <p>
              Rendimento nominal mensal domiciliar per capita. Seleção de três UFs, não um ranking
              completo.
            </p>
            <ul className="income-bars">
              {incomeExamples.map((item) => (
                <li key={item.label}>
                  <div>
                    <span>{item.label}</span>
                    <strong>{currency.format(item.value)}</strong>
                  </div>
                  <div className="bar-track" aria-hidden="true">
                    <span style={{ width: `${(item.value / 3444) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="national-average">
              Média do Brasil: <strong>R$ 2.069 por mês</strong>
            </p>
            <a className="source-link" href={brazilSources.income.url}>
              Fonte: {brazilSources.income.name} ↗
            </a>
          </div>
          <aside className="context-panel">
            <p className="eyebrow">COMO LER ESSE NÚMERO</p>
            <h3>
              Por pessoa,
              <br />
              não por trabalhador.
            </h3>
            <p>
              A renda domiciliar per capita considera a renda da casa dividida pelo número de
              moradores, segundo os critérios da pesquisa.
            </p>
            <p>
              A média não indica quanto a maioria recebe e não permite descobrir, sozinha, a posição
              de uma pessoa na distribuição de renda.
            </p>
            <a href="#calculadora">Veja onde sua renda se encaixa ↓</a>
          </aside>
        </div>
      </section>
      <section id="calculadora" className="calculator-section">
        <div>
          <span className="tag">Dados de 2025</span>
          <p className="eyebrow">03 / SUA RENDA EM PERSPECTIVA</p>
          <h2>
            Onde minha renda
            <br />
            entra nessa história?
          </h2>
          <p>
            Responda: “Com essa renda mensal, estou entre quais faixas da população?” A comparação
            usa a distribuição de renda publicada pelo IBGE.
          </p>
          <p>
            Escolha o que comparar. A <strong>renda por pessoa da casa</strong> divide tudo o que a
            casa recebe pelos moradores e se compara com toda a população. A{' '}
            <strong>renda do trabalho</strong> considera só o que você ganha trabalhando e se
            compara com quem trabalha. Misturar as duas leva a conclusões erradas.
          </p>
          <p>
            O IBGE publica limites de faixas, não a renda de cada pessoa. Por isso o resultado
            indica uma faixa, e não uma posição exata.
          </p>
        </div>
        <IncomeCalculator />
      </section>
      <section className="data-section" aria-labelledby="next-topics">
        <div className="section-heading">
          <div>
            <p className="eyebrow">O RETRATO VAI GANHAR DETALHES</p>
            <h2 id="next-topics">Outros olhares sobre o Brasil.</h2>
          </div>
        </div>
        <div className="topic-grid">
          {upcomingTopics.map((topic) => (
            <article className="topic-card" key={topic.title}>
              <span className="tag">Próximas etapas</span>
              <h3>{topic.title}</h3>
              <p>{topic.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="fontes" className="sources-panel">
        <div>
          <p className="eyebrow">FONTES E CONTEXTO</p>
          <h2>Número bom vem acompanhado.</h2>
          <p>
            Seleção editorial conferida em 6 de outubro de 2026. Os períodos são diferentes e não
            devem ser combinados como se fossem um único retrato temporal. Valores populacionais
            foram arredondados; a renda está em reais nominais de 2024.
          </p>
        </div>
        <ul>
          <li>
            <a href={brazilSources.census.url}>Censo 2022 · população urbana e rural ↗</a>
          </li>
          <li>
            <a href={brazilSources.income.url}>
              PNAD Contínua 2024 · rendimento domiciliar per capita ↗
            </a>
          </li>
          <li>
            <a href={distribuicoesDeRenda.domiciliar.fonte.url}>
              PNAD Contínua 2025 · Tabela 7438 · faixas da renda por pessoa da casa ↗
            </a>
          </li>
          <li>
            <a href={distribuicoesDeRenda.individual.fonte.url}>
              PNAD Contínua 2025 · Tabela 7536 · faixas da renda do trabalho ↗
            </a>
          </li>
          <li>
            <Link href="/sobre#contato">Encontrou algo? Envie uma correção →</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
