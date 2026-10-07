import Link from 'next/link';
import { ContentPage } from '@/components/content-page';

export default function NotFound() {
  return (
    <ContentPage
      eyebrow="PÁGINA NÃO ENCONTRADA"
      title="Não encontramos esta página."
      lead="O endereço pode ter mudado ou ainda não existir: a A Lupa está sendo construída por etapas."
    >
      <p>
        <Link className="button" href="/">
          Voltar ao início
        </Link>
      </p>
    </ContentPage>
  );
}
