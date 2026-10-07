import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { DraftNotice } from '@/components/draft-notice';
import { Pagination } from '@/components/pagination';
import { listarPoliticos, listarUfs } from '@/lib/dados';
import { CARGOS, lerPagina, lerTexto } from '@/lib/formatos';

export const metadata: Metadata = {
  title: 'Políticos',
  description: 'Deputados federais e senadores em exercício, com mandatos e contatos públicos.',
  alternates: { canonical: '/politicos' },
  robots: { index: false, follow: true },
};

export default async function PoliticosPage({ searchParams }: PageProps<'/politicos'>) {
  const params = await searchParams;
  const termo = lerTexto(params.q);
  const siglaUf = lerTexto(params.uf, 2).toUpperCase();
  const cargo = lerTexto(params.cargo, 20);
  const pagina = lerPagina(params.pagina);
  const [{ politicos, haMais }, ufs] = await Promise.all([
    listarPoliticos({ termo, siglaUf, cargo, pagina }),
    listarUfs(),
  ]);

  return (
    <main id="conteudo" className="records-page">
      <header className="page-heading">
        <Link className="back-link" href="/">
          Início <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">REPRESENTANTES</p>
        <h1>
          Quem representa <em>você no Congresso.</em>
        </h1>
        <p className="lead">
          Deputados federais e senadores em exercício, com mandato, partido e contatos públicos
          oficiais.
        </p>
      </header>

      <DraftNotice>
        Por enquanto, só parlamentares federais em exercício. Estados e municípios entram nas
        próximas etapas.
      </DraftNotice>

      <form className="filter-bar" role="search" action="/politicos">
        <label htmlFor="q">Buscar por nome</label>
        <div>
          <input id="q" name="q" defaultValue={termo} placeholder="Nome do parlamentar" />
          <select name="uf" defaultValue={siglaUf} aria-label="Estado">
            <option value="">Todos os estados</option>
            {ufs.map((u) => (
              <option key={u.sigla} value={u.sigla!}>
                {u.nome}
              </option>
            ))}
          </select>
          <select name="cargo" defaultValue={cargo} aria-label="Cargo">
            <option value="">Deputados e senadores</option>
            <option value="deputado_federal">Deputados federais</option>
            <option value="senador">Senadores</option>
          </select>
          <button className="button" type="submit">
            Filtrar
          </button>
        </div>
      </form>

      {politicos.length === 0 ? (
        <p className="empty-state">Nenhum parlamentar encontrado com esses filtros.</p>
      ) : (
        <ul className="person-grid">
          {politicos.map((p) => (
            <li key={`${p.slug}-${p.cargo}`}>
              <Link href={`/politicos/${p.slug}`}>
                {p.fotoUrl ? (
                  <Image src={p.fotoUrl} alt="" width={64} height={84} unoptimized />
                ) : (
                  <span className="photo-placeholder" aria-hidden="true" />
                )}
                <span>
                  <strong>{p.nome}</strong>
                  <span>
                    {CARGOS[p.cargo]} · {p.partido ?? 'sem partido informado'} · {p.siglaUf}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        caminho="/politicos"
        pagina={pagina}
        haMais={haMais}
        filtros={{ q: termo, uf: siglaUf, cargo }}
      />
    </main>
  );
}
