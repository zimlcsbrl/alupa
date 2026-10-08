import Link from 'next/link';

export type TemaLegal =
  | 'patrimonio'
  | 'cpf'
  | 'empresas'
  | 'contratos'
  | 'contatos'
  | 'imprensa'
  | 'sinais';

const ROTULOS: Record<TemaLegal, string> = {
  patrimonio: 'bens declarados',
  cpf: 'CPF',
  empresas: 'participação em empresas',
  contratos: 'contratos públicos',
  contatos: 'contatos públicos',
  imprensa: 'seleção de imprensa',
  sinais: 'sinais para verificação',
};

/**
 * Ícone "?" ao lado de uma informação. É um link (não um balão), para funcionar igual no
 * toque, no teclado e em leitores de tela.
 */
export function InfoTip({ tema }: { tema: TemaLegal }) {
  return (
    <Link
      className="info-tip"
      href={`/metodologia/amparo-legal#${tema}`}
      aria-label={`Como obtemos e por que podemos divulgar: ${ROTULOS[tema]}`}
      title={`Fonte e amparo legal: ${ROTULOS[tema]}`}
    >
      ?
    </Link>
  );
}
