import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftNotice } from '@/components/draft-notice';
import { Pagination } from '@/components/pagination';
import { listarOrgaos } from '@/lib/dados';
import { emReais, formatarCnpj, lerPagina, lerTexto, numero, PODERES } from '@/lib/formatos';

export const metadata: Metadata = {
  title: 'Órgãos públicos',
  description: 'Órgãos e entidades públicas com contratações publicadas no PNCP.',
  alternates: { canonical: '/orgaos' },
  robots: { index: false, follow: true },
};

export default async function OrgaosPage({ searchParams }: PageProps<'/orgaos'>) {
  const params = await searchParams;
  const termo = lerTexto(params.q);
  const pagina = lerPagina(params.pagina);
  const { orgaos, haMais } = await listarOrgaos({ termo, pagina });

  return (
    <main id="conteudo" className="records-page">
      <header className="page-heading">
        <Link className="back-link" href="/">
          Início <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">ÓRGÃOS E ENTIDADES</p>
        <h1>
          Quem contrata <em>com dinheiro público.</em>
        </h1>
        <p className="lead">
          Prefeituras, secretarias, tribunais e outros órgãos que publicaram contratações no Portal
          Nacional de Contratações Públicas (PNCP).
        </p>
      </header>

      <DraftNotice>
        Por enquanto, a lista reúne apenas órgãos com contratações publicadas no PNCP nos dias já
        coletados. Ausência de um órgão não significa ausência de contratações.
      </DraftNotice>

      <form className="filter-bar" role="search" action="/orgaos">
        <label htmlFor="q">Buscar órgão</label>
        <div>
          <input id="q" name="q" defaultValue={termo} placeholder="Nome do órgão ou da cidade" />
          <button className="button" type="submit">
            Buscar
          </button>
        </div>
      </form>

      {orgaos.length === 0 ? (
        <p className="empty-state">
          Nenhum órgão encontrado{termo ? ` para “${termo}”` : ''}. A busca considera só os órgãos
          com contratações já coletadas.
        </p>
      ) : (
        <ul className="record-list">
          {orgaos.map((o) => (
            <li key={o.slug}>
              <Link href={`/orgaos/${o.slug}`}>
                <strong>{o.nome}</strong>
                <span>
                  {o.ente}
                  {o.siglaUf && o.esfera !== 'estadual' ? ` · ${o.siglaUf}` : ''} ·{' '}
                  {PODERES[o.poder]} · CNPJ {formatarCnpj(o.cnpj)}
                </span>
              </Link>
              <dl>
                <div>
                  <dt>Contratações</dt>
                  <dd>{numero(o.contratacoes)}</dd>
                </div>
                <div>
                  <dt>Valor estimado</dt>
                  <dd>{emReais(o.valorEstimado)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}

      <Pagination caminho="/orgaos" pagina={pagina} haMais={haMais} filtros={{ q: termo }} />
    </main>
  );
}
