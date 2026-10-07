import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { DraftNotice } from '@/components/draft-notice';
import { Pagination } from '@/components/pagination';
import { buscarCandidatos, listarPoliticos, listarUfs } from '@/lib/dados';
import { CARGOS, cargoTse, lerPagina, lerTexto } from '@/lib/formatos';

export const metadata: Metadata = {
  title: 'Políticos',
  description:
    'Deputados federais, senadores e deputados estaduais do RJ, com mandatos, patrimônio declarado e contatos públicos.',
  alternates: { canonical: '/politicos' },
  robots: { index: false, follow: true },
};

export default async function PoliticosPage({ searchParams }: PageProps<'/politicos'>) {
  const params = await searchParams;
  const termo = lerTexto(params.q);
  const siglaUf = lerTexto(params.uf, 2).toUpperCase();
  const cargo = lerTexto(params.cargo, 20);
  const pagina = lerPagina(params.pagina);
  const [{ politicos, haMais }, ufs, candidatos] = await Promise.all([
    listarPoliticos({ termo, siglaUf, cargo, pagina }),
    listarUfs(),
    pagina === 1 ? buscarCandidatos(termo, siglaUf) : Promise.resolve([]),
  ]);

  return (
    <main id="conteudo" className="records-page">
      <header className="page-heading">
        <Link className="back-link" href="/">
          Início <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">REPRESENTANTES E CANDIDATOS</p>
        <h1>
          Quem representa <em>você.</em>
        </h1>
        <p className="lead">
          Mandatos, candidaturas, patrimônio declarado e contatos públicos oficiais, com fonte em
          cada informação.
        </p>
      </header>

      <DraftNotice>
        Por enquanto: deputados federais e senadores em exercício, deputados estaduais do Rio de
        Janeiro e candidaturas no RJ em 2022, 2024 e 2026. Outros estados entram nas próximas
        etapas.
      </DraftNotice>

      <form className="filter-bar" role="search" action="/politicos">
        <label htmlFor="q">Buscar por nome</label>
        <div>
          <input id="q" name="q" defaultValue={termo} placeholder="Nome do político ou candidato" />
          <select name="uf" defaultValue={siglaUf} aria-label="Estado">
            <option value="">Todos os estados</option>
            {ufs.map((u) => (
              <option key={u.sigla} value={u.sigla!}>
                {u.nome}
              </option>
            ))}
          </select>
          <select name="cargo" defaultValue={cargo} aria-label="Cargo">
            <option value="">Todos os mandatos</option>
            <option value="deputado_federal">Deputados federais</option>
            <option value="senador">Senadores</option>
            <option value="deputado_estadual">Deputados estaduais</option>
          </select>
          <button className="button" type="submit">
            Filtrar
          </button>
        </div>
      </form>

      {politicos.length === 0 && candidatos.length === 0 ? (
        <p className="empty-state">Nenhum político encontrado com esses filtros.</p>
      ) : (
        politicos.length > 0 && (
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
        )
      )}

      <Pagination
        caminho="/politicos"
        pagina={pagina}
        haMais={haMais}
        filtros={{ q: termo, uf: siglaUf, cargo }}
      />

      {candidatos.length > 0 && !cargo && (
        <section className="data-section" aria-labelledby="candidatos">
          <h2 id="candidatos">Candidatos sem mandato cadastrado</h2>
          <ul className="person-grid">
            {candidatos.map((c) => (
              <li key={c.slug}>
                <Link href={`/politicos/${c.slug}`}>
                  <span className="photo-placeholder" aria-hidden="true" />
                  <span>
                    <strong>{c.nome}</strong>
                    <span>
                      {c.ano} · {cargoTse(c.cargo)} · {c.partido} · {c.unidade ?? c.siglaUf}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
