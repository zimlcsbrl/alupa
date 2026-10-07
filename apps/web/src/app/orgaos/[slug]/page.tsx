import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { DraftNotice } from '@/components/draft-notice';
import { buscarOrgao } from '@/lib/dados';
import {
  emReais,
  formatarCnpj,
  formatarDataCurta,
  formatarDataHora,
  numero,
  PODERES,
  valorEstimado,
} from '@/lib/formatos';

export const revalidate = 3600;

const carregar = cache(buscarOrgao);

export async function generateMetadata({ params }: PageProps<'/orgaos/[slug]'>): Promise<Metadata> {
  const orgao = await carregar((await params).slug);
  if (!orgao) return { title: 'Órgão não encontrado' };
  return {
    title: orgao.nome,
    description: `Contratações publicadas no PNCP por ${orgao.nome}, com valores, datas e fontes.`,
    alternates: { canonical: `/orgaos/${orgao.slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function OrgaoPage({ params }: PageProps<'/orgaos/[slug]'>) {
  const orgao = await carregar((await params).slug);
  if (!orgao) notFound();

  return (
    <main id="conteudo" className="records-page">
      <header className="page-heading">
        <Link className="back-link" href="/orgaos">
          Órgãos <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">
          {PODERES[orgao.poder]?.toUpperCase()} · {orgao.ente.toUpperCase()}
        </p>
        <h1>{orgao.nome}</h1>
        <p className="data-note">
          CNPJ {formatarCnpj(orgao.cnpj)} · Atualizado em {formatarDataHora(orgao.atualizadoEm)}
        </p>
      </header>

      <DraftNotice>
        Esta página mostra apenas contratações publicadas no PNCP nos dias já coletados pela A Lupa.
      </DraftNotice>

      <section className="stat-grid" aria-label="Resumo">
        <article className="stat-card">
          <p className="eyebrow">Contratações coletadas</p>
          <p className="stat-value">{numero(orgao.totais.contratacoes)}</p>
          <p>
            Publicadas entre {formatarDataCurta(orgao.totais.primeira)} e{' '}
            {formatarDataCurta(orgao.totais.ultima)}.
          </p>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Valor estimado somado</p>
          <p className="stat-value">{emReais(orgao.totais.valorEstimado)}</p>
          <p>
            Valor <strong>previsto</strong> pelo órgão ao abrir as contratações. Não é valor
            contratado nem pago.
          </p>
        </article>
      </section>

      <section className="data-section" aria-labelledby="contratacoes">
        <h2 id="contratacoes">Contratações mais recentes</h2>
        <ul className="record-list">
          {orgao.recentes.map((c) => (
            <li key={c.id}>
              <Link href={`/contratacoes/${c.id}`}>
                <strong>{c.objeto ?? 'Objeto não informado'}</strong>
                <span>
                  {c.modalidade} · {c.situacao} · publicada em {formatarDataCurta(c.publicadaEm)}
                  {c.encerramento && c.encerramento > new Date()
                    ? ` · propostas até ${formatarDataCurta(c.encerramento)}`
                    : ''}
                </span>
              </Link>
              <dl>
                <div>
                  <dt>Valor estimado</dt>
                  <dd>{valorEstimado(c.valorEstimado)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <p className="data-note">
        Fonte: Portal Nacional de Contratações Públicas (PNCP), API de consulta. Cada contratação
        aponta para o registro original.
      </p>
    </main>
  );
}
