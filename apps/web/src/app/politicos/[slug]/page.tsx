import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { CopyButton } from '@/components/copy-button';
import { DraftNotice } from '@/components/draft-notice';
import { buscarPolitico } from '@/lib/dados';
import { CARGOS, formatarData, formatarDataCurta } from '@/lib/formatos';

export const revalidate = 3600;

const carregar = cache(buscarPolitico);

export async function generateMetadata({
  params,
}: PageProps<'/politicos/[slug]'>): Promise<Metadata> {
  const p = await carregar((await params).slug);
  if (!p) return { title: 'Político não encontrado' };
  const atual = p.mandatos[0];
  return {
    title: p.nome,
    description: atual
      ? `${CARGOS[atual.cargo]} (${atual.partido}–${atual.siglaUf}): mandato, contatos públicos e fontes.`
      : `Perfil de ${p.nome} na A Lupa.`,
    alternates: { canonical: `/politicos/${p.slug}` },
    robots: { index: false, follow: true },
  };
}

const vigente = (fim: string | null) => !fim || new Date(`${fim}T23:59:59-03:00`) >= new Date();

export default async function PoliticoPage({ params }: PageProps<'/politicos/[slug]'>) {
  const p = await carregar((await params).slug);
  if (!p) notFound();
  const atual = p.mandatos[0];
  const emails = p.contatos.filter((c) => c.canal === 'email');
  const sites = p.contatos.filter((c) => c.canal === 'site');

  return (
    <main id="conteudo" className="records-page">
      <header className="page-heading person-heading">
        {p.fotoUrl && (
          <Image
            src={p.fotoUrl}
            alt={`Foto oficial de ${p.nome}`}
            width={120}
            height={158}
            unoptimized
          />
        )}
        <div>
          <Link className="back-link" href="/politicos">
            Políticos <span aria-hidden="true">/</span>
          </Link>
          {atual && (
            <p className="eyebrow">
              {CARGOS[atual.cargo]?.toUpperCase()} · {atual.partido} · {atual.siglaUf}
            </p>
          )}
          <h1>{p.nome}</h1>
          {p.nomeCompleto && p.nomeCompleto !== p.nome && (
            <p className="data-note">Nome civil: {p.nomeCompleto}</p>
          )}
        </div>
      </header>

      <DraftNotice>
        Perfil inicial com mandato e contatos oficiais. Emendas, despesas, votações e patrimônio
        declarado entram nas próximas etapas, sempre com fonte.
      </DraftNotice>

      <section className="data-section" aria-labelledby="mandatos">
        <h2 id="mandatos">Mandatos</h2>
        <ul className="record-list">
          {p.mandatos.map((m) => (
            <li key={`${m.cargo}-${m.inicio}`}>
              <div>
                <strong>
                  {CARGOS[m.cargo]} por {m.ufNome}
                </strong>
                <span>
                  {formatarData(m.inicio)} a {formatarData(m.fim)} ·{' '}
                  {m.partido ?? 'partido não informado'}
                  {vigente(m.fim) && m.situacao ? ` · ${m.situacao}` : ''}
                </span>
              </div>
              <a className="source-link" href={m.fonteUrl ?? '#'}>
                Fonte · verificado em {formatarDataCurta(m.verificadoEm)} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="data-note">
          O partido é o informado pela Casa na data da verificação; mudanças de partido durante o
          mandato ainda não são registradas aqui.
        </p>
      </section>

      <section className="data-section" aria-labelledby="contatos">
        <h2 id="contatos">Contatos públicos</h2>
        {emails.length === 0 && sites.length === 0 ? (
          <p>Contato público não localizado.</p>
        ) : (
          <ul className="contact-list">
            {emails.map((c) => (
              <li key={c.id}>
                <span className="eyebrow">{c.rotulo ?? 'E-mail'}</span>
                <a href={`mailto:${c.valor}`}>{c.valor}</a>
                <CopyButton texto={c.valor} />
                <span className="data-note">
                  Fonte oficial · verificado em {formatarDataCurta(c.verificadoEm)}
                </span>
              </li>
            ))}
            {sites.map((c) => (
              <li key={c.id}>
                <span className="eyebrow">{c.rotulo ?? 'Página'}</span>
                <a href={c.valor}>Abrir página oficial de contato ↗</a>
                <span className="data-note">verificado em {formatarDataCurta(c.verificadoEm)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="data-note">
          A A Lupa não envia mensagens em seu nome. Os contatos vêm das páginas oficiais da Câmara e
          do Senado.
        </p>
      </section>
    </main>
  );
}
