import { ehBemDeParticipacao, naturezaEmpresarial } from '@alupa/domain';

export interface Ligacao {
  pessoaId: string;
  organizacaoId: string;
  qualificacao: string | null;
  entradaEm: string | null;
  naturezaCodigo: number | null;
  capitalSocial: string | null;
  situacaoCadastral: string | null;
  inicioAtividade: string | null;
  referencia: string;
  confianca: 'confirmada' | 'possivel';
}

export interface ContratoLigado {
  id: string;
  organizacaoId: string;
  valorGlobal: string | null;
  assinadoEm: string | null;
  orgaoNome: string;
  numeroControlePncp: string;
}

export interface MandatoLigado {
  pessoaId: string;
  cargo: string;
  inicio: string;
  fim: string | null;
}

export interface CandidaturaLigada {
  id: string;
  pessoaId: string;
  ano: number;
  cargo: string;
  tiposDeBem: string[];
}

export interface Achado {
  regra: string;
  chave: string;
  pessoaId: string;
  organizacaoId: string;
  contratoId: string | null;
  evidencia: Record<string, unknown>;
  valorReferencia: string | null;
}

const CARGOS_COM_VEDACAO = new Set(['deputado_federal', 'deputado_estadual', 'senador']);
const QUALIFICACAO_COM_VEDACAO = /s[óo]cio|administrador|diretor|presidente/i;
const QUALIFICACAO_DE_SOCIO = /^s[óo]cio/i;

const dias = (de: string, ate: string) => (Date.parse(ate) - Date.parse(de)) / 86_400_000;
const vigente = (m: MandatoLigado, dia: string) => m.inicio <= dia && (!m.fim || m.fim >= dia);

/** Aplica as regras publicadas em /em-foco. Não decide nada: só levanta achados. */
export function avaliarSinais(dados: {
  ligacoes: Ligacao[];
  contratos: ContratoLigado[];
  mandatos: MandatoLigado[];
  candidaturas: CandidaturaLigada[];
}): Achado[] {
  const achados: Achado[] = [];
  const contratosPorEmpresa = new Map<string, ContratoLigado[]>();
  for (const c of dados.contratos) {
    contratosPorEmpresa.set(c.organizacaoId, [
      ...(contratosPorEmpresa.get(c.organizacaoId) ?? []),
      c,
    ]);
  }

  for (const l of dados.ligacoes) {
    const empresarial = naturezaEmpresarial(l.naturezaCodigo);
    const contratos = contratosPorEmpresa.get(l.organizacaoId) ?? [];

    for (const c of contratos) {
      const base = {
        pessoaId: l.pessoaId,
        organizacaoId: l.organizacaoId,
        contratoId: c.id,
        valorReferencia: c.valorGlobal,
      };
      const contrato = {
        numeroControlePncp: c.numeroControlePncp,
        orgao: c.orgaoNome,
        valorGlobal: c.valorGlobal,
        assinadoEm: c.assinadoEm,
      };

      // 1. Parlamentar no quadro de empresa com contrato público (CF art. 54, II, a).
      if (empresarial && c.assinadoEm && QUALIFICACAO_COM_VEDACAO.test(l.qualificacao ?? '')) {
        const mandato = dados.mandatos.find(
          (m) =>
            m.pessoaId === l.pessoaId &&
            CARGOS_COM_VEDACAO.has(m.cargo) &&
            vigente(m, c.assinadoEm!),
        );
        if (mandato) {
          achados.push({
            ...base,
            regra: 'mandato-e-contrato-publico',
            chave: `${l.pessoaId}:${c.id}`,
            evidencia: { contrato, qualificacao: l.qualificacao, mandato },
          });
        }
      }

      // 2. Contrato muito maior que o capital social.
      const capital = Number(l.capitalSocial ?? 0);
      const valor = Number(c.valorGlobal ?? 0);
      if (empresarial && capital > 0 && valor >= 50 * capital) {
        achados.push({
          ...base,
          regra: 'contrato-desproporcional-capital',
          chave: `${l.organizacaoId}:${c.id}`,
          evidencia: {
            contrato,
            capitalSocial: l.capitalSocial,
            proporcao: Math.round(valor / capital),
          },
        });
      }

      // 3. Empresa aberta pouco antes do contrato.
      if (empresarial && l.inicioAtividade && c.assinadoEm) {
        const intervalo = dias(l.inicioAtividade, c.assinadoEm);
        if (intervalo >= 0 && intervalo < 365) {
          achados.push({
            ...base,
            regra: 'empresa-recente',
            chave: `${l.organizacaoId}:${c.id}`,
            evidencia: {
              contrato,
              inicioAtividade: l.inicioAtividade,
              diasAteContrato: Math.round(intervalo),
            },
          });
        }
      }

      // 4. Cadastro irregular na Receita.
      if (l.situacaoCadastral && l.situacaoCadastral !== 'Ativa') {
        achados.push({
          ...base,
          regra: 'empresa-situacao-irregular',
          chave: `${l.organizacaoId}:${c.id}`,
          evidencia: {
            contrato,
            situacaoCadastral: l.situacaoCadastral,
            referenciaReceita: l.referencia,
          },
        });
      }
    }

    // 5. Participação societária sem cotas declaradas ao TSE (independe de contrato).
    if (empresarial && l.entradaEm && QUALIFICACAO_DE_SOCIO.test(l.qualificacao ?? '')) {
      for (const cand of dados.candidaturas.filter((x) => x.pessoaId === l.pessoaId)) {
        const limiteRegistro = `${cand.ano}-08-15`;
        if (l.entradaEm >= limiteRegistro) continue;
        if (cand.tiposDeBem.some(ehBemDeParticipacao)) continue;
        achados.push({
          regra: 'participacao-nao-declarada',
          chave: `${l.pessoaId}:${l.organizacaoId}:${cand.ano}`,
          pessoaId: l.pessoaId,
          organizacaoId: l.organizacaoId,
          contratoId: null,
          valorReferencia: l.capitalSocial,
          evidencia: {
            ano: cand.ano,
            cargo: cand.cargo,
            entradaEm: l.entradaEm,
            limiteRegistro,
            qualificacao: l.qualificacao,
            bensDeclarados: cand.tiposDeBem.length,
            // Metade das candidaturas no TSE não declara bem nenhum: é outro padrão, mostrado à parte.
            nenhumBemDeclarado: cand.tiposDeBem.length === 0,
            confianca: l.confianca,
          },
        });
      }
    }
  }

  // A mesma pessoa pode aparecer mais de uma vez na mesma empresa (qualificações diferentes):
  // cada achado conta uma vez por regra e chave.
  return [...new Map(achados.map((a) => [`${a.regra}|${a.chave}`, a])).values()];
}
