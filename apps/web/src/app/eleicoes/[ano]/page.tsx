import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DraftNotice } from '@/components/draft-notice';
import { Pagination } from '@/components/pagination';
import {
  ANOS_ELEICAO,
  listarCandidaturas,
  listarUfs,
  resumoEleicoes,
  unidadesDaEleicao,
} from '@/lib/dados';
import { cargoTse, emReais, lerPagina, lerTexto, resultadoTse } from '@/lib/formatos';

const anoValido = (v: string) => ANOS_ELEICAO.find((a) => String(a) === v);

export async function generateMetadata({
  params,
}: PageProps<'/eleicoes/[ano]'>): Promise<Metadata> {
  const ano = anoValido((await params).ano);
  return {
    title: ano ? `Candidatos · Eleições ${ano}` : 'Eleição não encontrada',
    description: ano
      ? `Candidaturas de ${ano} com resultado, partido e patrimônio declarado ao TSE.`
      : undefined,
    robots: { index: false, follow: true },
  };
}

export default async function EleicaoPage({ params, searchParams }: PageProps<'/eleicoes/[ano]'>) {
  const ano = anoValido((await params).ano);
  if (!ano) notFound();

  const q = await searchParams;
  const termo = lerTexto(q.q);
  const siglaUf = lerTexto(q.uf, 2).toUpperCase();
  const unidade = lerTexto(q.municipio, 10);
  const codigoCargo = Number(lerTexto(q.cargo, 3)) || null;
  const pagina = lerPagina(q.pagina);
  const municipal = ano === 2024;

  const [resumo, ufs, unidades, { candidaturas, haMais }] = await Promise.all([
    resumoEleicoes(),
    listarUfs(),
    municipal ? unidadesDaEleicao(ano, siglaUf) : Promise.resolve([]),
    listarCandidaturas({ ano, codigoCargo, siglaUf, unidade, termo, pagina }),
  ]);
  const cargos = resumo.filter((r) => r.ano === ano);

  return (
    <main id="conteudo" className="records-page">
      <header className="page-heading">
        <Link className="back-link" href="/eleicoes">
          Eleições <span aria-hidden="true">/</span>
        </Link>
        <p className="eyebrow">{municipal ? 'ELEIÇÕES MUNICIPAIS' : 'ELEIÇÕES GERAIS'}</p>
        <h1>Candidatos de {ano}</h1>
        <p className="lead">
          Resultado, partido e bens declarados de cada candidatura. Clique em um nome para ver o
          histórico completo da pessoa.
        </p>
      </header>

      <DraftNotice>
        Por enquanto, só candidaturas no Rio de Janeiro. Patrimônio é o declarado pelo próprio
        candidato ao TSE.
      </DraftNotice>

      <form className="filter-bar" role="search" action={`/eleicoes/${ano}`}>
        <label htmlFor="q">Buscar candidato</label>
        <div>
          <input id="q" name="q" defaultValue={termo} placeholder="Nome de urna ou nome civil" />
          <select name="cargo" defaultValue={codigoCargo ?? ''} aria-label="Cargo">
            <option value="">Todos os cargos</option>
            {cargos.map((c) => (
              <option key={c.codigoCargo} value={c.codigoCargo}>
                {cargoTse(c.cargo)}
              </option>
            ))}
          </select>
          <select name="uf" defaultValue={siglaUf} aria-label="Estado">
            <option value="">Todos os estados</option>
            {ufs.map((u) => (
              <option key={u.sigla} value={u.sigla!}>
                {u.nome}
              </option>
            ))}
          </select>
          {municipal && (
            <select name="municipio" defaultValue={unidade} aria-label="Município">
              <option value="">Todos os municípios</option>
              {unidades.map((u) => (
                <option key={u.codigo} value={u.codigo}>
                  {u.nome}
                </option>
              ))}
            </select>
          )}
          <button className="button" type="submit">
            Filtrar
          </button>
        </div>
      </form>

      {candidaturas.length === 0 ? (
        <p className="empty-state">
          Nenhuma candidatura encontrada com esses filtros nas UFs já importadas.
        </p>
      ) : (
        <ul className="record-list">
          {candidaturas.map((c) => (
            <li key={`${c.slug}-${c.cargo}`}>
              <Link href={`/politicos/${c.slug}#patrimonio`}>
                <strong>
                  {c.nome}
                  {c.numero ? ` · ${c.numero}` : ''}
                </strong>
                <span>
                  {cargoTse(c.cargo)} · {c.unidade ?? c.siglaUf} · {c.partido ?? '—'} ·{' '}
                  {resultadoTse(c.resultado)}
                  {c.situacao && c.situacao !== 'APTO'
                    ? ` · candidatura ${c.situacao.toLowerCase()}`
                    : ''}
                </span>
              </Link>
              <dl>
                <div>
                  <dt>Bens declarados</dt>
                  <dd>{c.quantidadeBens > 0 ? emReais(c.totalBens) : 'Nenhum'}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        caminho={`/eleicoes/${ano}`}
        pagina={pagina}
        haMais={haMais}
        filtros={{
          q: termo,
          cargo: codigoCargo ? String(codigoCargo) : '',
          uf: siglaUf,
          municipio: unidade,
        }}
      />
    </main>
  );
}
