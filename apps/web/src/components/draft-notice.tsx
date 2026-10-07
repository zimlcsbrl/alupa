import Link from 'next/link';

/** Aviso das páginas em validação: visível, honesto sobre a cobertura e com canal de correção. */
export function DraftNotice({ children }: { children: React.ReactNode }) {
  return (
    <aside className="draft-notice" role="note">
      <span className="tag">Rascunho</span>
      <p>
        {children} Os dados estão em validação e podem mudar.{' '}
        <Link href="/sobre#contato">Encontrou um erro?</Link>
      </p>
    </aside>
  );
}
