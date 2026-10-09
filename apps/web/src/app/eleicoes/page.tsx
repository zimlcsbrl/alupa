import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftNotice } from '@/components/draft-notice';
import { ANOS_ELEICAO, resumoEleicoes } from '@/lib/dados';
import { cargoTse, numero } from '@/lib/formatos';

export const metadata: Metadata = {
  title: 'Eleições',
  description:
    'Candidaturas, resultados e patrimônio declarado nas eleições de 2022, 2024 e 2026, ligados ao histórico de cada político.',
  alternates: { canonical: '/eleicoes' },
};

// Lê o banco a cada acesso: o build não depende de conexão com o banco.
export const dynamic = 'force-dynamic';

const DESCRICAO: Record<number, string> = {
  2026: 'Presidente, governadores, senadores, deputados federais e estaduais.',
  2024: 'Prefeitos, vice-prefeitos e vereadores.',
  2022: 'Presidente, governadores, senadores, deputados federais e estaduais.',
};

export default async function EleicoesPage() {
  const resumo = await resumoEleicoes();

  return (
    <main id="conteudo" className="records-page">
      <header className="page-heading">
        <Link className="back-link" href="/">
          Início <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">CANDIDATOS E ELEIÇÕES</p>
        <h1>
          Quem pediu <em>o seu voto.</em>
        </h1>
        <p className="lead">
          Todas as candidaturas registradas no TSE, com resultado e patrimônio declarado, ligadas ao
          histórico de cada pessoa: mandatos anteriores, outras eleições e o que vier depois.
        </p>
      </header>

      <DraftNotice>
        Por enquanto, só candidaturas no Rio de Janeiro. As demais UFs entram nas próximas
        importações.
      </DraftNotice>

      <ul className="election-grid">
        {ANOS_ELEICAO.map((ano) => {
          const cargos = resumo.filter((r) => r.ano === ano);
          const total = cargos.reduce((s, c) => s + c.candidaturas, 0);
          return (
            <li key={ano}>
              <Link href={`/eleicoes/${ano}`}>
                <span className="eyebrow">{ano === 2024 ? 'MUNICIPAIS' : 'GERAIS'}</span>
                <strong>Eleições {ano}</strong>
                <span>{DESCRICAO[ano]}</span>
                <span className="election-count">
                  {total > 0 ? `${numero(total)} candidaturas importadas` : 'Ainda não importada'}
                </span>
              </Link>
              {cargos.length > 0 && (
                <ul className="election-cargos" aria-label={`Cargos em ${ano}`}>
                  {cargos.map((c) => (
                    <li key={c.codigoCargo}>
                      <Link href={`/eleicoes/${ano}?cargo=${c.codigoCargo}`}>
                        {cargoTse(c.cargo)} <span>{numero(c.candidaturas)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <p className="data-note">
        Fonte: Tribunal Superior Eleitoral, dados abertos de candidaturas e bens de candidatos. Cada
        candidatura aponta para o perfil da pessoa, que reúne todas as eleições disputadas.
      </p>
    </main>
  );
}
