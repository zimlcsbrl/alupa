import { Children, cloneElement, isValidElement, type ReactNode } from 'react';
import Link from 'next/link';

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
  const sections: { id: string; title: string }[] = [];
  const content = Children.map(children, (child, index) => {
    if (!isValidElement<{ id?: string; children?: ReactNode }>(child) || child.type !== 'section')
      return child;
    const heading = Children.toArray(child.props.children).find(
      (node) => isValidElement(node) && node.type === 'h2',
    );
    if (
      !isValidElement<{ children: ReactNode }>(heading) ||
      typeof heading.props.children !== 'string'
    )
      return child;
    const id = child.props.id ?? `secao-${index + 1}`;
    sections.push({ id, title: heading.props.children });
    return cloneElement(child, { id });
  });
  return (
    <main id="conteudo" className="content-page">
      <header className="page-heading">
        <Link className="back-link" href="/">
          Início <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {updatedAt && <p className="updated">Última atualização: {updatedAt}</p>}
      </header>
      <div className="reading-layout">
        {sections.length > 0 && (
          <aside className="reading-index">
            <p className="eyebrow">NESTA PÁGINA</p>
            <nav aria-label="Índice da página">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>
        )}
        <article className="prose">{content}</article>
      </div>
    </main>
  );
}
