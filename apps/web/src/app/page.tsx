import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return (
    <main id="conteudo" className="home">
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
      <Link className="button" href="/manifesto">
        Leia nosso manifesto <span aria-hidden="true">↗</span>
      </Link>
      <div className="project-note">
        <span className="eyebrow">ESTAMOS COMEÇANDO</span>
        <p>
          A plataforma está em construção. Pesquisa, dados e ferramentas de participação serão
          disponibilizados por etapas, com fontes e cobertura explícitas.
        </p>
      </div>
    </main>
  );
}
