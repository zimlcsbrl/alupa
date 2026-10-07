import Link from 'next/link';

/** Paginação anterior/próxima, preservando os filtros da URL. */
export function Pagination({
  caminho,
  pagina,
  haMais,
  filtros,
}: {
  caminho: string;
  pagina: number;
  haMais: boolean;
  filtros: Record<string, string>;
}) {
  const href = (p: number) => {
    const params = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v));
    if (p > 1) params.set('pagina', String(p));
    const qs = params.toString();
    return qs ? `${caminho}?${qs}` : caminho;
  };
  if (pagina === 1 && !haMais) return null;
  return (
    <nav className="pagination" aria-label="Paginação">
      {pagina > 1 ? <Link href={href(pagina - 1)}>← Anterior</Link> : <span />}
      <span>Página {pagina}</span>
      {haMais && pagina < 20 ? <Link href={href(pagina + 1)}>Próxima →</Link> : <span />}
    </nav>
  );
}
