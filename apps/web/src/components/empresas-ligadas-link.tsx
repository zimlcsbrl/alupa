import Link from 'next/link';
import { emReaisInteiros, numero } from '@/lib/formatos';

/**
 * Chamada para o painel /empresas-ligadas. Com `totais`, vira um destaque com os números do
 * painel; sem, é um link discreto para as páginas de consulta.
 */
export function EmpresasLigadasLink({
  totais,
}: {
  totais?: { empresas: number; contratos: number; valor: number; politicos: number };
}) {
  if (!totais) {
    return (
      <p className="panel-link">
        <Link href="/empresas-ligadas">
          Ver todas as empresas de políticos com contratos públicos{' '}
          <span aria-hidden="true">→</span>
        </Link>
      </p>
    );
  }
  return (
    <Link className="panel-callout" href="/empresas-ligadas">
      <span className="eyebrow">O CAMINHO DO DINHEIRO</span>
      <strong>Empresas de políticos com contratos públicos</strong>
      <span>
        {numero(totais.empresas)} empresas ligadas a {numero(totais.politicos)} políticos ·{' '}
        {numero(totais.contratos)} contratos · {emReaisInteiros(totais.valor)} em valor contratado
      </span>
      <span className="panel-callout-cta">
        Ver o painel, com totais por político e por órgão <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
