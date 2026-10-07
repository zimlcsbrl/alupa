import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { DraftNotice } from '@/components/draft-notice';
import { buscarContratacao, urlPncp } from '@/lib/dados';
import {
  emReais,
  estimativaNaoDivulgada,
  formatarCnpj,
  formatarDataHora,
  valorEstimado,
} from '@/lib/formatos';

export const revalidate = 3600;

const carregar = cache(buscarContratacao);

export async function generateMetadata({
  params,
}: PageProps<'/contratacoes/[id]'>): Promise<Metadata> {
  const r = await carregar((await params).id);
  if (!r) return { title: 'Contratação não encontrada' };
  return {
    title: `${r.c.modalidadeNome ?? 'Contratação'} ${r.c.numero ?? ''}/${r.c.ano} · ${r.orgaoNome}`,
    description: r.c.objeto?.slice(0, 160) ?? undefined,
    robots: { index: false, follow: true },
  };
}

export default async function ContratacaoPage({ params }: PageProps<'/contratacoes/[id]'>) {
  const r = await carregar((await params).id);
  if (!r) notFound();
  const { c } = r;

  const linhas: [string, React.ReactNode][] = [
    [
      'Órgão',
      <Link key="o" href={`/orgaos/${r.orgaoSlug}`}>
        {r.orgaoNome}
      </Link>,
    ],
    ['CNPJ do órgão', formatarCnpj(r.cnpj)],
    ['Unidade', c.unidadeNome ?? '—'],
    ['Localidade', `${r.ente}${r.siglaUf ? ` · ${r.siglaUf}` : ''}`],
    ['Modalidade', c.modalidadeNome ?? '—'],
    ['Modo de disputa', c.modoDisputaNome ?? '—'],
    ['Amparo legal', c.amparoLegalNome ?? '—'],
    ['Situação', c.situacaoNome ?? '—'],
    ['Registro de preços', c.registroDePrecos == null ? '—' : c.registroDePrecos ? 'Sim' : 'Não'],
    ['Número / processo', `${c.numero ?? '—'} · ${c.processo ?? '—'}`],
    ['Publicada no PNCP', formatarDataHora(c.publicadaEm)],
    ['Abertura das propostas', formatarDataHora(c.aberturaPropostasEm)],
    ['Encerramento das propostas', formatarDataHora(c.encerramentoPropostasEm)],
    ['Número de controle PNCP', c.numeroControlePncp],
  ];

  return (
    <main id="conteudo" className="records-page">
      <header className="page-heading">
        <Link className="back-link" href={`/orgaos/${r.orgaoSlug}`}>
          {r.orgaoNome} <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">
          {(c.modalidadeNome ?? 'CONTRATAÇÃO').toUpperCase()} · {c.ano}
        </p>
        <h1 className="record-title">{c.objeto ?? 'Objeto não informado'}</h1>
      </header>

      <DraftNotice>Dados copiados do PNCP; confira sempre o registro original.</DraftNotice>

      <section className="stat-grid" aria-label="Valores">
        <article className="stat-card">
          <p className="eyebrow">Valor estimado</p>
          <p className="stat-value">{valorEstimado(c.valorEstimado)}</p>
          <p>
            {estimativaNaoDivulgada(c.valorEstimado)
              ? 'O PNCP registra R$ 0,00: o órgão não divulgou a estimativa, o que a Lei 14.133/2021 (art. 24) permite quando o orçamento é sigiloso.'
              : 'Quanto o órgão previu gastar. Não é o valor contratado nem pago.'}
          </p>
        </article>
        <article className="stat-card">
          <p className="eyebrow">Valor homologado</p>
          <p className="stat-value">{emReais(c.valorHomologado)}</p>
          <p>Valor do resultado da disputa, quando já informado pelo órgão.</p>
        </article>
      </section>

      <section className="panel record-details" aria-label="Detalhes">
        <dl>
          {linhas.map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt>{rotulo}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
        {c.informacaoComplementar && (
          <>
            <h2>Informação complementar</h2>
            <p>{c.informacaoComplementar}</p>
          </>
        )}
      </section>

      <p className="source-line">
        <a href={urlPncp(c)}>Ver registro original no PNCP ↗</a>
        {c.linkSistemaOrigem && (
          <>
            {' · '}
            <a href={c.linkSistemaOrigem}>Sistema de origem ↗</a>
          </>
        )}
        <span className="data-note">
          {' '}
          · Atualizado na fonte em {formatarDataHora(c.atualizadaNaFonteEm)} · coletado em{' '}
          {formatarDataHora(c.atualizadoEm)}
        </span>
      </p>
    </main>
  );
}
