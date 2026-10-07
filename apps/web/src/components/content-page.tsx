import type { ReactNode } from 'react';

/** Estrutura comum das páginas institucionais: chamada, título, data e texto corrido. */
export function ContentPage({
  eyebrow,
  title,
  lead,
  updatedAt,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: string;
  /** Data real da última revisão do texto, por extenso. */
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <main id="conteudo" className="content-page">
      <article>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {updatedAt && <p className="updated">Última atualização: {updatedAt}</p>}
        {children}
      </article>
    </main>
  );
}
