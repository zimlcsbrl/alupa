import { cnpjDaMatriz } from '@alupa/domain';
import { emReais, formatarCnpj, formatarData } from '@/lib/formatos';

interface Empresa {
  slug: string | null;
  cnpj: string | null;
  nomeFantasia: string | null;
  naturezaJuridica: string | null;
  capitalSocial: string | null;
  porte: string | null;
  situacaoCadastral: string | null;
  inicioAtividade: string | null;
  cnaePrincipalDescricao: string | null;
  endereco: string | null;
  municipioNome: string | null;
  siglaUf: string | null;
  enderecoProtegido: boolean | null;
}

interface Participacao {
  id: string;
  cnpjBasico: string;
  razaoSocial: string | null;
  nomeNaFonte: string;
  cpfParcial: string;
  qualificacao: string | null;
  entradaEm: string | null;
  confianca: 'confirmada' | 'possivel';
  metodo: string;
  referencia: string;
  empresa: Empresa | null;
}

const urlComprovante = (cnpj: string) =>
  `https://solucoes.receita.fazenda.gov.br/Servicos/cnpjreva/Cnpjreva_Solicitacao.asp?cnpj=${cnpj}`;

const mesExtenso = (ref: string) =>
  new Date(`${ref}-15T12:00:00-03:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

function Localizacao({ empresa }: { empresa: Empresa }) {
  const cidade = [empresa.municipioNome, empresa.siglaUf].filter(Boolean).join(' · ');
  if (empresa.enderecoProtegido) {
    return (
      <>
        {cidade || 'Local não informado'}{' '}
        <span className="data-note">
          (endereço completo omitido: empresário individual costuma registrar a própria residência)
        </span>
      </>
    );
  }
  return <>{[empresa.endereco, cidade].filter(Boolean).join(' · ') || 'Endereço não informado'}</>;
}

export function ParticipacoesSocietarias({ participacoes }: { participacoes: Participacao[] }) {
  if (participacoes.length === 0) {
    return (
      <p>
        Nenhuma participação societária encontrada no quadro de sócios da Receita Federal. A busca
        só é feita para quem informou CPF ao TSE em 2022 ou 2026. A ausência não prova que a pessoa
        não tenha empresas: a base mostra só o quadro atual, e a busca depende de o nome estar
        escrito da mesma forma nas duas fontes.
      </p>
    );
  }

  const referencia = participacoes[0]!.referencia;
  return (
    <>
      <ul className="company-list">
        {participacoes.map((p) => {
          const cnpj = p.empresa?.cnpj ?? cnpjDaMatriz(p.cnpjBasico);
          const e = p.empresa?.cnpj ? p.empresa : null;
          return (
            <li key={p.id}>
              <div className="company-heading">
                <div>
                  <strong>{p.razaoSocial ?? `Empresa de CNPJ ${formatarCnpj(cnpj)}`}</strong>
                  {e?.nomeFantasia && <span>“{e.nomeFantasia}”</span>}
                  <span>CNPJ {formatarCnpj(cnpj)}</span>
                </div>
                <span className={`tag ${p.confianca === 'possivel' ? 'tag-warning' : ''}`}>
                  {p.confianca === 'possivel' ? 'Possível correspondência' : 'Confirmada'}
                </span>
              </div>

              <dl className="company-facts">
                <div>
                  <dt>Participação</dt>
                  <dd>
                    {p.qualificacao ?? 'Não informada'}
                    {p.entradaEm ? `, desde ${formatarData(p.entradaEm)}` : ''}
                  </dd>
                </div>
                {e && (
                  <>
                    <div>
                      <dt>Capital social</dt>
                      <dd>
                        {e.capitalSocial != null ? emReais(e.capitalSocial) : 'Não informado'}
                      </dd>
                    </div>
                    <div>
                      <dt>Situação</dt>
                      <dd>
                        {e.situacaoCadastral ?? 'Não informada'}
                        {e.inicioAtividade ? ` · aberta em ${formatarData(e.inicioAtividade)}` : ''}
                      </dd>
                    </div>
                    <div>
                      <dt>Natureza e porte</dt>
                      <dd>{[e.naturezaJuridica, e.porte].filter(Boolean).join(' · ') || '—'}</dd>
                    </div>
                    <div className="company-wide">
                      <dt>Atividade principal</dt>
                      <dd>{e.cnaePrincipalDescricao ?? 'Não informada'}</dd>
                    </div>
                    <div className="company-wide">
                      <dt>Endereço da matriz</dt>
                      <dd>
                        <Localizacao empresa={e} />
                      </dd>
                    </div>
                  </>
                )}
              </dl>

              <p className="data-note">
                Na Receita, o sócio aparece como {p.nomeNaFonte} ({p.cpfParcial}).{' '}
                {cnpj && <a href={urlComprovante(cnpj)}>Comprovante de inscrição na Receita ↗</a>}
              </p>
            </li>
          );
        })}
      </ul>
      <div className="method-note">
        <p className="eyebrow">COMO ESSA LIGAÇÃO FOI FEITA</p>
        <ul>
          <li>
            A base aberta do CNPJ mostra o nome do sócio e só os 6 dígitos do meio do CPF. Ligamos a
            pessoa quando <strong>nome civil e esses dígitos coincidem</strong> com o CPF que ela
            informou ao TSE.
          </li>
          <li>
            Isso torna a coincidência muito provável, mas <strong>não prova identidade</strong>: por
            isso cada vínculo aparece como possível correspondência até ser confirmado por outra
            fonte.
          </li>
          <li>
            Capital social é o valor declarado pelos sócios no registro da empresa, não o
            faturamento nem o patrimônio atual.
          </li>
          <li>
            Ser sócio de uma empresa é legal. Esta lista indica relações a conhecer, não
            irregularidades.
          </li>
        </ul>
        <p className="data-note">
          Fonte: Receita Federal, dados abertos do CNPJ (quadro de sócios, empresas e
          estabelecimentos) de {mesExtenso(referencia)}.
        </p>
      </div>
    </>
  );
}
