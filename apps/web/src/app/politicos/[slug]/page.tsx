import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { CopyButton } from '@/components/copy-button';
import { DraftNotice } from '@/components/draft-notice';
import { EmpresasLigadasLink } from '@/components/empresas-ligadas-link';
import { InfoTip } from '@/components/info-tip';
import { ParticipacoesSocietarias } from '@/components/participacoes-societarias';
import { PatrimonioDeclarado } from '@/components/patrimonio-declarado';
import { buscarPolitico } from '@/lib/dados';
import { CARGOS, cargoTse, formatarData, formatarDataCurta } from '@/lib/formatos';

export const revalidate = 3600;

const carregar = cache(buscarPolitico);

export async function generateMetadata({
  params,
}: PageProps<'/politicos/[slug]'>): Promise<Metadata> {
  const p = await carregar((await params).slug);
  if (!p) return { title: 'Político não encontrado' };
  const atual = p.mandatos[0];
  const candidatura = p.candidaturas[0];
  return {
    title: p.nome,
    description: atual
      ? `${CARGOS[atual.cargo]} (${atual.partido}–${atual.siglaUf}): mandatos, patrimônio declarado, contatos e imprensa.`
      : candidatura
        ? `${cargoTse(candidatura.cargo)} em ${candidatura.ano}: candidaturas e patrimônio declarado ao TSE.`
        : `Perfil de ${p.nome} na A Lupa.`,
    alternates: { canonical: `/politicos/${p.slug}` },
    robots: { index: false, follow: true },
  };
}

const vigente = (fim: string | null) => !fim || new Date(`${fim}T23:59:59-03:00`) >= new Date();

const formatarDataMateria = (d: string) =>
  new Date(`${d}T12:00:00-03:00`).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export default async function PoliticoPage({ params }: PageProps<'/politicos/[slug]'>) {
  const p = await carregar((await params).slug);
  if (!p) notFound();
  const atual = p.mandatos.find((m) => vigente(m.fim)) ?? p.mandatos[0];
  const candidaturaRecente = p.candidaturas[0];
  const emails = p.contatos.filter((c) => c.canal === 'email');
  const telefones = p.contatos.filter((c) => c.canal === 'telefone');
  const sites = p.contatos.filter((c) => c.canal === 'site');
  const emDisputa = p.candidaturas.some((c) => c.ano === 2026 && c.resultado === '2º TURNO');

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
          {atual ? (
            <p className="eyebrow">
              {CARGOS[atual.cargo]?.toUpperCase()} · {atual.partido} · {atual.siglaUf}
            </p>
          ) : (
            candidaturaRecente && (
              <p className="eyebrow">
                CANDIDATURA {candidaturaRecente.ano} · {candidaturaRecente.cargo} ·{' '}
                {candidaturaRecente.partido}
              </p>
            )
          )}
          <h1>{p.nome}</h1>
          {p.nomeCompleto && p.nomeCompleto !== p.nome && (
            <p className="data-note">Nome civil: {p.nomeCompleto}</p>
          )}
        </div>
      </header>

      <DraftNotice>
        Perfil em construção: mandatos, candidaturas com patrimônio declarado, contatos oficiais e
        imprensa. Emendas, despesas e votações entram nas próximas etapas, sempre com fonte.
      </DraftNotice>

      {emDisputa && (
        <p className="neutral-note">
          Candidatura no 2º turno das eleições de 2026. Todos os candidatos são apresentados com o
          mesmo método, as mesmas fontes e os mesmos critérios.
        </p>
      )}

      {p.mandatos.length > 0 && (
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
      )}

      <section className="data-section" aria-labelledby="patrimonio">
        <h2 id="patrimonio">
          Candidaturas e patrimônio declarado <InfoTip tema="patrimonio" />
        </h2>
        {p.candidaturas.length === 0 ? (
          <p>
            Nenhuma candidatura encontrada nas eleições já importadas (por enquanto, 2022, 2024 e
            2026 no Rio de Janeiro).
          </p>
        ) : (
          <PatrimonioDeclarado candidaturas={p.candidaturas} />
        )}
      </section>

      <section className="data-section" aria-labelledby="empresas">
        <h2 id="empresas">
          Participação em empresas <InfoTip tema="empresas" />
        </h2>
        <ParticipacoesSocietarias
          participacoes={p.participacoes}
          cobertura={p.coberturaContratos}
        />
        <EmpresasLigadasLink />
      </section>

      <section className="data-section" aria-labelledby="imprensa">
        <h2 id="imprensa">
          Imprensa <InfoTip tema="imprensa" />
        </h2>
        {p.materias.length === 0 ? (
          <p>Nenhuma matéria selecionada ainda.</p>
        ) : (
          <ul className="press-list">
            {p.materias.map((m) => (
              <li key={m.id}>
                <span className="eyebrow">
                  {m.veiculo} · {formatarDataMateria(m.publicadaEm)}
                </span>
                <a href={m.url} rel="noopener noreferrer" target="_blank">
                  {m.titulo} <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (abre o site do veículo)</span>
                </a>
                {m.resumo && <p>{m.resumo}</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="data-note">
          Seleção editorial de matérias de veículos reconhecidos, com o mesmo critério para todos. O
          conteúdo é de responsabilidade de cada veículo; os resumos são da A Lupa.
        </p>
      </section>

      <section className="data-section" aria-labelledby="contatos">
        <h2 id="contatos">
          Contatos públicos <InfoTip tema="contatos" />
        </h2>
        {emails.length === 0 && sites.length === 0 && telefones.length === 0 ? (
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
            {telefones.map((c) => (
              <li key={c.id}>
                <span className="eyebrow">{c.rotulo ?? 'Telefone'}</span>
                <a href={`tel:+55${c.valor.replace(/\D/g, '')}`}>{c.valor}</a>
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
          A A Lupa não envia mensagens em seu nome. Os contatos vêm das páginas oficiais da Câmara,
          do Senado e da Assembleia Legislativa.
        </p>
      </section>
    </main>
  );
}
