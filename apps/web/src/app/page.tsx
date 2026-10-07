import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return (
    <main id="conteudo" className="home">
      <section className="home-hero">
        <div>
          <p className="eyebrow">INFORMAÇÃO PÚBLICA, INTERESSE DE TODOS</p>
          <h1>
            O público é da
            <br />
            <em>nossa conta.</em>
          </h1>
          <p className="intro">
            Entender de onde vem. Acompanhar para onde vai. Perguntar o que foi entregue.
          </p>
          <p className="home-description">
            A Lupa nasce para aproximar pessoas e informações públicas brasileiras. Um lugar para
            conectar documentos, entender o caminho do dinheiro e acompanhar o que acontece na sua
            cidade.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/brasil-em-numeros">
              Explore o Brasil em números <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="/manifesto">
              Leia nosso manifesto →
            </Link>
          </div>
        </div>
        <aside className="home-feature">
          <p className="eyebrow">UM PRIMEIRO OLHAR</p>
          <h2>
            Um país que vai
            <br />
            além da média.
          </h2>
          <p>
            População, território e renda. Comece pelas perguntas que ajudam a entender o Brasil.
          </p>
          <ol className="feature-topics">
            <li>
              <span>01</span> Onde vivemos?
            </li>
            <li>
              <span>02</span> Como a renda se distribui?
            </li>
            <li>
              <span>03</span> O que os números dizem?
            </li>
          </ol>
          <Link href="/brasil-em-numeros">
            Conheça o panorama <span aria-hidden="true">↗</span>
          </Link>
        </aside>
      </section>
      <section className="home-discover" aria-labelledby="discover-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ESCOLHA POR ONDE COMEÇAR</p>
            <h2 id="discover-title">Informação que aproxima.</h2>
          </div>
          <p>Conheça os dados, a ideia e os compromissos por trás da A Lupa.</p>
        </div>
        <div className="topic-grid">
          <Link className="discovery-card" href="/brasil-em-numeros">
            <span className="eyebrow">CONTEXTO</span>
            <h3>
              Brasil em números <span aria-hidden="true">↗</span>
            </h3>
            <p>Um panorama de população e renda, com fonte e período em cada indicador.</p>
          </Link>
          <Link className="discovery-card" href="/sobre">
            <span className="eyebrow">O PROJETO</span>
            <h3>
              Por que A Lupa? <span aria-hidden="true">↗</span>
            </h3>
            <p>O que estamos construindo e como queremos aproximar pessoas e informação pública.</p>
          </Link>
          <Link className="discovery-card" href="/manifesto">
            <span className="eyebrow">NOSSOS COMPROMISSOS</span>
            <h3>
              Olhar de perto <span aria-hidden="true">↗</span>
            </h3>
            <p>Clareza, rigor e participação para fazer perguntas que merecem resposta.</p>
          </Link>
        </div>
      </section>
      <div className="project-note">
        <span className="eyebrow">ESTAMOS COMEÇANDO</span>
        <p>
          O panorama do Brasil já tem um recorte inicial de indicadores. Pesquisa de registros
          públicos, novas bases e ferramentas de participação serão disponibilizadas por etapas.
        </p>
      </div>
    </main>
  );
}
